namespace SildraSupport.Domain.Entities;

public class Organization
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty; // "Distribuidora Cibao Norte"
    public string Branch { get; set; } = string.Empty;  // "Santiago"
}
