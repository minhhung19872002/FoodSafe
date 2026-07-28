using System;
using FoodSafe.Data;
using Shouldly;
using Xunit;

namespace FoodSafe.Security;

// C-5: the built-in development seed password lives in git history, so it must never
// back a real account outside Development. ResolveSeedPassword enforces that gate.
public sealed class SeedPasswordResolutionTests
{
    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    [InlineData("production")]
    [InlineData(null)] // unknown environment defaults to Production posture
    public void Refuses_builtin_password_outside_development(string? environment)
    {
        Should.Throw<InvalidOperationException>(() =>
            E2eTestDataSeedContributor.ResolveSeedPassword(configuredPassword: null, environment));
    }

    [Theory]
    [InlineData("Development")]
    [InlineData("development")]
    public void Allows_builtin_password_in_development(string environment)
    {
        var password = E2eTestDataSeedContributor.ResolveSeedPassword(
            configuredPassword: null, environment);

        password.ShouldNotBeNullOrWhiteSpace();
    }

    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    [InlineData("Development")]
    [InlineData(null)]
    public void Operator_supplied_password_always_wins(string? environment)
    {
        const string configured = "Op3rator-Chosen!Secret";

        var password = E2eTestDataSeedContributor.ResolveSeedPassword(configured, environment);

        password.ShouldBe(configured);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Blank_configured_password_is_ignored_and_still_gated(string configured)
    {
        // A blank Seed:TestPassword must not be treated as "operator supplied"; the
        // Production gate must still fire.
        Should.Throw<InvalidOperationException>(() =>
            E2eTestDataSeedContributor.ResolveSeedPassword(configured, "Production"));
    }
}
