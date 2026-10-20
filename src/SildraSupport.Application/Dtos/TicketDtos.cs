using SildraSupport.Domain.Entities;

namespace SildraSupport.Application.Dtos;

public record CreateTicketRequest(
    Guid OrganizationId,
    string Subject,
    string Description,
    TicketIntent Intent,
    int Impact,
    int Urgency
);

public record TicketResponse(
    Guid Id,
    string TicketNumber,
    string Subject,
    TicketPriority Priority,
    TicketStatus Status,
    string Queue,
    DateTime CreatedAt,
    DateTime? SlaDeadline
);