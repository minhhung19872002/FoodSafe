using System.ComponentModel.DataAnnotations;

namespace FoodSafe.Settings;

public class SystemSettingsDto
{
    public int PasswordRequiredLength { get; set; }
    public int PasswordMaxLength { get; set; }
    public bool PasswordRequireDigit { get; set; }
    public bool PasswordRequireLowercase { get; set; }
    public bool PasswordRequireUppercase { get; set; }
    public bool PasswordRequireNonAlphanumeric { get; set; }

    public int LockoutMaxFailedAttempts { get; set; }
    public int LockoutDurationMinutes { get; set; }

    public string? SmtpHost { get; set; }
    public int? SmtpPort { get; set; }
    public string? SmtpUserName { get; set; }
    public bool SmtpEnableSsl { get; set; }
    public string? SmtpSenderAddress { get; set; }
    public string? SmtpSenderDisplayName { get; set; }
    public bool HasSmtpPassword { get; set; }

    public string? HomepageTitle { get; set; }
    public string? HomepageDescription { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactAddress { get; set; }

    public bool HasLogo { get; set; }
    public bool HasLoginBackground { get; set; }

    public int LicenseExpiryNotificationDays { get; set; }
    public string? MinioEndpoint { get; set; }
    public string? MinioBucketName { get; set; }
}

public class UpdateSystemSettingsDto
{
    [Range(6, 64)]
    public int PasswordRequiredLength { get; set; } = 8;

    [Range(16, 256)]
    public int PasswordMaxLength { get; set; } = 128;

    public bool PasswordRequireDigit { get; set; } = true;
    public bool PasswordRequireLowercase { get; set; } = true;
    public bool PasswordRequireUppercase { get; set; } = true;
    public bool PasswordRequireNonAlphanumeric { get; set; } = true;

    [Range(1, 20)]
    public int LockoutMaxFailedAttempts { get; set; } = 5;

    [Range(1, 1440)]
    public int LockoutDurationMinutes { get; set; } = 30;

    [StringLength(256)]
    public string? SmtpHost { get; set; }

    [Range(1, 65535)]
    public int? SmtpPort { get; set; }

    [StringLength(256)]
    public string? SmtpUserName { get; set; }

    /// <summary>Only updated when a non-empty value is provided.</summary>
    [StringLength(256)]
    public string? SmtpPassword { get; set; }

    public bool SmtpEnableSsl { get; set; }

    private string? _smtpSenderAddress;

    [EmailAddress]
    [StringLength(256)]
    public string? SmtpSenderAddress
    {
        get => _smtpSenderAddress;
        set => _smtpSenderAddress = NullIfEmpty(value);
    }

    [StringLength(256)]
    public string? SmtpSenderDisplayName { get; set; }

    [StringLength(256)]
    public string? HomepageTitle { get; set; }

    [StringLength(2000)]
    public string? HomepageDescription { get; set; }

    [StringLength(50)]
    public string? ContactPhone { get; set; }

    private string? _contactEmail;

    [EmailAddress]
    [StringLength(256)]
    public string? ContactEmail
    {
        get => _contactEmail;
        set => _contactEmail = NullIfEmpty(value);
    }

    [StringLength(500)]
    public string? ContactAddress { get; set; }

    [Range(1, 365)]
    public int LicenseExpiryNotificationDays { get; set; } = 30;

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value;
}

public sealed class BrandingImageDto
{
    public byte[] Content { get; set; } = [];
    public string ContentType { get; set; } = "image/png";
}

public sealed class PublicBrandingDto
{
    public string? HomepageTitle { get; set; }
    public string? HomepageDescription { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactAddress { get; set; }
    public bool HasLogo { get; set; }
    public bool HasLoginBackground { get; set; }
}
