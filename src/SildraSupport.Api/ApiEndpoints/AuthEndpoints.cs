using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Npgsql;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SildraSupport.Api;

internal static partial class ApiEndpoints
{
    private static void MapAuthEndpoints(WebApplication app)
    {
        var auth = app.MapGroup("/api/auth").WithTags("Authentication");
        auth.MapPost("/register", RegisterAsync);
        auth.MapPost("/login", LoginAsync);

        var authenticatedAuth = app.MapGroup("/api/auth").RequireAuthorization().WithTags("Authentication");
        authenticatedAuth.MapGet("/me", MeAsync);
        authenticatedAuth.MapPost("/logout", (Func<HttpContext, Task<IResult>>)LogoutAsync);
        authenticatedAuth.MapPut("/profile", UpdateProfileAsync);
    }

    private static async Task<IResult> RegisterAsync(RegisterRequest request, PostgresSupportStore store, RegistrationEmailSender emailSender, HttpContext http, CancellationToken cancellationToken)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        var email = NormalizeEmail(request.Email);
        var hasOrganization = Guid.TryParse(request.OrganizationId, out var organizationId) && organizationId != Guid.Empty;
        if (name.Length is < 2 or > 120 || !IsValidEmail(email) || request.Password is null || request.Password.Length is < 8 or > 128 || !hasOrganization)
        {
            return Results.BadRequest(new { message = "Completa el nombre, correo, contraseña de al menos 8 caracteres y selecciona una sucursal válida." });
        }

        if (await store.EmailExistsAsync(email, cancellationToken: cancellationToken))
            return Results.Conflict(new { message = "Ya existe una cuenta con ese correo." });

        var tenantId = await store.GetTenantIdForOrganizationAsync(organizationId, cancellationToken);
        if (tenantId is null) return Results.BadRequest(new { message = "Selecciona una organización o sucursal activa." });

        var user = new SupportUser(Guid.NewGuid(), tenantId, name, email, "User", PasswordSecurity.Hash(request.Password), "Disponible");
        try
        {
            await store.InsertUserAsync(user, cancellationToken);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return Results.Conflict(new { message = "Ya existe una cuenta con ese correo." });
        }

        await SignInAsync(http, user);
        var emailSent = await emailSender.SendWelcomeAsync(user.Email, user.Name);
        return Results.Created("/api/auth/me", UserPayload(user, emailSent));
    }

    private static async Task<IResult> LoginAsync(LoginRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        if (!IsValidEmail(email) || string.IsNullOrEmpty(request.Password)) return Results.Unauthorized();

        var adminEmail = NormalizeEmail(Environment.GetEnvironmentVariable("ADMIN_EMAIL"));
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
        if (!string.IsNullOrWhiteSpace(adminEmail) && email == adminEmail)
        {
            if (string.IsNullOrEmpty(adminPassword) || !FixedTimeTextEquals(request.Password, adminPassword)) return Results.Unauthorized();
            var adminName = Environment.GetEnvironmentVariable("ADMIN_NAME")?.Trim();
            var admin = await store.UpsertAdminAsync(
                string.IsNullOrWhiteSpace(adminName) ? "Administrador" : adminName,
                adminEmail,
                PasswordSecurity.Hash(adminPassword),
                cancellationToken);
            await SignInAsync(http, admin);
            return Results.Ok(UserPayload(admin));
        }

        var user = await store.FindUserForLoginAsync(email, cancellationToken);
        if (user is null || !PasswordSecurity.Verify(request.Password, user.PasswordHash)) return Results.Unauthorized();
        await SignInAsync(http, user);
        return Results.Ok(UserPayload(user));
    }

    private static async Task<IResult> MeAsync(PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var userId)) return Results.Unauthorized();
        var user = await store.FindUserByIdAsync(userId, cancellationToken);
        if (user is null) return Results.Unauthorized();
        await SignInAsync(http, user);
        return Results.Ok(UserPayload(user));
    }

    private static async Task<IResult> LogoutAsync(HttpContext http)
    {
        await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Results.Ok(new { message = "Sesión cerrada." });
    }

    private static async Task<IResult> UpdateProfileAsync(UpdateProfileRequest request, PostgresSupportStore store, HttpContext http, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(http.User, out var userId)) return Results.Unauthorized();
        var name = request.Name?.Trim() ?? string.Empty;
        var email = NormalizeEmail(request.Email);
        if (name.Length is < 2 or > 120 || !IsValidEmail(email))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["profile"] = ["Escribe un nombre y un correo válido."]
            });
        }

        if (await store.EmailExistsAsync(email, userId, cancellationToken))
            return Results.Conflict(new { message = "Ese correo ya pertenece a otra cuenta." });

        var user = await store.UpdateProfileAsync(userId, name, email, cancellationToken);
        if (user is null) return Results.Unauthorized();
        await SignInAsync(http, user);
        return Results.Ok(UserPayload(user));
    }
}
