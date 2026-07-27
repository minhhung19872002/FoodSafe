using Microsoft.AspNetCore.Identity;
using Shouldly;
using Xunit;
using IdentityUser = Volo.Abp.Identity.IdentityUser;

namespace FoodSafe.Security;

public class PasswordHistoryPolicyTests
{
    [Fact]
    public void It_should_detect_reuse_across_the_current_and_five_retained_hashes()
    {
        var user = new IdentityUser(
            Guid.NewGuid(),
            "account-policy-test",
            "account-policy-test@foodsafe.local");
        var hasher = new PasswordHasher<IdentityUser>();
        var hashes = new[]
        {
            hasher.HashPassword(user, "Current9!Password"),
            hasher.HashPassword(user, "Previous8!Password"),
            hasher.HashPassword(user, "Previous7!Password")
        };

        PasswordHistoryPolicy.IsReused(
                user,
                "Previous8!Password",
                hashes,
                hasher)
            .ShouldBeTrue();
        PasswordHistoryPolicy.IsReused(
                user,
                "NeverUsed6!Password",
                hashes,
                hasher)
            .ShouldBeFalse();
    }
}
