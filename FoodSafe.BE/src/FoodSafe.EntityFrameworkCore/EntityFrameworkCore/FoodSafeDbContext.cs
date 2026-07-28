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
using FoodSafe.Licensing;
using FoodSafe.Inspection;
using FoodSafe.AlertsAndTesting;
using FoodSafe.FoodPoisoning;
using FoodSafe.Reporting;
using FoodSafe.DataIntegration;

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
    public DbSet<ProductRegistration> ProductRegistrations { get; set; }
    public DbSet<CfsCertificate> CfsCertificates { get; set; }
    public DbSet<AdvertisementRegistration> AdvertisementRegistrations
    { get; set; }
    public DbSet<AdvertisementRegistrationProduct>
        AdvertisementRegistrationProducts
    { get; set; }
    public DbSet<EligibilityCertificate> EligibilityCertificates
    { get; set; }
    public DbSet<ExportFoodCertificate> ExportFoodCertificates
    { get; set; }
    public DbSet<InspectionPlan> InspectionPlans { get; set; }
    public DbSet<InspectionPlanItem> InspectionPlanItems { get; set; }
    public DbSet<InspectionResult> InspectionResults { get; set; }
    public DbSet<InspectionResultInspector> InspectionResultInspectors { get; set; }
    public DbSet<InspectionViolation> InspectionViolations { get; set; }
    public DbSet<AtpAlert> AtpAlerts { get; set; }
    public DbSet<AtpNews> AtpNewsArticles { get; set; }
    public DbSet<NewsLinkedAlert> NewsLinkedAlerts { get; set; }
    public DbSet<RiskAnalysis> RiskAnalyses { get; set; }
    public DbSet<TestingResult> TestingResults { get; set; }
    public DbSet<AdministrativeDocument> AdministrativeDocuments { get; set; }
    public DbSet<FoodPoisoningCase> FoodPoisoningCases { get; set; }
    public DbSet<FoodPoisoningIncident> FoodPoisoningIncidents { get; set; }
    public DbSet<PoisoningCaseErrorReport> PoisoningCaseErrorReports { get; set; }
    public DbSet<PoisoningIncidentErrorReport> PoisoningIncidentErrorReports { get; set; }
    public DbSet<DocumentOwner> DocumentOwners { get; set; }
    public DbSet<FileAttachment> FileAttachments { get; set; }
    public DbSet<NdtpReport> NdtpReports { get; set; }
    public DbSet<NdtpReportErrorNotification> NdtpReportErrorNotifications { get; set; }
    public DbSet<AtpWorkReport> AtpWorkReports { get; set; }
    public DbSet<AtpWorkReportErrorNotification> AtpWorkReportErrorNotifications { get; set; }
    public DbSet<ActionMonthReport> ActionMonthReports { get; set; }
    public DbSet<ActionMonthReportErrorNotification> ActionMonthReportErrorNotifications { get; set; }
    public DbSet<ApiEndpoint> ApiEndpoints { get; set; }
    public DbSet<ApiCallLog> ApiCallLogs { get; set; }
    public DbSet<PartnerAccount> PartnerAccounts { get; set; }
    public DbSet<PartnerApiKey> PartnerApiKeys { get; set; }
    public DbSet<InboundSubmission> InboundSubmissions { get; set; }
    public DbSet<ApiSpecification> ApiSpecifications { get; set; }

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
