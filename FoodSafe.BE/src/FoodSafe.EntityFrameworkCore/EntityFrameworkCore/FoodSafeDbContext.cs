using Microsoft.EntityFrameworkCore;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.BackgroundJobs.EntityFrameworkCore;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.FeatureManagement.EntityFrameworkCore;
using Volo.Abp.Identity;
using Volo.Abp.Identity.EntityFrameworkCore;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using FoodSafe.Organizations;
using FoodSafe.Catalogs;
using FoodSafe.Security;
using FoodSafe.BusinessManagement;
using FoodSafe.FileManagement;

namespace FoodSafe.EntityFrameworkCore;

[ReplaceDbContext(typeof(IIdentityDbContext))]
[ConnectionStringName("Default")]
public class FoodSafeDbContext :
    AbpDbContext<FoodSafeDbContext>,
    IIdentityDbContext
{
    // ABP Identity
    public DbSet<IdentityUser> Users { get; set; }
    public DbSet<IdentityRole> Roles { get; set; }
    public DbSet<IdentityClaimType> ClaimTypes { get; set; }
    public DbSet<OrganizationUnit> OrganizationUnits { get; set; }
    public DbSet<IdentitySecurityLog> SecurityLogs { get; set; }
    public DbSet<IdentityLinkUser> LinkUsers { get; set; }
    public DbSet<IdentityUserDelegation> UserDelegations { get; set; }
    public DbSet<IdentitySession> Sessions { get; set; }
    public DbSet<Organization> FoodSafeOrganizations { get; set; }
    public DbSet<Country> Countries { get; set; }
    public DbSet<Region> Regions { get; set; }
    public DbSet<Province> Provinces { get; set; }
    public DbSet<District> Districts { get; set; }
    public DbSet<Commune> Communes { get; set; }
    public DbSet<ProductGroup> ProductGroups { get; set; }
    public DbSet<BusinessType> BusinessTypes { get; set; }
    public DbSet<BusinessClassification> BusinessClassifications { get; set; }
    public DbSet<AdvertisementType> AdvertisementTypes { get; set; }
    public DbSet<DocumentType> DocumentTypes { get; set; }
    public DbSet<TestingCenter> TestingCenters { get; set; }
    public DbSet<TestingService> TestingServices { get; set; }
    public DbSet<AppUserProfile> AppUserProfiles { get; set; }
    public DbSet<PasswordHistory> PasswordHistory { get; set; }
    public DbSet<ManagementScopeAssignment> ManagementScopeAssignments { get; set; }
    public DbSet<Business> Businesses { get; set; }
    public DbSet<BusinessProductGroup> BusinessProductGroups { get; set; }
    public DbSet<BusinessHandler> BusinessHandlers { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<SelfDeclaration> SelfDeclarations { get; set; }
    public DbSet<DocumentOwner> DocumentOwners { get; set; }
    public DbSet<FileAttachment> FileAttachments { get; set; }

    public FoodSafeDbContext(DbContextOptions<FoodSafeDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ConfigurePermissionManagement();
        builder.ConfigureSettingManagement();
        builder.ConfigureBackgroundJobs();
        builder.ConfigureAuditLogging();
        builder.ConfigureIdentity();
        builder.ConfigureOpenIddict();
        builder.ConfigureFeatureManagement();

        builder.ConfigureFoodSafe();
    }
}
