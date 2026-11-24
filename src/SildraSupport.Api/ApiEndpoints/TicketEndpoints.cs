using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Npgsql;
using SildraSupport.Api;

internal static partial class ApiEndpoints
{
    private static void MapTicketEndpoints(WebApplication app)
    {
        var tickets = app.MapGroup("/api/tickets")
            .RequireAuthorization()
            .WithTags("Tickets");
        tickets.MapGet("", GetTicketsAsync);
        tickets.MapPost("", CreateTicketAsync);
        tickets.MapGet("/{id:guid}/messages", GetTicketChatMessagesAsync);
        tickets.MapPost("/{id:guid}/messages", SendTicketChatMessageAsync);
        tickets.MapPut("/{id:guid}", UpdateTicketAsync);
        tickets.MapPost("/{id:guid}/resolve", ResolveTicketAsync);
        tickets.MapPost("/{id:guid}/classification", ReviewClassificationAsync);
    }

    private static async Task<IResult> GetTicketsAsync(PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var userId)) return Results.Unauthorized();
        return Results.Ok(await store.GetTicketsAsync(userId, IsAdmin(http.User), IsAgent(http.User), cancellationToken));
    }

    private static async Task<IResult> GetTicketChatMessagesAsync(Guid id, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var userId)) return Results.Unauthorized();
        var messages = await store.GetTicketChatMessagesAsync(id, userId, cancellationToken);
        return messages is null
            ? Results.NotFound(new { message = "No tienes acceso a la conversación de este ticket o el ticket no existe." })
            : Results.Ok(messages);
    }

    private static async Task<IResult> SendTicketChatMessageAsync(Guid id, SendTicketChatMessageRequest request, PostgresSupportStore store, RegistrationEmailSender emailSender, ILogger<RegistrationEmailSender> logger, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var userId)) return Results.Unauthorized();
        var message = request.Message?.Trim() ?? string.Empty;
        if (message.Length is < 1 or > 4000)
            return Results.BadRequest(new { message = "El mensaje debe tener entre 1 y 4000 caracteres." });

        var created = await store.CreateTicketChatMessageAsync(id, userId, message, cancellationToken);
        if (created is null)
            return Results.NotFound(new { message = "No tienes acceso a la conversación de este ticket o el ticket no existe." });

        await NotifyCollaboratorsAsync(
            id,
            userId,
            $"Nuevo mensaje en el ticket {id}",
            $"Se publicó un nuevo mensaje en Sildra Support.\n\nTicket: {id}\nAutor: {created.AuthorName} ({created.AuthorRole})\n\nMensaje:\n{created.Message}",
            store,
            emailSender,
            logger,
            cancellationToken);

        return Results.Created($"/api/tickets/{id}/messages", created);
    }

    private static async Task<IResult> CreateTicketAsync(CreateTicketRequest request, PostgresSupportStore store, RegistrationEmailSender emailSender, ILogger<RegistrationEmailSender> logger, HttpContext http, CancellationToken cancellationToken)
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
        if (ticket is null)
            return Results.BadRequest(new { message = "La organización no existe o no pertenece a tu cuenta." });

        await NotifyCollaboratorsAsync(
            ticket.Id,
            userId,
            $"Nuevo ticket {ticket.TicketNumber}: {ticket.Subject}",
            $"Se creó un nuevo ticket en Sildra Support.\n\nNúmero: {ticket.TicketNumber}\nAsunto: {ticket.Subject}\nSolicitante: {ticket.RequesterName}\nCorreo: {ticket.RequesterEmail}\nOrganización: {ticket.Organization}\nPrioridad: {ticket.Priority}\n\nDescripción:\n{ticket.Description}",
            store,
            emailSender,
            logger,
            cancellationToken);

        return Results.Created($"/api/tickets/{ticket.Id}", ticket);
    }

    private static async Task NotifyCollaboratorsAsync(
        Guid ticketId,
        Guid actorId,
        string subject,
        string body,
        PostgresSupportStore store,
        RegistrationEmailSender emailSender,
        ILogger<RegistrationEmailSender> logger,
        CancellationToken cancellationToken)
    {
        try
        {
            var recipientEmails = await store.GetCollaboratorEmailsForTicketAsync(ticketId, actorId, cancellationToken);
            await emailSender.SendToCollaboratorsAsync(recipientEmails, subject, body);
        }
        catch (NpgsqlException exception)
        {
            logger.LogWarning(exception, "No se pudieron obtener los agentes para notificar el ticket {TicketId}.", ticketId);
        }
    }

    private static async Task<IResult> UpdateTicketAsync(Guid id, UpdateTicketRequest request, PostgresSupportStore store, RegistrationEmailSender emailSender, HttpContext http, CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User)) return Results.Forbid();
        if (!TryNormalizePriority(request.Priority, out var priority) || !IsValidStatus(request.Status))
            return Results.BadRequest(new { message = "El estado o la prioridad no son válidos." });
        if (!TryGetUserId(http.User, out var adminId)) return Results.Unauthorized();

        var update = await store.UpdateTicketAsync(id, adminId, request.Status, priority,
            request.Queue?.Trim() ?? "Soporte técnico", request.AssigneeId, cancellationToken);
        if (update is null)
            return Results.NotFound(new { message = "No se encontró el ticket o el agente no pertenece a su organización." });

        var assignedAgentEmail = update.AssignedAgentEmail;
        if (update.AssigneeChanged && !string.IsNullOrWhiteSpace(assignedAgentEmail))
        {
            var ticket = update.Ticket;
            var agentName = update.AssignedAgentName ?? "agente";
            var subject = $"Se te asignó el ticket {ticket.TicketNumber}";
            var body = $"Hola {agentName},\n\n" +
                       "Se te asignó un ticket en Sildra Support.\n\n" +
                       $"Número: {ticket.TicketNumber}\n" +
                       $"Asunto: {ticket.Subject}\n" +
                       $"Solicitante: {ticket.RequesterName}\n" +
                       $"Organización: {ticket.Organization}\n" +
                       $"Prioridad: {ticket.Priority}\n" +
                       $"Estado: {ticket.Status}\n" +
                       $"Cola: {ticket.Queue}\n\n" +
                       "Ingresa en Sildra Support para revisar el ticket.\n\nSildra Support";
            await emailSender.SendToCollaboratorsAsync(new[] { assignedAgentEmail }, subject, body);
        }

        return Results.Ok(update.Ticket);
    }

    private static async Task<IResult> ResolveTicketAsync(Guid id, ResolveTicketRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var actorId)) return Results.Unauthorized();
        if (!IsAdmin(http.User) && !IsAgent(http.User)) return Results.Forbid();
        var notes = request.ResolutionNotes?.Trim() ?? string.Empty;
        if (notes.Length > 5000 || (request.KnowledgeArticleId is null && notes.Length < 10))
            return Results.BadRequest(new { message = "Escribe al menos 10 caracteres o selecciona una guía publicada; las notas admiten hasta 5000 caracteres." });
        var ticket = await store.ResolveTicketAsync(id, actorId, GetTenantId(http.User), IsAdmin(http.User), IsAgent(http.User), notes, request.KnowledgeArticleId, cancellationToken);
        return ticket is null
            ? Results.NotFound(new { message = "El ticket no existe, no está asignado a tu cuenta o la guía publicada no está disponible para esta organización." })
            : Results.Ok(ticket);
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
}
