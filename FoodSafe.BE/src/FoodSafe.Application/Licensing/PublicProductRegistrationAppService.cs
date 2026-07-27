using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.Licensing;

[RemoteService(false)]
[AllowAnonymous]
public class PublicProductRegistrationAppService :
    ApplicationService,
    IPublicProductRegistrationAppService
{
    private readonly IRepository<ProductRegistration, Guid> _registrations;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PublicProductRegistrationAppService(
        IRepository<ProductRegistration, Guid> registrations,
        IRepository<Business, Guid> businesses,
        ICancellationTokenProvider cancellationTokens)
    {
        _registrations = registrations;
        _businesses = businesses;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PublicProductRegistrationDto> FindByNumberAsync(
        string number)
    {
        Check.NotNullOrWhiteSpace(number, nameof(number), 100);
        var normalized = number.Trim().ToUpperInvariant();
        var query = await _registrations.GetQueryableAsync();
        var registration = await AsyncExecuter.FirstOrDefaultAsync(
            query.Where(x => x.RegistrationNumber == normalized),
            _cancellationTokens.Token);
        if (registration is null)
            throw new UserFriendlyException(
                "Không tìm thấy đăng ký công bố sản phẩm.");
        var businesses = await _businesses.GetQueryableAsync();
        var businessName = await AsyncExecuter.FirstOrDefaultAsync(
            businesses.Where(x => x.Id == registration.BusinessId)
                .Select(x => x.Name),
            _cancellationTokens.Token);
        return new PublicProductRegistrationDto
        {
            RegistrationNumber = registration.RegistrationNumber,
            ReceiptNumber = registration.ReceiptNumber,
            RegistrationDate = registration.RegistrationDate,
            ReceiptDate = registration.ReceiptDate,
            ExpiryDate = registration.ExpiryDate,
            ProductName = registration.ProductName,
            Manufacturer = registration.Manufacturer,
            CertifyingAuthority = registration.CertifyingAuthority,
            BusinessName = businessName ?? string.Empty,
            Status = registration.EffectiveStatus(Clock.Now.Date)
        };
    }
}
