namespace SildraSupport.Domain.Entities;

public enum KbState { Draft, InReview, Approved, Published, Retired }

public class KnowledgeBaseArticle
{
    public Guid Id { get; set; }
    public string ArticleCode { get; set; } = string.Empty; // "KB-0142"
    public int Version { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty; // Markdown
    public KbState State { get; set; } = KbState.Draft;

    public Guid AuthorId { get; set; }
    public Guid? ReviewerId { get; set; }

    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
}