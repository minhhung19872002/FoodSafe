using FoodSafe.Application.Contracts.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.BusinessManagement;

[RemoteService(false)]
[AllowAnonymous]
public class PublicSelfDeclarationAppService :
    ApplicationService,
    IPublicSelfDeclarationAppService
{
    private readonly IRepository<SelfDeclaration, Guid> _declarations;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PublicSelfDeclarationAppService(
        IRepository<SelfDeclaration, Guid> declarations,
        IRepository<Business, Guid> businesses,
        ICancellationTokenProvider cancellationTokens)
    {
        _declarations = declarations;
        _businesses = businesses;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PublicSelfDeclarationDto> FindByNumberAsync(string number)
    {
        Check.NotNullOrWhiteSpace(number, nameof(number), 100);
        var normalized = number.Trim().ToUpperInvariant();
        var query = await _declarations.GetQueryableAsync();
        var declaration = await AsyncExecuter.FirstOrDefaultAsync(
            query.Where(x => x.DeclarationNumber == normalized),
            _cancellationTokens.Token);

        if (declaration is null)
            throw new UserFriendlyException(
                "Không tìm thấy hồ sơ tự công bố sản phẩm.");

        var businesses = await _businesses.GetQueryableAsync();
        var businessName = await AsyncExecuter.FirstOrDefaultAsync(
            businesses.Where(x => x.Id == declaration.BusinessId)
                .Select(x => x.Name),
            _cancellationTokens.Token);

        return new PublicSelfDeclarationDto
        {
            DeclarationNumber = declaration.DeclarationNumber,
            DeclarationDate = declaration.DeclarationDate,
            ProductName = declaration.ProductName,
            ProductStandard = declaration.Purpose,
            BusinessName = businessName ?? string.Empty,
            Status = declaration.EffectiveStatus(Clock.Now.Date),
        };
    }
}
