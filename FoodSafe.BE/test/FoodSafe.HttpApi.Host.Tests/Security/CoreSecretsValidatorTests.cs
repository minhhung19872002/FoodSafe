using FoodSafe.Security;
using Shouldly;
using Xunit;

namespace FoodSafe;

/// <summary>
/// Regression tests for blocker B-3: the core-secret guard must reject values that
/// were committed to source history when running in Production, and must never
/// authenticate on the leaked postgres/postgres default credential.
/// </summary>
public sealed class CoreSecretsValidatorTests
{
    private const string GoodCs =
        "Host=postgres;Port=5432;Database=FoodSafe;Username=foodsafe_app;Password=Rotated#Prod-9x!;SslMode=Require";
    private const string GoodPassPhrase = "a-unique-rotated-production-passphrase-32ch";

    // ---------------------------------------------------------------- missing secrets (all environments)

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Missing_Connection_String_Should_Throw(string? connectionString)
    {
        var act = () => CoreSecretsValidator.Validate(connectionString, GoodPassPhrase, isProduction: true);

        act.ShouldThrow<InvalidOperationException>()
           .Message.ShouldContain("ConnectionStrings:Default");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Missing_PassPhrase_Should_Throw(string? passPhrase)
    {
        var act = () => CoreSecretsValidator.Validate(GoodCs, passPhrase, isProduction: true);

        act.ShouldThrow<InvalidOperationException>()
           .Message.ShouldContain("DefaultPassPhrase");
    }

    // ---------------------------------------------------------------- leaked placeholder passphrase

    [Fact]
    public void Leaked_Default_PassPhrase_Should_Be_Rejected_In_Production()
    {
        var act = () => CoreSecretsValidator.Validate(
            GoodCs, CoreSecretsValidator.LeakedPassPhrase, isProduction: true);

        act.ShouldThrow<InvalidOperationException>()
           .Message.ShouldContain("known default");
    }

    [Fact]
    public void Leaked_Default_PassPhrase_Should_Be_Rejected_Even_In_Development()
    {
        // A leaked encryption passphrase is unsafe in any environment.
        var act = () => CoreSecretsValidator.Validate(
            GoodCs, CoreSecretsValidator.LeakedPassPhrase, isProduction: false);

        act.ShouldThrow<InvalidOperationException>();
    }

    // ---------------------------------------------------------------- leaked postgres/postgres credential

    [Theory]
    [InlineData("Host=db;Database=FoodSafe;Username=postgres;Password=postgres;SslMode=Require")]
    [InlineData("Host=db;Database=FoodSafe;Username=postgres;Password=postgres")]
    [InlineData("Host=db;Database=FoodSafe;User Id=postgres;Password=postgres;SslMode=Require")]
    public void Leaked_Default_Db_Credential_Should_Be_Rejected_In_Production(string connectionString)
    {
        var act = () => CoreSecretsValidator.Validate(connectionString, GoodPassPhrase, isProduction: true);

        var ex = act.ShouldThrow<InvalidOperationException>();
        ex.Message.ShouldContain("postgres/postgres");
        ex.Message.ShouldContain("rotated");
    }

    [Fact]
    public void Leaked_Default_Db_Credential_Should_Be_Allowed_In_Development()
    {
        // The dev stack legitimately uses postgres/postgres; only Production forbids it.
        const string cs = "Host=localhost;Database=FoodSafe;Username=postgres;Password=postgres";

        Should.NotThrow(() => CoreSecretsValidator.Validate(cs, GoodPassPhrase, isProduction: false));
    }

    [Fact]
    public void Non_Default_Db_User_With_Postgres_Password_Should_Be_Allowed()
    {
        // Only the exact postgres/postgres pair is the leaked credential.
        const string cs = "Host=db;Database=FoodSafe;Username=foodsafe_app;Password=postgres;SslMode=Require";

        Should.NotThrow(() => CoreSecretsValidator.Validate(cs, GoodPassPhrase, isProduction: true));
    }

    // ---------------------------------------------------------------- happy path

    [Fact]
    public void Rotated_Production_Secrets_Should_Pass()
    {
        Should.NotThrow(() => CoreSecretsValidator.Validate(GoodCs, GoodPassPhrase, isProduction: true));
    }
}
