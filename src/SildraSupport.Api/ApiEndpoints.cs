using Microsoft.AspNetCore.Builder;

internal static partial class ApiEndpoints
{
    public static void Map(WebApplication app)
    {
        MapHealthEndpoints(app);
        MapAuthEndpoints(app);
        MapOrganizationEndpoints(app);
        MapTicketEndpoints(app);
        MapUserEndpoints(app);
        MapTelephonyEndpoints(app);
        MapKnowledgeEndpoints(app);
    }
}
