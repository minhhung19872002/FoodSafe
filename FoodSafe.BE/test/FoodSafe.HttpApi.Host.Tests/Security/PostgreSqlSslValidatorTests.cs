using FoodSafe.Security;
using Shouldly;
using Xunit;

namespace FoodSafe;

public sealed class PostgreSqlSslValidatorTests
{
    // ------------------------------------------------------------------ production rejects insecure modes

    [Theory]
    [InlineData("Disable")]
    [InlineData("disable")]
    [InlineData("DISABLE")]
    public void Production_Should_Reject_Disable_Mode(string sslMode)
    {
        var cs = BuildConnectionString(sslMode);

        var act = () => PostgreSqlSslValidator.Validate(cs, isProduction: true);

        var ex = act.ShouldThrow<InvalidOperationException>();
        ex.Message.ShouldContain("Disable");
        ex.Message.ShouldContain("plaintext");
    }

    [Theory]
    [InlineData("Prefer")]
    [InlineData("prefer")]
    public void Production_Should_Reject_Prefer_Mode(string sslMode)
    {
        var cs = BuildConnectionString(sslMode);

        var act = () => PostgreSqlSslValidator.Validate(cs, isProduction: true);

        var ex = act.ShouldThrow<InvalidOperationException>();
        ex.Message.ShouldContain("Prefer");
    }

    [Theory]
    [InlineData("Allow")]
    [InlineData("allow")]
    public void Production_Should_Reject_Allow_Mode(string sslMode)
    {
        var cs = BuildConnectionString(sslMode);

        var act = () => PostgreSqlSslValidator.Validate(cs, isProduction: true);

        act.ShouldThrow<InvalidOperationException>()
           .Message.ShouldContain("Allow");
    }

    [Fact]
    public void Production_Should_Reject_Connection_String_Without_SslMode()
    {
        const string cs = "Host=postgres;Database=test;Username=app;Password=secret";

        var act = () => PostgreSqlSslValidator.Validate(cs, isProduction: true);

        var ex = act.ShouldThrow<InvalidOperationException>();
        ex.Message.ShouldContain("implicit default");
    }

    // ------------------------------------------------------------------ production accepts secure modes

    [Theory]
    [InlineData("Require")]
    [InlineData("VerifyCA")]
    [InlineData("VerifyFull")]
    [InlineData("require")]
    [InlineData("verifyca")]
    [InlineData("verifyfull")]
    public void Production_Should_Accept_Secure_Mode(string sslMode)
    {
        var cs = BuildConnectionString(sslMode);

        Should.NotThrow(() => PostgreSqlSslValidator.Validate(cs, isProduction: true));
    }

    // ------------------------------------------------------------------ development allows anything

    [Theory]
    [InlineData("Disable")]
    [InlineData("Prefer")]
    [InlineData("Allow")]
    [InlineData("Require")]
    public void Development_Should_Allow_Any_SslMode(string sslMode)
    {
        var cs = BuildConnectionString(sslMode);

        Should.NotThrow(() => PostgreSqlSslValidator.Validate(cs, isProduction: false));
    }

    [Fact]
    public void Development_Should_Allow_Missing_SslMode()
    {
        const string cs = "Host=postgres;Database=test;Username=app;Password=secret";

        Should.NotThrow(() => PostgreSqlSslValidator.Validate(cs, isProduction: false));
    }

    // ------------------------------------------------------------------ edge cases

    [Fact]
    public void Null_Connection_String_Should_Not_Throw_In_Production()
    {
        // ValidateCoreSecrets catches missing connection strings before this validator runs.
        Should.NotThrow(() => PostgreSqlSslValidator.Validate(null, isProduction: true));
    }

    [Fact]
    public void Empty_Connection_String_Should_Not_Throw_In_Production()
    {
        Should.NotThrow(() => PostgreSqlSslValidator.Validate(string.Empty, isProduction: true));
    }

    [Fact]
    public void Error_Message_Should_Name_Required_Secure_Modes()
    {
        var cs = BuildConnectionString("Prefer");

        var ex = Should.Throw<InvalidOperationException>(
            () => PostgreSqlSslValidator.Validate(cs, isProduction: true));

        ex.Message.ShouldContain("Require");
        ex.Message.ShouldContain("VerifyCA");
        ex.Message.ShouldContain("VerifyFull");
    }

    [Fact]
    public void Error_Message_Should_Mention_Server_Side_SSL_Requirement()
    {
        var cs = BuildConnectionString("Prefer");

        var ex = Should.Throw<InvalidOperationException>(
            () => PostgreSqlSslValidator.Validate(cs, isProduction: true));

        // Operators need to know the server must also be configured for SSL.
        ex.Message.ShouldContain("postgresql.conf");
    }

    // ------------------------------------------------------------------ helper

    private static string BuildConnectionString(string sslMode) =>
        $"Host=postgres;Port=5432;Database=FoodSafe;Username=foodsafe;Password=secret;SslMode={sslMode}";
}
