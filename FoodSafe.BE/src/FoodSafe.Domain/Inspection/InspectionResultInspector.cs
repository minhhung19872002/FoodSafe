using Volo.Abp.Domain.Entities;

namespace FoodSafe.Inspection;

public sealed class InspectionResultInspector : Entity
{
    public Guid InspectionResultId { get; private set; }
    public Guid UserId { get; private set; }
    public bool IsTeamLeader { get; private set; }

    private InspectionResultInspector() { }

    internal InspectionResultInspector(
        Guid inspectionResultId,
        Guid userId,
        bool isTeamLeader)
    {
        InspectionResultId = inspectionResultId;
        UserId = userId;
        IsTeamLeader = isTeamLeader;
    }

    public override object[] GetKeys() => [InspectionResultId, UserId];
}
