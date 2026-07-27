using FoodSafe.Application.Contracts.Licensing;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.Licensing;

[RemoteService(false)]
[AllowAnonymous]
public class PublicAdRegistrationAppService :
    ApplicationService,
    IPublicAdRegistrationAppService
{
    private readonly IRepository<AdvertisementRegistration, Guid> _registrations;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PublicAdRegistrationAppService(
        IRepository<AdvertisementRegistration, Guid> registrations,
        IRepository<Business, Guid> businesses,
        ICancellationTokenProvider cancellationTokens)
    {
        _registrations = registrations;
        _businesses = businesses;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PublicAdRegistrationDto> FindByNumberAsync(string number)
    {
        Check.NotNullOrWhiteSpace(number, nameof(number), 100);
        var normalized = number.Trim().ToUpperInvariant();
        var query = await _registrations.GetQueryableAsync();
        var registration = await AsyncExecuter.FirstOrDefaultAsync(
            query.Where(x => x.RegistrationNumber == normalized),
            _cancellationTokens.Token);

        if (registration is null)
            throw new UserFriendlyException(
                "Không tìm thấy đăng ký quảng cáo.");

        var businesses = await _businesses.GetQueryableAsync();
        var businessName = await AsyncExecuter.FirstOrDefaultAsync(
            businesses.Where(x => x.Id == registration.BusinessId)
                .Select(x => x.Name),
            _cancellationTokens.Token);

        return new PublicAdRegistrationDto
        {
            RegistrationNumber = registration.RegistrationNumber,
            RegistrationDate = registration.RegistrationDate,
            ExpiryDate = registration.ExpiryDate,
            ContentDescription = registration.ContentDescription,
            Medium = registration.Medium,
            BusinessName = businessName ?? string.Empty,
            Status = registration.EffectiveStatus(Clock.Now.Date),
        };
    }
}
