using FoodSafe.Security;
using Shouldly;
using Xunit;

namespace FoodSafe.Domain.Tests.Security;

public class AccountSecurityTests
{
    [Fact]
    public void Password_change_should_clear_first_login_and_set_ninety_day_expiry()
    {
        var createdAt = new DateTime(2026, 7, 25, 8, 0, 0, DateTimeKind.Utc);
        var changedAt = createdAt.AddHours(1);
        var profile = AppUserProfile.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Test User",
            createdAt);

        profile.MustChangePassword.ShouldBeTrue();

        profile.RecordPasswordChanged(changedAt, TimeSpan.FromDays(90));

        profile.MustChangePassword.ShouldBeFalse();
        profile.PasswordExpiresAt.ShouldBe(changedAt.AddDays(90));
        profile.IsPasswordExpired(changedAt.AddDays(90).AddTicks(-1)).ShouldBeFalse();
        profile.IsPasswordExpired(changedAt.AddDays(90)).ShouldBeTrue();
    }

    [Fact]
    public void Password_history_should_reject_an_empty_hash()
    {
        Should.Throw<ArgumentException>(() =>
            PasswordHistory.Create(
                Guid.NewGuid(),
                Guid.NewGuid(),
                " ",
                DateTime.UtcNow));
    }

    [Fact]
    public void Password_validity_period_must_be_positive()
    {
        var profile = AppUserProfile.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Test User",
            DateTime.UtcNow);

        Should.Throw<ArgumentOutOfRangeException>(() =>
            profile.RecordPasswordChanged(DateTime.UtcNow, TimeSpan.Zero));
    }
}
