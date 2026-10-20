using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
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

    private static async Task<IResult> SendTicketChatMessageAsync(Guid id, SendTicketChatMessageRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var userId)) return Results.Unauthorized();
        var message = request.Message?.Trim() ?? string.Empty;
        if (message.Length is < 1 or > 4000)
            return Results.BadRequest(new { message = "El mensaje debe tener entre 1 y 4000 caracteres." });

        var created = await store.CreateTicketChatMessageAsync(id, userId, message, cancellationToken);
        return created is null
            ? Results.NotFound(new { message = "No tienes acceso a la conversación de este ticket o el ticket no existe." })
            : Results.Created($"/api/tickets/{id}/messages", created);
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
}
