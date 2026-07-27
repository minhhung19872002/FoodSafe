using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
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
    // 90-day default per SEC-04; overridable via Security:PasswordValidityDays so the
    // policy is configuration-driven rather than a hard-coded constant.
    private const int DefaultPasswordValidityDays = 90;

    private readonly TimeSpan _passwordValidity;
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
        ICancellationTokenProvider cancellationTokens,
        IConfiguration configuration)
    {
        _currentUser = currentUser;
        _userManager = userManager;
        _passwordHistory = passwordHistory;
        _profiles = profiles;
        _guidGenerator = guidGenerator;
        _cancellationTokens = cancellationTokens;

        var validityDays = configuration.GetValue(
            "Security:PasswordValidityDays",
            DefaultPasswordValidityDays);
        if (validityDays <= 0)
        {
            validityDays = DefaultPasswordValidityDays;
        }

        _passwordValidity = TimeSpan.FromDays(validityDays);
    }

    public async Task ChangePasswordAsync(ChangeOwnPasswordDto input)
    {
        var userId = _currentUser.GetId();
        var user = await _userManager.GetByIdAsync(userId);
        var profile = await GetProfileAsync(userId);
        await ChangePasswordCoreAsync(
            user,
            profile,
            input.CurrentPassword,
            input.NewPassword);
    }

    [AllowAnonymous]
    public async Task CompleteInitialPasswordChangeAsync(
        CompleteInitialPasswordChangeDto input)
    {
        var identifier = input.UserNameOrEmailAddress.Trim();
        var user = await _userManager.FindByNameAsync(identifier)
                   ?? await _userManager.FindByEmailAsync(identifier);
        if (user is null ||
            !user.IsActive ||
            await _userManager.IsLockedOutAsync(user))
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Account.InvalidCurrentPassword);
        }

        var profile = await GetProfileAsync(user.Id);
        if (!user.ShouldChangePasswordOnNextLogin &&
            profile?.MustChangePassword != true &&
            profile?.IsPasswordExpired(Clock.Now) != true)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Account.InvalidCurrentPassword);
        }

        await ChangePasswordCoreAsync(
            user,
            profile,
            input.CurrentPassword,
            input.NewPassword);
    }

    [AllowAnonymous]
    public async Task ResetPasswordAsync(CompletePasswordResetDto input)
    {
        var user = await _userManager.GetByIdAsync(input.UserId);
        var profile = await GetProfileAsync(user.Id);
        var histories = await GetPasswordHistoryAsync(user.Id);
        EnsurePasswordIsNotReused(user, input.Password, histories);

        var replacedPasswordHash = user.PasswordHash;
        var result = await _userManager.ResetPasswordAsync(
            user,
            input.ResetToken,
            input.Password);
        if (!result.Succeeded)
        {
            throw new BusinessException(
                    FoodSafeDomainErrorCodes.Account.PasswordChangeFailed)
                .WithData(
                    "IdentityErrors",
                    string.Join("; ", result.Errors.Select(x => x.Description)));
        }

        await FinalizePasswordChangeAsync(
            user,
            profile,
            histories,
            replacedPasswordHash);
    }

    private async Task ChangePasswordCoreAsync(
        IdentityUser user,
        AppUserProfile? profile,
        string currentPassword,
        string newPassword)
    {
        if (!await _userManager.CheckPasswordAsync(user, currentPassword))
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Account.InvalidCurrentPassword);
        }

        var histories = await GetPasswordHistoryAsync(user.Id);
        EnsurePasswordIsNotReused(user, newPassword, histories);

        var replacedPasswordHash = user.PasswordHash;
        var result = await _userManager.ChangePasswordAsync(
            user,
            currentPassword,
            newPassword);
        if (!result.Succeeded)
        {
            throw new BusinessException(
                    FoodSafeDomainErrorCodes.Account.PasswordChangeFailed)
                .WithData(
                    "IdentityErrors",
                    string.Join("; ", result.Errors.Select(x => x.Description)));
        }

        await FinalizePasswordChangeAsync(
            user,
            profile,
            histories,
            replacedPasswordHash);
    }

    private async Task FinalizePasswordChangeAsync(
        IdentityUser user,
        AppUserProfile? profile,
        IReadOnlyList<PasswordHistory> histories,
        string? replacedPasswordHash)
    {
        var token = _cancellationTokens.Token;
        user.SetShouldChangePasswordOnNextLogin(false);
        await _userManager.UpdateAsync(user);
        if (histories.Count >= PasswordHistoryPolicy.RetainedPasswordCount)
        {
            await _passwordHistory.DeleteManyAsync(
                histories.Skip(PasswordHistoryPolicy.RetainedPasswordCount - 1),
                autoSave: false,
                cancellationToken: token);
        }

        // The REPLACED hash goes into history — recording the new hash instead
        // would let users flip straight back to their previous password.
        if (!string.IsNullOrEmpty(replacedPasswordHash))
        {
            await _passwordHistory.InsertAsync(
                PasswordHistory.Create(
                    _guidGenerator.Create(),
                    user.Id,
                    replacedPasswordHash,
                    Clock.Now),
                autoSave: false,
                cancellationToken: token);
        }

        profile?.RecordPasswordChanged(Clock.Now, _passwordValidity);
    }

    private async Task<List<PasswordHistory>> GetPasswordHistoryAsync(
        Guid userId)
    {
        var historyQuery = await _passwordHistory.GetQueryableAsync();
        return await AsyncExecuter.ToListAsync(
            historyQuery
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt),
            _cancellationTokens.Token);
    }

    private void EnsurePasswordIsNotReused(
        IdentityUser user,
        string newPassword,
        IEnumerable<PasswordHistory> histories)
    {
        if (PasswordHistoryPolicy.IsReused(
                user,
                newPassword,
                new[] { user.PasswordHash }
                    .Concat(histories.Select(x => x.PasswordHash)),
                _userManager.PasswordHasher))
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Account.PasswordReused);
        }
    }

    private async Task<AppUserProfile?> GetProfileAsync(Guid userId)
    {
        var profileQuery = await _profiles.GetQueryableAsync();
        return await AsyncExecuter.FirstOrDefaultAsync(
            profileQuery.Where(x => x.UserId == userId),
            _cancellationTokens.Token);
    }
}
