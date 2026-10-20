namespace SildraSupport.Domain.Entities;

public enum TicketPriority { P1, P2, P3, P4 }
public enum TicketStatus { New, Triaged, Assigned, InProgress, Resolved, Closed }
public enum TicketIntent { software, hardware, capacitacion, facturacion, ventas, no_clasificado, redes, telefonia, accesos, otro }

public class Ticket
{
    public Guid Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty; // "SUP-2026-000418"
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Relaciones
    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    public Guid? AssigneeId { get; set; }
    public User? Assignee { get; set; }

    // Usuario que reportó el incidente. Puede ser nulo para tickets heredados.
    public Guid? RequesterId { get; set; }
    public User? Requester { get; set; }

    // Clasificación
    public TicketPriority Priority { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.New;
    public TicketIntent Intent { get; set; }
    public int Impact { get; set; } // 1-4
    public int Urgency { get; set; } // 1-4
    public string Channel { get; set; } = "Portal";

    // Cola y SLA
    public string Queue { get; set; } = string.Empty; // "N1 Facturación"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SlaDeadline { get; set; }
    public DateTime? FirstResponseAt { get; set; }
}
