using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.Licensing;

[RemoteService(false)]
[AllowAnonymous]
public class PublicEligibilityCertificateAppService :
    ApplicationService,
    IPublicEligibilityCertificateAppService
{
    private readonly IRepository<EligibilityCertificate, Guid> _certificates;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PublicEligibilityCertificateAppService(
        IRepository<EligibilityCertificate, Guid> certificates,
        IRepository<Business, Guid> businesses,
        ICancellationTokenProvider cancellationTokens)
    {
        _certificates = certificates;
        _businesses = businesses;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PublicEligibilityCertificateDto> FindByNumberAsync(
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
                "Không tìm thấy giấy chứng nhận đủ điều kiện ATTP.");
        var businesses = await _businesses.GetQueryableAsync();
        var businessName = await AsyncExecuter.FirstOrDefaultAsync(
            businesses.Where(x => x.Id == certificate.BusinessId)
                .Select(x => x.Name),
            _cancellationTokens.Token);
        return new PublicEligibilityCertificateDto
        {
            CertificateNumber = certificate.CertificateNumber,
            IssueDate = certificate.IssueDate,
            ExpiryDate = certificate.ExpiryDate,
            CertifyingAuthority = certificate.CertifyingAuthority,
            CertificationScope = certificate.CertificationScope,
            BusinessName = businessName ?? string.Empty,
            Status = certificate.EffectiveStatus(Clock.Now.Date)
        };
    }
}
