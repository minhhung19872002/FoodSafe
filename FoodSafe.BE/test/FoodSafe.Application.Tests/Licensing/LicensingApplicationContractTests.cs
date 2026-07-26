using System.Reflection;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.Licensing;

public sealed class LicensingApplicationContractTests
{
    [Theory]
    [InlineData(typeof(ProductRegistrationAppService), "GetListAsync", null)]
    [InlineData(typeof(ProductRegistrationAppService), "GetAsync", null)]
    [InlineData(typeof(ProductRegistrationAppService), "GetBusinessOptionsAsync", null)]
    [InlineData(typeof(ProductRegistrationAppService), "GetProductOptionsAsync", null)]
    [InlineData(typeof(ProductRegistrationAppService), "CreateAsync",
        FoodSafePermissions.Licensing.ProductRegistrations.Create)]
    [InlineData(typeof(ProductRegistrationAppService), "UpdateAsync",
        FoodSafePermissions.Licensing.ProductRegistrations.Edit)]
    [InlineData(typeof(ProductRegistrationAppService), "DeleteAsync",
        FoodSafePermissions.Licensing.ProductRegistrations.Delete)]
    [InlineData(typeof(ProductRegistrationAppService), "RevokeAsync",
        FoodSafePermissions.Licensing.ProductRegistrations.Edit)]
    [InlineData(typeof(AdvertisementRegistrationAppService), "GetListAsync", null)]
    [InlineData(typeof(AdvertisementRegistrationAppService), "GetAsync", null)]
    [InlineData(typeof(AdvertisementRegistrationAppService), "GetBusinessOptionsAsync", null)]
    [InlineData(typeof(AdvertisementRegistrationAppService), "GetProductOptionsAsync", null)]
    [InlineData(typeof(AdvertisementRegistrationAppService), "GetAdvertisementTypeOptionsAsync", null)]
    [InlineData(typeof(AdvertisementRegistrationAppService), "CreateAsync",
        FoodSafePermissions.Licensing.AdRegistrations.Create)]
    [InlineData(typeof(AdvertisementRegistrationAppService), "UpdateAsync",
        FoodSafePermissions.Licensing.AdRegistrations.Edit)]
    [InlineData(typeof(AdvertisementRegistrationAppService), "DeleteAsync",
        FoodSafePermissions.Licensing.AdRegistrations.Delete)]
    [InlineData(typeof(AdvertisementRegistrationAppService), "RevokeAsync",
        FoodSafePermissions.Licensing.AdRegistrations.Edit)]
    [InlineData(typeof(EligibilityCertificateAppService), "GetListAsync", null)]
    [InlineData(typeof(EligibilityCertificateAppService), "GetAsync", null)]
    [InlineData(typeof(EligibilityCertificateAppService), "GetBusinessOptionsAsync", null)]
    [InlineData(typeof(EligibilityCertificateAppService), "CreateAsync",
        FoodSafePermissions.Licensing.EligibilityCertificates.Create)]
    [InlineData(typeof(EligibilityCertificateAppService), "UpdateAsync",
        FoodSafePermissions.Licensing.EligibilityCertificates.Edit)]
    [InlineData(typeof(EligibilityCertificateAppService), "DeleteAsync",
        FoodSafePermissions.Licensing.EligibilityCertificates.Delete)]
    [InlineData(typeof(EligibilityCertificateAppService), "RevokeAsync",
        FoodSafePermissions.Licensing.EligibilityCertificates.Edit)]
    [InlineData(typeof(CfsCertificateAppService), "GetListAsync", null)]
    [InlineData(typeof(CfsCertificateAppService), "GetAsync", null)]
    [InlineData(typeof(CfsCertificateAppService), "GetBusinessOptionsAsync", null)]
    [InlineData(typeof(CfsCertificateAppService), "GetProductOptionsAsync", null)]
    [InlineData(typeof(CfsCertificateAppService), "GetCountryOptionsAsync", null)]
    [InlineData(typeof(CfsCertificateAppService), "CreateAsync",
        FoodSafePermissions.Licensing.CfsCertificates.Create)]
    [InlineData(typeof(CfsCertificateAppService), "UpdateAsync",
        FoodSafePermissions.Licensing.CfsCertificates.Edit)]
    [InlineData(typeof(CfsCertificateAppService), "DeleteAsync",
        FoodSafePermissions.Licensing.CfsCertificates.Delete)]
    [InlineData(typeof(CfsCertificateAppService), "RevokeAsync",
        FoodSafePermissions.Licensing.CfsCertificates.Edit)]
    [InlineData(typeof(ExportFoodCertificateAppService), "GetListAsync", null)]
    [InlineData(typeof(ExportFoodCertificateAppService), "GetAsync", null)]
    [InlineData(typeof(ExportFoodCertificateAppService), "GetBusinessOptionsAsync", null)]
    [InlineData(typeof(ExportFoodCertificateAppService), "GetProductOptionsAsync", null)]
    [InlineData(typeof(ExportFoodCertificateAppService), "GetCountryOptionsAsync", null)]
    [InlineData(typeof(ExportFoodCertificateAppService), "CreateAsync",
        FoodSafePermissions.Licensing.ExportCertificates.Create)]
    [InlineData(typeof(ExportFoodCertificateAppService), "UpdateAsync",
        FoodSafePermissions.Licensing.ExportCertificates.Edit)]
    [InlineData(typeof(ExportFoodCertificateAppService), "DeleteAsync",
        FoodSafePermissions.Licensing.ExportCertificates.Delete)]
    [InlineData(typeof(ExportFoodCertificateAppService), "RevokeAsync",
        FoodSafePermissions.Licensing.ExportCertificates.Edit)]
    public void Operations_should_use_least_privilege_permissions(
        Type serviceType, string methodName, string? expectedPermission)
    {
        var method = serviceType.GetMethod(methodName);
        method.ShouldNotBeNull();
        method.GetCustomAttribute<AuthorizeAttribute>()?.Policy
            .ShouldBe(expectedPermission);
    }

    [Fact]
    public void Service_roots_should_require_view_permissions()
    {
        typeof(ProductRegistrationAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.Licensing.ProductRegistrations.View);

        typeof(AdvertisementRegistrationAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.Licensing.AdRegistrations.View);

        typeof(EligibilityCertificateAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.Licensing.EligibilityCertificates.View);

        typeof(CfsCertificateAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.Licensing.CfsCertificates.View);

        typeof(ExportFoodCertificateAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.Licensing.ExportCertificates.View);
    }

    [Theory]
    [InlineData(typeof(ProductRegistrationExcelAppService), "ExportAsync",
        FoodSafePermissions.Licensing.ProductRegistrations.View)]
    [InlineData(typeof(AdvertisementRegistrationExcelAppService), "ExportAsync",
        FoodSafePermissions.Licensing.AdRegistrations.View)]
    [InlineData(typeof(EligibilityCertificateExcelAppService), "ExportAsync",
        FoodSafePermissions.Licensing.EligibilityCertificates.View)]
    [InlineData(typeof(CfsCertificateExcelAppService), "ExportAsync",
        FoodSafePermissions.Licensing.CfsCertificates.View)]
    [InlineData(typeof(ExportFoodCertificateExcelAppService), "ExportAsync",
        FoodSafePermissions.Licensing.ExportCertificates.View)]
    public void Excel_exports_require_view_permission(
        Type serviceType, string methodName, string permission)
    {
        var method = serviceType.GetMethod(methodName);
        method.ShouldNotBeNull();
        method!.GetCustomAttributes<AuthorizeAttribute>()
            .Select(x => x.Policy)
            .ShouldContain(permission);
    }
}
