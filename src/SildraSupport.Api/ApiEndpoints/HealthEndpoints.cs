using Npgsql;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SildraSupport.Api;

internal static partial class ApiEndpoints
{
    private static void MapHealthEndpoints(WebApplication app)
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
        }).WithTags("Health");
    }
}
