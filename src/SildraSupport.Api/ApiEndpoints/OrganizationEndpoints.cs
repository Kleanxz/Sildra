using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SildraSupport.Api;

internal static partial class ApiEndpoints
{
    private static void MapOrganizationEndpoints(WebApplication app)
    {
        app.MapGet("/api/public/organizations", GetPublicOrganizationsAsync)
            .WithTags("Organizations");

        var organizations = app.MapGroup("/api/organizations")
            .RequireAuthorization()
            .WithTags("Organizations");
        organizations.MapGet("", GetOrganizationsAsync);
        organizations.MapPost("", CreateOrganizationAsync);
    }

    private static async Task<IResult> GetPublicOrganizationsAsync(PostgresSupportStore store, CancellationToken cancellationToken)
    {
        var organizations = await store.GetOrganizationsAsync(null, cancellationToken);
        return Results.Ok(organizations);
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
}
