using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SildraSupport.Api;

internal static partial class ApiEndpoints
{
    private static void MapCategoryEndpoints(WebApplication app)
    {
        var categories = app.MapGroup("/api/categories")
            .RequireAuthorization()
            .WithTags("Categories");

        categories.MapGet("", GetSupportCategoriesAsync);
        categories.MapPost("", CreateSupportCategoryAsync);
    }

    private static async Task<IResult> GetSupportCategoriesAsync(
        PostgresSupportStore store, CancellationToken cancellationToken) =>
        Results.Ok(await store.GetSupportCategoriesAsync(cancellationToken));

    private static async Task<IResult> CreateSupportCategoryAsync(
        CreateSupportCategoryRequest request,
        PostgresSupportStore store,
        HttpContext http,
        CancellationToken cancellationToken)
    {
        if (!IsAdmin(http.User)) return Results.Forbid();
        if (!TryGetUserId(http.User, out var adminId)) return Results.Unauthorized();

        var name = request.Name?.Trim() ?? string.Empty;
        if (name.Length is < 2 or > 80)
            return Results.BadRequest(new { message = "El nombre debe tener entre 2 y 80 caracteres." });

        var created = await store.AddSupportCategoryAsync(adminId, name, cancellationToken);
        return created is null
            ? Results.Conflict(new { message = "Ya existe una categoría con ese nombre." })
            : Results.Created("/api/categories", new { name = created });
    }
}
