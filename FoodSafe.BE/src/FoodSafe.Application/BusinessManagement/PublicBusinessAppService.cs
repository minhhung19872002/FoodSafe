using FoodSafe.Application.Contracts.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.BusinessManagement;

[RemoteService(false)]
[AllowAnonymous]
public class PublicBusinessAppService :
    ApplicationService,
    IPublicBusinessAppService
{
    private readonly IRepository<Business, Guid> _businesses;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PublicBusinessAppService(
        IRepository<Business, Guid> businesses,
        ICancellationTokenProvider cancellationTokens)
    {
        _businesses = businesses;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PublicBusinessDto> FindByNameOrCodeAsync(string keyword)
    {
        Check.NotNullOrWhiteSpace(keyword, nameof(keyword), 200);
        var normalized = keyword.Trim().ToUpperInvariant();
        var query = await _businesses.GetQueryableAsync();
        var business = await AsyncExecuter.FirstOrDefaultAsync(
            query.Where(x =>
                (x.Code != null && x.Code == normalized) ||
                x.TaxCode == normalized),
            _cancellationTokens.Token);

        if (business is null)
            throw new UserFriendlyException(
                "Không tìm thấy cơ sở sản xuất kinh doanh.");

        return new PublicBusinessDto
        {
            Name = business.Name,
            Code = business.Code,
            TaxCode = business.TaxCode,
            RepresentativeName = business.RepresentativeName,
            ContactPhone = business.ContactPhone,
            AddressStreet = business.AddressStreet,
            Status = business.Status,
            HasEligibilityCertificate = business.HasEligibilityCertificate,
            HasVsattpCommitment = business.HasVsattpCommitment,
        };
    }
}
