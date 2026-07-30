using Volo.Abp;
using Volo.Abp.Domain.Entities;

namespace FoodSafe.FoodPoisoning;

public sealed class PoisoningCaseVictim : Entity<Guid>
{
    public Guid CaseId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int? Age { get; private set; }
    public VictimGender? Gender { get; private set; }
    public string? Phone { get; private set; }
    public string? Address { get; private set; }

    private PoisoningCaseVictim() { }

    internal PoisoningCaseVictim(
        Guid id,
        Guid caseId,
        string name,
        int? age,
        VictimGender? gender,
        string? phone,
        string? address)
        : base(id)
    {
        CaseId = caseId;
        UpdateInfo(name, age, gender, phone, address);
    }

    internal void UpdateInfo(
        string name,
        int? age,
        VictimGender? gender,
        string? phone,
        string? address)
    {
        Check.NotNullOrWhiteSpace(name, nameof(name), 200);

        Name = name.Trim();
        Age = age;
        Gender = gender;
        Phone = string.IsNullOrWhiteSpace(phone) ? null : phone.Trim();
        Address = string.IsNullOrWhiteSpace(address) ? null : address.Trim();
    }
}
