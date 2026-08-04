using System.Reflection;
using FoodSafe.PublicPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shouldly;
using Xunit;

namespace FoodSafe;

/// <summary>
/// Guards the shape of the anonymous portal surface. These endpoints are the
/// only ones reachable without a session, so a route or an [AllowAnonymous]
/// disappearing must fail the build rather than the portal.
/// </summary>
public sealed class PublicPortalContractTests
{
    [Fact]
    public void Testing_result_certificate_download_should_be_anonymous()
    {
        var method = typeof(PublicContentController)
            .GetMethod(nameof(PublicContentController.GetTestingResultCertificateAsync));

        method.ShouldNotBeNull();
        method.GetCustomAttribute<HttpGetAttribute>()!.Template
            .ShouldBe("testing-results/{id:guid}/certificate");
        typeof(PublicContentController)
            .GetCustomAttribute<AllowAnonymousAttribute>()
            .ShouldNotBeNull();
    }

    [Fact]
    public void Citizen_report_evidence_should_stay_capped()
    {
        // The endpoint is anonymous and every file is malware-scanned, so the
        // cap is a cost control, not a nicety.
        CreateCitizenAlertReportDto.MaximumEvidenceFiles.ShouldBe(3);
    }

    [Fact]
    public void Public_product_summary_should_carry_the_label_fields_stt42_requires()
    {
        var properties = typeof(PublicProductSummaryDto)
            .GetProperties()
            .Select(p => p.Name)
            .ToList();

        properties.ShouldContain(nameof(PublicProductSummaryDto.Ingredients));
        properties.ShouldContain(nameof(PublicProductSummaryDto.ExpiryPeriodMonths));
        properties.ShouldContain(nameof(PublicProductSummaryDto.OriginCountryName));
        properties.ShouldContain(nameof(PublicProductSummaryDto.BusinessId));
    }
}
