using Microsoft.EntityFrameworkCore;
using Volo.Abp;
using Volo.Abp.EntityFrameworkCore.Modeling;
using FoodSafe.Organizations;
using FoodSafe.Catalogs;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FoodSafe.Security;

namespace FoodSafe.EntityFrameworkCore;

public static class FoodSafeDbContextModelCreatingExtensions
{
    public static void ConfigureFoodSafe(this ModelBuilder builder)
    {
        Check.NotNull(builder, nameof(builder));

        ConfigureGeographicCatalogs(builder);
        ConfigureMasterCatalogs(builder);
        ConfigureDataScope(builder);

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

            entity.HasOne<Province>()
                .WithMany()
                .HasForeignKey(x => x.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_organizations_province");
            entity.HasOne<District>()
                .WithMany()
                .HasForeignKey(x => new { x.DistrictId, x.ProvinceId })
                .HasPrincipalKey(x => new { DistrictId = x.Id, x.ProvinceId })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_organizations_district_province");
            entity.HasOne<Commune>()
                .WithMany()
                .HasForeignKey(x => new { x.CommuneId, x.DistrictId })
                .HasPrincipalKey(x => new { CommuneId = x.Id, x.DistrictId })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_organizations_commune_district");

            entity.HasIndex(x => x.Code)
                .IsUnique()
                .HasDatabaseName("uq_organizations_code");
            entity.HasIndex(x => x.ParentId)
                .HasDatabaseName("idx_organizations_parent_id");
            entity.HasIndex(x => x.Level)
                .HasDatabaseName("idx_organizations_level");
        });
    }

    private static void ConfigureMasterCatalogs(ModelBuilder builder)
    {
        builder.Entity<ProductGroup>(entity =>
        {
            entity.ToTable("cat_product_groups", table =>
                table.HasCheckConstraint("chk_cat_product_groups_level", "level IN (1, 2)"));
            ConfigureMasterCatalog(entity);
            entity.Property(x => x.Level).HasColumnName("level");
            entity.Property(x => x.ParentId).HasColumnName("parent_id");
            entity.HasOne<ProductGroup>().WithMany().HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_cat_product_groups_parent");
            entity.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_cat_product_groups_code");
            entity.HasIndex(x => x.ParentId).HasDatabaseName("idx_cat_product_groups_parent");
        });

        builder.Entity<BusinessType>(entity =>
        {
            entity.ToTable("cat_business_types");
            ConfigureMasterCatalog(entity);
            entity.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_business_types_code");
        });

        builder.Entity<BusinessClassification>(entity =>
        {
            entity.ToTable("cat_business_classifications", table =>
                table.HasCheckConstraint("chk_business_classifications_risk", "risk_level IN (1, 2, 3)"));
            ConfigureMasterCatalog(entity);
            entity.Property(x => x.Criteria).HasColumnName("criteria").HasMaxLength(2000).IsRequired();
            entity.Property(x => x.RiskLevel).HasColumnName("risk_level").HasConversion<short>();
            entity.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_business_classifications_code");
        });

        builder.Entity<AdvertisementType>(entity =>
        {
            entity.ToTable("cat_advertisement_types");
            ConfigureMasterCatalog(entity);
            entity.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_advertisement_types_code");
        });

        builder.Entity<DocumentType>(entity =>
        {
            entity.ToTable("cat_document_types");
            ConfigureMasterCatalog(entity);
            entity.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_document_types_code");
        });

        builder.Entity<TestingCenter>(entity =>
        {
            entity.ToTable("cat_testing_centers");
            ConfigureMasterCatalog(entity);
            entity.Property(x => x.Address).HasColumnName("address_street").HasMaxLength(500).IsRequired();
            entity.Property(x => x.ProvinceId).HasColumnName("address_province_id");
            entity.Property(x => x.DistrictId).HasColumnName("address_district_id");
            entity.Property(x => x.CommuneId).HasColumnName("address_commune_id");
            entity.Property(x => x.ContactPerson).HasColumnName("contact_person").HasMaxLength(200);
            entity.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(50);
            entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(200);
            entity.Property(x => x.AccreditationNumber).HasColumnName("accreditation_number").HasMaxLength(100).IsRequired();
            entity.Property(x => x.AccreditationScope).HasColumnName("accreditation_scope").HasMaxLength(2000).IsRequired();
            entity.Property(x => x.AccreditationExpiresAt).HasColumnName("accreditation_expiry");
            entity.HasOne<Province>().WithMany().HasForeignKey(x => x.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_testing_centers_province");
            entity.HasOne<District>().WithMany().HasForeignKey(x => new { x.DistrictId, x.ProvinceId })
                .HasPrincipalKey(x => new { DistrictId = x.Id, x.ProvinceId })
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_testing_centers_district_province");
            entity.HasOne<Commune>().WithMany().HasForeignKey(x => new { x.CommuneId, x.DistrictId })
                .HasPrincipalKey(x => new { CommuneId = x.Id, x.DistrictId })
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_testing_centers_commune_district");
            entity.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_testing_centers_code");
        });

        builder.Entity<TestingService>(entity =>
        {
            entity.ToTable("cat_testing_services");
            ConfigureMasterCatalog(entity);
            entity.Property(x => x.TestingCenterId).HasColumnName("testing_center_id");
            entity.Property(x => x.Unit).HasColumnName("unit").HasMaxLength(50).IsRequired();
            entity.Property(x => x.Method).HasColumnName("method").HasMaxLength(500).IsRequired();
            entity.Property(x => x.Price).HasColumnName("unit_price").HasPrecision(18, 2);
            entity.Property(x => x.TurnaroundDays).HasColumnName("turnaround_days");
            entity.HasOne<TestingCenter>().WithMany().HasForeignKey(x => x.TestingCenterId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_testing_services_center");
            entity.HasIndex(x => new { x.TestingCenterId, x.Code }).IsUnique()
                .HasDatabaseName("uq_testing_services_center_code");
        });
    }

    private static void ConfigureGeographicCatalogs(ModelBuilder builder)
    {
        builder.Entity<Country>(entity =>
        {
            entity.ToTable("cat_countries");
            ConfigureCatalogAudit(entity);
            entity.HasKey(x => x.Id).HasName("pk_cat_countries");
            entity.Property(x => x.CodeAlpha2).HasColumnName("code_alpha2").HasMaxLength(2).IsRequired();
            entity.Property(x => x.CodeAlpha3).HasColumnName("code_alpha3").HasMaxLength(3);
            entity.Property(x => x.NameVi).HasColumnName("name_vi").HasMaxLength(200).IsRequired();
            entity.Property(x => x.NameEn).HasColumnName("name_en").HasMaxLength(200);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.SortOrder).HasColumnName("sort_order");
            entity.HasIndex(x => x.CodeAlpha2).IsUnique().HasDatabaseName("uq_cat_countries_code");
        });

        builder.Entity<Region>(entity =>
        {
            entity.ToTable("cat_regions");
            ConfigureAdministrativeArea(entity);
            entity.HasKey(x => x.Id).HasName("pk_cat_regions");
            entity.Property(x => x.Description).HasColumnName("description");
            entity.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_cat_regions_code");
        });

        builder.Entity<Province>(entity =>
        {
            entity.ToTable("cat_provinces");
            ConfigureAdministrativeArea(entity);
            entity.HasKey(x => x.Id).HasName("pk_cat_provinces");
            entity.Property(x => x.Code).HasMaxLength(10);
            entity.Property(x => x.RegionId).HasColumnName("region_id");
            entity.Property(x => x.NameShort).HasColumnName("name_short").HasMaxLength(100);
            entity.HasOne<Region>().WithMany().HasForeignKey(x => x.RegionId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_cat_provinces_region");
            entity.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_cat_provinces_code");
        });

        builder.Entity<District>(entity =>
        {
            entity.ToTable("cat_districts", table =>
                table.HasCheckConstraint("chk_cat_districts_type", "type IN (1, 2, 3, 4)"));
            ConfigureAdministrativeArea(entity);
            entity.HasKey(x => x.Id).HasName("pk_cat_districts");
            entity.Property(x => x.Code).HasMaxLength(10);
            entity.Property(x => x.ProvinceId).HasColumnName("province_id");
            entity.Property(x => x.Type).HasColumnName("type").HasConversion<short>();
            entity.HasOne<Province>().WithMany().HasForeignKey(x => x.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_cat_districts_province");
            entity.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_cat_districts_code");
            entity.HasAlternateKey(x => new { x.Id, x.ProvinceId })
                .HasName("uq_cat_districts_id_province");
        });

        builder.Entity<Commune>(entity =>
        {
            entity.ToTable("cat_communes", table =>
                table.HasCheckConstraint("chk_cat_communes_type", "type IN (1, 2, 3)"));
            ConfigureAdministrativeArea(entity);
            entity.HasKey(x => x.Id).HasName("pk_cat_communes");
            entity.Property(x => x.Code).HasMaxLength(10);
            entity.Property(x => x.DistrictId).HasColumnName("district_id");
            entity.Property(x => x.Type).HasColumnName("type").HasConversion<short>();
            entity.HasOne<District>().WithMany().HasForeignKey(x => x.DistrictId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_cat_communes_district");
            entity.HasIndex(x => x.Code).IsUnique().HasDatabaseName("uq_cat_communes_code");
            entity.HasAlternateKey(x => new { x.Id, x.DistrictId })
                .HasName("uq_cat_communes_id_district");
        });
    }

    private static void ConfigureDataScope(ModelBuilder builder)
    {
        builder.Entity<AppUserProfile>(entity =>
        {
            entity.ToTable("app_user_profiles");
            entity.HasKey(x => x.Id).HasName("pk_app_user_profiles");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id");
            entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(200).IsRequired();
            entity.Property(x => x.Position).HasColumnName("position").HasMaxLength(200);
            entity.Property(x => x.Department).HasColumnName("department").HasMaxLength(200);
            entity.Property(x => x.PasswordExpiresAt).HasColumnName("password_expires_at");
            entity.Property(x => x.MustChangePassword).HasColumnName("must_change_password");
            entity.Property(x => x.LastLoginAt).HasColumnName("last_login_at");
            entity.Property(x => x.FailedLoginCount).HasColumnName("failed_login_count");
            entity.Property(x => x.LockedUntil).HasColumnName("locked_until");
            entity.Property(x => x.CreationTime).HasColumnName("creation_time");
            entity.Property(x => x.LastModificationTime).HasColumnName("last_modification_time");
            entity.HasIndex(x => x.UserId).IsUnique().HasDatabaseName("uq_app_user_profiles_user_id");
            entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_app_user_profiles_org");
        });

        builder.Entity<PasswordHistory>(entity =>
        {
            entity.ToTable("password_history");
            entity.HasKey(x => x.Id).HasName("pk_password_history");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.PasswordHash)
                .HasColumnName("password_hash")
                .HasMaxLength(500)
                .IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(x => new { x.UserId, x.CreatedAt })
                .IsDescending(false, true)
                .HasDatabaseName("idx_password_history_user");
        });

        builder.Entity<ManagementScopeAssignment>(entity =>
        {
            entity.ToTable("management_scope_assignments", table =>
            {
                table.HasCheckConstraint("chk_msa_type", "scope_type IN (1, 2, 3, 4)");
                table.HasCheckConstraint("chk_msa_dates", "valid_to IS NULL OR valid_from < valid_to");
                table.HasCheckConstraint(
                    "chk_msa_one_target",
                    """
                    (scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL
                     AND product_group_id IS NULL AND num_nonnulls(province_id, district_id, commune_id) = 1)
                    OR (scope_type = 2 AND business_id IS NOT NULL AND province_id IS NULL
                     AND district_id IS NULL AND commune_id IS NULL AND business_type_id IS NULL
                     AND product_group_id IS NULL)
                    OR (scope_type = 3 AND business_type_id IS NOT NULL AND province_id IS NULL
                     AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL
                     AND product_group_id IS NULL)
                    OR (scope_type = 4 AND product_group_id IS NOT NULL AND province_id IS NULL
                     AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL
                     AND business_type_id IS NULL)
                    """);
            });
            entity.HasKey(x => x.Id).HasName("pk_management_scope_assignments");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.GranteeOrganizationId).HasColumnName("grantee_organization_id");
            entity.Property(x => x.GranteeUserId).HasColumnName("grantee_user_id");
            entity.Property(x => x.ScopeType).HasColumnName("scope_type").HasConversion<short>();
            entity.Property(x => x.ProvinceId).HasColumnName("province_id");
            entity.Property(x => x.DistrictId).HasColumnName("district_id");
            entity.Property(x => x.CommuneId).HasColumnName("commune_id");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.BusinessTypeId).HasColumnName("business_type_id");
            entity.Property(x => x.ProductGroupId).HasColumnName("product_group_id");
            entity.Property(x => x.CanView).HasColumnName("can_view");
            entity.Property(x => x.CanCreate).HasColumnName("can_create");
            entity.Property(x => x.CanEdit).HasColumnName("can_edit");
            entity.Property(x => x.CanDelete).HasColumnName("can_delete");
            entity.Property(x => x.ValidFrom).HasColumnName("valid_from");
            entity.Property(x => x.ValidTo).HasColumnName("valid_to");
            entity.Property(x => x.CreationTime).HasColumnName("creation_time");
            entity.Property(x => x.CreatorId).HasColumnName("creator_id");
            entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.GranteeOrganizationId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_msa_grantee_org");
            entity.HasOne<Province>().WithMany().HasForeignKey(x => x.ProvinceId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_msa_province");
            entity.HasOne<District>().WithMany().HasForeignKey(x => x.DistrictId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_msa_district");
            entity.HasOne<Commune>().WithMany().HasForeignKey(x => x.CommuneId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_msa_commune");
            entity.HasOne<BusinessType>().WithMany().HasForeignKey(x => x.BusinessTypeId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_msa_business_type");
            entity.HasOne<ProductGroup>().WithMany().HasForeignKey(x => x.ProductGroupId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_msa_product_group");
            entity.HasIndex(x => new
            {
                x.GranteeOrganizationId,
                x.GranteeUserId,
                x.ValidFrom,
                x.ValidTo
            })
                .HasDatabaseName("idx_msa_grantee");
        });
    }

    private static void ConfigureAdministrativeArea<TEntity>(EntityTypeBuilder<TEntity> entity)
        where TEntity : AdministrativeArea
    {
        ConfigureCatalogAudit(entity);
        entity.Property(x => x.Code).HasColumnName("code").HasMaxLength(20).IsRequired();
        entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        entity.Property(x => x.IsActive).HasColumnName("is_active");
        entity.Property(x => x.SortOrder).HasColumnName("sort_order");
    }

    private static void ConfigureCatalogAudit<TEntity>(EntityTypeBuilder<TEntity> entity)
        where TEntity : class, Volo.Abp.Domain.Entities.IEntity<Guid>
    {
        entity.HasKey("Id");
        entity.Property<Guid>("Id").HasColumnName("id");
        entity.Property<DateTime>("CreationTime").HasColumnName("creation_time");
        entity.Property<Guid?>("CreatorId").HasColumnName("creator_id");
        entity.Property<DateTime?>("LastModificationTime").HasColumnName("last_modification_time");
        entity.Property<Guid?>("LastModifierId").HasColumnName("last_modifier_id");
        entity.Property<bool>("IsDeleted").HasColumnName("is_deleted");
    }

    private static void ConfigureMasterCatalog<TEntity>(EntityTypeBuilder<TEntity> entity)
        where TEntity : MasterCatalog
    {
        ConfigureCatalogAudit(entity);
        entity.Property(x => x.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
        entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(2000);
        entity.Property(x => x.IsActive).HasColumnName("is_active");
        entity.Property(x => x.SortOrder).HasColumnName("sort_order");
    }
}
