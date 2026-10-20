using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Npgsql;
using NpgsqlTypes;

namespace SildraSupport.Api;

internal sealed record SupportUser(Guid Id, Guid? TenantId, string Name, string Email, string Role, string? PasswordHash, string Status);
internal sealed record OrganizationResponse(Guid Id, string Name, string Branch);

internal sealed class PostgresSupportStore(NpgsqlDataSource dataSource)
{
    public async Task EnsureAppUserTableAsync(CancellationToken cancellationToken = default)
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS app_user (
                id uuid PRIMARY KEY,
                tenant_id uuid NULL REFERENCES tenant(id) ON DELETE RESTRICT,
                name varchar(120) NOT NULL,
                email varchar(254) NOT NULL,
                role varchar(40) NOT NULL DEFAULT 'User',
                password_hash text NOT NULL,
                status varchar(40) NOT NULL DEFAULT 'Disponible',
                skills jsonb NOT NULL DEFAULT '[]'::jsonb,
                created_at timestamptz NOT NULL DEFAULT now(),
                updated_at timestamptz NOT NULL DEFAULT now()
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ux_app_user_email_lower ON app_user (lower(email));
            CREATE INDEX IF NOT EXISTS ix_ticket_requester_ref ON ticket (requester_ref);
            ALTER TABLE ticket ADD COLUMN IF NOT EXISTS resolution_notes text NOT NULL DEFAULT '';
            ALTER TABLE ticket ADD COLUMN IF NOT EXISTS requester_phone varchar(40) NOT NULL DEFAULT '';
            """;

        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<SupportUser?> FindUserByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT id, tenant_id, name, email, role, password_hash, status
            FROM app_user WHERE lower(email) = @email LIMIT 1;
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "email", NpgsqlDbType.Varchar, email);
        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadUser(reader) : null;
    }

    public async Task<SupportUser?> FindUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT id, tenant_id, name, email, role, password_hash, status
            FROM app_user WHERE id = @id LIMIT 1;
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "id", NpgsqlDbType.Uuid, id);
        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadUser(reader) : null;
    }

    public async Task<bool> EmailExistsAsync(string email, Guid? exceptId = null, CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM app_user
                WHERE lower(email) = @email AND (@except_id IS NULL OR id <> @except_id)
            );
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "email", NpgsqlDbType.Varchar, email);
        AddNullable(command, "except_id", NpgsqlDbType.Uuid, exceptId);
        return (bool)(await command.ExecuteScalarAsync(cancellationToken) ?? false);
    }

    public async Task InsertUserAsync(SupportUser user, CancellationToken cancellationToken = default)
    {
        const string sql = """
            INSERT INTO app_user (id, tenant_id, name, email, role, password_hash, status, created_at, updated_at)
            VALUES (@id, @tenant_id, @name, @email, @role, @password_hash, @status, now(), now());
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "id", NpgsqlDbType.Uuid, user.Id);
        AddNullable(command, "tenant_id", NpgsqlDbType.Uuid, user.TenantId);
        Add(command, "name", NpgsqlDbType.Varchar, user.Name);
        Add(command, "email", NpgsqlDbType.Varchar, user.Email);
        Add(command, "role", NpgsqlDbType.Varchar, user.Role);
        Add(command, "password_hash", NpgsqlDbType.Text, user.PasswordHash ?? string.Empty);
        Add(command, "status", NpgsqlDbType.Varchar, user.Status);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<SupportUser> UpsertAdminAsync(string name, string email, string passwordHash, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        const string findSql = "SELECT id FROM app_user WHERE lower(email) = @email LIMIT 1 FOR UPDATE;";
        Guid? id;
        await using (var find = new NpgsqlCommand(findSql, connection, transaction))
        {
            Add(find, "email", NpgsqlDbType.Varchar, email);
            var value = await find.ExecuteScalarAsync(cancellationToken);
            id = value is Guid existingId ? existingId : null;
        }

        if (id is Guid adminId)
        {
            const string updateSql = """
                UPDATE app_user SET name = @name, role = 'Admin', password_hash = @hash,
                    tenant_id = NULL, updated_at = now() WHERE id = @id;
                """;
            await using var update = new NpgsqlCommand(updateSql, connection, transaction);
            Add(update, "name", NpgsqlDbType.Varchar, name);
            Add(update, "hash", NpgsqlDbType.Text, passwordHash);
            Add(update, "id", NpgsqlDbType.Uuid, adminId);
            await update.ExecuteNonQueryAsync(cancellationToken);
            id = adminId;
        }
        else
        {
            id = Guid.NewGuid();
            await using var insert = new NpgsqlCommand("""
                INSERT INTO app_user (id, tenant_id, name, email, role, password_hash, status, created_at, updated_at)
                VALUES (@id, NULL, @name, @email, 'Admin', @hash, 'Disponible', now(), now());
                """, connection, transaction);
            Add(insert, "id", NpgsqlDbType.Uuid, id.Value);
            Add(insert, "name", NpgsqlDbType.Varchar, name);
            Add(insert, "email", NpgsqlDbType.Varchar, email);
            Add(insert, "hash", NpgsqlDbType.Text, passwordHash);
            await insert.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return (await FindUserByIdAsync(id.Value, cancellationToken))!;
    }

    public async Task<SupportUser?> UpdateProfileAsync(Guid userId, string name, string email, CancellationToken cancellationToken = default)
    {
        const string sql = """
            UPDATE app_user SET name = @name, email = @email, updated_at = now()
            WHERE id = @id
            RETURNING id, tenant_id, name, email, role, password_hash, status;
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "id", NpgsqlDbType.Uuid, userId);
        Add(command, "name", NpgsqlDbType.Varchar, name);
        Add(command, "email", NpgsqlDbType.Varchar, email);
        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadUser(reader) : null;
    }

    public async Task<IReadOnlyList<OrganizationResponse>> GetOrganizationsAsync(Guid? tenantId, CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT COALESCE(b.id, t.id) AS id, t.name,
                   COALESCE(b.name, 'Sede principal') AS branch
            FROM tenant t
            LEFT JOIN branch b ON b.tenant_id = t.id AND b.status = 'active'
            WHERE t.status = 'active' AND (@tenant_id IS NULL OR t.id = @tenant_id)
            ORDER BY t.name, b.name;
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        AddNullable(command, "tenant_id", NpgsqlDbType.Uuid, tenantId);
        var items = new List<OrganizationResponse>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
            items.Add(new OrganizationResponse(reader.GetGuid(0), reader.GetString(1), reader.GetString(2)));
        return items;
    }

    public async Task<OrganizationResponse> CreateOrganizationAsync(string name, string branch, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        var tenantId = Guid.NewGuid();
        var organizationId = Guid.NewGuid();
        var tenantCode = $"TEN-{tenantId.ToString("N")[..10].ToUpperInvariant()}";
        await using (var tenant = new NpgsqlCommand("""
            INSERT INTO tenant (id, organization_id, code, name, status, created_at, updated_at)
            VALUES (@id, @organization_id, @code, @name, 'active', now(), now());
            """, connection, transaction))
        {
            Add(tenant, "id", NpgsqlDbType.Uuid, tenantId);
            Add(tenant, "organization_id", NpgsqlDbType.Uuid, organizationId);
            Add(tenant, "code", NpgsqlDbType.Varchar, tenantCode);
            Add(tenant, "name", NpgsqlDbType.Varchar, name);
            await tenant.ExecuteNonQueryAsync(cancellationToken);
        }

        var branchId = Guid.NewGuid();
        await using (var branchCommand = new NpgsqlCommand("""
            INSERT INTO branch (id, tenant_id, code, name, status, created_at, updated_at)
            VALUES (@id, @tenant_id, @code, @name, 'active', now(), now());
            """, connection, transaction))
        {
            Add(branchCommand, "id", NpgsqlDbType.Uuid, branchId);
            Add(branchCommand, "tenant_id", NpgsqlDbType.Uuid, tenantId);
            Add(branchCommand, "code", NpgsqlDbType.Varchar, $"BR-{branchId.ToString("N")[..10].ToUpperInvariant()}");
            Add(branchCommand, "name", NpgsqlDbType.Varchar, string.IsNullOrWhiteSpace(branch) ? "Sede principal" : branch);
            await branchCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return new OrganizationResponse(branchId, name, string.IsNullOrWhiteSpace(branch) ? "Sede principal" : branch);
    }

    public async Task<SupportUser?> FindUserForLoginAsync(string email, CancellationToken cancellationToken = default) =>
        await FindUserByEmailAsync(email, cancellationToken);

    public async Task<Guid?> GetTenantIdForOrganizationAsync(Guid organizationId, CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT t.id
            FROM tenant t
            LEFT JOIN branch b ON b.tenant_id = t.id AND b.status = 'active'
            WHERE t.status = 'active' AND (t.id = @id OR b.id = @id)
            ORDER BY CASE WHEN b.id = @id THEN 0 ELSE 1 END
            LIMIT 1;
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "id", NpgsqlDbType.Uuid, organizationId);
        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        return reader.GetGuid(0);
    }

    public async Task<IReadOnlyList<TicketResponse>> GetTicketsAsync(Guid userId, bool isAdmin, bool isAgent, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using (var breach = new NpgsqlCommand("""
            UPDATE sla_clock s SET breach_at = s.target_at
            FROM ticket t
            WHERE s.ticket_id = t.id AND s.kind = 'resolution' AND s.breach_at IS NULL
              AND s.target_at <= now() AND t.status NOT IN ('resolved', 'closed', 'cancelled');
            """, connection))
            await breach.ExecuteNonQueryAsync(cancellationToken);

        const string sql = """
            SELECT t.id, t.display_number, t.subject, COALESCE(t.description, ''),
                   COALESCE(requester.name, 'Usuario registrado'), COALESCE(requester.email, ''),
                   COALESCE(tenant.name, 'Organización'), COALESCE(branch.name, 'Sede principal'),
                   COALESCE(NULLIF(category_meta.metadata ->> 'category', ''), 'Otro'),
                   CASE lower(COALESCE(t.priority, 'p3')) WHEN 'p1' THEN 'P1' WHEN 'p2' THEN 'P2' ELSE 'P3' END,
                   CASE t.status WHEN 'new' THEN 'Abierto' WHEN 'triaged' THEN 'Pendiente'
                     WHEN 'assigned' THEN 'En progreso' WHEN 'in_progress' THEN 'En progreso'
                     WHEN 'waiting_customer' THEN 'Pendiente' WHEN 'waiting_vendor' THEN 'Pendiente'
                     WHEN 'reopened' THEN 'Abierto' WHEN 'resolved' THEN 'Resuelto'
                     WHEN 'closed' THEN 'Resuelto' WHEN 'cancelled' THEN 'Resuelto' ELSE 'Abierto' END,
                   COALESCE(agent.name, 'Sin asignar'), agent.id,
                   COALESCE(NULLIF(queue_meta.metadata ->> 'queue', ''), 'Soporte técnico'),
                   COALESCE(NULLIF(created_meta.metadata ->> 'channel', ''), 'Portal'),
                   t.created_at,
                   COALESCE(sla.target_at, t.created_at + CASE lower(COALESCE(t.priority, 'p3'))
                       WHEN 'p1' THEN interval '4 hours' WHEN 'p2' THEN interval '8 hours'
                       ELSE interval '24 hours' END), COALESCE(t.resolution_notes, ''), COALESCE(t.requester_phone, '')
            FROM ticket t
            LEFT JOIN app_user requester ON t.requester_ref = requester.id::text
            LEFT JOIN tenant ON tenant.id = t.tenant_id
            LEFT JOIN branch ON branch.id = t.branch_id
            LEFT JOIN sla_clock sla ON sla.ticket_id = t.id AND sla.kind = 'resolution'
            LEFT JOIN LATERAL (
                SELECT metadata FROM ticket_timeline timeline
                WHERE timeline.ticket_id = t.id AND timeline.metadata ->> 'category' IS NOT NULL
                ORDER BY timeline.occurred_at DESC LIMIT 1
            ) category_meta ON true
            LEFT JOIN LATERAL (
                SELECT metadata FROM ticket_timeline timeline
                WHERE timeline.ticket_id = t.id AND timeline.type = 'created'
                ORDER BY timeline.occurred_at DESC LIMIT 1
            ) created_meta ON true
            LEFT JOIN LATERAL (
                SELECT metadata FROM ticket_timeline timeline
                WHERE timeline.ticket_id = t.id AND timeline.metadata ->> 'queue' IS NOT NULL
                ORDER BY timeline.occurred_at DESC LIMIT 1
            ) queue_meta ON true
            LEFT JOIN LATERAL (
                SELECT assignee_ref FROM assignment
                WHERE ticket_id = t.id AND ended_at IS NULL
                ORDER BY assigned_at DESC LIMIT 1
            ) active_assignment ON true
            LEFT JOIN app_user agent ON active_assignment.assignee_ref = agent.id::text
            WHERE @is_admin OR t.requester_ref = @user_id::text
               OR (@is_agent AND active_assignment.assignee_ref = @user_id::text)
            ORDER BY t.created_at DESC;
            """;
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "is_admin", NpgsqlDbType.Boolean, isAdmin);
        Add(command, "is_agent", NpgsqlDbType.Boolean, isAgent);
        Add(command, "user_id", NpgsqlDbType.Uuid, userId);
        var tickets = new List<TicketResponse>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            tickets.Add(new TicketResponse(
                reader.GetGuid(0), reader.GetString(1), reader.GetString(2), reader.GetString(3),
                reader.GetString(4), reader.GetString(5), reader.GetString(6), reader.GetString(7),
                reader.GetString(8), reader.GetString(9), reader.GetString(10), reader.GetString(11),
                reader.IsDBNull(12) ? null : reader.GetGuid(12), reader.GetString(13), reader.GetString(14),
                AsUtc(reader.GetDateTime(15)), AsUtc(reader.GetDateTime(16)), reader.GetString(17), reader.GetString(18)));
        }
        return tickets;
    }

    public async Task<TicketResponse?> CreateTicketAsync(
        Guid userId, Guid? userTenantId, bool isAdmin, Guid organizationId, string subject,
        string description, string category, string priority, string channel, string phone,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        var requester = await FindUserByIdOnConnectionAsync(connection, transaction, userId, cancellationToken);
        if (requester is null) return null;
        var organization = await FindOrganizationAsync(connection, transaction, organizationId, cancellationToken);
        if (organization is null || (!isAdmin && organization.TenantId != userTenantId)) return null;

        var now = DateTime.UtcNow;
        var hours = SlaHoursFor(priority);
        var ticketId = Guid.NewGuid();
        var ticketNumber = await NextTicketNumberAsync(connection, transaction, organization.TenantId, now.Year, cancellationToken);
        var impact = priority.ToUpperInvariant() switch { "P1" => "critical", "P2" => "high", _ => "medium" };
        var dbPriority = priority.ToLowerInvariant();
        const string insertTicket = """
            INSERT INTO ticket (
                id, display_number, tenant_id, organization_id, branch_id, requester_ref,
                subject, description, requester_phone, impact, urgency, priority, status, row_version,
                created_by_ref, created_at, updated_at)
            VALUES (
                @id, @display_number, @tenant_id, @organization_id, @branch_id, @requester_ref,
                @subject, @description, @requester_phone, @impact, @urgency, @priority, 'new', 1,
                @created_by_ref, @created_at, @created_at);
            """;
        await using (var command = new NpgsqlCommand(insertTicket, connection, transaction))
        {
            Add(command, "id", NpgsqlDbType.Uuid, ticketId);
            Add(command, "display_number", NpgsqlDbType.Varchar, ticketNumber);
            Add(command, "tenant_id", NpgsqlDbType.Uuid, organization.TenantId);
            Add(command, "organization_id", NpgsqlDbType.Uuid, organization.OrganizationId);
            AddNullable(command, "branch_id", NpgsqlDbType.Uuid, organization.BranchId);
            Add(command, "requester_ref", NpgsqlDbType.Varchar, userId.ToString());
            Add(command, "subject", NpgsqlDbType.Varchar, subject);
            Add(command, "description", NpgsqlDbType.Text, description);
            Add(command, "requester_phone", NpgsqlDbType.Varchar, phone);
            Add(command, "impact", NpgsqlDbType.Varchar, impact);
            Add(command, "urgency", NpgsqlDbType.Varchar, impact);
            Add(command, "priority", NpgsqlDbType.Varchar, dbPriority);
            Add(command, "created_by_ref", NpgsqlDbType.Varchar, userId.ToString());
            Add(command, "created_at", NpgsqlDbType.TimestampTz, now);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await using (var sla = new NpgsqlCommand("""
            INSERT INTO sla_clock (id, ticket_id, tenant_id, kind, target_at, started_at,
                                   timezone_snapshot, calendar_snapshot)
            VALUES (@id, @ticket_id, @tenant_id, 'resolution', @target_at, @started_at,
                    'America/Santo_Domingo', '{}'::jsonb);
            """, connection, transaction))
        {
            Add(sla, "id", NpgsqlDbType.Uuid, Guid.NewGuid());
            Add(sla, "ticket_id", NpgsqlDbType.Uuid, ticketId);
            Add(sla, "tenant_id", NpgsqlDbType.Uuid, organization.TenantId);
            Add(sla, "target_at", NpgsqlDbType.TimestampTz, now.AddHours(hours));
            Add(sla, "started_at", NpgsqlDbType.TimestampTz, now);
            await sla.ExecuteNonQueryAsync(cancellationToken);
        }

        var queue = QueueFor(category);
        var metadata = JsonSerializer.Serialize(new { category, queue, channel = NormalizeChannel(channel) });
        await InsertTimelineAsync(connection, transaction, ticketId, organization.TenantId, "created", userId.ToString(), metadata, cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new TicketResponse(ticketId, ticketNumber, subject, description,
            requester.Name, requester.Email, organization.Name, organization.Branch,
            category, priority.ToUpperInvariant(), "Abierto", "Sin asignar", null, queue,
            NormalizeChannel(channel), now, now.AddHours(hours), string.Empty, phone);
    }

    public async Task<TicketResponse?> UpdateTicketAsync(
        Guid ticketId, Guid adminId, string status, string priority, string queue,
        Guid? assigneeId, CancellationToken cancellationToken = default)
    {
        var dbStatus = DbStatus(status);
        var dbPriority = priority.ToLowerInvariant();
        var now = DateTime.UtcNow;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        Guid tenantId;
        string displayNumber;
        await using (var find = new NpgsqlCommand("SELECT tenant_id, display_number FROM ticket WHERE id = @id FOR UPDATE;", connection, transaction))
        {
            Add(find, "id", NpgsqlDbType.Uuid, ticketId);
            await using var reader = await find.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
            if (!await reader.ReadAsync(cancellationToken)) return null;
            tenantId = reader.GetGuid(0);
            displayNumber = reader.GetString(1);
        }

        SupportUser? assignee = null;
        if (assigneeId is Guid id)
        {
            assignee = await FindUserByIdOnConnectionAsync(connection, transaction, id, cancellationToken);
            if (assignee is null || string.Equals(assignee.Role, "User", StringComparison.OrdinalIgnoreCase)) return null;
            if (!string.Equals(assignee.Role, "Admin", StringComparison.OrdinalIgnoreCase) && assignee.TenantId != tenantId) return null;
        }

        await using (var update = new NpgsqlCommand("""
            UPDATE ticket SET status = @status, priority = @priority, updated_by_ref = @actor,
                updated_at = @now, row_version = row_version + 1,
                resolved_at = CASE WHEN @status IN ('resolved', 'closed') THEN COALESCE(resolved_at, @now)
                                    WHEN @status IN ('new', 'reopened') THEN NULL ELSE resolved_at END,
                closed_at = CASE WHEN @status = 'closed' THEN COALESCE(closed_at, @now)
                                 WHEN @status <> 'closed' THEN NULL ELSE closed_at END
            WHERE id = @id;
            """, connection, transaction))
        {
            Add(update, "status", NpgsqlDbType.Varchar, dbStatus);
            Add(update, "priority", NpgsqlDbType.Varchar, dbPriority);
            Add(update, "actor", NpgsqlDbType.Varchar, adminId.ToString());
            Add(update, "now", NpgsqlDbType.TimestampTz, now);
            Add(update, "id", NpgsqlDbType.Uuid, ticketId);
            await update.ExecuteNonQueryAsync(cancellationToken);
        }

        await using (var updateSla = new NpgsqlCommand("""
            UPDATE sla_clock SET target_at = @target_at, breach_at = NULL
            WHERE ticket_id = @ticket_id AND kind = 'resolution';
            """, connection, transaction))
        {
            Add(updateSla, "target_at", NpgsqlDbType.TimestampTz, now.AddHours(SlaHoursFor(priority)));
            Add(updateSla, "ticket_id", NpgsqlDbType.Uuid, ticketId);
            await updateSla.ExecuteNonQueryAsync(cancellationToken);
        }

        await using (var closeAssignments = new NpgsqlCommand("""
            UPDATE assignment SET ended_at = @now
            WHERE ticket_id = @ticket_id AND ended_at IS NULL;
            """, connection, transaction))
        {
            Add(closeAssignments, "now", NpgsqlDbType.TimestampTz, now);
            Add(closeAssignments, "ticket_id", NpgsqlDbType.Uuid, ticketId);
            await closeAssignments.ExecuteNonQueryAsync(cancellationToken);
        }

        Guid? queueId = null;
        await using (var findQueue = new NpgsqlCommand("""
            SELECT id FROM queue WHERE tenant_id = @tenant_id AND lower(name) = lower(@name) AND is_active LIMIT 1;
            """, connection, transaction))
        {
            Add(findQueue, "tenant_id", NpgsqlDbType.Uuid, tenantId);
            Add(findQueue, "name", NpgsqlDbType.Varchar, queue);
            var value = await findQueue.ExecuteScalarAsync(cancellationToken);
            queueId = value is Guid queueGuid ? queueGuid : null;
        }

        if (assigneeId.HasValue || queueId.HasValue)
        {
            await using var assignment = new NpgsqlCommand("""
                INSERT INTO assignment (id, ticket_id, tenant_id, queue_id, assignee_ref, to_ref, assigned_at)
                VALUES (@id, @ticket_id, @tenant_id, @queue_id, @assignee_ref, @to_ref, @now);
                """, connection, transaction);
            Add(assignment, "id", NpgsqlDbType.Uuid, Guid.NewGuid());
            Add(assignment, "ticket_id", NpgsqlDbType.Uuid, ticketId);
            Add(assignment, "tenant_id", NpgsqlDbType.Uuid, tenantId);
            AddNullable(assignment, "queue_id", NpgsqlDbType.Uuid, queueId);
            AddNullable(assignment, "assignee_ref", NpgsqlDbType.Varchar, assigneeId?.ToString());
            AddNullable(assignment, "to_ref", NpgsqlDbType.Varchar, assigneeId?.ToString());
            Add(assignment, "now", NpgsqlDbType.TimestampTz, now);
            await assignment.ExecuteNonQueryAsync(cancellationToken);
        }

        var updateMetadata = JsonSerializer.Serialize(new { queue, status = dbStatus, priority = dbPriority });
        await InsertTimelineAsync(connection, transaction, ticketId, tenantId, "status_changed", adminId.ToString(), updateMetadata, cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var tickets = await GetTicketsByIdsAsync(ticketId, cancellationToken);
        return tickets.FirstOrDefault();
    }

    public async Task<IReadOnlyList<object>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        const string sql = "SELECT id, name, email, role, status FROM app_user WHERE lower(role) <> 'admin' ORDER BY name;";
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        var users = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
            users.Add(new { id = reader.GetGuid(0), name = reader.GetString(1), email = reader.GetString(2), role = reader.GetString(3), status = reader.GetString(4) });
        return users;
    }

    public async Task<bool> DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        string? role;
        await using (var find = new NpgsqlCommand("SELECT role FROM app_user WHERE id=@id FOR UPDATE;", connection, transaction))
        {
            Add(find, "id", NpgsqlDbType.Uuid, userId);
            role = (string?)await find.ExecuteScalarAsync(cancellationToken);
        }
        if (role is null || role.Equals("Admin", StringComparison.OrdinalIgnoreCase)) return false;

        await using (var unassign = new NpgsqlCommand("UPDATE assignment SET ended_at=now() WHERE assignee_ref=@assignee AND ended_at IS NULL;", connection, transaction))
        {
            Add(unassign, "assignee", NpgsqlDbType.Varchar, userId.ToString());
            await unassign.ExecuteNonQueryAsync(cancellationToken);
        }
        await using (var delete = new NpgsqlCommand("DELETE FROM app_user WHERE id=@id AND lower(role) <> 'admin';", connection, transaction))
        {
            Add(delete, "id", NpgsqlDbType.Uuid, userId);
            if (await delete.ExecuteNonQueryAsync(cancellationToken) == 0) return false;
        }

        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task<SupportUser?> UpdateUserRoleAsync(Guid userId, string role, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("UPDATE app_user SET role = @role, updated_at = now() WHERE id = @id AND lower(role) <> 'admin';", connection);
        Add(command, "role", NpgsqlDbType.Varchar, role);
        Add(command, "id", NpgsqlDbType.Uuid, userId);
        if (await command.ExecuteNonQueryAsync(cancellationToken) == 0) return null;
        return await FindUserByIdAsync(userId, cancellationToken);
    }

    public async Task<TicketResponse?> ResolveTicketAsync(Guid ticketId, Guid actorId, Guid? actorTenantId, bool isAdmin, bool isAgent, string notes, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        Guid tenantId;
        bool assigned;
        string ticketNumber;
        string ticketSubject;
        string ticketStatus;
        await using (var find = new NpgsqlCommand("""
            SELECT t.tenant_id, t.display_number, t.subject, t.status,
                   EXISTS (SELECT 1 FROM assignment a WHERE a.ticket_id=t.id AND a.ended_at IS NULL AND a.assignee_ref=@actor)
            FROM ticket t WHERE t.id=@id FOR UPDATE;
            """, connection, transaction))
        {
            Add(find, "id", NpgsqlDbType.Uuid, ticketId);
            Add(find, "actor", NpgsqlDbType.Varchar, actorId.ToString());
            await using var reader = await find.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
            if (!await reader.ReadAsync(cancellationToken)) return null;
            tenantId = reader.GetGuid(0);
            ticketNumber = reader.GetString(1);
            ticketSubject = reader.GetString(2);
            ticketStatus = reader.GetString(3);
            assigned = reader.GetBoolean(4);
        }
        if (!isAdmin && (!isAgent || !assigned || actorTenantId != tenantId)) return null;
        if (ticketStatus is "resolved" or "closed" or "cancelled") return null;

        var now = DateTime.UtcNow;
        await using (var update = new NpgsqlCommand("""
            UPDATE ticket SET status='resolved', resolution_notes=@notes, resolved_at=COALESCE(resolved_at,@now),
              updated_by_ref=@actor, updated_at=@now, row_version=row_version+1 WHERE id=@id;
            """, connection, transaction))
        {
            Add(update, "notes", NpgsqlDbType.Text, notes);
            Add(update, "now", NpgsqlDbType.TimestampTz, now);
            Add(update, "actor", NpgsqlDbType.Varchar, actorId.ToString());
            Add(update, "id", NpgsqlDbType.Uuid, ticketId);
            await update.ExecuteNonQueryAsync(cancellationToken);
        }
        await InsertTimelineAsync(connection, transaction, ticketId, tenantId, "resolved", actorId.ToString(),
            JsonSerializer.Serialize(new { resolutionNotes = notes }), cancellationToken);

        var articleId = Guid.NewGuid();
        var versionId = Guid.NewGuid();
        var title = $"Solución del ticket {ticketNumber}";
        var articleBody = $"# {title}\n\nAsunto: {ticketSubject.Trim()}\n\n## Procedimiento aplicado\n\n{notes.Trim()}";
        var checksum = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(articleBody))).ToLowerInvariant();
        await using (var article = new NpgsqlCommand("""
            INSERT INTO knowledge_article (id,owner_scope,tenant_id,product_code,module_code,language,audience,workflow_state,owner_ref,created_at,updated_at)
            VALUES (@id,'tenant',@tenant,'sildra-support','resoluciones','es','support','pending_review',@owner,@now,@now);
            """, connection, transaction))
        {
            Add(article, "id", NpgsqlDbType.Uuid, articleId);
            Add(article, "tenant", NpgsqlDbType.Uuid, tenantId);
            Add(article, "owner", NpgsqlDbType.Varchar, actorId.ToString());
            Add(article, "now", NpgsqlDbType.TimestampTz, now);
            await article.ExecuteNonQueryAsync(cancellationToken);
        }
        await using (var version = new NpgsqlCommand("""
            INSERT INTO knowledge_version (id,article_id,version_number,content_md,content_checksum,source_refs,author_ref,sanitization_state,is_immutable,created_at)
            VALUES (@id,@article,1,@content,@checksum,'[]'::jsonb,@author,'sanitized',false,@now);
            """, connection, transaction))
        {
            Add(version, "id", NpgsqlDbType.Uuid, versionId);
            Add(version, "article", NpgsqlDbType.Uuid, articleId);
            Add(version, "content", NpgsqlDbType.Text, articleBody);
            Add(version, "checksum", NpgsqlDbType.Varchar, checksum);
            Add(version, "author", NpgsqlDbType.Varchar, actorId.ToString());
            Add(version, "now", NpgsqlDbType.TimestampTz, now);
            await version.ExecuteNonQueryAsync(cancellationToken);
        }
        await using (var setCurrent = new NpgsqlCommand("UPDATE knowledge_article SET current_version_id=@version WHERE id=@article;", connection, transaction))
        {
            Add(setCurrent, "version", NpgsqlDbType.Uuid, versionId);
            Add(setCurrent, "article", NpgsqlDbType.Uuid, articleId);
            await setCurrent.ExecuteNonQueryAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
        return (await GetTicketsByIdsAsync(ticketId, cancellationToken)).FirstOrDefault();
    }

    public async Task<bool> ReviewClassificationAsync(Guid ticketId, Guid actorId, Guid? actorTenantId, bool isAdmin, bool isAgent, string category, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        Guid tenantId;
        bool assigned;
        await using (var find = new NpgsqlCommand("""
            SELECT t.tenant_id, EXISTS (SELECT 1 FROM assignment a WHERE a.ticket_id=t.id AND a.ended_at IS NULL AND a.assignee_ref=@actor)
            FROM ticket t WHERE t.id=@id FOR UPDATE;
            """, connection, transaction))
        {
            Add(find, "id", NpgsqlDbType.Uuid, ticketId);
            Add(find, "actor", NpgsqlDbType.Varchar, actorId.ToString());
            await using var reader = await find.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
            if (!await reader.ReadAsync(cancellationToken)) return false;
            tenantId = reader.GetGuid(0);
            assigned = reader.GetBoolean(1);
        }
        if (!isAdmin && (!isAgent || !assigned || actorTenantId != tenantId)) return false;
        await InsertTimelineAsync(connection, transaction, ticketId, tenantId, "classification_reviewed", actorId.ToString(),
            JsonSerializer.Serialize(new { category }), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<object>> GetCallSessionsAsync(Guid? tenantId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT c.id, c.state, c.started_at, c.connected_at, c.ended_at, c.duration_sec,
                   c.asterisk_channel, c.asterisk_bridge, c.ucm_ref, c.codec, cv.channel, cv.requester_ref
            FROM call_session c LEFT JOIN conversation cv ON cv.id=c.conversation_id
            WHERE @is_admin OR c.tenant_id=@tenant_id ORDER BY c.started_at DESC LIMIT 200;
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "is_admin", NpgsqlDbType.Boolean, isAdmin);
        AddNullable(command, "tenant_id", NpgsqlDbType.Uuid, tenantId);
        var items = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
            items.Add(new
            {
                id = reader.GetGuid(0), state = reader.GetString(1), startedAt = AsUtc(reader.GetDateTime(2)),
                connectedAt = reader.IsDBNull(3) ? (DateTime?)null : AsUtc(reader.GetDateTime(3)),
                endedAt = reader.IsDBNull(4) ? (DateTime?)null : AsUtc(reader.GetDateTime(4)),
                durationSec = reader.IsDBNull(5) ? 0 : reader.GetInt32(5),
                channelId = reader.IsDBNull(6) ? "" : reader.GetString(6), bridge = reader.IsDBNull(7) ? "" : reader.GetString(7),
                providerRef = reader.IsDBNull(8) ? "" : reader.GetString(8), codec = reader.IsDBNull(9) ? "" : reader.GetString(9),
                channel = reader.IsDBNull(10) ? "Teléfono" : reader.GetString(10), requesterRef = reader.IsDBNull(11) ? "" : reader.GetString(11)
            });
        return items;
    }

    public async Task<IReadOnlyList<object>> GetHandoffsAsync(Guid? tenantId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT h.id, h.ticket_id, t.display_number, t.subject, h.provider, h.queue_ref, h.extension_ref,
                   h.status, h.reason, h.requested_at, h.accepted_at, h.completed_at, h.failure_reason
            FROM handoff h JOIN ticket t ON t.id=h.ticket_id
            WHERE @is_admin OR h.tenant_id=@tenant_id ORDER BY h.requested_at DESC LIMIT 200;
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "is_admin", NpgsqlDbType.Boolean, isAdmin);
        AddNullable(command, "tenant_id", NpgsqlDbType.Uuid, tenantId);
        var items = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
            items.Add(new { id = reader.GetGuid(0), ticketId = reader.GetGuid(1), ticketNumber = reader.GetString(2), subject = reader.GetString(3), provider = reader.GetString(4), queueRef = reader.IsDBNull(5) ? "" : reader.GetString(5), extensionRef = reader.IsDBNull(6) ? "" : reader.GetString(6), status = reader.GetString(7), reason = reader.IsDBNull(8) ? "" : reader.GetString(8), requestedAt = AsUtc(reader.GetDateTime(9)), acceptedAt = reader.IsDBNull(10) ? (DateTime?)null : AsUtc(reader.GetDateTime(10)), completedAt = reader.IsDBNull(11) ? (DateTime?)null : AsUtc(reader.GetDateTime(11)), failureReason = reader.IsDBNull(12) ? "" : reader.GetString(12) });
        return items;
    }

    public async Task<bool> CreateHandoffAsync(Guid ticketId, Guid actorId, Guid? actorTenantId, bool isAdmin, bool isAgent, string provider, string queueRef, string extensionRef, string reason, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        Guid tenantId;
        bool assigned;
        await using (var find = new NpgsqlCommand("""
            SELECT t.tenant_id, EXISTS (SELECT 1 FROM assignment a WHERE a.ticket_id=t.id AND a.ended_at IS NULL AND a.assignee_ref=@actor)
            FROM ticket t WHERE t.id=@id FOR UPDATE;
            """, connection, transaction))
        {
            Add(find, "id", NpgsqlDbType.Uuid, ticketId);
            Add(find, "actor", NpgsqlDbType.Varchar, actorId.ToString());
            await using var reader = await find.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
            if (!await reader.ReadAsync(cancellationToken)) return false;
            tenantId = reader.GetGuid(0);
            assigned = reader.GetBoolean(1);
        }
        if (!isAdmin && (!isAgent || !assigned || actorTenantId != tenantId)) return false;
        await using var insert = new NpgsqlCommand("""
            INSERT INTO handoff (id,ticket_id,tenant_id,provider,queue_ref,extension_ref,status,reason,callback_owner_ref,requested_at)
            VALUES (@id,@ticket,@tenant,@provider,@queue,@extension,'requested',@reason,@owner,now());
            """, connection, transaction);
        Add(insert, "id", NpgsqlDbType.Uuid, Guid.NewGuid()); Add(insert, "ticket", NpgsqlDbType.Uuid, ticketId);
        Add(insert, "tenant", NpgsqlDbType.Uuid, tenantId); Add(insert, "provider", NpgsqlDbType.Varchar, provider);
        Add(insert, "queue", NpgsqlDbType.Varchar, queueRef); Add(insert, "extension", NpgsqlDbType.Varchar, extensionRef);
        Add(insert, "reason", NpgsqlDbType.Varchar, reason); Add(insert, "owner", NpgsqlDbType.Varchar, actorId.ToString());
        await insert.ExecuteNonQueryAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateHandoffAsync(Guid id, Guid? tenantId, bool isAdmin, Guid actorId, string status, string? comment, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        const string sql = """
            UPDATE handoff SET status=@status, callback_owner_ref=@actor,
              accepted_at=CASE WHEN @status='accepted' THEN COALESCE(accepted_at,@now) ELSE accepted_at END,
              completed_at=CASE WHEN @status='completed' THEN COALESCE(completed_at,@now) ELSE completed_at END,
              failed_at=CASE WHEN @status='rejected' THEN COALESCE(failed_at,@now) ELSE failed_at END,
              failure_reason=CASE WHEN @status='rejected' THEN @comment ELSE failure_reason END
            WHERE id=@id AND (@is_admin OR tenant_id=@tenant_id)
              AND ((status='requested' AND @status IN ('accepted','rejected'))
                OR (status='accepted' AND @status='completed'));
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "status", NpgsqlDbType.Varchar, status); Add(command, "actor", NpgsqlDbType.Varchar, actorId.ToString());
        Add(command, "now", NpgsqlDbType.TimestampTz, now); Add(command, "comment", NpgsqlDbType.Varchar, comment ?? "");
        Add(command, "id", NpgsqlDbType.Uuid, id); Add(command, "is_admin", NpgsqlDbType.Boolean, isAdmin);
        AddNullable(command, "tenant_id", NpgsqlDbType.Uuid, tenantId);
        return await command.ExecuteNonQueryAsync(cancellationToken) > 0;
    }

    public async Task<IReadOnlyList<object>> GetKnowledgeArticlesAsync(Guid? tenantId, bool isAdmin, bool canReview, CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT a.id,a.workflow_state,a.language,a.product_code,a.module_code,a.owner_ref,a.created_at,
                   v.id,v.version_number,v.content_md,v.author_ref,v.created_at,v.published_at
            FROM knowledge_article a LEFT JOIN knowledge_version v ON v.id=COALESCE(a.current_version_id,
              (SELECT v2.id FROM knowledge_version v2 WHERE v2.article_id=a.id ORDER BY v2.version_number DESC LIMIT 1))
            WHERE (@is_admin OR a.tenant_id=@tenant_id OR a.owner_scope='global')
              AND (@can_review OR lower(a.workflow_state)='published')
            ORDER BY a.updated_at DESC LIMIT 300;
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "is_admin", NpgsqlDbType.Boolean, isAdmin); AddNullable(command, "tenant_id", NpgsqlDbType.Uuid, tenantId);
        Add(command, "can_review", NpgsqlDbType.Boolean, canReview);
        var articles = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var content = reader.IsDBNull(9) ? "" : reader.GetString(9);
            var title = content.Split('\n', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim().TrimStart('#').Trim() ?? "Artículo sin título";
            articles.Add(new { id = reader.GetGuid(0), workflowState = reader.GetString(1), language = reader.GetString(2), productCode = reader.IsDBNull(3) ? "" : reader.GetString(3), moduleCode = reader.IsDBNull(4) ? "" : reader.GetString(4), ownerRef = reader.GetString(5), createdAt = AsUtc(reader.GetDateTime(6)), versionId = reader.IsDBNull(7) ? (Guid?)null : reader.GetGuid(7), versionNumber = reader.IsDBNull(8) ? 0 : reader.GetInt32(8), title, content, authorRef = reader.IsDBNull(10) ? "" : reader.GetString(10), versionCreatedAt = reader.IsDBNull(11) ? (DateTime?)null : AsUtc(reader.GetDateTime(11)), publishedAt = reader.IsDBNull(12) ? (DateTime?)null : AsUtc(reader.GetDateTime(12)) });
        }
        return articles;
    }

    public async Task<Guid> CreateKnowledgeArticleAsync(Guid actorId, Guid? tenantId, string title, string content, string productCode, string moduleCode, string language, string audience, CancellationToken cancellationToken = default)
    {
        if (tenantId is null)
        {
            await using var tenantConnection = await dataSource.OpenConnectionAsync(cancellationToken);
            await using var findTenant = new NpgsqlCommand("SELECT id FROM tenant WHERE status='active' ORDER BY created_at LIMIT 1;", tenantConnection);
            var value = await findTenant.ExecuteScalarAsync(cancellationToken);
            if (value is Guid selectedTenant) tenantId = selectedTenant;
        }
        var articleId = Guid.NewGuid();
        var versionId = Guid.NewGuid();
        var body = $"# {title.Trim()}\n\n{content.Trim()}";
        var checksum = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(body))).ToLowerInvariant();
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using (var article = new NpgsqlCommand("""
            INSERT INTO knowledge_article (id,owner_scope,tenant_id,product_code,module_code,language,audience,workflow_state,owner_ref,created_at,updated_at)
            VALUES (@id,@scope,@tenant,@product,@module,@language,@audience,'pending_review',@owner,now(),now());
            """, connection, transaction))
        {
            Add(article,"id",NpgsqlDbType.Uuid,articleId); Add(article,"scope",NpgsqlDbType.Varchar,tenantId.HasValue?"tenant":"global");
            AddNullable(article,"tenant",NpgsqlDbType.Uuid,tenantId); Add(article,"product",NpgsqlDbType.Varchar,productCode);
            Add(article,"module",NpgsqlDbType.Varchar,moduleCode); Add(article,"language",NpgsqlDbType.Varchar,language);
            Add(article,"audience",NpgsqlDbType.Varchar,audience); Add(article,"owner",NpgsqlDbType.Varchar,actorId.ToString());
            await article.ExecuteNonQueryAsync(cancellationToken);
        }
        await using (var version = new NpgsqlCommand("""
            INSERT INTO knowledge_version (id,article_id,version_number,content_md,content_checksum,source_refs,author_ref,sanitization_state,is_immutable,created_at)
            VALUES (@id,@article,1,@content,@checksum,'[]'::jsonb,@author,'sanitized',false,now());
            """, connection, transaction))
        {
            Add(version,"id",NpgsqlDbType.Uuid,versionId); Add(version,"article",NpgsqlDbType.Uuid,articleId);
            Add(version,"content",NpgsqlDbType.Text,body); Add(version,"checksum",NpgsqlDbType.Varchar,checksum);
            Add(version,"author",NpgsqlDbType.Varchar,actorId.ToString()); await version.ExecuteNonQueryAsync(cancellationToken);
        }
        await using (var setCurrent = new NpgsqlCommand("UPDATE knowledge_article SET current_version_id=@version WHERE id=@article;", connection, transaction))
        {
            Add(setCurrent,"version",NpgsqlDbType.Uuid,versionId); Add(setCurrent,"article",NpgsqlDbType.Uuid,articleId);
            await setCurrent.ExecuteNonQueryAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
        return articleId;
    }

    public async Task<bool> ReviewKnowledgeArticleAsync(Guid articleId, Guid? tenantId, bool isAdmin, Guid reviewerId, bool approve, string? comment, CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        Guid? versionId;
        await using (var find = new NpgsqlCommand("SELECT current_version_id FROM knowledge_article WHERE id=@id AND (@is_admin OR tenant_id=@tenant_id) AND lower(workflow_state)='pending_review' FOR UPDATE;", connection, transaction))
        {
            Add(find,"id",NpgsqlDbType.Uuid,articleId); Add(find,"is_admin",NpgsqlDbType.Boolean,isAdmin); AddNullable(find,"tenant_id",NpgsqlDbType.Uuid,tenantId);
            var value = await find.ExecuteScalarAsync(cancellationToken);
            if (value is not Guid versionGuid) return false;
            versionId=versionGuid;
        }
        var workflow = approve ? "published" : "rejected";
        await using (var update = new NpgsqlCommand("UPDATE knowledge_article SET workflow_state=@state,updated_at=now() WHERE id=@id;", connection, transaction))
        {
            Add(update,"state",NpgsqlDbType.Varchar,workflow); Add(update,"id",NpgsqlDbType.Uuid,articleId);
            await update.ExecuteNonQueryAsync(cancellationToken);
        }
        await using (var versionUpdate = new NpgsqlCommand("""
            UPDATE knowledge_version SET reviewer_ref=@reviewer,
              publisher_ref=CASE WHEN @approve THEN @reviewer ELSE publisher_ref END,
              published_at=CASE WHEN @approve THEN now() ELSE published_at END,
              is_immutable=CASE WHEN @approve THEN true ELSE is_immutable END,
              source_refs=CASE WHEN @comment='' THEN source_refs ELSE source_refs || jsonb_build_array(jsonb_build_object('reviewComment',@comment)) END
            WHERE id=@version;
            """, connection, transaction))
        {
            Add(versionUpdate,"reviewer",NpgsqlDbType.Varchar,reviewerId.ToString()); Add(versionUpdate,"approve",NpgsqlDbType.Boolean,approve);
            Add(versionUpdate,"comment",NpgsqlDbType.Text,comment?.Trim() ?? ""); Add(versionUpdate,"version",NpgsqlDbType.Uuid,versionId.Value);
            await versionUpdate.ExecuteNonQueryAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<object>> GetAgentsAsync(CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT id, name, role FROM app_user
            WHERE lower(role) = 'agent'
            ORDER BY name;
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        var agents = new List<object>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
            agents.Add(new { id = reader.GetGuid(0), name = reader.GetString(1), role = reader.GetString(2) });
        return agents;
    }

    public async Task<bool> IsDatabaseReadyAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand("""
            SELECT to_regclass('tenant') IS NOT NULL
               AND to_regclass('branch') IS NOT NULL
               AND to_regclass('ticket') IS NOT NULL
               AND to_regclass('sla_clock') IS NOT NULL
               AND to_regclass('app_user') IS NOT NULL;
            """, connection);
        return (bool)(await command.ExecuteScalarAsync(cancellationToken) ?? false);
    }

    public async Task RecordBreachedSlasAsync(CancellationToken cancellationToken = default)
    {
        const string sql = """
            UPDATE sla_clock s SET breach_at = s.target_at
            FROM ticket t
            WHERE s.ticket_id = t.id AND s.kind = 'resolution' AND s.breach_at IS NULL
              AND s.target_at <= now() AND t.status NOT IN ('resolved', 'closed', 'cancelled');
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<TicketResponse>> GetTicketsByIdsAsync(Guid id, CancellationToken cancellationToken)
    {
        // Reuse the same response mapping with an administrator-only one-ticket query.
        const string sql = """
            SELECT t.id, t.display_number, t.subject, COALESCE(t.description, ''),
                   COALESCE(requester.name, 'Usuario registrado'), COALESCE(requester.email, ''),
                   COALESCE(tenant.name, 'Organización'), COALESCE(branch.name, 'Sede principal'),
                   COALESCE(NULLIF(category_meta.metadata ->> 'category', ''), 'Otro'),
                   CASE lower(COALESCE(t.priority, 'p3')) WHEN 'p1' THEN 'P1' WHEN 'p2' THEN 'P2' ELSE 'P3' END,
                   CASE t.status WHEN 'new' THEN 'Abierto' WHEN 'triaged' THEN 'Pendiente'
                     WHEN 'assigned' THEN 'En progreso' WHEN 'in_progress' THEN 'En progreso'
                     WHEN 'waiting_customer' THEN 'Pendiente' WHEN 'waiting_vendor' THEN 'Pendiente'
                     WHEN 'reopened' THEN 'Abierto' WHEN 'resolved' THEN 'Resuelto'
                     WHEN 'closed' THEN 'Resuelto' WHEN 'cancelled' THEN 'Resuelto' ELSE 'Abierto' END,
                   COALESCE(agent.name, 'Sin asignar'), agent.id,
                   COALESCE(NULLIF(queue_meta.metadata ->> 'queue', ''), 'Soporte técnico'),
                   COALESCE(NULLIF(created_meta.metadata ->> 'channel', ''), 'Portal'),
                   t.created_at,
                   COALESCE(sla.target_at, t.created_at + CASE lower(COALESCE(t.priority, 'p3'))
                       WHEN 'p1' THEN interval '4 hours' WHEN 'p2' THEN interval '8 hours'
                       ELSE interval '24 hours' END), COALESCE(t.resolution_notes, ''), COALESCE(t.requester_phone, '')
            FROM ticket t
            LEFT JOIN app_user requester ON t.requester_ref = requester.id::text
            LEFT JOIN tenant ON tenant.id = t.tenant_id
            LEFT JOIN branch ON branch.id = t.branch_id
            LEFT JOIN sla_clock sla ON sla.ticket_id = t.id AND sla.kind = 'resolution'
            LEFT JOIN LATERAL (SELECT metadata FROM ticket_timeline timeline WHERE timeline.ticket_id = t.id AND timeline.metadata ->> 'category' IS NOT NULL ORDER BY timeline.occurred_at DESC LIMIT 1) category_meta ON true
            LEFT JOIN LATERAL (SELECT metadata FROM ticket_timeline timeline WHERE timeline.ticket_id = t.id AND timeline.type = 'created' ORDER BY timeline.occurred_at DESC LIMIT 1) created_meta ON true
            LEFT JOIN LATERAL (SELECT metadata FROM ticket_timeline timeline WHERE timeline.ticket_id = t.id AND timeline.metadata ->> 'queue' IS NOT NULL ORDER BY timeline.occurred_at DESC LIMIT 1) queue_meta ON true
            LEFT JOIN LATERAL (SELECT assignee_ref FROM assignment WHERE ticket_id = t.id AND ended_at IS NULL ORDER BY assigned_at DESC LIMIT 1) active_assignment ON true
            LEFT JOIN app_user agent ON active_assignment.assignee_ref = agent.id::text
            WHERE t.id = @id;
            """;
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        Add(command, "id", NpgsqlDbType.Uuid, id);
        var items = new List<TicketResponse>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new TicketResponse(reader.GetGuid(0), reader.GetString(1), reader.GetString(2), reader.GetString(3),
                reader.GetString(4), reader.GetString(5), reader.GetString(6), reader.GetString(7), reader.GetString(8),
                reader.GetString(9), reader.GetString(10), reader.GetString(11), reader.IsDBNull(12) ? null : reader.GetGuid(12),
                reader.GetString(13), reader.GetString(14), AsUtc(reader.GetDateTime(15)), AsUtc(reader.GetDateTime(16)), reader.GetString(17), reader.GetString(18)));
        }
        return items;
    }

    private static async Task<OrganizationReference?> FindOrganizationAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction, Guid selectionId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT t.id, t.organization_id, b.id, t.name, COALESCE(b.name, 'Sede principal')
            FROM tenant t
            LEFT JOIN branch b ON b.tenant_id = t.id AND b.status = 'active'
            WHERE t.status = 'active' AND (t.id = @id OR b.id = @id)
            ORDER BY CASE WHEN b.id = @id THEN 0 ELSE 1 END
            LIMIT 1;
            """;
        await using var command = new NpgsqlCommand(sql, connection, transaction);
        Add(command, "id", NpgsqlDbType.Uuid, selectionId);
        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        return new OrganizationReference(reader.GetGuid(0), reader.GetGuid(1),
            reader.IsDBNull(2) ? null : reader.GetGuid(2), reader.GetString(3), reader.GetString(4));
    }

    private static async Task<string> NextTicketNumberAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction, Guid tenantId, int year, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO ticket_number_counter (tenant_id, prefix, year, last_value, updated_at)
            VALUES (@tenant_id, 'SUP', @year, 1, now())
            ON CONFLICT (tenant_id) DO UPDATE SET
                prefix = CASE WHEN ticket_number_counter.year = EXCLUDED.year THEN ticket_number_counter.prefix ELSE 'SUP' END,
                last_value = CASE WHEN ticket_number_counter.year = EXCLUDED.year THEN ticket_number_counter.last_value + 1 ELSE 1 END,
                year = EXCLUDED.year, updated_at = now()
            RETURNING prefix, last_value;
            """;
        await using var command = new NpgsqlCommand(sql, connection, transaction);
        Add(command, "tenant_id", NpgsqlDbType.Uuid, tenantId);
        Add(command, "year", NpgsqlDbType.Integer, year);
        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
        await reader.ReadAsync(cancellationToken);
        return $"{reader.GetString(0)}-{year}-{reader.GetInt64(1):D6}";
    }

    private static async Task InsertTimelineAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction, Guid ticketId, Guid tenantId,
        string type, string actor, string metadata, CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand("""
            INSERT INTO ticket_timeline (id, ticket_id, tenant_id, type, actor_ref, metadata, correlation_id, occurred_at)
            VALUES (@id, @ticket_id, @tenant_id, @type, @actor, @metadata, @correlation_id, now());
            """, connection, transaction);
        Add(command, "id", NpgsqlDbType.Uuid, Guid.NewGuid());
        Add(command, "ticket_id", NpgsqlDbType.Uuid, ticketId);
        Add(command, "tenant_id", NpgsqlDbType.Uuid, tenantId);
        Add(command, "type", NpgsqlDbType.Varchar, type);
        Add(command, "actor", NpgsqlDbType.Varchar, actor);
        Add(command, "metadata", NpgsqlDbType.Jsonb, metadata);
        Add(command, "correlation_id", NpgsqlDbType.Uuid, Guid.NewGuid());
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<SupportUser?> FindUserByIdOnConnectionAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction, Guid id, CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand("SELECT id, tenant_id, name, email, role, password_hash, status FROM app_user WHERE id = @id;", connection, transaction);
        Add(command, "id", NpgsqlDbType.Uuid, id);
        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadUser(reader) : null;
    }

    private static SupportUser ReadUser(NpgsqlDataReader reader) => new(
        reader.GetGuid(0), reader.IsDBNull(1) ? null : reader.GetGuid(1), reader.GetString(2),
        reader.GetString(3), reader.GetString(4), reader.IsDBNull(5) ? null : reader.GetString(5), reader.GetString(6));

    private static DateTime AsUtc(DateTime value) => DateTime.SpecifyKind(value, DateTimeKind.Utc);
    private static int SlaHoursFor(string priority) => priority.ToUpperInvariant() switch { "P1" => 4, "P2" => 8, _ => 24 };
    private static string QueueFor(string category) => category.Trim().ToLowerInvariant() switch
    {
        "software" => "Aplicaciones", "redes" => "Infraestructura", "telefonía" or "telefonia" => "Telefonía",
        "accesos" => "Accesos", _ => "Soporte técnico"
    };
    private static string NormalizeChannel(string channel) => channel.Trim() switch
    {
        "Correo" => "Correo", "Teléfono" or "Telefono" => "Teléfono", _ => "Portal"
    };
    private static string DbStatus(string status) => status switch
    {
        "Pendiente" => "waiting_customer", "En progreso" => "in_progress", "Resuelto" => "resolved", _ => "new"
    };

    private static void Add(NpgsqlCommand command, string name, NpgsqlDbType type, object value) =>
        command.Parameters.Add(name, type).Value = value;

    private static void AddNullable(NpgsqlCommand command, string name, NpgsqlDbType type, object? value) =>
        command.Parameters.Add(name, type).Value = value ?? DBNull.Value;

    private sealed record OrganizationReference(Guid TenantId, Guid OrganizationId, Guid? BranchId, string Name, string Branch);
}
