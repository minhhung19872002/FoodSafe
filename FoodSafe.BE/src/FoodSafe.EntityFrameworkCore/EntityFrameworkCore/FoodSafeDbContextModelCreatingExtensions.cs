using Microsoft.EntityFrameworkCore;
using Volo.Abp;
using Volo.Abp.EntityFrameworkCore.Modeling;
using FoodSafe.Organizations;

namespace FoodSafe.EntityFrameworkCore;

public static class FoodSafeDbContextModelCreatingExtensions
{
    public static void ConfigureFoodSafe(this ModelBuilder builder)
    {
        Check.NotNull(builder, nameof(builder));

        builder.Entity<Organization>(entity =>
        {
            entity.ToTable("organizations");
            entity.ConfigureByConvention();

            entity.HasKey(x => x.Id).HasName("pk_organizations");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ParentId).HasColumnName("parent_id");
            entity.Property(x => x.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            entity.Property(x => x.Level).HasColumnName("level").HasConversion<short>();
            entity.Property(x => x.Address).HasColumnName("address");
            entity.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(50);
            entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(200);
            entity.Property(x => x.LeaderName).HasColumnName("leader_name").HasMaxLength(200);
            entity.Property(x => x.ProvinceId).HasColumnName("province_id");
            entity.Property(x => x.DistrictId).HasColumnName("district_id");
            entity.Property(x => x.CommuneId).HasColumnName("commune_id");
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.ExtraProperties).HasColumnName("extra_properties");
            entity.Property(x => x.ConcurrencyStamp).HasColumnName("concurrency_stamp");
            entity.Property(x => x.CreationTime).HasColumnName("creation_time");
            entity.Property(x => x.CreatorId).HasColumnName("creator_id");
            entity.Property(x => x.LastModificationTime).HasColumnName("last_modification_time");
            entity.Property(x => x.LastModifierId).HasColumnName("last_modifier_id");
            entity.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            entity.Property(x => x.DeletionTime).HasColumnName("deletion_time");
            entity.Property(x => x.DeleterId).HasColumnName("deleter_id");

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_organizations_parent");

            entity.HasIndex(x => x.Code)
                .IsUnique()
                .HasDatabaseName("uq_organizations_code");
            entity.HasIndex(x => x.ParentId)
                .HasDatabaseName("idx_organizations_parent_id");
            entity.HasIndex(x => x.Level)
                .HasDatabaseName("idx_organizations_level");
        });
    }
}
