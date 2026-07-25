using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Guids;
using Volo.Abp.Identity;
using Volo.Abp.Threading;
using Volo.Abp.Users;
using IdentityUser = Volo.Abp.Identity.IdentityUser;

namespace FoodSafe.Security;

[Authorize]
public class AccountSecurityAppService :
    ApplicationService,
    IAccountSecurityAppService
{
    private static readonly TimeSpan PasswordValidity = TimeSpan.FromDays(90);

    private readonly ICurrentUser _currentUser;
    private readonly IdentityUserManager _userManager;
    private readonly IRepository<PasswordHistory, Guid> _passwordHistory;
    private readonly IRepository<AppUserProfile, Guid> _profiles;
    private readonly IGuidGenerator _guidGenerator;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public AccountSecurityAppService(
        ICurrentUser currentUser,
        IdentityUserManager userManager,
        IRepository<PasswordHistory, Guid> passwordHistory,
        IRepository<AppUserProfile, Guid> profiles,
        IGuidGenerator guidGenerator,
        ICancellationTokenProvider cancellationTokens)
    {
        _currentUser = currentUser;
        _userManager = userManager;
        _passwordHistory = passwordHistory;
        _profiles = profiles;
        _guidGenerator = guidGenerator;
        _cancellationTokens = cancellationTokens;
    }

    public async Task ChangePasswordAsync(ChangeOwnPasswordDto input)
    {
        var token = _cancellationTokens.Token;
        var userId = _currentUser.GetId();
        var user = await _userManager.GetByIdAsync(userId);

        if (!await _userManager.CheckPasswordAsync(user, input.CurrentPassword))
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Account.InvalidCurrentPassword);
        }

        var historyQuery = await _passwordHistory.GetQueryableAsync();
        var histories = await AsyncExecuter.ToListAsync(
            historyQuery
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt),
            token);

        if (PasswordHistoryPolicy.IsReused(
                user,
                input.NewPassword,
                new[] { user.PasswordHash }
                    .Concat(histories.Select(x => x.PasswordHash)),
                _userManager.PasswordHasher))
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Account.PasswordReused);
        }

        var result = await _userManager.ChangePasswordAsync(
            user,
            input.CurrentPassword,
            input.NewPassword);
        if (!result.Succeeded)
        {
            throw new BusinessException(
                    FoodSafeDomainErrorCodes.Account.PasswordChangeFailed)
                .WithData(
                    "IdentityErrors",
                    string.Join("; ", result.Errors.Select(x => x.Description)));
        }

        user.SetShouldChangePasswordOnNextLogin(false);
        await _userManager.UpdateAsync(user);

        if (histories.Count >= PasswordHistoryPolicy.RetainedPasswordCount)
        {
            await _passwordHistory.DeleteManyAsync(
                histories.Skip(PasswordHistoryPolicy.RetainedPasswordCount - 1),
                autoSave: false,
                cancellationToken: token);
        }

        await _passwordHistory.InsertAsync(
            PasswordHistory.Create(
                _guidGenerator.Create(),
                userId,
                user.PasswordHash
                    ?? throw new InvalidOperationException(
                        "The changed password did not produce a password hash."),
                Clock.Now),
            autoSave: false,
            cancellationToken: token);

        var profileQuery = await _profiles.GetQueryableAsync();
        var profile = await AsyncExecuter.FirstOrDefaultAsync(
            profileQuery.Where(x => x.UserId == userId),
            token);
        profile?.RecordPasswordChanged(Clock.Now, PasswordValidity);
    }
}
