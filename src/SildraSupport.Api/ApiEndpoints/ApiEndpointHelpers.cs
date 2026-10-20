using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SildraSupport.Api;

internal static partial class ApiEndpoints
{

    private static async Task SignInAsync(HttpContext http, SupportUser user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, IsAdmin(user.Role) ? "Admin" : IsAgent(user.Role) ? "Agent" : "User")
        };
        if (user.TenantId is Guid tenantId) claims.Add(new Claim("tenant_id", tenantId.ToString()));
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await http.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = true, ExpiresUtc = DateTimeOffset.UtcNow.AddDays(30) });
    }

    private static object UserPayload(SupportUser user, bool? emailSent = null) => new
    {
        id = user.Id,
        name = user.Name,
        email = user.Email,
        role = IsAdmin(user.Role) ? "Admin" : IsAgent(user.Role) ? "Agent" : "User",
        isAdmin = IsAdmin(user.Role),
        isAgent = IsAgent(user.Role),
        emailSent
    };

    private static bool TryGetUserId(ClaimsPrincipal principal, out Guid userId) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out userId);

    private static Guid? GetTenantId(ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue("tenant_id"), out var id) ? id : null;

    private static bool IsAdmin(ClaimsPrincipal principal) =>
        string.Equals(principal.FindFirstValue(ClaimTypes.Role), "Admin", StringComparison.OrdinalIgnoreCase);

    private static bool IsAgent(ClaimsPrincipal principal) =>
        string.Equals(principal.FindFirstValue(ClaimTypes.Role), "Agent", StringComparison.OrdinalIgnoreCase);

    private static bool IsAdmin(string? role) => string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);

    private static bool IsAgent(string? role) => string.Equals(role, "Agent", StringComparison.OrdinalIgnoreCase);

    private static string NormalizeEmail(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    private static bool IsValidEmail(string email) => email.Length <= 254 && new EmailAddressAttribute().IsValid(email);

    private static bool IsValidPhone(string phone) =>
        phone.Length is >= 7 and <= 40 &&
        phone.Count(char.IsAsciiDigit) is >= 7 and <= 15 &&
        phone.All(character => char.IsAsciiDigit(character) || "+ ().-".Contains(character));

    private static bool TryNormalizePriority(string? value, out string priority)
    {
        priority = value?.Trim().ToUpperInvariant() ?? string.Empty;
        return priority is "P1" or "P2" or "P3";
    }

    private static bool IsValidStatus(string? value) => value is "Abierto" or "Pendiente" or "En progreso" or "Resuelto";

    private static bool FixedTimeTextEquals(string first, string second)
    {
        var left = System.Text.Encoding.UTF8.GetBytes(first);
        var right = System.Text.Encoding.UTF8.GetBytes(second);
        return left.Length == right.Length && CryptographicOperations.FixedTimeEquals(left, right);
    }
}
