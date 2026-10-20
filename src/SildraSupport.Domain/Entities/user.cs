namespace SildraSupport.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "Agent N1", "Supervisor", "Admin"
    public string? PasswordHash { get; set; }
    public string Status { get; set; } = "Disponible"; // "Disponible", "En llamada", "Ausente"
    public string? UcmExtension { get; set; } // Ej: "2104"
    public List<string> Skills { get; set; } = new(); // "e-CF", "DGII", "facturación"
}
