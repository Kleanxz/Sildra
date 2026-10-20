using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Npgsql;
using SildraSupport.Api;

internal static class ApiEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/api/health", async (PostgresSupportStore store, CancellationToken cancellationToken) =>
        {
            try
            {
                var ready = await store.IsDatabaseReadyAsync(cancellationToken);
                return ready
                    ? Results.Ok(new { status = "ok", database = "connected" })
                    : Results.Json(new { status = "degraded", database = "schema_incomplete" }, statusCode: StatusCodes.Status503ServiceUnavailable);
            }
            catch (NpgsqlException)
            {
                return Results.Json(new { status = "degraded", database = "unavailable" }, statusCode: StatusCodes.Status503ServiceUnavailable);
            }
        });

        app.MapGet("/api/public/organizations", GetPublicOrganizationsAsync);
        app.MapPost("/api/auth/register", RegisterAsync);
        app.MapPost("/api/auth/login", LoginAsync);
        app.MapGet("/api/auth/me", MeAsync).RequireAuthorization();
        app.MapPost("/api/auth/logout", (Func<HttpContext, Task<IResult>>)LogoutAsync).RequireAuthorization();
        app.MapPut("/api/auth/profile", UpdateProfileAsync).RequireAuthorization();

        app.MapGet("/api/organizations", GetOrganizationsAsync).RequireAuthorization();
        app.MapPost("/api/organizations", CreateOrganizationAsync).RequireAuthorization();
        app.MapGet("/api/tickets", GetTicketsAsync).RequireAuthorization();
        app.MapPost("/api/tickets", CreateTicketAsync).RequireAuthorization();
        app.MapPut("/api/tickets/{id:guid}", UpdateTicketAsync).RequireAuthorization();
        app.MapPost("/api/tickets/{id:guid}/resolve", ResolveTicketAsync).RequireAuthorization();
        app.MapPost("/api/tickets/{id:guid}/classification", ReviewClassificationAsync).RequireAuthorization();
        app.MapGet("/api/agents", GetAgentsAsync).RequireAuthorization();
        app.MapGet("/api/users", GetUsersAsync).RequireAuthorization();
        app.MapPut("/api/users/{id:guid}/role", UpdateUserRoleAsync).RequireAuthorization();
        app.MapDelete("/api/users/{id:guid}", DeleteUserAsync).RequireAuthorization();
        app.MapGet("/api/calls", GetCallSessionsAsync).RequireAuthorization();
        app.MapGet("/api/handoffs", GetHandoffsAsync).RequireAuthorization();
        app.MapPost("/api/handoffs", CreateHandoffAsync).RequireAuthorization();
        app.MapPut("/api/handoffs/{id:guid}", UpdateHandoffAsync).RequireAuthorization();
        app.MapGet("/api/knowledge/articles", GetKnowledgeArticlesAsync).RequireAuthorization();
        app.MapPost("/api/knowledge/articles", CreateKnowledgeArticleAsync).RequireAuthorization();
        app.MapPost("/api/knowledge/articles/{id:guid}/approve", ApproveKnowledgeArticleAsync).RequireAuthorization();
        app.MapPost("/api/knowledge/articles/{id:guid}/reject", RejectKnowledgeArticleAsync).RequireAuthorization();
    }

    private static async Task<IResult> GetPublicOrganizationsAsync(PostgresSupportStore store, CancellationToken cancellationToken)
    {
        var organizations = await store.GetOrganizationsAsync(null, cancellationToken);
        return Results.Ok(organizations);
    }

    private static async Task<IResult> RegisterAsync(RegisterRequest request, PostgresSupportStore store, RegistrationEmailSender emailSender, HttpContext http, CancellationToken cancellationToken)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        var email = NormalizeEmail(request.Email);
        var hasOrganization = Guid.TryParse(request.OrganizationId, out var organizationId) && organizationId != Guid.Empty;
        if (name.Length is < 2 or > 120 || !IsValidEmail(email) || request.Password is null || request.Password.Length is < 8 or > 128 || !hasOrganization)
        {
            return Results.BadRequest(new { message = "Completa el nombre, correo, contraseña de al menos 8 caracteres y selecciona una sucursal válida." });
        }

        if (await store.EmailExistsAsync(email, cancellationToken: cancellationToken))
            return Results.Conflict(new { message = "Ya existe una cuenta con ese correo." });

        var tenantId = await store.GetTenantIdForOrganizationAsync(organizationId, cancellationToken);
        if (tenantId is null) return Results.BadRequest(new { message = "Selecciona una organización o sucursal activa." });

        var user = new SupportUser(Guid.NewGuid(), tenantId, name, email, "User", PasswordSecurity.Hash(request.Password), "Disponible");
        try
        {
            await store.InsertUserAsync(user, cancellationToken);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return Results.Conflict(new { message = "Ya existe una cuenta con ese correo." });
        }

        await SignInAsync(http, user);
        var emailSent = await emailSender.SendWelcomeAsync(user.Email, user.Name);
        return Results.Created("/api/auth/me", UserPayload(user, emailSent));
    }

    private static async Task<IResult> LoginAsync(LoginRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        if (!IsValidEmail(email) || string.IsNullOrEmpty(request.Password)) return Results.Unauthorized();

        var adminEmail = NormalizeEmail(Environment.GetEnvironmentVariable("ADMIN_EMAIL"));
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
        if (!string.IsNullOrWhiteSpace(adminEmail) && email == adminEmail)
        {
            if (string.IsNullOrEmpty(adminPassword) || !FixedTimeTextEquals(request.Password, adminPassword)) return Results.Unauthorized();
            var adminName = Environment.GetEnvironmentVariable("ADMIN_NAME")?.Trim();
            var admin = await store.UpsertAdminAsync(
                string.IsNullOrWhiteSpace(adminName) ? "Administrador" : adminName,
                adminEmail,
                PasswordSecurity.Hash(adminPassword),
                cancellationToken);
            await SignInAsync(http, admin);
            return Results.Ok(UserPayload(admin));
        }

        var user = await store.FindUserForLoginAsync(email, cancellationToken);
        if (user is null || !PasswordSecurity.Verify(request.Password, user.PasswordHash)) return Results.Unauthorized();
        await SignInAsync(http, user);
        return Results.Ok(UserPayload(user));
    }

    private static async Task<IResult> MeAsync(PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var userId)) return Results.Unauthorized();
        var user = await store.FindUserByIdAsync(userId, cancellationToken);
        if (user is null) return Results.Unauthorized();
        await SignInAsync(http, user);
        return Results.Ok(UserPayload(user));
    }

    private static async Task<IResult> LogoutAsync(HttpContext http)
    {
        await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Results.Ok(new { message = "Sesión cerrada." });
    }

    private static async Task<IResult> UpdateProfileAsync(UpdateProfileRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var userId)) return Results.Unauthorized();
        var name = request.Name?.Trim() ?? string.Empty;
        var email = NormalizeEmail(request.Email);
        if (name.Length is < 2 or > 120 || !IsValidEmail(email))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["profile"] = ["Escribe un nombre y un correo válido."]
            });
        }

        if (await store.EmailExistsAsync(email, userId, cancellationToken))
            return Results.Conflict(new { message = "Ese correo ya pertenece a otra cuenta." });

        var user = await store.UpdateProfileAsync(userId, name, email, cancellationToken);
        if (user is null) return Results.Unauthorized();
        await SignInAsync(http, user);
        return Results.Ok(UserPayload(user));
    }

    private static async Task<IResult> GetOrganizationsAsync(PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        var tenantId = IsAdmin(http.User) ? null : GetTenantId(http.User);
        if (!IsAdmin(http.User) && tenantId is null) return Results.Forbid();
        return Results.Ok(await store.GetOrganizationsAsync(tenantId, cancellationToken));
    }

    private static async Task<IResult> CreateOrganizationAsync(CreateOrganizationRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User)) return Results.Forbid();
        var name = request.Name?.Trim() ?? string.Empty;
        var branch = request.Branch?.Trim() ?? string.Empty;
        if (name.Length is < 2 or > 120 || branch.Length > 120)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["organization"] = ["Indica un nombre válido y una sucursal de hasta 120 caracteres."]
            });
        }

        var organization = await store.CreateOrganizationAsync(name, branch, cancellationToken);
        return Results.Created("/api/organizations", organization);
    }

    private static async Task<IResult> GetTicketsAsync(PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var userId)) return Results.Unauthorized();
        return Results.Ok(await store.GetTicketsAsync(userId, IsAdmin(http.User), IsAgent(http.User), cancellationToken));
    }

    private static async Task<IResult> CreateTicketAsync(CreateTicketRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var userId)) return Results.Unauthorized();
        var subject = request.Subject?.Trim() ?? string.Empty;
        var description = request.Description?.Trim() ?? string.Empty;
        var phone = request.Phone?.Trim() ?? string.Empty;
        if (subject.Length is < 3 or > 150 || description.Length is < 5 or > 5000)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["ticket"] = ["El título debe tener entre 3 y 150 caracteres y la descripción entre 5 y 5000."]
            });
        }

        if (!TryNormalizePriority(request.Priority, out var priority))
            return Results.BadRequest(new { message = "La prioridad seleccionada no es válida." });

        if (!IsValidPhone(phone))
            return Results.BadRequest(new { message = "Escribe un teléfono válido con entre 7 y 15 dígitos." });

        var ticket = await store.CreateTicketAsync(
            userId, GetTenantId(http.User), IsAdmin(http.User), request.OrganizationId,
            subject, description, request.Category?.Trim() ?? "Otro", priority,
            request.Channel?.Trim() ?? "Portal", phone, cancellationToken);
        return ticket is null
            ? Results.BadRequest(new { message = "La organización no existe o no pertenece a tu cuenta." })
            : Results.Created($"/api/tickets/{ticket.Id}", ticket);
    }

    private static async Task<IResult> UpdateTicketAsync(Guid id, UpdateTicketRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User)) return Results.Forbid();
        if (!TryNormalizePriority(request.Priority, out var priority) || !IsValidStatus(request.Status))
            return Results.BadRequest(new { message = "El estado o la prioridad no son válidos." });
        if (!TryGetUserId(http.User, out var adminId)) return Results.Unauthorized();

        var ticket = await store.UpdateTicketAsync(id, adminId, request.Status, priority,
            request.Queue?.Trim() ?? "Soporte técnico", request.AssigneeId, cancellationToken);
        return ticket is null
            ? Results.NotFound(new { message = "No se encontró el ticket o el agente no pertenece a su organización." })
            : Results.Ok(ticket);
    }

    private static async Task<IResult> GetAgentsAsync(PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User)) return Results.Forbid();
        return Results.Ok(await store.GetAgentsAsync(cancellationToken));
    }

    private static async Task<IResult> GetUsersAsync(PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User)) return Results.Forbid();
        return Results.Ok(await store.GetUsersAsync(cancellationToken));
    }

    private static async Task<IResult> UpdateUserRoleAsync(Guid id, UpdateUserRoleRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User)) return Results.Forbid();
        if (!TryGetUserId(http.User, out var actorId)) return Results.Unauthorized();
        var role = request.Role?.Trim();
        if (role is null || !(role.Equals("User", StringComparison.OrdinalIgnoreCase) || role.Equals("Agent", StringComparison.OrdinalIgnoreCase)))
            return Results.BadRequest(new { message = "El rol debe ser User o Agent." });
        if (id == actorId) return Results.BadRequest(new { message = "No puedes cambiar tu propio rol." });
        var user = await store.UpdateUserRoleAsync(id, role.Equals("Agent", StringComparison.OrdinalIgnoreCase) ? "Agent" : "User", cancellationToken);
        return user is null ? Results.NotFound(new { message = "No se encontró la cuenta o es una cuenta administrativa." }) : Results.Ok(new { id = user.Id, name = user.Name, email = user.Email, role = user.Role, status = user.Status });
    }

    private static async Task<IResult> DeleteUserAsync(Guid id, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User)) return Results.Forbid();
        if (!TryGetUserId(http.User, out var actorId)) return Results.Unauthorized();
        if (id == actorId) return Results.BadRequest(new { message = "No puedes borrar tu propia cuenta administrativa." });
        var deleted = await store.DeleteUserAsync(id, cancellationToken);
        return deleted ? Results.NoContent() : Results.NotFound(new { message = "No se encontró la cuenta o es una cuenta administrativa." });
    }

    private static async Task<IResult> ResolveTicketAsync(Guid id, ResolveTicketRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var actorId)) return Results.Unauthorized();
        if (!IsAdmin(http.User) && !IsAgent(http.User)) return Results.Forbid();
        var notes = request.ResolutionNotes?.Trim() ?? string.Empty;
        if (notes.Length is < 10 or > 5000) return Results.BadRequest(new { message = "Describe cómo resolviste el ticket (entre 10 y 5000 caracteres)." });
        var ticket = await store.ResolveTicketAsync(id, actorId, GetTenantId(http.User), IsAdmin(http.User), IsAgent(http.User), notes, cancellationToken);
        return ticket is null ? Results.NotFound(new { message = "El ticket no existe o no está asignado a tu cuenta." }) : Results.Ok(ticket);
    }

    private static async Task<IResult> ReviewClassificationAsync(Guid id, ReviewClassificationRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var actorId)) return Results.Unauthorized();
        if (!IsAdmin(http.User) && !IsAgent(http.User)) return Results.Forbid();
        var category = request.Category?.Trim() ?? string.Empty;
        if (category.Length is < 2 or > 80) return Results.BadRequest(new { message = "Selecciona una categoría válida." });
        var updated = await store.ReviewClassificationAsync(id, actorId, GetTenantId(http.User), IsAdmin(http.User), IsAgent(http.User), category, cancellationToken);
        return updated ? Results.Ok(new { message = "Clasificación guardada." }) : Results.NotFound(new { message = "El ticket no existe o no está asignado a tu cuenta." });
    }

    private static async Task<IResult> GetCallSessionsAsync(PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User) && GetTenantId(http.User) is null) return Results.Forbid();
        return Results.Ok(await store.GetCallSessionsAsync(GetTenantId(http.User), IsAdmin(http.User), cancellationToken));
    }

    private static async Task<IResult> GetHandoffsAsync(PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User) && !IsAgent(http.User)) return Results.Forbid();
        return Results.Ok(await store.GetHandoffsAsync(GetTenantId(http.User), IsAdmin(http.User), cancellationToken));
    }

    private static async Task<IResult> CreateHandoffAsync(CreateHandoffRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var actorId)) return Results.Unauthorized();
        if (!IsAdmin(http.User) && !IsAgent(http.User)) return Results.Forbid();
        var reason = request.Reason?.Trim() ?? string.Empty;
        var extension = request.ExtensionRef?.Trim() ?? string.Empty;
        if (reason.Length is < 3 or > 500 || extension.Length > 40) return Results.BadRequest(new { message = "Indica un motivo y una extensión válida." });
        var created = await store.CreateHandoffAsync(request.TicketId, actorId, GetTenantId(http.User), IsAdmin(http.User), IsAgent(http.User),
            string.IsNullOrWhiteSpace(request.Provider) ? "manual" : request.Provider.Trim(), request.QueueRef?.Trim() ?? "Soporte", extension, reason, cancellationToken);
        return created ? Results.Created("/api/handoffs", new { message = "Transferencia solicitada." }) : Results.NotFound(new { message = "El ticket no existe o no está asignado a tu cuenta." });
    }

    private static async Task<IResult> UpdateHandoffAsync(Guid id, UpdateHandoffRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var actorId)) return Results.Unauthorized();
        if (!IsAdmin(http.User) && !IsAgent(http.User)) return Results.Forbid();
        var status = request.Status?.Trim().ToLowerInvariant();
        if (status is not ("accepted" or "rejected" or "completed")) return Results.BadRequest(new { message = "El estado de transferencia no es válido." });
        var updated = await store.UpdateHandoffAsync(id, GetTenantId(http.User), IsAdmin(http.User), actorId, status, request.Comment, cancellationToken);
        return updated ? Results.Ok(new { message = "Transferencia actualizada." }) : Results.NotFound(new { message = "No se encontró la transferencia." });
    }

    private static async Task<IResult> GetKnowledgeArticlesAsync(PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User) && GetTenantId(http.User) is null) return Results.Forbid();
        return Results.Ok(await store.GetKnowledgeArticlesAsync(GetTenantId(http.User), IsAdmin(http.User), IsAdmin(http.User) || IsAgent(http.User), cancellationToken));
    }

    private static async Task<IResult> CreateKnowledgeArticleAsync(CreateKnowledgeArticleRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var actorId)) return Results.Unauthorized();
        if (!IsAdmin(http.User) && !IsAgent(http.User)) return Results.Forbid();
        var title = request.Title?.Trim() ?? string.Empty;
        var content = request.Content?.Trim() ?? string.Empty;
        if (title.Length is < 3 or > 160 || content.Length is < 20 or > 20_000) return Results.BadRequest(new { message = "El título debe tener al menos 3 caracteres y el contenido entre 20 y 20000." });
        var id = await store.CreateKnowledgeArticleAsync(actorId, GetTenantId(http.User), title, content,
            request.ProductCode?.Trim() ?? string.Empty, request.ModuleCode?.Trim() ?? string.Empty,
            string.IsNullOrWhiteSpace(request.Language) ? "es" : request.Language.Trim(),
            string.IsNullOrWhiteSpace(request.Audience) ? "support" : request.Audience.Trim(), cancellationToken);
        return Results.Created($"/api/knowledge/articles/{id}", new { id, workflowState = "pending_review" });
    }

    private static Task<IResult> ApproveKnowledgeArticleAsync(Guid id, ReviewKnowledgeArticleRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken) =>
        ReviewKnowledgeArticleAsync(id, request, store, http, true, cancellationToken);

    private static Task<IResult> RejectKnowledgeArticleAsync(Guid id, ReviewKnowledgeArticleRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken) =>
        ReviewKnowledgeArticleAsync(id, request, store, http, false, cancellationToken);

    private static async Task<IResult> ReviewKnowledgeArticleAsync(Guid id, ReviewKnowledgeArticleRequest request, PostgresSupportStore store, HttpContext http, bool approve, CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User)) return Results.Forbid();
        if (!TryGetUserId(http.User, out var reviewerId)) return Results.Unauthorized();
        var changed = await store.ReviewKnowledgeArticleAsync(id, GetTenantId(http.User), true, reviewerId, approve, request.Comment, cancellationToken);
        return changed ? Results.Ok(new { message = approve ? "Artículo aprobado y publicado." : "Artículo rechazado." }) : Results.NotFound(new { message = "No se encontró un artículo pendiente de revisión." });
    }

    private static async Task SignInAsync(HttpContext http, SupportUser user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, IsAdmin(user.Role) ? "Admin" : IsAgent(user.Role) ? "Agent" : "User")
        };
        if (user.TenantId is Guid tenantId) claims.Add(new Claim("tenant_id", tenantId.ToString()));
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await http.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = true, ExpiresUtc = DateTimeOffset.UtcNow.AddDays(30) });
    }

    private static object UserPayload(SupportUser user, bool? emailSent = null) => new
    {
        id = user.Id,
        name = user.Name,
        email = user.Email,
        role = IsAdmin(user.Role) ? "Admin" : IsAgent(user.Role) ? "Agent" : "User",
        isAdmin = IsAdmin(user.Role),
        isAgent = IsAgent(user.Role),
        emailSent
    };

    private static bool TryGetUserId(ClaimsPrincipal principal, out Guid userId) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

    private static Guid? GetTenantId(ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue("tenant_id"), out var id) ? id : null;

    private static bool IsAdmin(ClaimsPrincipal principal) =>
        string.Equals(principal.FindFirstValue(ClaimTypes.Role), "Admin", StringComparison.OrdinalIgnoreCase);

    private static bool IsAgent(ClaimsPrincipal principal) =>
        string.Equals(principal.FindFirstValue(ClaimTypes.Role), "Agent", StringComparison.OrdinalIgnoreCase);

    private static bool IsAdmin(string? role) => string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);
    private static bool IsAgent(string? role) => string.Equals(role, "Agent", StringComparison.OrdinalIgnoreCase);
    private static string NormalizeEmail(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();
    private static bool IsValidEmail(string email) => email.Length <= 254 && new EmailAddressAttribute().IsValid(email);
    private static bool IsValidPhone(string phone) =>
        phone.Length is >= 7 and <= 40 &&
        phone.Count(char.IsAsciiDigit) is >= 7 and <= 15 &&
        phone.All(character => char.IsAsciiDigit(character) || "+ ().-".Contains(character));

    private static bool TryNormalizePriority(string? value, out string priority)
    {
        priority = value?.Trim().ToUpperInvariant() ?? string.Empty;
        return priority is "P1" or "P2" or "P3";
    }

    private static bool IsValidStatus(string? value) => value is "Abierto" or "Pendiente" or "En progreso" or "Resuelto";

    private static bool FixedTimeTextEquals(string first, string second)
    {
        var left = System.Text.Encoding.UTF8.GetBytes(first);
        var right = System.Text.Encoding.UTF8.GetBytes(second);
        return left.Length == right.Length && CryptographicOperations.FixedTimeEquals(left, right);
    }
}
