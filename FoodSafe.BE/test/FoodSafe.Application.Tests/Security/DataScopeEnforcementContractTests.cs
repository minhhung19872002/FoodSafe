using System.Reflection;
using FoodSafe.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using FoodSafe.Dashboard;
using FoodSafe.DataIntegration;
using FoodSafe.FoodPoisoning;
using FoodSafe.Inspection;
using FoodSafe.Licensing;
using FoodSafe.Organizations;
using FoodSafe.Reporting;
using FoodSafe.Security;
using Shouldly;
using Xunit;

namespace FoodSafe.Security;

public sealed class DataScopeEnforcementContractTests
{
    private static readonly Type[] OrgScopedAppServices =
    [
        typeof(BusinessAppService),
        typeof(ProductAppService),
        typeof(SelfDeclarationAppService),
        typeof(ProductRegistrationAppService),
        typeof(AdvertisementRegistrationAppService),
        typeof(EligibilityCertificateAppService),
        typeof(CfsCertificateAppService),
        typeof(ExportFoodCertificateAppService),
        typeof(InspectionPlanAppService),
        typeof(InspectionResultAppService),
        typeof(FoodPoisoningCaseAppService),
        typeof(FoodPoisoningIncidentAppService),
        typeof(NdtpReportAppService),
        typeof(AtpWorkReportAppService),
        typeof(ActionMonthReportAppService),
        typeof(AtpAlertAppService),
        typeof(AtpNewsAppService),
        typeof(TestingResultAppService),
        typeof(RiskAnalysisAppService),
        typeof(AdministrativeDocumentAppService),
        typeof(StatisticsAppService),
        typeof(DashboardAppService),
        typeof(OrganizationAppService),
        typeof(ApiEndpointAppService),
        typeof(ApiCallLogAppService),
    ];

    [Fact]
    public void All_org_scoped_services_inject_ICurrentDataScopeProvider()
    {
        foreach (var serviceType in OrgScopedAppServices)
        {
            var constructors = serviceType.GetConstructors(
                BindingFlags.Public | BindingFlags.Instance);

            var injectsScope = constructors.Any(ctor =>
                ctor.GetParameters().Any(p =>
                    p.ParameterType == typeof(ICurrentDataScopeProvider)));

            injectsScope.ShouldBeTrue(
                $"{serviceType.Name} must inject ICurrentDataScopeProvider " +
                $"for organization-scoped data filtering.");
        }
    }

    [Theory]
    [InlineData(typeof(ProductDataScopeChecker))]
    [InlineData(typeof(SelfDeclarationDataScopeChecker))]
    [InlineData(typeof(ProductRegistrationDataScopeChecker))]
    [InlineData(typeof(AdvertisementRegistrationDataScopeChecker))]
    [InlineData(typeof(EligibilityCertificateDataScopeChecker))]
    [InlineData(typeof(CfsCertificateDataScopeChecker))]
    [InlineData(typeof(ExportFoodCertificateDataScopeChecker))]
    public void Data_scope_checker_must_inject_ICurrentDataScopeProvider(
        Type checkerType)
    {
        var constructors = checkerType.GetConstructors(
            BindingFlags.Public | BindingFlags.Instance);

        var injectsScope = constructors.Any(ctor =>
            ctor.GetParameters().Any(p =>
                p.ParameterType == typeof(ICurrentDataScopeProvider)));

        injectsScope.ShouldBeTrue(
            $"{checkerType.Name} must inject ICurrentDataScopeProvider.");
    }

    [Theory]
    [InlineData(typeof(ProductDataScopeChecker))]
    [InlineData(typeof(SelfDeclarationDataScopeChecker))]
    [InlineData(typeof(ProductRegistrationDataScopeChecker))]
    [InlineData(typeof(AdvertisementRegistrationDataScopeChecker))]
    [InlineData(typeof(EligibilityCertificateDataScopeChecker))]
    [InlineData(typeof(CfsCertificateDataScopeChecker))]
    [InlineData(typeof(ExportFoodCertificateDataScopeChecker))]
    public void Data_scope_checker_exposes_EnsureAccessAsync(Type checkerType)
    {
        var interfaces = checkerType.GetInterfaces();
        var hasEnsureAccess = interfaces.Any(iface =>
            iface.GetMethods().Any(m => m.Name == "EnsureAccessAsync"));

        hasEnsureAccess.ShouldBeTrue(
            $"{checkerType.Name} must expose EnsureAccessAsync via its interface.");
    }

    [Fact]
    public void CurrentDataScope_rejects_cross_org_access()
    {
        var orgA = Guid.NewGuid();
        var orgB = Guid.NewGuid();
        var scope = new CurrentDataScope(
            Guid.NewGuid(), orgA, false, false,
            new HashSet<Guid> { orgA },
            new HashSet<Guid>(),
            new HashSet<Guid>(),
            new HashSet<Guid>());

        scope.IncludesOrganization(orgA).ShouldBeTrue();
        scope.IncludesOrganization(orgB).ShouldBeFalse();
    }

    [Fact]
    public void Null_scope_sets_reject_access()
    {
        var scope = new CurrentDataScope(
            Guid.NewGuid(), Guid.NewGuid(), false, false,
            new HashSet<Guid> { Guid.NewGuid() },
            new HashSet<Guid>(),
            new HashSet<Guid>(),
            null, null, null);

        scope.IncludesBusiness(Guid.NewGuid()).ShouldBeFalse();
        scope.IncludesBusinessType(Guid.NewGuid()).ShouldBeFalse();
        scope.IncludesProductGroup(Guid.NewGuid()).ShouldBeFalse();
    }

    [Fact]
    public void Empty_scope_sets_reject_access()
    {
        var scope = new CurrentDataScope(
            Guid.NewGuid(), Guid.NewGuid(), false, false,
            new HashSet<Guid>(),
            new HashSet<Guid>(),
            new HashSet<Guid>(),
            new HashSet<Guid>(),
            new HashSet<Guid>(),
            new HashSet<Guid>());

        scope.IncludesOrganization(Guid.NewGuid()).ShouldBeFalse();
        scope.IncludesBusiness(Guid.NewGuid()).ShouldBeFalse();
        scope.IncludesBusinessType(Guid.NewGuid()).ShouldBeFalse();
        scope.IncludesProductGroup(Guid.NewGuid()).ShouldBeFalse();
    }
}
