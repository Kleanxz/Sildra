using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

internal static partial class ApiEndpoints
{
    private static void MapLiveKitEndpoints(WebApplication app)
    {
        app.MapPost("/api/livekit/token", CreateLiveKitToken)
            .RequireAuthorization()
            .WithTags("LiveKit");
    }

    private static IResult CreateLiveKitToken(HttpContext http)
    {
        if (!TryGetUserId(http.User, out var userId))
            return Results.Unauthorized();
        if (!IsAgent(http.User) && !IsAdmin(http.User))
            return Results.Forbid();

        var configuredOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "http://localhost:4200",
            "http://127.0.0.1:4200",
            "https://localhost:4200",
            "https://127.0.0.1:4200",
        };
        var origin = http.Request.Headers["Origin"].ToString();
        if (!string.IsNullOrEmpty(origin) && !configuredOrigins.Contains(origin))
            return Results.Forbid();

        var serverUrl = Environment.GetEnvironmentVariable("LIVEKIT_URL");
        var apiKey = Environment.GetEnvironmentVariable("LIVEKIT_API_KEY");
        var apiSecret = Environment.GetEnvironmentVariable("LIVEKIT_API_SECRET");
        var agentName = Environment.GetEnvironmentVariable("LIVEKIT_AGENT_NAME");

        if (string.IsNullOrWhiteSpace(serverUrl)
            || string.IsNullOrWhiteSpace(apiKey)
            || string.IsNullOrWhiteSpace(apiSecret)
            || string.IsNullOrWhiteSpace(agentName))
        {
            return Results.Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "LiveKit no está configurado",
                detail: "Configura LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET y LIVEKIT_AGENT_NAME en el entorno de la API.");
        }

        var roomName = $"sildra-support-{Guid.NewGuid():N}";
        var identity = $"support-{userId:N}-{Guid.NewGuid():N}";
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var token = CreateLiveKitJwt(apiKey, apiSecret, roomName, identity, agentName, now);

        return Results.Ok(new LiveKitTokenResponse(serverUrl, token, roomName));
    }

    private static string CreateLiveKitJwt(
        string apiKey,
        string apiSecret,
        string roomName,
        string identity,
        string agentName,
        long now)
    {
        var header = Base64Url(JsonSerializer.SerializeToUtf8Bytes(new { alg = "HS256", typ = "JWT" }));
        var payload = Base64Url(JsonSerializer.SerializeToUtf8Bytes(new
        {
            iss = apiKey,
            sub = identity,
            nbf = now - 5,
            exp = now + 600,
            name = "Sildra Support Agent",
            video = new
            {
                room = roomName,
                roomJoin = true,
                canPublish = true,
                canSubscribe = true,
                canPublishData = true,
            },
            roomConfig = new
            {
                agents = new[] { new { agentName } },
            },
        }));

        var signingInput = $"{header}.{payload}";
        var signature = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(apiSecret),
            Encoding.ASCII.GetBytes(signingInput));
        return $"{signingInput}.{Base64Url(signature)}";
    }

    private static string Base64Url(byte[] value) =>
        Convert.ToBase64String(value)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

    private sealed record LiveKitTokenResponse(
        string ServerUrl,
        string ParticipantToken,
        string RoomName);
}
