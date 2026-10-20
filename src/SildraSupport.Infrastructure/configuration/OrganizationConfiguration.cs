using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SildraSupport.Domain.Entities;

namespace SildraSupport.Infrastructure.configuration;

public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.HasKey(organization => organization.Id);
        builder.Property(organization => organization.Name).IsRequired();
        builder.Property(organization => organization.Branch).IsRequired();
    }
}
