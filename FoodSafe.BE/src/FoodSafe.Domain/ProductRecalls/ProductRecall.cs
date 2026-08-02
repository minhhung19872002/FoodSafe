using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.ProductRecalls;

/// <summary>
/// Recall of a food product that fails to meet safety requirements,
/// per Circular 23/2018/TT-BYT (voluntary/mandatory recall and
/// post-recall handling).
/// </summary>
public sealed class ProductRecall : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public Guid BusinessId { get; private set; }
    public Guid? ProductId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;

    /// <summary>Batch number / expiry information of the recalled lot.</summary>
    public string? BatchInfo { get; private set; }

    public RecallType RecallType { get; private set; }
    public string Reason { get; private set; } = string.Empty;

    /// <summary>Recall decision number — required for mandatory recalls.</summary>
    public string? DecisionNumber { get; private set; }

    public DateTime? DecisionDate { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime? CompletedDate { get; private set; }
    public decimal? QuantityRecalled { get; private set; }
    public string? QuantityUnit { get; private set; }

    /// <summary>Required when the recall is completed.</summary>
    public PostRecallAction? PostRecallAction { get; private set; }

    public string? ActionDescription { get; private set; }
    public ProductRecallStatus Status { get; private set; }
    public string? CancelReason { get; private set; }

    private ProductRecall()
    {
    }

    private ProductRecall(Guid id) : base(id)
    {
    }

    public static ProductRecall Create(
        Guid id,
        Guid businessId,
        Guid organizationId,
        Guid? productId,
        string productName,
        string? batchInfo,
        RecallType recallType,
        string reason,
        string? decisionNumber,
        DateTime? decisionDate,
        DateTime startDate,
        decimal? quantityRecalled,
        string? quantityUnit)
    {
        var recall = new ProductRecall(id)
        {
            BusinessId = businessId,
            OrganizationId = organizationId,
            Status = ProductRecallStatus.Draft
        };
        recall.Update(
            productId,
            productName,
            batchInfo,
            recallType,
            reason,
            decisionNumber,
            decisionDate,
            startDate,
            quantityRecalled,
            quantityUnit);
        return recall;
    }

    public void Update(
        Guid? productId,
        string productName,
        string? batchInfo,
        RecallType recallType,
        string reason,
        string? decisionNumber,
        DateTime? decisionDate,
        DateTime startDate,
        decimal? quantityRecalled,
        string? quantityUnit)
    {
        if (Status is ProductRecallStatus.Completed
            or ProductRecallStatus.Cancelled)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.CannotModifyFinalized);
        Check.NotNullOrWhiteSpace(productName, nameof(productName), 500);
        Check.NotNullOrWhiteSpace(reason, nameof(reason), 2000);
        if (!Enum.IsDefined(recallType))
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.InvalidStatusTransition);
        if (recallType == RecallType.Mandatory &&
            string.IsNullOrWhiteSpace(decisionNumber))
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.DecisionNumberRequired);
        if (quantityRecalled is < 0)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.InvalidQuantity);

        ProductId = productId;
        ProductName = productName.Trim();
        BatchInfo = Normalize(batchInfo);
        RecallType = recallType;
        Reason = reason.Trim();
        DecisionNumber = Normalize(decisionNumber);
        DecisionDate = decisionDate?.Date;
        StartDate = startDate.Date;
        QuantityRecalled = quantityRecalled;
        QuantityUnit = Normalize(quantityUnit);
    }

    /// <summary>Moves a draft recall into execution.</summary>
    public void Start()
    {
        if (Status != ProductRecallStatus.Draft)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.InvalidStatusTransition);
        Status = ProductRecallStatus.InProgress;
    }

    /// <summary>
    /// Completes an in-progress recall. The post-recall handling method is
    /// mandatory per Circular 23/2018/TT-BYT.
    /// </summary>
    public void Complete(
        PostRecallAction postRecallAction,
        DateTime completedDate,
        string? actionDescription)
    {
        if (Status != ProductRecallStatus.InProgress)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.InvalidStatusTransition);
        if (!Enum.IsDefined(postRecallAction))
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.PostRecallActionRequired);
        if (completedDate.Date < StartDate)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.InvalidDateRange);

        PostRecallAction = postRecallAction;
        CompletedDate = completedDate.Date;
        ActionDescription = Normalize(actionDescription);
        Status = ProductRecallStatus.Completed;
    }

    /// <summary>Cancels a draft or in-progress recall with a stated reason.</summary>
    public void Cancel(string reason)
    {
        if (Status is ProductRecallStatus.Completed
            or ProductRecallStatus.Cancelled)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.InvalidStatusTransition);
        if (string.IsNullOrWhiteSpace(reason))
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.CancelReasonRequired);
        Check.Length(reason, nameof(reason), 2000);

        CancelReason = reason.Trim();
        Status = ProductRecallStatus.Cancelled;
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
