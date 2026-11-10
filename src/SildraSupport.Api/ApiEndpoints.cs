using Microsoft.AspNetCore.Builder;

internal static partial class ApiEndpoints
{
    public static void Map(WebApplication app)
    {
        MapHealthEndpoints(app);
        MapVoiceEndpoints(app);
        MapAuthEndpoints(app);
        MapCategoryEndpoints(app);
        MapOrganizationEndpoints(app);
        MapTicketEndpoints(app);
        MapUserEndpoints(app);
        MapTelephonyEndpoints(app);
        MapKnowledgeEndpoints(app);
    }
}
