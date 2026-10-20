namespace SildraSupport.Api;

public sealed record RegisterRequest(string Name, string Email, string Password, string? OrganizationId);
public sealed record LoginRequest(string Email, string Password);
public sealed record UpdateProfileRequest(string Name, string Email);
public sealed record CreateOrganizationRequest(string Name, string Branch);

public sealed record CreateTicketRequest(
    Guid OrganizationId,
    string Subject,
    string Description,
    string Category,
    string Priority,
    string Channel,
    string Phone);

public sealed record UpdateTicketRequest(
    string Status,
    string Priority,
    string Queue,
    Guid? AssigneeId);

public sealed record ResolveTicketRequest(string ResolutionNotes);
public sealed record SendTicketChatMessageRequest(string Message);
public sealed record TicketChatMessageResponse(
    Guid Id,
    Guid TicketId,
    Guid? AuthorId,
    string AuthorName,
    string AuthorRole,
    string Message,
    DateTime CreatedAt);
public sealed record UpdateUserRoleRequest(string Role);
public sealed record CreateKnowledgeArticleRequest(
    string Title,
    string Content,
    string? ProductCode,
    string? ModuleCode,
    string? Language,
    string? Audience);
public sealed record ReviewKnowledgeArticleRequest(string? Comment);
public sealed record CreateHandoffRequest(Guid TicketId, string? Provider, string? QueueRef, string? ExtensionRef, string? Reason);
public sealed record UpdateHandoffRequest(string Status, string? Comment);
public sealed record ReviewClassificationRequest(string Category);

public sealed record TicketResponse(
    Guid Id,
    string TicketNumber,
    string Subject,
    string Description,
    string RequesterName,
    string RequesterEmail,
    string Organization,
    string Branch,
    string Category,
    string Priority,
    string Status,
    string Agent,
    Guid? AssigneeId,
    string Queue,
    string Channel,
    DateTime CreatedAt,
    DateTime SlaDeadline,
    string ResolutionNotes,
    string RequesterPhone);
