using System.Security.Claims;
using Livekit.Server.Sdk.Dotnet;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

internal static partial class ApiEndpoints
{
    private static void MapVoiceEndpoints(WebApplication app)
    {
        app.MapPost("/api/voice/token", CreateVoiceToken)
            .RequireAuthorization()
            .WithTags("Voice assistant");
    }

    private static IResult CreateVoiceToken(ClaimsPrincipal principal)
    {
        var livekitUrl = Environment.GetEnvironmentVariable("LIVEKIT_URL");
        var apiKey = Environment.GetEnvironmentVariable("LIVEKIT_API_KEY");
        var apiSecret = Environment.GetEnvironmentVariable("LIVEKIT_API_SECRET");

        if (string.IsNullOrWhiteSpace(livekitUrl) ||
            string.IsNullOrWhiteSpace(apiKey) ||
            string.IsNullOrWhiteSpace(apiSecret))
        {
            return Results.Problem(
                title: "El asistente de voz no está configurado.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        if (!TryGetUserId(principal, out var userId))
            return Results.Unauthorized();

        var roomName = $"sildra-{Guid.NewGuid():N}";
        var participantName = principal.FindFirstValue(ClaimTypes.Name) ?? "Usuario Sildra";
        var participantIdentity = $"user-{userId:N}-{Guid.NewGuid():N}";

        var participantToken = new AccessToken(apiKey, apiSecret)
            .WithIdentity(participantIdentity)
            .WithName(participantName)
            .WithGrants(new VideoGrants
            {
                Room = roomName,
                RoomJoin = true,
                CanPublish = true,
                CanSubscribe = true,
                CanPublishData = true,
            })
            .WithRoomConfig(new RoomConfiguration
            {
                Agents = { new RoomAgentDispatch { AgentName = "livekit-agent" } },
            })
            .WithTtl(TimeSpan.FromMinutes(15))
            .ToJwt();

        return Results.Ok(new { serverUrl = livekitUrl, participantToken, roomName });
    }
}
