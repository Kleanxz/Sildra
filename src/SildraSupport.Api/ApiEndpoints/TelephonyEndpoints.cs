using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SildraSupport.Api;

internal static partial class ApiEndpoints
{
    private static void MapTelephonyEndpoints(WebApplication app)
    {
        var telephony = app.MapGroup("/api")
            .RequireAuthorization()
            .WithTags("Telephony");
        telephony.MapGet("/calls", GetCallSessionsAsync);

        var handoffs = telephony.MapGroup("/handoffs");
        handoffs.MapGet("", GetHandoffsAsync);
        handoffs.MapPost("", CreateHandoffAsync);
        handoffs.MapPut("/{id:guid}", UpdateHandoffAsync);
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
}
