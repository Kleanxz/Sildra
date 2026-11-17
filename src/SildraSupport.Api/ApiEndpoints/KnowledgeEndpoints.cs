using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SildraSupport.Api;

internal static partial class ApiEndpoints
{
    private static void MapKnowledgeEndpoints(WebApplication app)
    {
        var knowledge = app.MapGroup("/api/knowledge/articles")
            .RequireAuthorization()
            .WithTags("Knowledge base");
        knowledge.MapGet("", GetKnowledgeArticlesAsync);
        knowledge.MapPost("", CreateKnowledgeArticleAsync);
        knowledge.MapPost("/{id:guid}/approve", ApproveKnowledgeArticleAsync);
        knowledge.MapPost("/{id:guid}/reject", RejectKnowledgeArticleAsync);

        app.MapPost("/api/voice/knowledge/search", SearchVoiceKnowledgeAsync)
            .WithTags("Voice assistant");
    }

    private static async Task<IResult> SearchVoiceKnowledgeAsync(SearchVoiceKnowledgeRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        var expectedKey = Environment.GetEnvironmentVariable("SILDRA_KB_TOOL_KEY");
        var suppliedKey = http.Request.Headers["X-Sildra-KB-Key"].ToString();
        if (string.IsNullOrWhiteSpace(expectedKey))
            return Results.Problem(title: "La búsqueda de conocimiento del agente no está configurada.", statusCode: StatusCodes.Status503ServiceUnavailable);
        if (string.IsNullOrWhiteSpace(suppliedKey) || !FixedTimeTextEquals(suppliedKey, expectedKey))
            return Results.Unauthorized();

        var query = request.Query?.Trim() ?? string.Empty;
        if (query.Length is < 3 or > 500)
            return Results.BadRequest(new { message = "La consulta debe tener entre 3 y 500 caracteres." });

        Guid? tenantId = null;
        var tenantHeader = http.Request.Headers["X-Sildra-Tenant-Id"].ToString();
        if (!string.IsNullOrWhiteSpace(tenantHeader))
        {
            if (!Guid.TryParse(tenantHeader, out var parsedTenantId)) return Results.BadRequest(new { message = "El tenant de la consulta no es válido." });
            tenantId = parsedTenantId;
        }

        var articles = await store.SearchPublishedKnowledgeAsync(query, tenantId, cancellationToken);
        return Results.Ok(new { found = articles.Count > 0, articles });
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
}

internal sealed record SearchVoiceKnowledgeRequest(string? Query);
