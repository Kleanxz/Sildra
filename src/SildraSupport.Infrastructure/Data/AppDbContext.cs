using Microsoft.EntityFrameworkCore;
using SildraSupport.Domain.Entities;

namespace SildraSupport.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<KnowledgeBaseArticle> KbArticles => Set<KnowledgeBaseArticle>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuración de Ticket
        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TicketNumber).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => e.TicketNumber).IsUnique();
            entity.Property(e => e.Channel).IsRequired().HasMaxLength(30).HasDefaultValue("Portal");

            entity.HasOne(e => e.Organization)
                  .WithMany()
                  .HasForeignKey(e => e.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Assignee)
                  .WithMany()
                  .HasForeignKey(e => e.AssigneeId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Requester)
                  .WithMany()
                  .HasForeignKey(e => e.RequesterId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Configuracion de KnowledgeBaseArticle
        modelBuilder.Entity<KnowledgeBaseArticle>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ArticleCode).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => new { e.ArticleCode, e.Version }).IsUnique();
        });
    }
}
//fin del articulo onichan UwU
