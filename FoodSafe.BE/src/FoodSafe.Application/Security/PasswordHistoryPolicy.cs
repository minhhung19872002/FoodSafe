using Microsoft.AspNetCore.Identity;
using IdentityUser = Volo.Abp.Identity.IdentityUser;

namespace FoodSafe.Security;

public static class PasswordHistoryPolicy
{
    public const int RetainedPasswordCount = 5;

    public static bool IsReused(
        IdentityUser user,
        string candidatePassword,
        IEnumerable<string?> passwordHashes,
        IPasswordHasher<IdentityUser> passwordHasher)
    {
        return passwordHashes
            .Where(hash => !string.IsNullOrWhiteSpace(hash))
            .Take(RetainedPasswordCount + 1)
            .Any(hash =>
                passwordHasher.VerifyHashedPassword(
                    user,
                    hash!,
                    candidatePassword) != PasswordVerificationResult.Failed);
    }
}
