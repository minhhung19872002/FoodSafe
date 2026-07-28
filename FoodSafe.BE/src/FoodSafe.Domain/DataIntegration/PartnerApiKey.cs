using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.DataIntegration;

/// <summary>
/// One API key issued to a <see cref="PartnerAccount"/> (INT-03). The raw key
/// is returned to the operator EXACTLY ONCE at issuance and never stored:
/// only its SHA-256 hash and a lookup prefix are persisted. Rotation = issue a
/// new key + revoke the old one; both operations leave immutable audit trails
/// via the creation/revocation timestamps.
/// </summary>
public class PartnerApiKey : CreationAuditedAggregateRoot<Guid>
{
    /// <summary>Raw keys look like "fsp_&lt;random&gt;"; the prefix (first 12 chars) is the lookup handle.</summary>
    public const int PrefixLength = PartnerApiKeyConsts.PrefixLength;
    public const int HashLength = PartnerApiKeyConsts.HashLength;

    public Guid PartnerAccountId { get; private set; }

    /// <summary>First characters of the raw key, used to locate the row without exposing the secret.</summary>
    public string KeyPrefix { get; private set; } = null!;

    /// <summary>SHA-256 (lowercase hex) of the FULL raw key. The raw key itself is never stored.</summary>
    public string KeyHash { get; private set; } = null!;

    public string? Description { get; private set; }
    public DateTime? ExpiresAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public DateTime? LastUsedAt { get; private set; }

    private PartnerApiKey() { }

    public static PartnerApiKey Create(
        Guid id,
        Guid partnerAccountId,
        string keyPrefix,
        string keyHash,
        DateTime? expiresAt = null,
        string? description = null)
    {
        Check.NotNullOrWhiteSpace(keyPrefix, nameof(keyPrefix), PrefixLength);
        Check.NotNullOrWhiteSpace(keyHash, nameof(keyHash), HashLength);

        return new PartnerApiKey
        {
            Id = id,
            PartnerAccountId = partnerAccountId,
            KeyPrefix = keyPrefix,
            KeyHash = keyHash,
            ExpiresAt = expiresAt,
            Description = description,
        };
    }

    public bool IsRevoked => RevokedAt is not null;

    public bool IsExpired(DateTime now) =>
        ExpiresAt is not null && ExpiresAt.Value <= now;

    /// <summary>Usable = not revoked and not expired. Status of the OWNING partner is checked separately.</summary>
    public bool IsUsable(DateTime now) => !IsRevoked && !IsExpired(now);

    public void Revoke(DateTime now)
    {
        if (RevokedAt is null)
        {
            RevokedAt = now;
        }
    }

    public void MarkUsed(DateTime now) => LastUsedAt = now;
}
