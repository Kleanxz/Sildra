using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SildraSupport.Api;

internal static partial class ApiEndpoints
{
    private static void MapUserEndpoints(WebApplication app)
    {
        var users = app.MapGroup("/api")
            .RequireAuthorization()
            .WithTags("Users");
        users.MapGet("/agents", GetAgentsAsync);
        users.MapGet("/users", GetUsersAsync);
        users.MapPut("/users/{id:guid}/role", UpdateUserRoleAsync);
        users.MapDelete("/users/{id:guid}", DeleteUserAsync);
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
}
