using DotNetEnv;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Diagnostics;
using Npgsql;
using SildraSupport.Api;

var envFile = new[]
{
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".env")),
    Path.Combine(Directory.GetCurrentDirectory(), "src", "SildraSupport.Api", ".env")
}.FirstOrDefault(File.Exists);
if (envFile is not null)
{
    Env.Load(envFile);
}

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
if (!string.IsNullOrWhiteSpace(dbHost))
{
    connectionString = new NpgsqlConnectionStringBuilder
    {
        Host = dbHost,
        Port = int.TryParse(Environment.GetEnvironmentVariable("DB_PORT"), out var dbPort) ? dbPort : 5432,
        Username = Environment.GetEnvironmentVariable("DB_USER"),
        Password = Environment.GetEnvironmentVariable("DB_PASSWORD"),
        Database = Environment.GetEnvironmentVariable("DB_NAME")
    }.ConnectionString;
}

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Configura DefaultConnection o las variables DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME.");
}

builder.Services.AddSingleton(NpgsqlDataSource.Create(connectionString));
builder.Services.AddSingleton<PostgresSupportStore>();
builder.Services.AddSingleton<RegistrationEmailSender>();
builder.Services.AddHostedService<SlaBreachWorker>();
builder.Services.AddCors(options => options.AddPolicy("SildraAngular", policy =>
    policy.WithOrigins("http://127.0.0.1:4200", "http://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "sildra.auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.IsEssential = true;
        options.Cookie.Path = "/";
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromDays(30);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
        options.Events.OnValidatePrincipal = async context =>
        {
            var claim = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(claim, out var userId))
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return;
            }

            var store = context.HttpContext.RequestServices.GetRequiredService<PostgresSupportStore>();
            if (await store.FindUserByIdAsync(userId, context.HttpContext.RequestAborted) is null)
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    var isDatabaseError = exception is NpgsqlException;
    if (isDatabaseError)
        app.Logger.LogWarning("Una operación de PostgreSQL falló (SQLSTATE {SqlState}).", (exception as NpgsqlException)?.SqlState);
    else if (exception is not null)
        app.Logger.LogError(exception, "Error no controlado en la API.");

    context.Response.StatusCode = isDatabaseError ? StatusCodes.Status503ServiceUnavailable : StatusCodes.Status500InternalServerError;
    await context.Response.WriteAsJsonAsync(new
    {
        message = isDatabaseError
            ? "No se pudo acceder a PostgreSQL. Revisa las credenciales y que el esquema esté instalado."
            : "Ocurrió un error interno en el servicio."
    });
}));

try
{
    await app.Services.GetRequiredService<PostgresSupportStore>().EnsureAppUserTableAsync();
}
catch (NpgsqlException exception)
{
    app.Logger.LogWarning("No se pudo preparar la tabla de cuentas locales en PostgreSQL (SQLSTATE {SqlState}). Revisa la conexión y el esquema.", exception.SqlState);
}

app.UseCors("SildraAngular");
app.UseAuthentication();
app.UseAuthorization();
ApiEndpoints.Map(app);

app.Run();
