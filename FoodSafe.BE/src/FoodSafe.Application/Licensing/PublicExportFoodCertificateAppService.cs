using FoodSafe.BusinessManagement;
using FoodSafe.Catalogs;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.Licensing;

[RemoteService(false)]
[AllowAnonymous]
public class PublicExportFoodCertificateAppService :
    ApplicationService,
    IPublicExportFoodCertificateAppService
{
    private readonly IRepository<ExportFoodCertificate, Guid> _certificates;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<Product, Guid> _products;
    private readonly IRepository<Country, Guid> _countries;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PublicExportFoodCertificateAppService(
        IRepository<ExportFoodCertificate, Guid> certificates,
        IRepository<Business, Guid> businesses,
        IRepository<Product, Guid> products,
        IRepository<Country, Guid> countries,
        ICancellationTokenProvider cancellationTokens)
    {
        _certificates = certificates;
        _businesses = businesses;
        _products = products;
        _countries = countries;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PublicExportFoodCertificateDto> FindByNumberAsync(
        string number)
    {
        Check.NotNullOrWhiteSpace(number, nameof(number), 100);
        var normalized = number.Trim().ToUpperInvariant();
        var query = await _certificates.GetQueryableAsync();
        var certificate = await AsyncExecuter.FirstOrDefaultAsync(
            query.Where(x => x.CertificateNumber == normalized),
            _cancellationTokens.Token);
        if (certificate is null)
            throw new UserFriendlyException(
                "Không tìm thấy giấy chứng nhận xuất khẩu.");

        var businesses = await _businesses.GetQueryableAsync();
        var businessName = await AsyncExecuter.FirstOrDefaultAsync(
            businesses.Where(x => x.Id == certificate.BusinessId)
                .Select(x => x.Name),
            _cancellationTokens.Token);

        string? productName = null;
        if (certificate.ProductId.HasValue)
        {
            var products = await _products.GetQueryableAsync();
            productName = await AsyncExecuter.FirstOrDefaultAsync(
                products.Where(x => x.Id == certificate.ProductId.Value)
                    .Select(x => x.Name),
                _cancellationTokens.Token);
        }

        string? countryName = null;
        if (certificate.DestinationCountryId.HasValue)
        {
            var countries = await _countries.GetQueryableAsync();
            countryName = await AsyncExecuter.FirstOrDefaultAsync(
                countries.Where(x =>
                        x.Id == certificate.DestinationCountryId.Value)
                    .Select(x => x.NameVi),
                _cancellationTokens.Token);
        }

        return new PublicExportFoodCertificateDto
        {
            CertificateNumber = certificate.CertificateNumber,
            IssueDate = certificate.IssueDate,
            ExpiryDate = certificate.ExpiryDate,
            ProductName = productName,
            DestinationCountryName = countryName ?? string.Empty,
            BusinessName = businessName ?? string.Empty,
            Status = certificate.EffectiveStatus(Clock.Now.Date),
            LotNumber = certificate.LotNumber,
            Quantity = certificate.Quantity,
            QuantityUnit = certificate.QuantityUnit
        };
    }
}
