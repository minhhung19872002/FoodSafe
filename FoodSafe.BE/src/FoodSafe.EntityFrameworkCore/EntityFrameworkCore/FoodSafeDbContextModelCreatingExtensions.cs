using Microsoft.EntityFrameworkCore;
using Volo.Abp;
using Volo.Abp.EntityFrameworkCore.Modeling;
using FoodSafe.Organizations;
using FoodSafe.Catalogs;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FoodSafe.Security;
using FoodSafe.BusinessManagement;
using FoodSafe.FileManagement;
using FoodSafe.Licensing;
using FoodSafe.Inspection;
using FoodSafe.AlertsAndTesting;
using FoodSafe.FoodPoisoning;
using FoodSafe.Reporting;
using FoodSafe.DataIntegration;

namespace FoodSafe.EntityFrameworkCore;

public static class FoodSafeDbContextModelCreatingExtensions
{
    public static void ConfigureFoodSafe(this ModelBuilder builder)
    {
        Check.NotNull(builder, nameof(builder));

        ConfigureGeographicCatalogs(builder);
        ConfigureMasterCatalogs(builder);
        ConfigureDataScope(builder);
        ConfigureBusinessManagement(builder);
        ConfigureFileManagement(builder);
        ConfigureInspection(builder);
        ConfigureAlertsAndTesting(builder);
        ConfigureFoodPoisoning(builder);
        ConfigureReporting(builder);
        ConfigureDataIntegration(builder);

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

    private static void ConfigureBusinessManagement(ModelBuilder builder)
    {
        builder.Entity<Business>(entity =>
        {
            entity.ToTable("businesses", table =>
            {
                table.HasCheckConstraint("chk_businesses_status", "status IN (1, 2, 3)");
                table.HasCheckConstraint(
                    "chk_businesses_address_chain",
                    "(address_commune_id IS NULL OR address_district_id IS NOT NULL) AND " +
                    "(address_district_id IS NULL OR address_province_id IS NOT NULL)");
                table.HasCheckConstraint(
                    "chk_businesses_coordinates",
                    "(address_latitude IS NULL AND address_longitude IS NULL) OR " +
                    "(address_latitude BETWEEN -90 AND 90 AND address_longitude BETWEEN -180 AND 180)");
                table.HasCheckConstraint(
                    "chk_businesses_suspension",
                    "status != 3 OR suspension_reason IS NOT NULL");
                table.HasCheckConstraint(
                    "chk_businesses_employee_count",
                    "employee_count IS NULL OR employee_count >= 0");
            });
            ConfigureAggregateAudit(entity, "pk_businesses");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id");
            entity.Property(x => x.Code).HasColumnName("code").HasMaxLength(50);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(500).IsRequired();
            entity.Property(x => x.BusinessTypeId).HasColumnName("business_type_id");
            entity.Property(x => x.BusinessClassificationId).HasColumnName("business_classification_id");
            entity.Property(x => x.TaxCode).HasColumnName("tax_code").HasMaxLength(50);
            entity.Property(x => x.RepresentativeName).HasColumnName("representative_name").HasMaxLength(200);
            entity.Property(x => x.RepresentativeIdCard).HasColumnName("representative_id_card").HasMaxLength(50);
            entity.Property(x => x.ContactPhone).HasColumnName("contact_phone").HasMaxLength(50);
            entity.Property(x => x.ContactEmail).HasColumnName("contact_email").HasMaxLength(200);
            entity.Property(x => x.ContactWebsite).HasColumnName("contact_website").HasMaxLength(500);
            entity.Property(x => x.AddressStreet).HasColumnName("address_street");
            entity.Property(x => x.AddressProvinceId).HasColumnName("address_province_id");
            entity.Property(x => x.AddressDistrictId).HasColumnName("address_district_id");
            entity.Property(x => x.AddressCommuneId).HasColumnName("address_commune_id");
            entity.Property(x => x.AddressLatitude).HasColumnName("address_latitude");
            entity.Property(x => x.AddressLongitude).HasColumnName("address_longitude");
            entity.Property(x => x.Status).HasColumnName("status").HasConversion<short>();
            entity.Property(x => x.SuspensionReason).HasColumnName("suspension_reason");
            entity.Property(x => x.SuspendedAt).HasColumnName("suspended_at");
            entity.Property(x => x.HasEligibilityCertificate).HasColumnName("has_eligibility_certificate");
            entity.Property(x => x.HasVsattpCommitment).HasColumnName("has_vsattp_commitment");
            entity.Property(x => x.EstablishedDate).HasColumnName("established_date").HasColumnType("date");
            entity.Property(x => x.EmployeeCount).HasColumnName("employee_count");
            entity.Property(x => x.Notes).HasColumnName("notes");

            entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_businesses_organization");
            entity.HasOne<BusinessType>().WithMany().HasForeignKey(x => x.BusinessTypeId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_businesses_type");
            entity.HasOne<BusinessClassification>().WithMany()
                .HasForeignKey(x => x.BusinessClassificationId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_businesses_classification");
            entity.HasOne<Province>().WithMany().HasForeignKey(x => x.AddressProvinceId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_businesses_province");
            entity.HasOne<District>().WithMany()
                .HasForeignKey(x => new { x.AddressDistrictId, x.AddressProvinceId })
                .HasPrincipalKey(x => new { AddressDistrictId = x.Id, AddressProvinceId = x.ProvinceId })
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_businesses_district_province");
            entity.HasOne<Commune>().WithMany()
                .HasForeignKey(x => new { x.AddressCommuneId, x.AddressDistrictId })
                .HasPrincipalKey(x => new { AddressCommuneId = x.Id, AddressDistrictId = x.DistrictId })
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_businesses_commune_district");

            entity.HasAlternateKey(x => new { x.Id, x.OrganizationId })
                .HasName("uq_businesses_id_org");
            entity.HasIndex(x => x.Code).IsUnique()
                .HasFilter("code IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("uq_businesses_code");
            entity.HasIndex(x => x.TaxCode).IsUnique()
                .HasFilter("tax_code IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("uq_businesses_tax_code");
            entity.HasIndex(x => x.OrganizationId).HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_businesses_org_id");
            entity.HasIndex(x => x.BusinessTypeId).HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_businesses_type");
            entity.HasIndex(x => x.BusinessClassificationId)
                .HasFilter("business_classification_id IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("idx_businesses_classification");
            entity.HasIndex(x => x.Status).HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_businesses_status");
            entity.HasIndex(x => x.AddressProvinceId).HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_businesses_province");
            entity.HasIndex(x => x.AddressDistrictId).HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_businesses_district");
            entity.HasIndex(x => x.AddressCommuneId).HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_businesses_commune");
        });

        builder.Entity<BusinessProductGroup>(entity =>
        {
            entity.ToTable("business_product_groups");
            entity.HasKey(x => new { x.BusinessId, x.ProductGroupId })
                .HasName("pk_business_product_groups");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.ProductGroupId).HasColumnName("product_group_id");
            entity.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId)
                .OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_bpg_business");
            entity.HasOne<ProductGroup>().WithMany().HasForeignKey(x => x.ProductGroupId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_bpg_product_group");
            entity.HasIndex(x => x.ProductGroupId).HasDatabaseName("idx_bpg_product_group");
        });

        builder.Entity<BusinessHandler>(entity =>
        {
            entity.ToTable("business_handlers", table =>
            {
                table.HasCheckConstraint(
                    "chk_bh_training_dates",
                    "training_date IS NULL OR training_expiry_date IS NULL OR training_date <= training_expiry_date");
                table.HasCheckConstraint(
                    "chk_bh_health_dates",
                    "health_check_date IS NULL OR health_check_expiry_date IS NULL OR health_check_date <= health_check_expiry_date");
            });
            ConfigureFullAudit(entity, "pk_business_handlers");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(200).IsRequired();
            entity.Property(x => x.Position).HasColumnName("position").HasMaxLength(200);
            entity.Property(x => x.IdCardNumber).HasColumnName("id_card_number").HasMaxLength(50);
            entity.Property(x => x.TrainingCertificateNumber).HasColumnName("training_certificate_number").HasMaxLength(100);
            entity.Property(x => x.TrainingDate).HasColumnName("training_date").HasColumnType("date");
            entity.Property(x => x.TrainingOrganization).HasColumnName("training_organization").HasMaxLength(300);
            entity.Property(x => x.TrainingExpiryDate).HasColumnName("training_expiry_date").HasColumnType("date");
            entity.Property(x => x.HealthCertificateNumber).HasColumnName("health_certificate_number").HasMaxLength(100);
            entity.Property(x => x.HealthCheckDate).HasColumnName("health_check_date").HasColumnType("date");
            entity.Property(x => x.HealthCheckFacility).HasColumnName("health_check_facility").HasMaxLength(300);
            entity.Property(x => x.HealthCheckExpiryDate).HasColumnName("health_check_expiry_date").HasColumnType("date");
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.Notes).HasColumnName("notes");
            entity.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId)
                .OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_business_handlers_business");
            entity.HasIndex(x => x.BusinessId).HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_business_handlers_business");
            entity.HasIndex(x => x.TrainingExpiryDate)
                .HasFilter("training_expiry_date IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("idx_business_handlers_training_expiry");
            entity.HasIndex(x => x.HealthCheckExpiryDate)
                .HasFilter("health_check_expiry_date IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("idx_business_handlers_health_expiry");
        });

        builder.Entity<Product>(entity =>
        {
            entity.ToTable("products", table =>
            {
                table.HasCheckConstraint("chk_products_status", "status IN (1, 2)");
                table.HasCheckConstraint(
                    "chk_products_expiry",
                    "expiry_period_months IS NULL OR expiry_period_months >= 0");
            });
            ConfigureAggregateAudit(entity, "pk_products");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id");
            entity.Property(x => x.Code).HasColumnName("code").HasMaxLength(50);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(500).IsRequired();
            entity.Property(x => x.ProductGroupId).HasColumnName("product_group_id");
            entity.Property(x => x.BrandName).HasColumnName("brand_name").HasMaxLength(200);
            entity.Property(x => x.Manufacturer).HasColumnName("manufacturer").HasMaxLength(300);
            entity.Property(x => x.ManufacturingCountryId).HasColumnName("manufacturing_country_id");
            entity.Property(x => x.NetWeight).HasColumnName("net_weight").HasMaxLength(100);
            entity.Property(x => x.Specifications).HasColumnName("specifications");
            entity.Property(x => x.Ingredients).HasColumnName("ingredients");
            entity.Property(x => x.ExpiryPeriodMonths).HasColumnName("expiry_period_months");
            entity.Property(x => x.StorageConditions).HasColumnName("storage_conditions");
            entity.Property(x => x.UsageInstructions).HasColumnName("usage_instructions");
            entity.Property(x => x.Status).HasColumnName("status").HasConversion<short>();
            entity.Property(x => x.Notes).HasColumnName("notes");
            entity.HasOne<Business>().WithMany()
                .HasForeignKey(x => new { x.BusinessId, x.OrganizationId })
                .HasPrincipalKey(x => new { x.Id, x.OrganizationId })
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_products_business_org");
            entity.HasOne<Organization>().WithMany().HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_products_org");
            entity.HasOne<ProductGroup>().WithMany().HasForeignKey(x => x.ProductGroupId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_products_group");
            entity.HasOne<Country>().WithMany().HasForeignKey(x => x.ManufacturingCountryId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_products_country");
            entity.HasAlternateKey(x => new { x.Id, x.BusinessId, x.OrganizationId })
                .HasName("uq_products_id_business_org");
            entity.HasIndex(x => new { x.BusinessId, x.Code }).IsUnique()
                .HasFilter("code IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("uq_products_business_code");
            entity.HasIndex(x => x.BusinessId).HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_products_business");
            entity.HasIndex(x => x.OrganizationId).HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_products_org");
            entity.HasIndex(x => x.ProductGroupId).HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_products_group");
        });

        builder.Entity<SelfDeclaration>(entity =>
        {
            entity.ToTable("self_declarations", table =>
            {
                table.HasCheckConstraint(
                    "chk_self_declarations_status",
                    "status IN (1, 2, 3)");
                table.HasCheckConstraint(
                    "chk_self_declarations_dates",
                    "expiry_date IS NULL OR declaration_date <= expiry_date");
                table.HasCheckConstraint(
                    "chk_self_declarations_revoke",
                    "(status != 3 AND revoke_reason IS NULL AND " +
                    "revoked_at IS NULL AND revoked_by_id IS NULL) OR " +
                    "(status = 3 AND revoke_reason IS NOT NULL AND " +
                    "revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)");
            });
            ConfigureAggregateAudit(entity, "pk_self_declarations");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.ProductId).HasColumnName("product_id");
            entity.Property(x => x.OrganizationId)
                .HasColumnName("organization_id");
            entity.Property(x => x.DeclarationNumber)
                .HasColumnName("declaration_number")
                .HasMaxLength(100)
                .IsRequired();
            entity.Property(x => x.DeclarationDate)
                .HasColumnName("declaration_date")
                .HasColumnType("date");
            entity.Property(x => x.ProductName)
                .HasColumnName("product_name")
                .HasMaxLength(500)
                .IsRequired();
            entity.Property(x => x.Manufacturer)
                .HasColumnName("manufacturer")
                .HasMaxLength(300);
            entity.Property(x => x.Purpose)
                .HasColumnName("purpose")
                .HasMaxLength(200);
            entity.Property(x => x.ExpiryDate)
                .HasColumnName("expiry_date")
                .HasColumnType("date");
            entity.Property(x => x.Status)
                .HasColumnName("status")
                .HasConversion<short>();
            entity.Property(x => x.RevokeReason)
                .HasColumnName("revoke_reason");
            entity.Property(x => x.RevokedAt)
                .HasColumnName("revoked_at");
            entity.Property(x => x.RevokedById)
                .HasColumnName("revoked_by_id");
            entity.Property(x => x.Notes).HasColumnName("notes");

            entity.HasOne<Business>().WithMany()
                .HasForeignKey(x => new
                {
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    x.Id,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_self_declarations_business_org");
            entity.HasOne<Product>().WithMany()
                .HasForeignKey(x => new
                {
                    x.ProductId,
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    ProductId = x.Id,
                    x.BusinessId,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_self_declarations_product");
            entity.HasOne<Organization>().WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_self_declarations_org");

            entity.HasIndex(x => new
            {
                x.BusinessId,
                x.DeclarationNumber
            })
                .IsUnique()
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("uq_self_declarations_business_number");
            entity.HasIndex(x => x.BusinessId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_self_declarations_business");
            entity.HasIndex(x => x.ProductId)
                .HasFilter("product_id IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("idx_self_declarations_product");
            entity.HasIndex(x => new { x.Status, x.ExpiryDate })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_self_declarations_status_expiry");
            entity.HasIndex(x => x.OrganizationId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_self_declarations_org");
        });

        builder.Entity<ProductRegistration>(entity =>
        {
            entity.ToTable("product_registrations", table =>
            {
                table.HasCheckConstraint(
                    "chk_product_reg_status",
                    "status IN (1, 2, 3)");
                table.HasCheckConstraint(
                    "chk_product_reg_dates",
                    "expiry_date IS NULL OR registration_date <= expiry_date");
                table.HasCheckConstraint(
                    "chk_product_reg_revoke",
                    "(status != 3 AND revoke_reason IS NULL AND " +
                    "revoked_at IS NULL AND revoked_by_id IS NULL) OR " +
                    "(status = 3 AND revoke_reason IS NOT NULL AND " +
                    "revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)");
            });
            ConfigureAggregateAudit(entity, "pk_product_registrations");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.ProductId).HasColumnName("product_id");
            entity.Property(x => x.OrganizationId)
                .HasColumnName("organization_id");
            entity.Property(x => x.RegistrationNumber)
                .HasColumnName("registration_number")
                .HasMaxLength(100)
                .IsRequired();
            entity.Property(x => x.ReceiptNumber)
                .HasColumnName("receipt_number")
                .HasMaxLength(100);
            entity.Property(x => x.RegistrationDate)
                .HasColumnName("registration_date")
                .HasColumnType("date");
            entity.Property(x => x.ReceiptDate)
                .HasColumnName("receipt_date")
                .HasColumnType("date");
            entity.Property(x => x.ExpiryDate)
                .HasColumnName("expiry_date")
                .HasColumnType("date");
            entity.Property(x => x.ProductName)
                .HasColumnName("product_name")
                .HasMaxLength(500)
                .IsRequired();
            entity.Property(x => x.Manufacturer)
                .HasColumnName("manufacturer")
                .HasMaxLength(300);
            entity.Property(x => x.CertifyingAuthority)
                .HasColumnName("certifying_authority")
                .HasMaxLength(200);
            entity.Property(x => x.Status)
                .HasColumnName("status")
                .HasConversion<short>();
            entity.Property(x => x.RevokeReason)
                .HasColumnName("revoke_reason");
            entity.Property(x => x.RevokedAt)
                .HasColumnName("revoked_at");
            entity.Property(x => x.RevokedById)
                .HasColumnName("revoked_by_id");
            entity.Property(x => x.Notes).HasColumnName("notes");

            entity.HasOne<Business>().WithMany()
                .HasForeignKey(x => new
                {
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    x.Id,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_product_reg_business_org");
            entity.HasOne<Product>().WithMany()
                .HasForeignKey(x => new
                {
                    x.ProductId,
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    ProductId = x.Id,
                    x.BusinessId,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_product_reg_product_owner");
            entity.HasOne<Organization>().WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_product_reg_org");

            entity.HasIndex(x => x.RegistrationNumber)
                .IsUnique()
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("uq_product_registrations_number");
            entity.HasIndex(x => x.BusinessId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_product_registrations_business");
            entity.HasIndex(x => x.ProductId)
                .HasFilter("product_id IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("idx_product_registrations_product");
            entity.HasIndex(x => new { x.ExpiryDate, x.Status })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_product_registrations_expiry");
            entity.HasIndex(x => x.OrganizationId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_product_registrations_org");
        });

        builder.Entity<CfsCertificate>(entity =>
        {
            entity.ToTable("cfs_certificates", table =>
            {
                table.HasCheckConstraint(
                    "chk_cfs_status",
                    "status IN (1, 2, 3)");
                table.HasCheckConstraint(
                    "chk_cfs_dates",
                    "expiry_date IS NULL OR issue_date <= expiry_date");
                table.HasCheckConstraint(
                    "chk_cfs_revoke",
                    "(status != 3 AND revoke_reason IS NULL AND " +
                    "revoked_at IS NULL AND revoked_by_id IS NULL) OR " +
                    "(status = 3 AND revoke_reason IS NOT NULL AND " +
                    "revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)");
            });
            ConfigureAggregateAudit(entity, "pk_cfs_certificates");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.ProductId).HasColumnName("product_id");
            entity.Property(x => x.DestinationCountryId)
                .HasColumnName("destination_country_id");
            entity.Property(x => x.OrganizationId)
                .HasColumnName("organization_id");
            entity.Property(x => x.CertificateNumber)
                .HasColumnName("certificate_number")
                .HasMaxLength(100)
                .IsRequired();
            entity.Property(x => x.IssueDate)
                .HasColumnName("issue_date")
                .HasColumnType("date");
            entity.Property(x => x.ExpiryDate)
                .HasColumnName("expiry_date")
                .HasColumnType("date");
            entity.Property(x => x.CertifyingAuthority)
                .HasColumnName("certifying_authority")
                .HasMaxLength(200);
            entity.Property(x => x.Status)
                .HasColumnName("status")
                .HasConversion<short>();
            entity.Property(x => x.RevokeReason)
                .HasColumnName("revoke_reason");
            entity.Property(x => x.RevokedAt)
                .HasColumnName("revoked_at");
            entity.Property(x => x.RevokedById)
                .HasColumnName("revoked_by_id");
            entity.Property(x => x.Notes).HasColumnName("notes");

            entity.HasOne<Business>().WithMany()
                .HasForeignKey(x => new
                {
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    x.Id,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_cfs_business_org");
            entity.HasOne<Product>().WithMany()
                .HasForeignKey(x => new
                {
                    x.ProductId,
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    ProductId = x.Id,
                    x.BusinessId,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_cfs_product_owner");
            entity.HasOne<Country>().WithMany()
                .HasForeignKey(x => x.DestinationCountryId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_cfs_destination_country");
            entity.HasOne<Organization>().WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_cfs_org");

            entity.HasIndex(x => x.CertificateNumber)
                .IsUnique()
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("uq_cfs_certificates_number");
            entity.HasIndex(x => x.BusinessId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_cfs_business");
            entity.HasIndex(x => x.ProductId)
                .HasFilter("product_id IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("idx_cfs_product");
            entity.HasIndex(x => x.DestinationCountryId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_cfs_destination_country");
            entity.HasIndex(x => new { x.ExpiryDate, x.Status })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_cfs_expiry");
            entity.HasIndex(x => x.OrganizationId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_cfs_org");
        });

        builder.Entity<ExportFoodCertificate>(entity =>
        {
            entity.ToTable("export_food_certificates", table =>
            {
                table.HasCheckConstraint(
                    "chk_export_cert_status",
                    "status IN (1, 2, 3)");
                table.HasCheckConstraint(
                    "chk_export_cert_dates",
                    "expiry_date IS NULL OR issue_date <= expiry_date");
                table.HasCheckConstraint(
                    "chk_export_cert_revoke",
                    "(status != 3 AND revoke_reason IS NULL AND " +
                    "revoked_at IS NULL AND revoked_by_id IS NULL) OR " +
                    "(status = 3 AND revoke_reason IS NOT NULL AND " +
                    "revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)");
            });
            ConfigureAggregateAudit(entity, "pk_export_food_certificates");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.ProductId).HasColumnName("product_id");
            entity.Property(x => x.DestinationCountryId)
                .HasColumnName("destination_country_id");
            entity.Property(x => x.OrganizationId)
                .HasColumnName("organization_id");
            entity.Property(x => x.CertificateNumber)
                .HasColumnName("certificate_number")
                .HasMaxLength(100)
                .IsRequired();
            entity.Property(x => x.IssueDate)
                .HasColumnName("issue_date")
                .HasColumnType("date");
            entity.Property(x => x.ExpiryDate)
                .HasColumnName("expiry_date")
                .HasColumnType("date");
            entity.Property(x => x.LotNumber)
                .HasColumnName("lot_number")
                .HasMaxLength(100);
            entity.Property(x => x.Quantity)
                .HasColumnName("quantity")
                .HasColumnType("numeric(18,3)");
            entity.Property(x => x.QuantityUnit)
                .HasColumnName("quantity_unit")
                .HasMaxLength(50);
            entity.Property(x => x.Status)
                .HasColumnName("status")
                .HasConversion<short>();
            entity.Property(x => x.RevokeReason)
                .HasColumnName("revoke_reason");
            entity.Property(x => x.RevokedAt)
                .HasColumnName("revoked_at");
            entity.Property(x => x.RevokedById)
                .HasColumnName("revoked_by_id");
            entity.Property(x => x.Notes).HasColumnName("notes");

            entity.HasOne<Business>().WithMany()
                .HasForeignKey(x => new
                {
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    x.Id,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_export_cert_business_org");
            entity.HasOne<Product>().WithMany()
                .HasForeignKey(x => new
                {
                    x.ProductId,
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    ProductId = x.Id,
                    x.BusinessId,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_export_cert_product_owner");
            entity.HasOne<Country>().WithMany()
                .HasForeignKey(x => x.DestinationCountryId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_export_cert_destination_country");
            entity.HasOne<Organization>().WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_export_cert_org");

            entity.HasIndex(x => x.CertificateNumber)
                .IsUnique()
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("uq_export_food_certificates_number");
            entity.HasIndex(x => x.BusinessId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_export_cert_business");
            entity.HasIndex(x => x.ProductId)
                .HasFilter("product_id IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("idx_export_cert_product");
            entity.HasIndex(x => x.DestinationCountryId)
                .HasFilter(
                    "destination_country_id IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("idx_export_cert_destination_country");
            entity.HasIndex(x => new { x.ExpiryDate, x.Status })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_export_cert_expiry");
            entity.HasIndex(x => x.OrganizationId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_export_cert_org");
        });

        builder.Entity<AdvertisementRegistration>(entity =>
        {
            entity.ToTable("advertisement_registrations", table =>
            {
                table.HasCheckConstraint(
                    "chk_ad_reg_status",
                    "status IN (1, 2, 3)");
                table.HasCheckConstraint(
                    "chk_ad_reg_dates",
                    "expiry_date IS NULL OR registration_date <= expiry_date");
                table.HasCheckConstraint(
                    "chk_ad_reg_revoke",
                    "(status != 3 AND revoke_reason IS NULL AND " +
                    "revoked_at IS NULL AND revoked_by_id IS NULL) OR " +
                    "(status = 3 AND revoke_reason IS NOT NULL AND " +
                    "revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)");
            });
            ConfigureAggregateAudit(
                entity,
                "pk_advertisement_registrations");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.OrganizationId)
                .HasColumnName("organization_id");
            entity.Property(x => x.AdvertisementTypeId)
                .HasColumnName("advertisement_type_id");
            entity.Property(x => x.RegistrationNumber)
                .HasColumnName("registration_number")
                .HasMaxLength(100)
                .IsRequired();
            entity.Property(x => x.RegistrationDate)
                .HasColumnName("registration_date")
                .HasColumnType("date");
            entity.Property(x => x.ExpiryDate)
                .HasColumnName("expiry_date")
                .HasColumnType("date");
            entity.Property(x => x.ContentDescription)
                .HasColumnName("content_description");
            entity.Property(x => x.Medium)
                .HasColumnName("medium")
                .HasMaxLength(200);
            entity.Property(x => x.Status)
                .HasColumnName("status")
                .HasConversion<short>();
            entity.Property(x => x.RevokeReason)
                .HasColumnName("revoke_reason");
            entity.Property(x => x.RevokedAt).HasColumnName("revoked_at");
            entity.Property(x => x.RevokedById)
                .HasColumnName("revoked_by_id");
            entity.Property(x => x.Notes).HasColumnName("notes");
            entity.HasOne<Business>().WithMany()
                .HasForeignKey(x => new
                {
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    x.Id,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_ad_reg_business_org");
            entity.HasOne<Organization>().WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_ad_reg_org");
            entity.HasOne<AdvertisementType>().WithMany()
                .HasForeignKey(x => x.AdvertisementTypeId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_ad_reg_type");
            entity.HasAlternateKey(
                    x => new { x.Id, x.BusinessId, x.OrganizationId })
                .HasName("uq_ad_reg_id_business_org");
            entity.HasMany(x => x.Products).WithOne()
                .HasForeignKey(x => new
                {
                    x.AdvertisementRegistrationId,
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    x.Id,
                    x.BusinessId,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_arp_ad_reg_owner");
            entity.Navigation(x => x.Products)
                .UsePropertyAccessMode(PropertyAccessMode.Field);
            entity.HasIndex(x => x.RegistrationNumber)
                .IsUnique()
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName(
                    "uq_advertisement_registrations_number");
            entity.HasIndex(x => x.BusinessId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_ad_reg_business");
            entity.HasIndex(x => x.OrganizationId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_ad_reg_org");
            entity.HasIndex(x => new { x.ExpiryDate, x.Status })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_ad_reg_expiry");
        });

        builder.Entity<AdvertisementRegistrationProduct>(entity =>
        {
            entity.ToTable("advertisement_registration_products");
            entity.HasKey(x => new
            {
                x.AdvertisementRegistrationId,
                x.ProductId
            })
                .HasName("pk_ad_reg_products");
            entity.Property(x => x.AdvertisementRegistrationId)
                .HasColumnName("advertisement_registration_id");
            entity.Property(x => x.ProductId).HasColumnName("product_id");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.OrganizationId)
                .HasColumnName("organization_id");
            entity.HasOne<Product>().WithMany()
                .HasForeignKey(x => new
                {
                    x.ProductId,
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    ProductId = x.Id,
                    x.BusinessId,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_arp_product_owner");
            entity.HasIndex(x => x.ProductId)
                .HasDatabaseName("idx_arp_product");
        });

        builder.Entity<EligibilityCertificate>(entity =>
        {
            entity.ToTable("eligibility_certificates", table =>
            {
                table.HasCheckConstraint(
                    "chk_elic_status",
                    "status IN (1, 2, 3)");
                table.HasCheckConstraint(
                    "chk_elic_dates",
                    "expiry_date IS NULL OR issue_date <= expiry_date");
                table.HasCheckConstraint(
                    "chk_elic_revoke",
                    "(status != 3 AND revoke_reason IS NULL AND " +
                    "revoked_at IS NULL AND revoked_by_id IS NULL) OR " +
                    "(status = 3 AND revoke_reason IS NOT NULL AND " +
                    "revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)");
            });
            ConfigureAggregateAudit(
                entity,
                "pk_eligibility_certificates");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.OrganizationId)
                .HasColumnName("organization_id");
            entity.Property(x => x.CertificateNumber)
                .HasColumnName("certificate_number")
                .HasMaxLength(100)
                .IsRequired();
            entity.Property(x => x.IssueDate)
                .HasColumnName("issue_date")
                .HasColumnType("date");
            entity.Property(x => x.ExpiryDate)
                .HasColumnName("expiry_date")
                .HasColumnType("date");
            entity.Property(x => x.CertifyingAuthority)
                .HasColumnName("certifying_authority")
                .HasMaxLength(200);
            entity.Property(x => x.CertificationScope)
                .HasColumnName("certification_scope");
            entity.Property(x => x.Status)
                .HasColumnName("status")
                .HasConversion<short>();
            entity.Property(x => x.RevokeReason)
                .HasColumnName("revoke_reason");
            entity.Property(x => x.RevokedAt).HasColumnName("revoked_at");
            entity.Property(x => x.RevokedById)
                .HasColumnName("revoked_by_id");
            entity.Property(x => x.Notes).HasColumnName("notes");
            entity.HasOne<Business>().WithMany()
                .HasForeignKey(x => new
                {
                    x.BusinessId,
                    x.OrganizationId
                })
                .HasPrincipalKey(x => new
                {
                    x.Id,
                    x.OrganizationId
                })
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_elic_business_org");
            entity.HasOne<Organization>().WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_elic_org");
            entity.HasIndex(x => x.CertificateNumber)
                .IsUnique()
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("uq_eligibility_certificates_number");
            entity.HasIndex(x => x.BusinessId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_eligibility_certificates_business");
            entity.HasIndex(x => new { x.ExpiryDate, x.Status })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_eligibility_certificates_expiry");
            entity.HasIndex(x => x.OrganizationId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_eligibility_certificates_org");
        });

        builder.Entity<ManagementScopeAssignment>(entity =>
        {
            entity.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId)
                .OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_msa_business");
            entity.HasIndex(x => x.BusinessId).HasDatabaseName("idx_msa_business");
        });
    }

    private static void ConfigureInspection(ModelBuilder builder)
    {
        builder.Entity<InspectionPlan>(entity =>
        {
            entity.ToTable("inspection_plans", table =>
            {
                table.HasCheckConstraint("chk_inspection_plans_type", "plan_type IN (1, 2, 3, 4)");
                table.HasCheckConstraint("chk_inspection_plans_status", "status IN (1, 2, 3, 4, 5, 6)");
                table.HasCheckConstraint("chk_inspection_plan_submission",
                    "(status = 1) OR (submitted_by_id IS NOT NULL AND submitted_at IS NOT NULL)");
                table.HasCheckConstraint("chk_inspection_plan_approval",
                    "status NOT IN (3, 4, 5) OR (approved_by_id IS NOT NULL AND approved_at IS NOT NULL)");
                table.HasCheckConstraint("chk_inspection_plan_cancellation",
                    "status <> 6 OR (cancelled_by_id IS NOT NULL AND cancelled_at IS NOT NULL AND cancelled_reason IS NOT NULL)");
                table.HasCheckConstraint("chk_inspection_plans_dates",
                    "start_date IS NULL OR end_date IS NULL OR start_date <= end_date");
            });
            ConfigureAggregateAudit(entity, "pk_inspection_plans");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id");
            entity.Property(x => x.PlanCode).HasColumnName("plan_code").HasMaxLength(50).IsRequired();
            entity.Property(x => x.Title).HasColumnName("title").HasMaxLength(500).IsRequired();
            entity.Property(x => x.PlanType).HasColumnName("plan_type").HasConversion<short>();
            entity.Property(x => x.Year).HasColumnName("year");
            entity.Property(x => x.StartDate).HasColumnName("start_date").HasColumnType("date");
            entity.Property(x => x.EndDate).HasColumnName("end_date").HasColumnType("date");
            entity.Property(x => x.Description).HasColumnName("description");
            entity.Property(x => x.Objectives).HasColumnName("objectives");
            entity.Property(x => x.Status).HasColumnName("status").HasConversion<short>();
            entity.Property(x => x.SubmittedById).HasColumnName("submitted_by_id");
            entity.Property(x => x.SubmittedAt).HasColumnName("submitted_at");
            entity.Property(x => x.ApprovedById).HasColumnName("approved_by_id");
            entity.Property(x => x.ApprovedAt).HasColumnName("approved_at");
            entity.Property(x => x.RejectedById).HasColumnName("rejected_by_id");
            entity.Property(x => x.RejectedAt).HasColumnName("rejected_at");
            entity.Property(x => x.RejectedReason).HasColumnName("rejected_reason");
            entity.Property(x => x.CancelledById).HasColumnName("cancelled_by_id");
            entity.Property(x => x.CancelledAt).HasColumnName("cancelled_at");
            entity.Property(x => x.CancelledReason).HasColumnName("cancelled_reason");

            entity.HasMany(x => x.Items)
                .WithOne()
                .HasForeignKey(x => x.PlanId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_plans_org")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.PlanCode, x.OrganizationId })
                .IsUnique()
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("uq_inspection_plans_code");
            entity.HasIndex(x => new { x.OrganizationId, x.Year })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_inspection_plans_org");
            entity.HasIndex(x => x.Status)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_inspection_plans_status");
        });

        builder.Entity<InspectionPlanItem>(entity =>
        {
            entity.ToTable("inspection_plan_items", table =>
            {
                table.HasCheckConstraint("chk_ipi_status", "status IN (1, 2, 3, 4)");
            });
            entity.HasKey(x => x.Id).HasName("pk_inspection_plan_items");
            entity.ConfigureByConvention();
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.PlanId).HasColumnName("plan_id");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.SequenceNumber).HasColumnName("sequence_number");
            entity.Property(x => x.PlannedDate).HasColumnName("planned_date").HasColumnType("date");
            entity.Property(x => x.AssignedInspectorId).HasColumnName("assigned_inspector_id");
            entity.Property(x => x.Status).HasColumnName("status").HasConversion<short>();
            entity.Property(x => x.Notes).HasColumnName("notes");

            entity.HasOne<Business>()
                .WithMany()
                .HasForeignKey(x => x.BusinessId)
                .HasConstraintName("fk_ipi_business")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.PlanId, x.BusinessId })
                .IsUnique()
                .HasDatabaseName("uq_ipi_plan_business");
            entity.HasIndex(x => new { x.Id, x.PlanId, x.BusinessId })
                .IsUnique()
                .HasDatabaseName("uq_ipi_id_plan_business");
            entity.HasIndex(x => x.BusinessId)
                .HasDatabaseName("idx_inspection_plan_items_business");
        });

        builder.Entity<InspectionResult>(entity =>
        {
            entity.ToTable("inspection_results", table =>
            {
                table.HasCheckConstraint("chk_ir_type", "inspection_type IN (1, 2, 3, 4)");
                table.HasCheckConstraint("chk_ir_result", "overall_result IN (1, 2, 3)");
                table.HasCheckConstraint("chk_ir_plan_tuple",
                    "(plan_item_id IS NULL AND plan_id IS NULL) OR (plan_item_id IS NOT NULL AND plan_id IS NOT NULL)");
            });
            ConfigureAggregateAudit(entity, "pk_inspection_results");
            entity.Property(x => x.PlanId).HasColumnName("plan_id");
            entity.Property(x => x.PlanItemId).HasColumnName("plan_item_id");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id");
            entity.Property(x => x.InspectionDate).HasColumnName("inspection_date").HasColumnType("date");
            entity.Property(x => x.InspectionType).HasColumnName("inspection_type").HasConversion<short>();
            entity.Property(x => x.TeamLeader).HasColumnName("team_leader").HasMaxLength(200);
            entity.Property(x => x.TeamMembersText).HasColumnName("team_members_text");
            entity.Property(x => x.OverallResult).HasColumnName("overall_result").HasConversion<short>();
            entity.Property(x => x.HasViolation).HasColumnName("has_violation");
            entity.Property(x => x.ViolationDescription).HasColumnName("violation_description");
            entity.Property(x => x.FineAmount).HasColumnName("fine_amount").HasColumnType("numeric(18,2)");
            entity.Property(x => x.FineCurrency).HasColumnName("fine_currency").HasMaxLength(3);
            entity.Property(x => x.AdminDecisionNumber).HasColumnName("admin_decision_number").HasMaxLength(100);
            entity.Property(x => x.AdminDecisionDate).HasColumnName("admin_decision_date").HasColumnType("date");
            entity.Property(x => x.FollowUpRequired).HasColumnName("follow_up_required");
            entity.Property(x => x.FollowUpDate).HasColumnName("follow_up_date").HasColumnType("date");
            entity.Property(x => x.FollowUpResultValue).HasColumnName("follow_up_result").HasConversion<short?>();
            entity.Property(x => x.Recommendations).HasColumnName("recommendations");
            entity.Property(x => x.Notes).HasColumnName("notes");
            entity.Property(x => x.IsFinalized)
                .HasColumnName("is_finalized")
                .HasDefaultValue(false);
            entity.Property(x => x.FinalizedById)
                .HasColumnName("finalized_by_id");
            entity.Property(x => x.FinalizedAt)
                .HasColumnName("finalized_at");

            entity.HasMany(x => x.Violations)
                .WithOne()
                .HasForeignKey(x => x.InspectionResultId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.Inspectors)
                .WithOne()
                .HasForeignKey(x => x.InspectionResultId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<InspectionPlan>()
                .WithMany()
                .HasForeignKey(x => x.PlanId)
                .HasConstraintName("fk_ir_plan")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_ir_org")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.PlanItemId)
                .IsUnique()
                .HasFilter("plan_item_id IS NOT NULL AND inspection_type <> 3 AND is_deleted = FALSE")
                .HasDatabaseName("uq_inspection_results_primary_plan_item");
            entity.HasIndex(x => x.BusinessId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_inspection_results_business");
            entity.HasIndex(x => x.InspectionDate)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_inspection_results_date");
            entity.HasIndex(x => x.OrganizationId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_inspection_results_org");
            entity.HasIndex(x => x.PlanId)
                .HasFilter("plan_id IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("idx_inspection_results_plan");
            entity.HasIndex(x => x.PlanItemId)
                .HasFilter("plan_item_id IS NOT NULL AND is_deleted = FALSE")
                .HasDatabaseName("idx_inspection_results_plan_item");
            entity.HasIndex(x => x.HasViolation)
                .HasFilter("has_violation = TRUE AND is_deleted = FALSE")
                .HasDatabaseName("idx_inspection_results_violation");
        });

        builder.Entity<InspectionResultInspector>(entity =>
        {
            entity.ToTable("inspection_result_inspectors");
            entity.HasKey(x => new { x.InspectionResultId, x.UserId })
                .HasName("pk_inspection_result_inspectors");
            entity.Property(x => x.InspectionResultId).HasColumnName("inspection_result_id");
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.IsTeamLeader).HasColumnName("is_team_leader");
            entity.HasIndex(x => x.UserId).HasDatabaseName("idx_iri_user");
        });

        builder.Entity<InspectionViolation>(entity =>
        {
            entity.ToTable("inspection_violations");
            entity.HasKey(x => x.Id).HasName("pk_inspection_violations");
            entity.ConfigureByConvention();
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.InspectionResultId).HasColumnName("inspection_result_id");
            entity.Property(x => x.ViolationCode).HasColumnName("violation_code").HasMaxLength(50);
            entity.Property(x => x.Description).HasColumnName("description").IsRequired();
            entity.Property(x => x.RegulationReference).HasColumnName("regulation_reference");
            entity.Property(x => x.FineAmount).HasColumnName("fine_amount").HasColumnType("numeric(18,2)");
            entity.Property(x => x.RemedyRequired).HasColumnName("remedy_required");
            entity.Property(x => x.RemedyDeadline).HasColumnName("remedy_deadline").HasColumnType("date");
            entity.Property(x => x.IsRemedied).HasColumnName("is_remedied");
            entity.Property(x => x.RemediedAt).HasColumnName("remedied_at");
            entity.Property(x => x.RemediedNotes).HasColumnName("remedied_notes");
            entity.HasIndex(x => x.InspectionResultId).HasDatabaseName("idx_inspection_violations_result");
            entity.HasIndex(x => new { x.IsRemedied, x.RemedyDeadline })
                .HasFilter("is_remedied = FALSE AND remedy_deadline IS NOT NULL")
                .HasDatabaseName("idx_inspection_violations_remedied");
        });
    }

    private static void ConfigureFileManagement(ModelBuilder builder)
    {
        builder.Entity<DocumentOwner>(entity =>
        {
            entity.ToTable("document_owners");
            entity.HasKey(x => x.Id).HasName("pk_document_owners");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id");
            entity.Property(x => x.OwnerType).HasColumnName("owner_type")
                .HasMaxLength(100).IsRequired();
            entity.Property(x => x.CreationTime).HasColumnName("creation_time");
            entity.HasOne<Organization>().WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_document_owners_org");
            entity.HasIndex(x => new { x.OrganizationId, x.OwnerType })
                .HasDatabaseName("idx_document_owners_org");
        });

        builder.Entity<FileAttachment>(entity =>
        {
            entity.ToTable("file_attachments", table =>
            {
                table.HasCheckConstraint(
                    "chk_fa_virus_scan",
                    "virus_scan_status IN (1, 2, 3, 4)");
                table.HasCheckConstraint(
                    "chk_fa_retention",
                    "retention_status IN (1, 2, 3)");
                table.HasCheckConstraint("chk_fa_file_size", "file_size > 0");
            });
            ConfigureFullAudit(entity, "pk_file_attachments");
            entity.Property(x => x.DocumentOwnerId)
                .HasColumnName("document_owner_id");
            entity.Property(x => x.FileName).HasColumnName("file_name")
                .HasMaxLength(500).IsRequired();
            entity.Property(x => x.OriginalName).HasColumnName("original_name")
                .HasMaxLength(500).IsRequired();
            entity.Property(x => x.StoragePath).HasColumnName("storage_path")
                .HasMaxLength(1000).IsRequired();
            entity.Property(x => x.FileSize).HasColumnName("file_size");
            entity.Property(x => x.MimeType).HasColumnName("mime_type")
                .HasMaxLength(100);
            entity.Property(x => x.Description).HasColumnName("description")
                .HasMaxLength(500);
            entity.Property(x => x.IsPublic).HasColumnName("is_public");
            entity.Property(x => x.Checksum).HasColumnName("checksum")
                .HasMaxLength(64).IsRequired();
            entity.Property(x => x.VirusScanStatus)
                .HasColumnName("virus_scan_status").HasConversion<short>();
            entity.Property(x => x.VirusScannedAt)
                .HasColumnName("virus_scanned_at");
            entity.Property(x => x.RetentionStatus)
                .HasColumnName("retention_status").HasConversion<short>();
            entity.Property(x => x.RetentionExpiresAt)
                .HasColumnName("retention_expires_at");
            entity.HasOne<DocumentOwner>().WithMany()
                .HasForeignKey(x => x.DocumentOwnerId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_fa_owner");
            entity.HasIndex(x => x.StoragePath).IsUnique()
                .HasDatabaseName("uq_file_attachments_storage_path");
            entity.HasIndex(x => x.DocumentOwnerId)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_file_attachments_owner");
            entity.HasIndex(x => x.VirusScanStatus)
                .HasFilter("virus_scan_status = 1")
                .HasDatabaseName("idx_file_attachments_scan");
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
                // Single-line on purpose: a multi-line raw string embeds the
                // source file's git-checkout line endings (CRLF on Windows,
                // LF on Linux CI) into the model, causing phantom EF drift.
                table.HasCheckConstraint(
                    "chk_msa_one_target",
                    "(scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL" +
                    " AND product_group_id IS NULL AND num_nonnulls(province_id, district_id, commune_id) = 1)" +
                    " OR (scope_type = 2 AND business_id IS NOT NULL AND province_id IS NULL" +
                    " AND district_id IS NULL AND commune_id IS NULL AND business_type_id IS NULL" +
                    " AND product_group_id IS NULL)" +
                    " OR (scope_type = 3 AND business_type_id IS NOT NULL AND province_id IS NULL" +
                    " AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL" +
                    " AND product_group_id IS NULL)" +
                    " OR (scope_type = 4 AND product_group_id IS NOT NULL AND province_id IS NULL" +
                    " AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL" +
                    " AND business_type_id IS NULL)");
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

    private static void ConfigureAggregateAudit<TEntity>(
        EntityTypeBuilder<TEntity> entity,
        string primaryKeyName)
        where TEntity : Volo.Abp.Domain.Entities.Auditing.FullAuditedAggregateRoot<Guid>
    {
        ConfigureFullAudit(entity, primaryKeyName);
        entity.Property(x => x.ExtraProperties)
            .HasColumnName("extra_properties")
            .HasColumnType("jsonb");
        entity.Property(x => x.ConcurrencyStamp).HasColumnName("concurrency_stamp").HasMaxLength(40);
    }

    private static void ConfigureFullAudit<TEntity>(
        EntityTypeBuilder<TEntity> entity,
        string primaryKeyName)
        where TEntity : class, Volo.Abp.Domain.Entities.IEntity<Guid>
    {
        entity.ConfigureByConvention();
        entity.HasKey("Id").HasName(primaryKeyName);
        entity.Property<Guid>("Id").HasColumnName("id");
        entity.Property<DateTime>("CreationTime").HasColumnName("creation_time");
        entity.Property<Guid?>("CreatorId").HasColumnName("creator_id");
        entity.Property<DateTime?>("LastModificationTime").HasColumnName("last_modification_time");
        entity.Property<Guid?>("LastModifierId").HasColumnName("last_modifier_id");
        entity.Property<bool>("IsDeleted").HasColumnName("is_deleted");
        entity.Property<DateTime?>("DeletionTime").HasColumnName("deletion_time");
        entity.Property<Guid?>("DeleterId").HasColumnName("deleter_id");
    }

    private static void ConfigureAlertsAndTesting(ModelBuilder builder)
    {
        builder.Entity<AtpAlert>(entity =>
        {
            entity.ToTable("atp_alerts", table =>
            {
                table.HasCheckConstraint("chk_alerts_category", "category IN (1, 2, 3, 4, 5, 6)");
                table.HasCheckConstraint("chk_alerts_severity", "severity IN (1, 2, 3, 4)");
                table.HasCheckConstraint("chk_alerts_source", "source IN (1, 2, 3)");
                table.HasCheckConstraint("chk_alerts_status", "status IN (1, 2, 3)");
                table.HasCheckConstraint("chk_alerts_publish",
                    "status = 1 OR (published_by_id IS NOT NULL AND published_at IS NOT NULL)");
                table.HasCheckConstraint("chk_alerts_recall",
                    "status <> 3 OR (recalled_by_id IS NOT NULL AND recalled_at IS NOT NULL AND recall_reason IS NOT NULL)");
            });
            ConfigureAggregateAudit(entity, "pk_atp_alerts");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id");
            entity.Property(x => x.AlertNumber).HasColumnName("alert_number").HasMaxLength(100);
            entity.Property(x => x.Title).HasColumnName("title").HasMaxLength(500).IsRequired();
            entity.Property(x => x.Content).HasColumnName("content").IsRequired();
            entity.Property(x => x.Category).HasColumnName("category").HasConversion<short>();
            entity.Property(x => x.Severity).HasColumnName("severity").HasConversion<short>();
            entity.Property(x => x.AffectedArea).HasColumnName("affected_area");
            entity.Property(x => x.AffectedProducts).HasColumnName("affected_products");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.Source).HasColumnName("source").HasConversion<short>();
            entity.Property(x => x.ReporterName).HasColumnName("reporter_name").HasMaxLength(200);
            entity.Property(x => x.ReporterPhone).HasColumnName("reporter_phone").HasMaxLength(20);
            entity.Property(x => x.ReporterEmail).HasColumnName("reporter_email").HasMaxLength(200);
            entity.Property(x => x.Status).HasColumnName("status").HasConversion<short>();
            entity.Property(x => x.PublishedById).HasColumnName("published_by_id");
            entity.Property(x => x.PublishedAt).HasColumnName("published_at");
            entity.Property(x => x.RecalledById).HasColumnName("recalled_by_id");
            entity.Property(x => x.RecalledAt).HasColumnName("recalled_at");
            entity.Property(x => x.RecallReason).HasColumnName("recall_reason");
            entity.Property(x => x.IsPublic).HasColumnName("is_public");

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_alerts_org")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Business>()
                .WithMany()
                .HasForeignKey(x => x.BusinessId)
                .HasConstraintName("fk_alerts_business")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.Status })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_alerts_org_status");
            entity.HasIndex(x => x.Category)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_alerts_category");
            entity.HasIndex(x => x.Severity)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_alerts_severity");
            entity.HasIndex(x => x.IsPublic)
                .HasFilter("is_deleted = FALSE AND is_public = TRUE")
                .HasDatabaseName("idx_alerts_public");
        });

        builder.Entity<AtpNews>(entity =>
        {
            entity.ToTable("atp_news", table =>
            {
                table.HasCheckConstraint("chk_news_status", "status IN (1, 2, 3)");
                table.HasCheckConstraint("chk_news_publish",
                    "status = 1 OR (published_by_id IS NOT NULL AND published_at IS NOT NULL)");
                table.HasCheckConstraint("chk_news_recall",
                    "status <> 3 OR (recalled_by_id IS NOT NULL AND recalled_at IS NOT NULL)");
                table.HasCheckConstraint("chk_news_view_count", "view_count >= 0");
            });
            ConfigureAggregateAudit(entity, "pk_atp_news");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id");
            entity.Property(x => x.Title).HasColumnName("title").HasMaxLength(500).IsRequired();
            entity.Property(x => x.Summary).HasColumnName("summary").HasMaxLength(1000);
            entity.Property(x => x.Content).HasColumnName("content").IsRequired();
            entity.Property(x => x.ThumbnailStoragePath).HasColumnName("thumbnail_storage_path").HasMaxLength(500);
            entity.Property(x => x.Category).HasColumnName("category").HasMaxLength(100);
            entity.Property(x => x.Tags).HasColumnName("tags").HasMaxLength(500);
            entity.Property(x => x.ViewCount).HasColumnName("view_count");
            entity.Property(x => x.Status).HasColumnName("status").HasConversion<short>();
            entity.Property(x => x.PublishedAt).HasColumnName("published_at");
            entity.Property(x => x.PublishedById).HasColumnName("published_by_id");
            entity.Property(x => x.RecalledById).HasColumnName("recalled_by_id");
            entity.Property(x => x.RecalledAt).HasColumnName("recalled_at");
            entity.Property(x => x.IsPublic).HasColumnName("is_public");
            entity.Property(x => x.IsFeatured).HasColumnName("is_featured");
            entity.Property(x => x.Source)
                .HasColumnName("source")
                .HasConversion<short>()
                .HasDefaultValue(AlertSource.Internal);
            entity.Property(x => x.ReporterName)
                .HasColumnName("reporter_name")
                .HasMaxLength(200);
            entity.Property(x => x.ReporterContact)
                .HasColumnName("reporter_contact")
                .HasMaxLength(200);

            entity.HasMany(x => x.LinkedAlerts)
                .WithOne()
                .HasForeignKey(x => x.NewsId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_news_org")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.Status })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_news_org_status");
            entity.HasIndex(x => x.Category)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_news_category");
            entity.HasIndex(x => x.IsPublic)
                .HasFilter("is_deleted = FALSE AND is_public = TRUE")
                .HasDatabaseName("idx_news_public");
        });

        builder.Entity<NewsLinkedAlert>(entity =>
        {
            entity.ToTable("news_linked_alerts");
            entity.HasKey(x => x.Id).HasName("pk_news_linked_alerts");
            entity.ConfigureByConvention();
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.NewsId).HasColumnName("news_id");
            entity.Property(x => x.AlertId).HasColumnName("alert_id");

            entity.HasOne<AtpAlert>()
                .WithMany()
                .HasForeignKey(x => x.AlertId)
                .HasConstraintName("fk_nla_alert")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.NewsId, x.AlertId })
                .IsUnique()
                .HasDatabaseName("uq_nla_news_alert");
        });

        builder.Entity<RiskAnalysis>(entity =>
        {
            entity.ToTable("risk_analyses", table =>
            {
                table.HasCheckConstraint("chk_ra_category", "category IN (1, 2, 3, 4, 5, 6)");
                table.HasCheckConstraint("chk_ra_risk_level", "risk_level IN (1, 2, 3, 4)");
                table.HasCheckConstraint("chk_ra_status", "status IN (1, 2)");
            });
            ConfigureAggregateAudit(entity, "pk_risk_analyses");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id");
            entity.Property(x => x.Title).HasColumnName("title").HasMaxLength(500).IsRequired();
            entity.Property(x => x.Content).HasColumnName("content").IsRequired();
            entity.Property(x => x.Category).HasColumnName("category").HasConversion<short>();
            entity.Property(x => x.RiskLevel).HasColumnName("risk_level").HasConversion<short>();
            entity.Property(x => x.RelatedProducts).HasColumnName("related_products");
            entity.Property(x => x.Evidence).HasColumnName("evidence");
            entity.Property(x => x.Recommendations).HasColumnName("recommendations");
            entity.Property(x => x.Status).HasColumnName("status").HasConversion<short>();
            entity.Property(x => x.IsPublic).HasColumnName("is_public");
            entity.Property(x => x.PublishedById).HasColumnName("published_by_id");
            entity.Property(x => x.PublishedAt).HasColumnName("published_at");

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_ra_org")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.Status })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_ra_org_status");
            entity.HasIndex(x => x.IsPublic)
                .HasFilter("is_deleted = FALSE AND is_public = TRUE")
                .HasDatabaseName("idx_ra_public");
        });

        builder.Entity<TestingResult>(entity =>
        {
            entity.ToTable("testing_results", table =>
            {
                table.HasCheckConstraint("chk_tr_outcome", "outcome IN (1, 2, 3)");
            });
            ConfigureAggregateAudit(entity, "pk_testing_results");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id");
            entity.Property(x => x.SampleCode).HasColumnName("sample_code").HasMaxLength(100).IsRequired();
            entity.Property(x => x.SampleName).HasColumnName("sample_name").HasMaxLength(500).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description");
            entity.Property(x => x.TestingCenterId).HasColumnName("testing_center_id");
            entity.Property(x => x.TestingServiceId).HasColumnName("testing_service_id");
            entity.Property(x => x.BusinessId).HasColumnName("business_id");
            entity.Property(x => x.ProductId).HasColumnName("product_id");
            entity.Property(x => x.SampleDate).HasColumnName("sample_date");
            entity.Property(x => x.SubmissionDate).HasColumnName("submission_date");
            entity.Property(x => x.ResultDate).HasColumnName("result_date");
            entity.Property(x => x.Outcome).HasColumnName("outcome").HasConversion<short>();
            entity.Property(x => x.FailedCriteria).HasColumnName("failed_criteria");
            entity.Property(x => x.CertificateNumber).HasColumnName("certificate_number").HasMaxLength(100);
            entity.Property(x => x.InspectionResultId).HasColumnName("inspection_result_id");
            entity.Property(x => x.IsPublic).HasColumnName("is_public");

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_tr_org")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<TestingCenter>()
                .WithMany()
                .HasForeignKey(x => x.TestingCenterId)
                .HasConstraintName("fk_tr_testing_center")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<TestingService>()
                .WithMany()
                .HasForeignKey(x => x.TestingServiceId)
                .HasConstraintName("fk_tr_testing_service")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Business>()
                .WithMany()
                .HasForeignKey(x => x.BusinessId)
                .HasConstraintName("fk_tr_business")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Product>()
                .WithMany()
                .HasForeignKey(x => x.ProductId)
                .HasConstraintName("fk_tr_product")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<InspectionResult>()
                .WithMany()
                .HasForeignKey(x => x.InspectionResultId)
                .HasConstraintName("fk_tr_inspection_result")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.Outcome })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_tr_org_outcome");
            entity.HasIndex(x => x.SampleCode)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_tr_sample_code");
            entity.HasIndex(x => x.IsPublic)
                .HasFilter("is_deleted = FALSE AND is_public = TRUE")
                .HasDatabaseName("idx_tr_public");
        });

        builder.Entity<AdministrativeDocument>(entity =>
        {
            entity.ToTable("administrative_documents", table =>
            {
                table.HasCheckConstraint("chk_ad_status", "status IN (1, 2, 3)");
            });
            ConfigureAggregateAudit(entity, "pk_administrative_documents");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id");
            entity.Property(x => x.DocumentTypeId).HasColumnName("document_type_id");
            entity.Property(x => x.DocumentNumber).HasColumnName("document_number").HasMaxLength(100).IsRequired();
            entity.Property(x => x.Title).HasColumnName("title").HasMaxLength(500).IsRequired();
            entity.Property(x => x.IssuingAuthority).HasColumnName("issuing_authority").HasMaxLength(500);
            entity.Property(x => x.IssuedDate).HasColumnName("issued_date");
            entity.Property(x => x.EffectiveDate).HasColumnName("effective_date");
            entity.Property(x => x.ExpiryDate).HasColumnName("expiry_date");
            entity.Property(x => x.Summary).HasColumnName("summary");
            entity.Property(x => x.Status).HasColumnName("status").HasConversion<short>();
            entity.Property(x => x.IsPublic).HasColumnName("is_public");

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_ad_org")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<DocumentType>()
                .WithMany()
                .HasForeignKey(x => x.DocumentTypeId)
                .HasConstraintName("fk_ad_document_type")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.DocumentTypeId })
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_ad_org_type");
            entity.HasIndex(x => x.DocumentNumber)
                .HasFilter("is_deleted = FALSE")
                .HasDatabaseName("idx_ad_doc_number");
            entity.HasIndex(x => x.IsPublic)
                .HasFilter("is_deleted = FALSE AND is_public = TRUE")
                .HasDatabaseName("idx_ad_public");
        });
    }

    private static void ConfigureFoodPoisoning(ModelBuilder builder)
    {
        builder.Entity<FoodPoisoningIncident>(entity =>
        {
            entity.ToTable("food_poisoning_incidents");
            entity.ConfigureByConvention();

            entity.HasKey(x => x.Id).HasName("pk_fpi");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            entity.Property(x => x.IncidentCode).HasColumnName("incident_code").HasMaxLength(50).IsRequired();
            entity.Property(x => x.OccurrenceDate).HasColumnName("occurrence_date");
            entity.Property(x => x.EndDate).HasColumnName("end_date");

            entity.Property(x => x.LocationDescription).HasColumnName("location_description");
            entity.Property(x => x.LocationCommuneId).HasColumnName("location_commune_id");
            entity.Property(x => x.LocationDistrictId).HasColumnName("location_district_id");
            entity.Property(x => x.LocationProvinceId).HasColumnName("location_province_id");
            entity.Property(x => x.LocationLatitude).HasColumnName("location_latitude");
            entity.Property(x => x.LocationLongitude).HasColumnName("location_longitude");

            entity.Property(x => x.ExposedCount).HasColumnName("exposed_count").HasDefaultValue(0);
            entity.Property(x => x.AffectedCount).HasColumnName("affected_count").HasDefaultValue(0);
            entity.Property(x => x.HospitalizedCount).HasColumnName("hospitalized_count").HasDefaultValue(0);
            entity.Property(x => x.DeathCount).HasColumnName("death_count").HasDefaultValue(0);

            entity.Property(x => x.SuspectedFood).HasColumnName("suspected_food");
            entity.Property(x => x.FoodSource).HasColumnName("food_source").HasMaxLength(200);
            entity.Property(x => x.FoodServiceType).HasColumnName("food_service_type").HasMaxLength(200);

            entity.Property(x => x.CauseAssessmentValue).HasColumnName("cause_assessment");
            entity.Property(x => x.CausativeAgent).HasColumnName("causative_agent");
            entity.Property(x => x.Pathogen).HasColumnName("pathogen");

            entity.Property(x => x.InvestigationTeam).HasColumnName("investigation_team");
            entity.Property(x => x.ControlMeasures).HasColumnName("control_measures");
            entity.Property(x => x.PreventionMeasures).HasColumnName("prevention_measures");
            entity.Property(x => x.Conclusion).HasColumnName("conclusion");

            entity.Property(x => x.Status).HasColumnName("status").IsRequired();
            entity.Property(x => x.ReportedById).HasColumnName("reported_by_id");
            entity.Property(x => x.ReportedAt).HasColumnName("reported_at");
            entity.Property(x => x.VerifiedById).HasColumnName("verified_by_id");
            entity.Property(x => x.VerifiedAt).HasColumnName("verified_at");
            entity.Property(x => x.ConcludedById).HasColumnName("concluded_by_id");
            entity.Property(x => x.ConcludedAt).HasColumnName("concluded_at");
            entity.Property(x => x.Notes).HasColumnName("notes");

            ConfigureAggregateAudit(entity, "pk_fpi");

            entity.ToTable(t =>
            {
                t.HasCheckConstraint("chk_fpi_status", "status IN (1, 2, 3, 4)");
                t.HasCheckConstraint("chk_fpi_report_evidence",
                    "status = 1 OR (reported_by_id IS NOT NULL AND reported_at IS NOT NULL)");
                t.HasCheckConstraint("chk_fpi_verify_evidence",
                    "status NOT IN (3, 4) OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL)");
                t.HasCheckConstraint("chk_fpi_conclude_evidence",
                    "status <> 4 OR (concluded_by_id IS NOT NULL AND concluded_at IS NOT NULL)");
            });

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_fpi_organization")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Commune>()
                .WithMany()
                .HasForeignKey(x => x.LocationCommuneId)
                .HasConstraintName("fk_fpi_commune")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<District>()
                .WithMany()
                .HasForeignKey(x => x.LocationDistrictId)
                .HasConstraintName("fk_fpi_district")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Province>()
                .WithMany()
                .HasForeignKey(x => x.LocationProvinceId)
                .HasConstraintName("fk_fpi_province")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.Status })
                .HasDatabaseName("idx_fpi_org_status");
            entity.HasIndex(x => x.OccurrenceDate)
                .HasDatabaseName("idx_fpi_occurrence_date");

            entity.HasMany(x => x.ErrorReports)
                .WithOne()
                .HasForeignKey(x => x.IncidentId)
                .HasConstraintName("fk_pier_incident")
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<FoodPoisoningCase>(entity =>
        {
            entity.ToTable("food_poisoning_cases");
            entity.ConfigureByConvention();

            entity.HasKey(x => x.Id).HasName("pk_fpc");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            entity.Property(x => x.IncidentId).HasColumnName("incident_id");
            entity.Property(x => x.CaseCode).HasColumnName("case_code").HasMaxLength(50).IsRequired();
            entity.Property(x => x.ReportDate).HasColumnName("report_date").IsRequired();
            entity.Property(x => x.OccurrenceDate).HasColumnName("occurrence_date");

            entity.Property(x => x.LocationDescription).HasColumnName("location_description");
            entity.Property(x => x.LocationCommuneId).HasColumnName("location_commune_id");
            entity.Property(x => x.LocationDistrictId).HasColumnName("location_district_id");
            entity.Property(x => x.LocationProvinceId).HasColumnName("location_province_id");
            entity.Property(x => x.LocationLatitude).HasColumnName("location_latitude");
            entity.Property(x => x.LocationLongitude).HasColumnName("location_longitude");

            entity.Property(x => x.VictimName).HasColumnName("victim_name").HasMaxLength(200);
            entity.Property(x => x.VictimAge).HasColumnName("victim_age");
            entity.Property(x => x.VictimGender).HasColumnName("victim_gender");
            entity.Property(x => x.VictimPhone).HasColumnName("victim_phone").HasMaxLength(50);
            entity.Property(x => x.VictimAddress).HasColumnName("victim_address");

            entity.Property(x => x.SuspectedFood).HasColumnName("suspected_food");
            entity.Property(x => x.FoodSource).HasColumnName("food_source").HasMaxLength(200);
            entity.Property(x => x.FoodPreparationDate).HasColumnName("food_preparation_date");
            entity.Property(x => x.Symptoms).HasColumnName("symptoms");
            entity.Property(x => x.OnsetTime).HasColumnName("onset_time");

            entity.Property(x => x.MedicalFacility).HasColumnName("medical_facility").HasMaxLength(300);
            entity.Property(x => x.TreatmentStartDate).HasColumnName("treatment_start_date");
            entity.Property(x => x.TreatmentResult).HasColumnName("treatment_result");

            entity.Property(x => x.ReporterName).HasColumnName("reporter_name").HasMaxLength(200);
            entity.Property(x => x.ReporterPhone).HasColumnName("reporter_phone").HasMaxLength(50);
            entity.Property(x => x.ReporterOrganization).HasColumnName("reporter_organization").HasMaxLength(300);
            entity.Property(x => x.ReporterRelation).HasColumnName("reporter_relation").HasMaxLength(100);

            entity.Property(x => x.Status).HasColumnName("status").IsRequired();
            entity.Property(x => x.ReportedById).HasColumnName("reported_by_id");
            entity.Property(x => x.ReportedAt).HasColumnName("reported_at");
            entity.Property(x => x.VerifiedById).HasColumnName("verified_by_id");
            entity.Property(x => x.VerifiedAt).HasColumnName("verified_at");
            entity.Property(x => x.Notes).HasColumnName("notes");

            ConfigureAggregateAudit(entity, "pk_fpc");

            entity.ToTable(t =>
            {
                t.HasCheckConstraint("chk_fpc_status", "status IN (1, 2, 3)");
                t.HasCheckConstraint("chk_fpc_report_evidence",
                    "status = 1 OR (reported_by_id IS NOT NULL AND reported_at IS NOT NULL)");
                t.HasCheckConstraint("chk_fpc_verify_evidence",
                    "status <> 3 OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL)");
            });

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_fpc_organization")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<FoodPoisoningIncident>()
                .WithMany()
                .HasForeignKey(x => x.IncidentId)
                .HasConstraintName("fk_fpc_incident")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Commune>()
                .WithMany()
                .HasForeignKey(x => x.LocationCommuneId)
                .HasConstraintName("fk_fpc_commune")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<District>()
                .WithMany()
                .HasForeignKey(x => x.LocationDistrictId)
                .HasConstraintName("fk_fpc_district")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Province>()
                .WithMany()
                .HasForeignKey(x => x.LocationProvinceId)
                .HasConstraintName("fk_fpc_province")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.Status })
                .HasDatabaseName("idx_fpc_org_status");
            entity.HasIndex(x => x.IncidentId)
                .HasDatabaseName("idx_fpc_incident");
            entity.HasIndex(x => x.ReportDate)
                .HasDatabaseName("idx_fpc_report_date");

            entity.HasMany(x => x.ErrorReports)
                .WithOne()
                .HasForeignKey(x => x.CaseId)
                .HasConstraintName("fk_pcer_case")
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PoisoningCaseErrorReport>(entity =>
        {
            entity.ToTable("poisoning_case_error_reports");

            entity.HasKey(x => x.Id).HasName("pk_pcer");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.CaseId).HasColumnName("case_id").IsRequired();
            entity.Property(x => x.FromOrganizationId).HasColumnName("from_organization_id").IsRequired();
            entity.Property(x => x.ErrorDescription).HasColumnName("error_description").IsRequired();
            entity.Property(x => x.CorrectionRequest).HasColumnName("correction_request").IsRequired();
            entity.Property(x => x.Status).HasColumnName("status").IsRequired();
            entity.Property(x => x.Response).HasColumnName("response");
            entity.Property(x => x.RespondedAt).HasColumnName("responded_at");
            entity.Property(x => x.RespondedById).HasColumnName("responded_by_id");
            entity.Property(x => x.CreationTime).HasColumnName("creation_time");
            entity.Property(x => x.CreatorId).HasColumnName("creator_id");

            entity.ToTable(t => t.HasCheckConstraint("chk_pcer_status", "status IN (1, 2, 3)"));

            entity.HasIndex(x => x.CaseId).HasDatabaseName("idx_pcer_case");
        });

        builder.Entity<PoisoningIncidentErrorReport>(entity =>
        {
            entity.ToTable("poisoning_incident_error_reports");

            entity.HasKey(x => x.Id).HasName("pk_pier");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.IncidentId).HasColumnName("incident_id").IsRequired();
            entity.Property(x => x.FromOrganizationId).HasColumnName("from_organization_id").IsRequired();
            entity.Property(x => x.ErrorDescription).HasColumnName("error_description").IsRequired();
            entity.Property(x => x.CorrectionRequest).HasColumnName("correction_request").IsRequired();
            entity.Property(x => x.Status).HasColumnName("status").IsRequired();
            entity.Property(x => x.Response).HasColumnName("response");
            entity.Property(x => x.RespondedAt).HasColumnName("responded_at");
            entity.Property(x => x.RespondedById).HasColumnName("responded_by_id");
            entity.Property(x => x.CreationTime).HasColumnName("creation_time");
            entity.Property(x => x.CreatorId).HasColumnName("creator_id");

            entity.ToTable(t => t.HasCheckConstraint("chk_pier_status", "status IN (1, 2, 3)"));

            entity.HasIndex(x => x.IncidentId).HasDatabaseName("idx_pier_incident");
        });
    }

    private static void ConfigureReporting(ModelBuilder builder)
    {
        builder.Entity<NdtpReport>(entity =>
        {
            entity.ToTable("ndtp_reports");
            ConfigureAggregateAudit(entity, "pk_ndtp_reports");

            entity.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            entity.Property(x => x.PeriodYear).HasColumnName("period_year").IsRequired();
            entity.Property(x => x.PeriodMonth).HasColumnName("period_month").IsRequired();

            entity.Property(x => x.CaseCount).HasColumnName("case_count");
            entity.Property(x => x.CaseAffected).HasColumnName("case_affected");
            entity.Property(x => x.CaseHospitalized).HasColumnName("case_hospitalized");
            entity.Property(x => x.CaseDeaths).HasColumnName("case_deaths");
            entity.Property(x => x.IncidentCount).HasColumnName("incident_count");
            entity.Property(x => x.IncidentAffected).HasColumnName("incident_affected");
            entity.Property(x => x.IncidentHospitalized).HasColumnName("incident_hospitalized");
            entity.Property(x => x.IncidentDeaths).HasColumnName("incident_deaths");

            entity.Property(x => x.PreventionActivities).HasColumnName("prevention_activities");
            entity.Property(x => x.RiskFactors).HasColumnName("risk_factors");
            entity.Property(x => x.Recommendations).HasColumnName("recommendations");

            entity.Property(x => x.Status).HasColumnName("status").IsRequired();
            entity.Property(x => x.SubmissionVersion).HasColumnName("submission_version");
            entity.Property(x => x.SubmittedById).HasColumnName("submitted_by_id");
            entity.Property(x => x.SubmittedAt).HasColumnName("submitted_at");
            entity.Property(x => x.VerifiedById).HasColumnName("verified_by_id");
            entity.Property(x => x.VerifiedAt).HasColumnName("verified_at");
            entity.Property(x => x.ReturnedById).HasColumnName("returned_by_id");
            entity.Property(x => x.ReturnedAt).HasColumnName("returned_at");
            entity.Property(x => x.ReturnReason).HasColumnName("return_reason");
            entity.Property(x => x.CompletedById).HasColumnName("completed_by_id");
            entity.Property(x => x.CompletedAt).HasColumnName("completed_at");
            entity.Property(x => x.Notes).HasColumnName("notes");

            entity.ToTable(t =>
            {
                t.HasCheckConstraint("chk_ndtp_status", "status IN (1, 2, 3, 4, 5)");
                t.HasCheckConstraint("chk_ndtp_month", "period_month >= 1 AND period_month <= 12");
            });

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_ndtp_reports_organization")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.PeriodYear, x.PeriodMonth })
                .HasDatabaseName("idx_ndtp_org_period")
                .HasFilter("is_deleted = false")
                .IsUnique();
            entity.HasIndex(x => new { x.OrganizationId, x.Status })
                .HasDatabaseName("idx_ndtp_org_status");

            entity.HasMany(x => x.ErrorNotifications)
                .WithOne()
                .HasForeignKey(x => x.ReportId)
                .HasConstraintName("fk_ndtp_error_notifications_report")
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<NdtpReportErrorNotification>(entity =>
        {
            entity.ToTable("ndtp_report_error_notifications");

            entity.HasKey(x => x.Id).HasName("pk_ndtp_ren");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ReportId).HasColumnName("report_id").IsRequired();
            entity.Property(x => x.FromOrganizationId).HasColumnName("from_organization_id").IsRequired();
            entity.Property(x => x.ErrorFields).HasColumnName("error_fields").IsRequired();
            entity.Property(x => x.CorrectionDetails).HasColumnName("correction_details").IsRequired();
            entity.Property(x => x.Status).HasColumnName("status").IsRequired();
            entity.Property(x => x.Response).HasColumnName("response");
            entity.Property(x => x.RespondedById).HasColumnName("responded_by_id");
            entity.Property(x => x.RespondedAt).HasColumnName("responded_at");
            entity.Property(x => x.CreationTime).HasColumnName("creation_time");
            entity.Property(x => x.CreatorId).HasColumnName("creator_id");

            entity.ToTable(t => t.HasCheckConstraint("chk_ndtp_ren_status", "status IN (1, 2, 3)"));
            entity.HasIndex(x => x.ReportId).HasDatabaseName("idx_ndtp_ren_report");
        });

        builder.Entity<AtpWorkReport>(entity =>
        {
            entity.ToTable("atp_work_reports");
            ConfigureAggregateAudit(entity, "pk_atp_work_reports");

            entity.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            entity.Property(x => x.PeriodType).HasColumnName("period_type").IsRequired();
            entity.Property(x => x.PeriodYear).HasColumnName("period_year").IsRequired();
            entity.Property(x => x.PeriodHalf).HasColumnName("period_half");

            entity.Property(x => x.TotalBusinesses).HasColumnName("total_businesses");
            entity.Property(x => x.NewBusinesses).HasColumnName("new_businesses");
            entity.Property(x => x.InactiveBusinesses).HasColumnName("inactive_businesses");
            entity.Property(x => x.BusinessesWithCertificate).HasColumnName("businesses_with_certificate");

            entity.Property(x => x.DkcbIssued).HasColumnName("dkcb_issued");
            entity.Property(x => x.SelfDeclarationsReceived).HasColumnName("self_declarations_received");
            entity.Property(x => x.AdRegistrationsIssued).HasColumnName("ad_registrations_issued");
            entity.Property(x => x.EligibilityCertificatesIssued).HasColumnName("eligibility_certificates_issued");
            entity.Property(x => x.CfsIssued).HasColumnName("cfs_issued");
            entity.Property(x => x.ExportCertificatesIssued).HasColumnName("export_certificates_issued");

            entity.Property(x => x.TotalInspectionPlans).HasColumnName("total_inspection_plans");
            entity.Property(x => x.BusinessesInspected).HasColumnName("businesses_inspected");
            entity.Property(x => x.ViolationsFound).HasColumnName("violations_found");
            entity.Property(x => x.FinesIssued).HasColumnName("fines_issued");
            entity.Property(x => x.FineTotalAmount).HasColumnName("fine_total_amount").HasColumnType("numeric(18,2)");

            entity.Property(x => x.PoisoningCaseCount).HasColumnName("poisoning_case_count");
            entity.Property(x => x.PoisoningIncidentCount).HasColumnName("poisoning_incident_count");
            entity.Property(x => x.TotalAffected).HasColumnName("total_affected");
            entity.Property(x => x.TotalDeaths).HasColumnName("total_deaths");

            entity.Property(x => x.TrainingSessions).HasColumnName("training_sessions");
            entity.Property(x => x.TrainingParticipants).HasColumnName("training_participants");
            entity.Property(x => x.MediaAppearances).HasColumnName("media_appearances");
            entity.Property(x => x.DocumentsIssued).HasColumnName("documents_issued");

            entity.Property(x => x.Overview).HasColumnName("overview");
            entity.Property(x => x.Achievements).HasColumnName("achievements");
            entity.Property(x => x.Limitations).HasColumnName("limitations");
            entity.Property(x => x.Solutions).HasColumnName("solutions");
            entity.Property(x => x.NextPeriodPlan).HasColumnName("next_period_plan");

            entity.Property(x => x.Status).HasColumnName("status").IsRequired();
            entity.Property(x => x.SubmissionVersion).HasColumnName("submission_version");
            entity.Property(x => x.SubmittedById).HasColumnName("submitted_by_id");
            entity.Property(x => x.SubmittedAt).HasColumnName("submitted_at");
            entity.Property(x => x.VerifiedById).HasColumnName("verified_by_id");
            entity.Property(x => x.VerifiedAt).HasColumnName("verified_at");
            entity.Property(x => x.ReturnedById).HasColumnName("returned_by_id");
            entity.Property(x => x.ReturnedAt).HasColumnName("returned_at");
            entity.Property(x => x.ReturnReason).HasColumnName("return_reason");
            entity.Property(x => x.CompletedById).HasColumnName("completed_by_id");
            entity.Property(x => x.CompletedAt).HasColumnName("completed_at");
            entity.Property(x => x.Notes).HasColumnName("notes");

            entity.ToTable(t =>
            {
                t.HasCheckConstraint("chk_atp_status", "status IN (1, 2, 3, 4, 5)");
                t.HasCheckConstraint("chk_atp_period_type", "period_type IN (1, 2)");
            });

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_atp_work_reports_organization")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.PeriodType, x.PeriodYear, x.PeriodHalf })
                .HasDatabaseName("idx_atp_org_period")
                .HasFilter("is_deleted = false")
                .IsUnique();
            entity.HasIndex(x => new { x.OrganizationId, x.Status })
                .HasDatabaseName("idx_atp_org_status");

            entity.HasMany(x => x.ErrorNotifications)
                .WithOne()
                .HasForeignKey(x => x.ReportId)
                .HasConstraintName("fk_atp_error_notifications_report")
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AtpWorkReportErrorNotification>(entity =>
        {
            entity.ToTable("atp_work_report_error_notifications");

            entity.HasKey(x => x.Id).HasName("pk_atp_ren");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ReportId).HasColumnName("report_id").IsRequired();
            entity.Property(x => x.FromOrganizationId).HasColumnName("from_organization_id").IsRequired();
            entity.Property(x => x.ErrorFields).HasColumnName("error_fields").IsRequired();
            entity.Property(x => x.CorrectionDetails).HasColumnName("correction_details").IsRequired();
            entity.Property(x => x.Status).HasColumnName("status").IsRequired();
            entity.Property(x => x.Response).HasColumnName("response");
            entity.Property(x => x.RespondedById).HasColumnName("responded_by_id");
            entity.Property(x => x.RespondedAt).HasColumnName("responded_at");
            entity.Property(x => x.CreationTime).HasColumnName("creation_time");
            entity.Property(x => x.CreatorId).HasColumnName("creator_id");

            entity.ToTable(t => t.HasCheckConstraint("chk_atp_ren_status", "status IN (1, 2, 3)"));
            entity.HasIndex(x => x.ReportId).HasDatabaseName("idx_atp_ren_report");
        });

        builder.Entity<ActionMonthReport>(entity =>
        {
            entity.ToTable("action_month_reports");
            ConfigureAggregateAudit(entity, "pk_action_month_reports");

            entity.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            entity.Property(x => x.PeriodYear).HasColumnName("period_year").IsRequired();
            entity.Property(x => x.ActionMonthTheme).HasColumnName("action_month_theme");
            entity.Property(x => x.ActionMonthDates).HasColumnName("action_month_dates").HasMaxLength(100);

            entity.Property(x => x.MediaArticles).HasColumnName("media_articles");
            entity.Property(x => x.BroadcastPrograms).HasColumnName("broadcast_programs");
            entity.Property(x => x.PropagandaSessions).HasColumnName("propaganda_sessions");
            entity.Property(x => x.Participants).HasColumnName("participants");
            entity.Property(x => x.PostersDistributed).HasColumnName("posters_distributed");
            entity.Property(x => x.LeafletsDistributed).HasColumnName("leaflets_distributed");

            entity.Property(x => x.BusinessesInspected).HasColumnName("businesses_inspected");
            entity.Property(x => x.ViolationsFound).HasColumnName("violations_found");
            entity.Property(x => x.FinesIssued).HasColumnName("fines_issued");
            entity.Property(x => x.FineAmount).HasColumnName("fine_amount").HasColumnType("numeric(18,2)");

            entity.Property(x => x.NewSelfDeclarations).HasColumnName("new_self_declarations");

            entity.Property(x => x.Achievements).HasColumnName("achievements");
            entity.Property(x => x.Limitations).HasColumnName("limitations");
            entity.Property(x => x.LessonsLearned).HasColumnName("lessons_learned");
            entity.Property(x => x.NextSteps).HasColumnName("next_steps");

            entity.Property(x => x.Status).HasColumnName("status").IsRequired();
            entity.Property(x => x.SubmissionVersion).HasColumnName("submission_version");
            entity.Property(x => x.SubmittedById).HasColumnName("submitted_by_id");
            entity.Property(x => x.SubmittedAt).HasColumnName("submitted_at");
            entity.Property(x => x.VerifiedById).HasColumnName("verified_by_id");
            entity.Property(x => x.VerifiedAt).HasColumnName("verified_at");
            entity.Property(x => x.ReturnedById).HasColumnName("returned_by_id");
            entity.Property(x => x.ReturnedAt).HasColumnName("returned_at");
            entity.Property(x => x.ReturnReason).HasColumnName("return_reason");
            entity.Property(x => x.CompletedById).HasColumnName("completed_by_id");
            entity.Property(x => x.CompletedAt).HasColumnName("completed_at");
            entity.Property(x => x.Notes).HasColumnName("notes");

            entity.ToTable(t => t.HasCheckConstraint("chk_amr_status", "status IN (1, 2, 3, 4, 5)"));

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_action_month_reports_organization")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.PeriodYear })
                .HasDatabaseName("idx_amr_org_period")
                .HasFilter("is_deleted = false")
                .IsUnique();
            entity.HasIndex(x => new { x.OrganizationId, x.Status })
                .HasDatabaseName("idx_amr_org_status");

            entity.HasMany(x => x.ErrorNotifications)
                .WithOne()
                .HasForeignKey(x => x.ReportId)
                .HasConstraintName("fk_amr_error_notifications_report")
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ActionMonthReportErrorNotification>(entity =>
        {
            entity.ToTable("action_month_report_error_notifications");

            entity.HasKey(x => x.Id).HasName("pk_amr_ren");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.ReportId).HasColumnName("report_id").IsRequired();
            entity.Property(x => x.FromOrganizationId).HasColumnName("from_organization_id").IsRequired();
            entity.Property(x => x.ErrorFields).HasColumnName("error_fields").IsRequired();
            entity.Property(x => x.CorrectionDetails).HasColumnName("correction_details").IsRequired();
            entity.Property(x => x.Status).HasColumnName("status").IsRequired();
            entity.Property(x => x.Response).HasColumnName("response");
            entity.Property(x => x.RespondedById).HasColumnName("responded_by_id");
            entity.Property(x => x.RespondedAt).HasColumnName("responded_at");
            entity.Property(x => x.CreationTime).HasColumnName("creation_time");
            entity.Property(x => x.CreatorId).HasColumnName("creator_id");

            entity.ToTable(t => t.HasCheckConstraint("chk_amr_ren_status", "status IN (1, 2, 3)"));
            entity.HasIndex(x => x.ReportId).HasDatabaseName("idx_amr_ren_report");
        });
    }

    private static void ConfigureDataIntegration(ModelBuilder builder)
    {
        builder.Entity<ApiEndpoint>(entity =>
        {
            entity.ToTable("di_api_endpoints");
            entity.ConfigureByConvention();

            entity.HasKey(x => x.Id).HasName("pk_di_endpoints");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(256).IsRequired();
            entity.Property(x => x.Url).HasColumnName("url").HasMaxLength(2048).IsRequired();
            entity.Property(x => x.HttpMethod).HasColumnName("http_method").HasMaxLength(10).IsRequired();
            entity.Property(x => x.ExternalSystem).HasColumnName("external_system").HasMaxLength(256).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(1024);
            entity.Property(x => x.AuthType).HasColumnName("auth_type").IsRequired();
            entity.Property(x => x.Status).HasColumnName("status").IsRequired();

            entity.Property(x => x.CreationTime).HasColumnName("creation_time");
            entity.Property(x => x.CreatorId).HasColumnName("creator_id");
            entity.Property(x => x.LastModificationTime).HasColumnName("last_modification_time");
            entity.Property(x => x.LastModifierId).HasColumnName("last_modifier_id");
            entity.Property(x => x.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
            entity.Property(x => x.DeletionTime).HasColumnName("deletion_time");
            entity.Property(x => x.DeleterId).HasColumnName("deleter_id");
            entity.Property(x => x.ConcurrencyStamp).HasColumnName("concurrency_stamp");

            entity.ToTable(t =>
            {
                t.HasCheckConstraint("chk_di_ep_status", "status IN (1, 2)");
                t.HasCheckConstraint("chk_di_ep_auth_type", "auth_type IN (1, 2, 3, 4)");
            });

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_di_ep_organization")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.Status })
                .HasDatabaseName("idx_di_ep_org_status");
            entity.HasIndex(x => x.ExternalSystem)
                .HasDatabaseName("idx_di_ep_ext_system");

            entity.HasQueryFilter(x => !x.IsDeleted);
        });

        builder.Entity<ApiCallLog>(entity =>
        {
            entity.ToTable("di_api_call_logs");
            entity.ConfigureByConvention();

            entity.HasKey(x => x.Id).HasName("pk_di_call_logs");
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            entity.Property(x => x.Direction).HasColumnName("direction").IsRequired();
            entity.Property(x => x.ExternalSystemName).HasColumnName("external_system_name").HasMaxLength(256).IsRequired();
            entity.Property(x => x.EndpointUrl).HasColumnName("endpoint_url").HasMaxLength(2048).IsRequired();
            entity.Property(x => x.HttpMethod).HasColumnName("http_method").HasMaxLength(10).IsRequired();
            entity.Property(x => x.RequestHeaders).HasColumnName("request_headers");
            entity.Property(x => x.RequestBody).HasColumnName("request_body");
            entity.Property(x => x.ResponseStatusCode).HasColumnName("response_status_code");
            entity.Property(x => x.ResponseBody).HasColumnName("response_body");
            entity.Property(x => x.CalledAt).HasColumnName("called_at").IsRequired();
            entity.Property(x => x.DurationMs).HasColumnName("duration_ms").IsRequired();
            entity.Property(x => x.IsSuccess).HasColumnName("is_success").IsRequired();
            entity.Property(x => x.ErrorMessage).HasColumnName("error_message").HasMaxLength(4000);
            entity.Property(x => x.DataType)
                .HasColumnName("data_type")
                .HasConversion<short>()
                .HasDefaultValue(SharedDataType.Other);
            entity.Property(x => x.CreationTime).HasColumnName("creation_time");
            entity.Property(x => x.CreatorId).HasColumnName("creator_id");
            entity.Property(x => x.ConcurrencyStamp).HasColumnName("concurrency_stamp");

            entity.ToTable(t => t.HasCheckConstraint("chk_di_cl_direction", "direction IN (1, 2)"));

            entity.HasOne<Organization>()
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .HasConstraintName("fk_di_cl_organization")
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.OrganizationId, x.CalledAt })
                .HasDatabaseName("idx_di_cl_org_called");
            entity.HasIndex(x => x.ExternalSystemName)
                .HasDatabaseName("idx_di_cl_ext_system");
            entity.HasIndex(x => x.IsSuccess)
                .HasDatabaseName("idx_di_cl_success");
        });
    }
}
