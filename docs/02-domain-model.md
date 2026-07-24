# Domain Model — FoodSafe

> Thiết kế theo DDD: Aggregate Root, Value Object, Domain Events  
> 9 Bounded Contexts, mỗi context là 1 folder trong `FoodSafe.Domain/`

---

## Sơ đồ Bounded Contexts

```
┌─────────────────────────────────────────────────────────────────┐
│                         FoodSafe System                          │
│                                                                   │
│  ┌───────────────┐   ┌──────────────┐   ┌───────────────────┐   │
│  │  Organizations │   │   Catalogs   │   │  BusinessManagement│  │
│  │  (Admin)      │   │              │   │                   │   │
│  └───────┬───────┘   └──────┬───────┘   └────────┬──────────┘   │
│          │                  │                     │               │
│          └──────────────────┼─────────────────────┘               │
│                             │                                      │
│  ┌──────────┐   ┌──────────┴──────┐   ┌────────────────────┐    │
│  │ Licensing│   │   Inspection    │   │  FoodPoisoning     │    │
│  └──────────┘   └─────────────────┘   └────────────────────┘    │
│                                                                   │
│  ┌──────────┐   ┌─────────────────┐   ┌────────────────────┐    │
│  │Reporting │   │AlertsAndTesting │   │  DataIntegration   │    │
│  └──────────┘   └─────────────────┘   └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Bounded Context: Organizations

### Aggregate Root: Organization

```csharp
public class Organization : FullAuditedAggregateRoot<Guid>
{
    public Guid? ParentId { get; private set; }
    public Organization? Parent { get; private set; }
    public ICollection<Organization> Children { get; private set; }

    public string Code { get; private set; }           // Mã đơn vị
    public string Name { get; private set; }           // Tên đơn vị
    public OrganizationLevel Level { get; private set; } // Province/District/Commune
    public string? Address { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public bool IsActive { get; private set; }

    // Nullable FK đến địa danh catalog
    public Guid? ProvinceId { get; private set; }
    public Guid? DistrictId { get; private set; }

    // Factory
    public static Organization CreateProvince(Guid id, string code, string name);
    public static Organization CreateDistrict(Guid id, Guid parentId, string code, string name, Guid provinceId);
    public static Organization CreateCommune(Guid id, Guid parentId, string code, string name, Guid districtId);

    // Methods
    public void Update(string name, string? address, string? phone, string? email);
    public void Activate();
    public void Deactivate();
}

public enum OrganizationLevel { Province = 1, District = 2, Commune = 3 }
```

### Value Object: AppUserProfile (extended IdentityUser data)

```csharp
// Entity gắn với ABP IdentityUser (1-1)
public class AppUserProfile : Entity<Guid>
{
    public Guid UserId { get; private set; }           // = IdentityUser.Id
    public Guid OrganizationId { get; private set; }
    public string FullName { get; private set; }
    public string? Position { get; private set; }
    public string? Department { get; private set; }
    public DateTime? PasswordExpiresAt { get; private set; }
    public bool MustChangePassword { get; private set; }
    public DateTime? LastLoginAt { get; private set; }
}
```

---

## 2. Bounded Context: Catalogs

*Các catalog là simple CRUD entities, không có complex domain logic.*

### Entities (all inherit FullAuditedAggregateRoot<Guid>):

```
Country          — code (ISO), name, isActive
Region           — code, name, isActive
Province         — regionId, code, name, isActive
District         — provinceId, code, name, type (District/Ward/City/Town), isActive
Commune          — districtId, code, name, type (Commune/Ward/Town), isActive

ProductGroup     — code, name, parentId (self-ref), level, description, isActive, sortOrder
BusinessType     — code, name, description, isActive, sortOrder
BusinessClassification — code, name, criteria, isActive, sortOrder
AdvertisementType — code, name, description, isActive
DocumentType     — code, name, isActive

TestingCenter    — code, name, address(VO), phone, email, accreditationNumber, isActive
TestingService   — testingCenterId, code, name, unit, method, unitPrice, isActive
```

### Value Object: Address (dùng chung)

```csharp
public class Address : ValueObject
{
    public string Street { get; }
    public Guid? CommuneId { get; }
    public Guid? DistrictId { get; }
    public Guid? ProvinceId { get; }
    public double? Latitude { get; }
    public double? Longitude { get; }

    protected override IEnumerable<object> GetAtomicValues()
        => [Street, CommuneId, DistrictId, ProvinceId, Latitude, Longitude];
}
```

### Value Object: ContactInfo

```csharp
public class ContactInfo : ValueObject
{
    public string? Phone { get; }
    public string? Email { get; }
    public string? Website { get; }
    protected override IEnumerable<object> GetAtomicValues() => [Phone, Email, Website];
}
```

---

## 3. Bounded Context: BusinessManagement

### Aggregate Root: Business

```csharp
public class Business : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }   // Đơn vị quản lý
    public string Code { get; private set; }
    public string Name { get; private set; }
    public Guid? BusinessTypeId { get; private set; }
    public Guid? BusinessClassificationId { get; private set; }
    public string? TaxCode { get; private set; }
    public string? RepresentativeName { get; private set; }  // Chủ cơ sở
    public string? RepresentativeIdCard { get; private set; }
    public ContactInfo Contact { get; private set; }   // VO
    public Address Address { get; private set; }       // VO (có tọa độ GPS)
    public BusinessStatus Status { get; private set; }
    public bool HasEligibilityCertificate { get; private set; }  // Có DDK
    public bool HasVsattpCommitment { get; private set; }         // Có cam kết
    public DateOnly? EstablishedDate { get; private set; }
    public int? EmployeeCount { get; private set; }

    // Collections
    public ICollection<BusinessProductGroup> ProductGroups { get; private set; }
    public ICollection<BusinessHandler> Handlers { get; private set; }

    // Factory
    public static Business Create(Guid id, Guid organizationId, string code,
        string name, Guid businessTypeId, Address address);

    // Methods
    public void Update(...);
    public void AddProductGroup(Guid productGroupId);
    public void RemoveProductGroup(Guid productGroupId);
    public void AddHandler(BusinessHandler handler);
    public void RemoveHandler(Guid handlerId);
    public void Activate();
    public void Deactivate();
    public void Suspend(string reason);
    public void UpdateEligibilityStatus(bool hasEligibility);
}

public enum BusinessStatus { Active = 1, Inactive = 2, Suspended = 3 }

// Entity trong Business Aggregate
public class BusinessProductGroup : Entity
{
    public Guid BusinessId { get; }
    public Guid ProductGroupId { get; }
}

public class BusinessHandler : Entity<Guid>
{
    public Guid BusinessId { get; }
    public string FullName { get; private set; }
    public string? Position { get; private set; }
    public string? IdCardNumber { get; private set; }
    public TrainingCertificate? Training { get; private set; }   // VO
    public HealthCertificate? Health { get; private set; }       // VO
    public bool IsActive { get; private set; }
}
```

### Value Object: TrainingCertificate

```csharp
public class TrainingCertificate : ValueObject
{
    public string? CertificateNumber { get; }
    public DateOnly? TrainingDate { get; }
    public string? Organization { get; }
    public DateOnly? ExpiryDate { get; }
    protected override IEnumerable<object> GetAtomicValues()
        => [CertificateNumber, TrainingDate, Organization, ExpiryDate];
}
```

### Aggregate Root: Product

```csharp
public class Product : FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string? Code { get; private set; }
    public string Name { get; private set; }
    public Guid? ProductGroupId { get; private set; }
    public string? BrandName { get; private set; }
    public string? Manufacturer { get; private set; }
    public Guid? ManufacturingCountryId { get; private set; }
    public string? NetWeight { get; private set; }
    public string? Ingredients { get; private set; }
    public int? ExpiryPeriodMonths { get; private set; }
    public string? StorageConditions { get; private set; }
    public ProductStatus Status { get; private set; }

    public static Product Create(Guid id, Guid businessId, Guid organizationId,
        string name, Guid? productGroupId);
    public void Update(...);
    public void Activate();
    public void Deactivate();
}

public enum ProductStatus { Active = 1, Inactive = 2 }
```

### Aggregate Root: SelfDeclaration

```csharp
public class SelfDeclaration : FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid? ProductId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string DeclarationNumber { get; private set; }
    public DateOnly DeclarationDate { get; private set; }
    public string ProductName { get; private set; }
    public string? Manufacturer { get; private set; }
    public string? Purpose { get; private set; }  // Mục đích sử dụng
    public DateOnly? ExpiryDate { get; private set; }
    public LicenseStatus Status { get; private set; }

    public static SelfDeclaration Create(...);
    public void Revoke(string reason);
}
```

---

## 4. Bounded Context: Licensing

*5 loại giấy phép, cùng pattern nhưng khác nhau ở một số thuộc tính.*

### Aggregate Root: ProductRegistration (DKCB)

```csharp
public class ProductRegistration : FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid? ProductId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string RegistrationNumber { get; private set; }
    public string? ReceiptNumber { get; private set; }
    public DateOnly RegistrationDate { get; private set; }
    public DateOnly? ReceiptDate { get; private set; }
    public DateOnly? ExpiryDate { get; private set; }
    public string ProductName { get; private set; }
    public string? Manufacturer { get; private set; }
    public string? CertifyingAuthority { get; private set; }
    public LicenseStatus Status { get; private set; }

    public static ProductRegistration Create(...);
    public void Revoke(string reason);

    // Domain Events
    public void CheckExpiry(DateTime now)
    {
        if (ExpiryDate.HasValue && ExpiryDate.Value.ToDateTime(TimeOnly.MinValue) <= now)
            AddDomainEvent(new ProductRegistrationExpiredEvent(Id, BusinessId));
    }
}
```

### Aggregate Root: AdvertisementRegistration (DDK Quảng cáo)

```csharp
public class AdvertisementRegistration : FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid AdvertisementTypeId { get; private set; }
    public string RegistrationNumber { get; private set; }
    public DateOnly RegistrationDate { get; private set; }
    public DateOnly? ExpiryDate { get; private set; }
    public string? ContentDescription { get; private set; }
    public string? Medium { get; private set; }
    public LicenseStatus Status { get; private set; }

    public ICollection<AdRegistrationProduct> Products { get; private set; }

    public static AdvertisementRegistration Create(...);
    public void AddProduct(Guid productId);
    public void Revoke(string reason);
}
```

### Aggregate Root: EligibilityCertificate (DDK cơ sở)

```csharp
public class EligibilityCertificate : FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string CertificateNumber { get; private set; }
    public DateOnly IssueDate { get; private set; }
    public DateOnly? ExpiryDate { get; private set; }
    public string? CertifyingAuthority { get; private set; }
    public string? CertificationScope { get; private set; }  // Phạm vi chứng nhận
    public LicenseStatus Status { get; private set; }

    public static EligibilityCertificate Create(...);
    public void Revoke(string reason);
}
```

### Aggregate Root: CfsCertificate

```csharp
public class CfsCertificate : FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid? ProductId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string CertificateNumber { get; private set; }
    public DateOnly IssueDate { get; private set; }
    public DateOnly? ExpiryDate { get; private set; }
    public Guid? DestinationCountryId { get; private set; }
    public LicenseStatus Status { get; private set; }

    public static CfsCertificate Create(...);
    public void Revoke(string reason);
}
```

### Aggregate Root: ExportFoodCertificate

```csharp
public class ExportFoodCertificate : FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid? ProductId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string CertificateNumber { get; private set; }
    public DateOnly IssueDate { get; private set; }
    public DateOnly? ExpiryDate { get; private set; }
    public Guid? DestinationCountryId { get; private set; }
    public string? LotNumber { get; private set; }
    public decimal? Quantity { get; private set; }
    public string? QuantityUnit { get; private set; }
    public LicenseStatus Status { get; private set; }

    public static ExportFoodCertificate Create(...);
    public void Revoke(string reason);
}

public enum LicenseStatus { Active = 1, Expired = 2, Revoked = 3 }
```

---

## 5. Bounded Context: Inspection

### Aggregate Root: InspectionPlan

```csharp
public class InspectionPlan : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string PlanCode { get; private set; }
    public string Title { get; private set; }
    public InspectionPlanType PlanType { get; private set; }
    public int Year { get; private set; }
    public DateOnly? StartDate { get; private set; }
    public DateOnly? EndDate { get; private set; }
    public string? Description { get; private set; }
    public string? Objectives { get; private set; }
    public InspectionPlanStatus Status { get; private set; }
    public Guid? ApprovedById { get; private set; }
    public DateTime? ApprovedAt { get; private set; }

    public ICollection<InspectionPlanItem> Items { get; private set; }

    public static InspectionPlan Create(Guid id, Guid organizationId, string code, string title,
        InspectionPlanType type, int year);

    public void AddBusiness(Guid businessId, DateOnly? plannedDate, Guid? assignedInspectorId)
    {
        if (Status != InspectionPlanStatus.Draft)
            throw new BusinessException(FoodSafeErrorCodes.Inspection.CannotModifyNonDraftPlan);
        if (Items.Any(i => i.BusinessId == businessId))
            throw new BusinessException(FoodSafeErrorCodes.Inspection.DuplicateBusinessInPlan);
        Items.Add(new InspectionPlanItem(GuidGenerator.Create(), Id, businessId, plannedDate, assignedInspectorId));
    }

    public void RemoveBusiness(Guid businessId)
    {
        if (Status != InspectionPlanStatus.Draft)
            throw new BusinessException(FoodSafeErrorCodes.Inspection.CannotModifyNonDraftPlan);
        var item = Items.FirstOrDefault(i => i.BusinessId == businessId)
            ?? throw new BusinessException(FoodSafeErrorCodes.Inspection.BusinessNotInPlan);
        Items.Remove(item);
    }

    public void Submit()
    {
        if (Status != InspectionPlanStatus.Draft)
            throw new BusinessException(FoodSafeErrorCodes.Inspection.InvalidPlanStatusTransition);
        if (!Items.Any())
            throw new BusinessException(FoodSafeErrorCodes.Inspection.EmptyPlan);
        Status = InspectionPlanStatus.Submitted;
    }

    public void Approve(Guid approverId)
    {
        if (Status != InspectionPlanStatus.Submitted)
            throw new BusinessException(FoodSafeErrorCodes.Inspection.InvalidPlanStatusTransition);
        Status = InspectionPlanStatus.Approved;
        ApprovedById = approverId;
        ApprovedAt = DateTime.UtcNow;
        AddDomainEvent(new InspectionPlanApprovedEvent(Id, OrganizationId));
    }

    public void Complete()
    {
        if (Status != InspectionPlanStatus.Approved && Status != InspectionPlanStatus.InProgress)
            throw new BusinessException(FoodSafeErrorCodes.Inspection.InvalidPlanStatusTransition);
        Status = InspectionPlanStatus.Completed;
    }

    public void Cancel(string reason)
    {
        if (Status == InspectionPlanStatus.Completed)
            throw new BusinessException(FoodSafeErrorCodes.Inspection.CannotCancelCompletedPlan);
        Status = InspectionPlanStatus.Cancelled;
    }
}

public enum InspectionPlanType { Annual = 1, Periodic = 2, Irregular = 3, FollowUp = 4 }
public enum InspectionPlanStatus { Draft = 1, Submitted = 2, Approved = 3, InProgress = 4, Completed = 5, Cancelled = 6 }

public class InspectionPlanItem : Entity<Guid>
{
    public Guid PlanId { get; }
    public Guid BusinessId { get; }
    public int SequenceNumber { get; private set; }
    public DateOnly? PlannedDate { get; private set; }
    public Guid? AssignedInspectorId { get; private set; }
    public InspectionPlanItemStatus Status { get; private set; }

    public void MarkInProgress() => Status = InspectionPlanItemStatus.InProgress;
    public void MarkCompleted() => Status = InspectionPlanItemStatus.Completed;
}

public enum InspectionPlanItemStatus { Pending = 1, InProgress = 2, Completed = 3, Skipped = 4 }
```

### Aggregate Root: InspectionResult

```csharp
public class InspectionResult : FullAuditedAggregateRoot<Guid>
{
    public Guid? PlanId { get; private set; }
    public Guid? PlanItemId { get; private set; }
    public Guid BusinessId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public DateOnly InspectionDate { get; private set; }
    public InspectionType InspectionType { get; private set; }
    public string? TeamLeader { get; private set; }
    public string? TeamMembersText { get; private set; }
    public InspectionOverallResult OverallResult { get; private set; }
    public bool HasViolation { get; private set; }
    public string? ViolationDescription { get; private set; }
    public Money? FineAmount { get; private set; }     // VO
    public string? AdministrativeDecisionNumber { get; private set; }
    public DateOnly? AdministrativeDecisionDate { get; private set; }
    public bool FollowUpRequired { get; private set; }
    public DateOnly? FollowUpDate { get; private set; }
    public string? Recommendations { get; private set; }

    public ICollection<InspectionViolation> Violations { get; private set; }

    public static InspectionResult Create(...);

    public void AddViolation(string code, string description, string? regulationRef, decimal? fine, string? remedy, DateOnly? deadline)
    {
        Violations.Add(new InspectionViolation(...));
        HasViolation = true;
        RecalculateFine();
    }

    public void RemoveViolation(Guid violationId)
    {
        var v = Violations.FirstOrDefault(x => x.Id == violationId)
            ?? throw new EntityNotFoundException(typeof(InspectionViolation), violationId);
        Violations.Remove(v);
        HasViolation = Violations.Any();
        RecalculateFine();
    }

    public void MarkViolationRemedied(Guid violationId)
    {
        var v = Violations.First(x => x.Id == violationId);
        v.MarkRemedied();
    }

    private void RecalculateFine()
    {
        var total = Violations.Where(v => v.FineAmount.HasValue).Sum(v => v.FineAmount!.Value.Amount);
        FineAmount = total > 0 ? new Money(total) : null;
    }
}

public enum InspectionType { Scheduled = 1, Unscheduled = 2, FollowUp = 3, Emergency = 4 }
public enum InspectionOverallResult { Pass = 1, Fail = 2, ConditionalPass = 3 }

public class InspectionViolation : Entity<Guid>
{
    public Guid InspectionResultId { get; }
    public string? ViolationCode { get; }
    public string Description { get; }
    public string? RegulationReference { get; }
    public Money? FineAmount { get; }
    public string? RemedyRequired { get; }
    public DateOnly? RemedyDeadline { get; }
    public bool IsRemedied { get; private set; }
    public void MarkRemedied() => IsRemedied = true;
}
```

### Value Object: Money (VND)

```csharp
public class Money : ValueObject
{
    public decimal Amount { get; }
    public string Currency { get; } = "VND";

    public Money(decimal amount)
    {
        if (amount < 0) throw new ArgumentException("Amount cannot be negative");
        Amount = amount;
    }

    protected override IEnumerable<object> GetAtomicValues() => [Amount, Currency];
}
```

---

## 6. Bounded Context: FoodPoisoning

### Aggregate Root: FoodPoisoningCase

```csharp
public class FoodPoisoningCase : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string CaseCode { get; private set; }
    public DateOnly ReportDate { get; private set; }
    public DateTime? OccurrenceDate { get; private set; }
    public Address Location { get; private set; }          // VO
    public VictimInfo Victim { get; private set; }         // VO
    public FoodInfo Food { get; private set; }             // VO
    public MedicalInfo Medical { get; private set; }       // VO
    public ReporterInfo Reporter { get; private set; }     // VO
    public PoisoningCaseStatus Status { get; private set; }
    public Guid? VerifiedById { get; private set; }
    public DateTime? VerifiedAt { get; private set; }

    public ICollection<PoisoningCaseErrorReport> ErrorReports { get; private set; }

    public static FoodPoisoningCase Create(...);

    public void Submit()
    {
        if (Status != PoisoningCaseStatus.Draft)
            throw new BusinessException(FoodSafeErrorCodes.Poisoning.InvalidStatusTransition);
        Status = PoisoningCaseStatus.Reported;
        AddDomainEvent(new PoisoningCaseReportedEvent(Id, OrganizationId));
    }

    public void Verify(Guid verifierId)
    {
        if (Status != PoisoningCaseStatus.Reported)
            throw new BusinessException(FoodSafeErrorCodes.Poisoning.InvalidStatusTransition);
        Status = PoisoningCaseStatus.Verified;
        VerifiedById = verifierId;
        VerifiedAt = DateTime.UtcNow;
    }

    public void AddErrorReport(Guid fromOrgId, string errorDescription, string correctionRequest)
    {
        if (Status != PoisoningCaseStatus.Verified)
            throw new BusinessException(FoodSafeErrorCodes.Poisoning.CanOnlyReportErrorOnVerified);
        ErrorReports.Add(new PoisoningCaseErrorReport(Id, fromOrgId, errorDescription, correctionRequest));
    }
}

public enum PoisoningCaseStatus { Draft = 1, Reported = 2, Verified = 3 }
```

### Value Object: VictimInfo

```csharp
public class VictimInfo : ValueObject
{
    public string? Name { get; }
    public int? Age { get; }
    public Gender? Gender { get; }
    public string? Phone { get; }
    public string? Address { get; }
    protected override IEnumerable<object> GetAtomicValues() => [Name, Age, Gender, Phone, Address];
}
```

### Value Object: FoodInfo

```csharp
public class FoodInfo : ValueObject
{
    public string? SuspectedFood { get; }
    public string? FoodSource { get; }
    public DateOnly? PreparationDate { get; }
    public string? Symptoms { get; }
    public DateTime? OnsetTime { get; }
    protected override IEnumerable<object> GetAtomicValues() 
        => [SuspectedFood, FoodSource, PreparationDate, Symptoms, OnsetTime];
}
```

### Aggregate Root: FoodPoisoningIncident

```csharp
public class FoodPoisoningIncident : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string IncidentCode { get; private set; }
    public DateTime? OccurrenceDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public Address Location { get; private set; }
    public IncidentStatistics Statistics { get; private set; }    // VO
    public IncidentFoodInfo FoodInfo { get; private set; }        // VO
    public CauseAssessment CauseAssessment { get; private set; }
    public string? CausativeAgent { get; private set; }
    public string? Pathogen { get; private set; }
    public string? InvestigationTeam { get; private set; }
    public string? ControlMeasures { get; private set; }
    public string? PreventionMeasures { get; private set; }
    public string? Conclusion { get; private set; }
    public PoisoningIncidentStatus Status { get; private set; }
    public Guid? VerifiedById { get; private set; }
    public DateTime? VerifiedAt { get; private set; }
    public Guid? ConcludedById { get; private set; }
    public DateTime? ConcludedAt { get; private set; }

    public static FoodPoisoningIncident Create(...);
    public void Submit();
    public void Verify(Guid verifierId);
    public void Conclude(Guid concluderId, string conclusion);
    public void AddErrorReport(...);
}

public enum PoisoningIncidentStatus { Draft = 1, Reported = 2, Verified = 3, Concluded = 4 }
public enum CauseAssessment { Confirmed = 1, Probable = 2, Suspected = 3, Unknown = 4 }

public class IncidentStatistics : ValueObject
{
    public int ExposedCount { get; }
    public int AffectedCount { get; }
    public int HospitalizedCount { get; }
    public int DeathCount { get; }
    // ...
}
```

---

## 7. Bounded Context: Reporting

*3 loại báo cáo, cùng state machine: Draft → Submitted → Verified → Returned/Completed*

### Abstract Base (Domain Pattern)

```csharp
// Không phải abstract class trong code, nhưng cùng pattern
// Mỗi report type là Aggregate Root riêng biệt

public abstract class BaseReport : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; protected set; }
    public ReportStatus Status { get; protected set; }
    public Guid? SubmittedById { get; protected set; }
    public DateTime? SubmittedAt { get; protected set; }
    public Guid? VerifiedById { get; protected set; }
    public DateTime? VerifiedAt { get; protected set; }
    public Guid? ReturnedById { get; protected set; }
    public DateTime? ReturnedAt { get; protected set; }
    public string? ReturnReason { get; protected set; }
    public Guid? CompletedById { get; protected set; }
    public DateTime? CompletedAt { get; protected set; }

    public void Submit(Guid submitterId)
    {
        if (Status != ReportStatus.Draft)
            throw new BusinessException(FoodSafeErrorCodes.Report.InvalidStatusTransition);
        Status = ReportStatus.Submitted;
        SubmittedById = submitterId;
        SubmittedAt = DateTime.UtcNow;
        AddDomainEvent(new ReportSubmittedEvent(Id, OrganizationId, GetReportType()));
    }

    public void Verify(Guid verifierId)
    {
        if (Status != ReportStatus.Submitted)
            throw new BusinessException(FoodSafeErrorCodes.Report.InvalidStatusTransition);
        Status = ReportStatus.Verified;
        VerifiedById = verifierId;
        VerifiedAt = DateTime.UtcNow;
    }

    public void Return(Guid returnerId, string reason)
    {
        if (Status != ReportStatus.Submitted && Status != ReportStatus.Verified)
            throw new BusinessException(FoodSafeErrorCodes.Report.InvalidStatusTransition);
        if (string.IsNullOrWhiteSpace(reason))
            throw new BusinessException(FoodSafeErrorCodes.Report.ReturnReasonRequired);
        Status = ReportStatus.Returned;
        ReturnedById = returnerId;
        ReturnedAt = DateTime.UtcNow;
        ReturnReason = reason;
        AddDomainEvent(new ReportReturnedEvent(Id, OrganizationId, reason));
    }

    public void Complete(Guid completedById)
    {
        if (Status != ReportStatus.Verified)
            throw new BusinessException(FoodSafeErrorCodes.Report.InvalidStatusTransition);
        Status = ReportStatus.Completed;
        CompletedById = completedById;
        CompletedAt = DateTime.UtcNow;
    }

    public void ReturnToDraft()
    {
        if (Status != ReportStatus.Returned)
            throw new BusinessException(FoodSafeErrorCodes.Report.CanOnlyReturnToDraftWhenReturned);
        Status = ReportStatus.Draft;
    }

    protected abstract string GetReportType();
}

public enum ReportStatus { Draft = 1, Submitted = 2, Verified = 3, Returned = 4, Completed = 5 }
```

### Aggregate Root: NdtpReport

```csharp
public class NdtpReport : BaseReport
{
    public int PeriodYear { get; private set; }
    public int PeriodMonth { get; private set; }

    // Số liệu ca ngộ độc lẻ
    public int CaseCount { get; private set; }
    public int CaseAffected { get; private set; }
    public int CaseHospitalized { get; private set; }
    public int CaseDeaths { get; private set; }

    // Số liệu vụ ngộ độc
    public int IncidentCount { get; private set; }
    public int IncidentAffected { get; private set; }
    public int IncidentHospitalized { get; private set; }
    public int IncidentDeaths { get; private set; }

    // Nội dung tường thuật
    public string? PreventionActivities { get; private set; }
    public string? RiskFactors { get; private set; }
    public string? Recommendations { get; private set; }

    public static NdtpReport Create(Guid id, Guid orgId, int year, int month);
    public void UpdateStats(int cases, int affected, int hospitalized, int deaths,
                           int incidents, int incAffected, int incHospitalized, int incDeaths);
    public void UpdateNarrative(string? prevention, string? riskFactors, string? recommendations);
    protected override string GetReportType() => "NDTP";
}
```

### Aggregate Root: AtpWorkReport (Công tác ATTP)

```csharp
public class AtpWorkReport : BaseReport
{
    public ReportPeriodType PeriodType { get; private set; }  // HalfYear/FullYear
    public int PeriodYear { get; private set; }
    public int? PeriodHalf { get; private set; }  // 1 hoặc 2

    // Số liệu cơ sở
    public int TotalBusinesses { get; private set; }
    public int NewBusinesses { get; private set; }
    public int InactiveBusinesses { get; private set; }
    public int BusinessesWithCertificate { get; private set; }

    // Số liệu giấy phép
    public int DkcbIssued { get; private set; }
    public int SelfDeclarationsReceived { get; private set; }
    public int AdRegistrationsIssued { get; private set; }
    public int EligibilityCertificatesIssued { get; private set; }
    public int CfsIssued { get; private set; }
    public int ExportCertificatesIssued { get; private set; }

    // Số liệu thanh kiểm tra
    public int TotalInspectionPlans { get; private set; }
    public int BusinessesInspected { get; private set; }
    public int ViolationsFound { get; private set; }
    public int FinesIssued { get; private set; }
    public decimal FineTotalAmount { get; private set; }

    // Số liệu ngộ độc
    public int CaseCount { get; private set; }
    public int IncidentCount { get; private set; }
    public int TotalAffected { get; private set; }
    public int TotalDeaths { get; private set; }

    // Truyền thông
    public int TrainingSessions { get; private set; }
    public int TrainingParticipants { get; private set; }
    public int MediaAppearances { get; private set; }
    public int DocumentsIssued { get; private set; }

    // Tường thuật
    public string? Overview { get; private set; }
    public string? Achievements { get; private set; }
    public string? Limitations { get; private set; }
    public string? Solutions { get; private set; }
    public string? NextPeriodPlan { get; private set; }

    public static AtpWorkReport Create(Guid id, Guid orgId, ReportPeriodType type, int year, int? half);
    public void UpdateStats(...);
    public void UpdateNarrative(...);
    protected override string GetReportType() => "ATTP_WORK";
}

public enum ReportPeriodType { HalfYear = 1, FullYear = 2 }
```

### Aggregate Root: ActionMonthReport (Tháng hành động)

```csharp
public class ActionMonthReport : BaseReport
{
    public int PeriodYear { get; private set; }
    public string? ActionMonthTheme { get; private set; }
    public string? ActionMonthDates { get; private set; }

    // Truyền thông
    public int MediaArticles { get; private set; }
    public int BroadcastPrograms { get; private set; }
    public int PropagandaSessions { get; private set; }
    public int Participants { get; private set; }
    public int PostersDistributed { get; private set; }
    public int LeafletsDistributed { get; private set; }

    // Thanh kiểm tra
    public int BusinessesInspected { get; private set; }
    public int ViolationsFound { get; private set; }
    public int FinesIssued { get; private set; }
    public decimal FineAmount { get; private set; }

    // Tự công bố
    public int NewSelfDeclarations { get; private set; }

    // Đánh giá
    public string? Achievements { get; private set; }
    public string? Limitations { get; private set; }
    public string? LessonsLearned { get; private set; }
    public string? NextSteps { get; private set; }

    public static ActionMonthReport Create(Guid id, Guid orgId, int year);
    public void UpdateStats(...);
    public void UpdateNarrative(...);
    protected override string GetReportType() => "ACTION_MONTH";
}
```

---

## 8. Bounded Context: AlertsAndTesting

### Aggregate Root: AtpAlert

```csharp
public class AtpAlert : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string? AlertNumber { get; private set; }
    public string Title { get; private set; }
    public string Content { get; private set; }
    public AlertCategory Category { get; private set; }
    public AlertSeverity Severity { get; private set; }
    public string? AffectedArea { get; private set; }
    public string? AffectedProducts { get; private set; }
    public Guid? BusinessId { get; private set; }
    public AlertSource Source { get; private set; }

    // Public submission info
    public string? ReporterName { get; private set; }
    public string? ReporterPhone { get; private set; }
    public string? ReporterEmail { get; private set; }

    public AlertStatus Status { get; private set; }
    public Guid? PublishedById { get; private set; }
    public DateTime? PublishedAt { get; private set; }
    public Guid? RecalledById { get; private set; }
    public DateTime? RecalledAt { get; private set; }
    public string? RecallReason { get; private set; }
    public bool IsPublic { get; private set; }

    public static AtpAlert Create(Guid id, Guid orgId, string title, string content,
        AlertCategory category, AlertSeverity severity);
    public static AtpAlert CreateFromPublicSubmission(Guid id, Guid orgId, Guid publicSubmissionId,
        string title, string content, AlertCategory category, AlertSeverity severity);

    public void Publish(Guid publisherId, bool isPublic = true)
    {
        if (Status != AlertStatus.Draft)
            throw new BusinessException(FoodSafeErrorCodes.Alert.InvalidStatusTransition);
        Status = AlertStatus.Published;
        PublishedById = publisherId;
        PublishedAt = DateTime.UtcNow;
        IsPublic = isPublic;
        AddDomainEvent(new AlertPublishedEvent(Id, OrganizationId, isPublic));
    }

    public void Recall(Guid recallerId, string reason)
    {
        if (Status != AlertStatus.Published)
            throw new BusinessException(FoodSafeErrorCodes.Alert.CanOnlyRecallPublished);
        Status = AlertStatus.Recalled;
        RecalledById = recallerId;
        RecalledAt = DateTime.UtcNow;
        RecallReason = reason;
    }
}

public enum AlertCategory { FoodSafety = 1, Contamination = 2, Chemical = 3, Biological = 4, Physical = 5, Other = 6 }
public enum AlertSeverity { Low = 1, Medium = 2, High = 3, Critical = 4 }
public enum AlertSource { Internal = 1, PublicReport = 2, ExternalSystem = 3 }
public enum AlertStatus { Draft = 1, Published = 2, Recalled = 3 }
```

### Aggregate Root: AtpNews

```csharp
public class AtpNews : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string Title { get; private set; }
    public string? Summary { get; private set; }
    public string Content { get; private set; }  // Rich text HTML
    public string? ThumbnailStoragePath { get; private set; }
    public string? Category { get; private set; }
    public List<string> Tags { get; private set; }
    public int ViewCount { get; private set; }
    public NewsStatus Status { get; private set; }
    public DateTime? PublishedAt { get; private set; }
    public Guid? PublishedById { get; private set; }
    public bool IsPublic { get; private set; }
    public bool IsFeatured { get; private set; }

    public ICollection<NewsLinkedAlert> LinkedAlerts { get; private set; }

    public void Publish(Guid publisherId, bool isPublic);
    public void Recall(Guid recallerId);
    public void IncrementViewCount() => ViewCount++;
}

public enum NewsStatus { Draft = 1, Published = 2, Recalled = 3 }
```

### Aggregate Root: RiskAnalysis

```csharp
public class RiskAnalysis : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string Title { get; private set; }
    public string? Category { get; private set; }
    public string Content { get; private set; }
    public RiskLevel RiskLevel { get; private set; }
    public DateOnly? AnalysisDate { get; private set; }
    public string? AffectedProducts { get; private set; }
    public string? EvidenceSummary { get; private set; }
    public string? Recommendations { get; private set; }
    public bool IsPublic { get; private set; }
    public RiskAnalysisStatus Status { get; private set; }

    public void Publish(Guid publisherId, bool isPublic);
}

public enum RiskLevel { Low = 1, Medium = 2, High = 3, Critical = 4 }
public enum RiskAnalysisStatus { Draft = 1, Published = 2 }
```

### Aggregate Root: TestingResult

```csharp
public class TestingResult : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public Guid? BusinessId { get; private set; }
    public Guid? ProductId { get; private set; }
    public Guid TestingCenterId { get; private set; }
    public string SampleCode { get; private set; }
    public string SampleName { get; private set; }
    public string? SampleDescription { get; private set; }
    public DateOnly? SampleCollectionDate { get; private set; }
    public DateOnly? SubmittedDate { get; private set; }
    public DateOnly? ResultDate { get; private set; }
    public TestingOverallResult OverallResult { get; private set; }
    public string? ResultDetails { get; private set; }
    public string? FailedParameters { get; private set; }
    public string? CertificateNumber { get; private set; }
    public Guid? InspectionResultId { get; private set; }

    public static TestingResult Create(...);
}

public enum TestingOverallResult { Pass = 1, Fail = 2, Conditional = 3 }
```

### Aggregate Root: RegulatoryDocument

```csharp
public class RegulatoryDocument : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public Guid? DocumentTypeId { get; private set; }
    public string DocumentNumber { get; private set; }
    public string Title { get; private set; }
    public string? IssuingAuthority { get; private set; }
    public DateOnly? IssueDate { get; private set; }
    public DateOnly? EffectiveDate { get; private set; }
    public DateOnly? ExpiryDate { get; private set; }
    public string? Summary { get; private set; }
    public string? ContentStoragePath { get; private set; }
    public DocumentStatus Status { get; private set; }
    public Guid? ReplacedById { get; private set; }
    public List<string> Tags { get; private set; }
    public bool IsPublic { get; private set; }
}

public enum DocumentStatus { Active = 1, Expired = 2, Replaced = 3, Revoked = 4 }
```

### Aggregate Root: PublicAlertSubmission

```csharp
public class PublicAlertSubmission : Entity<Guid>
{
    public string? SubmitterName { get; private set; }
    public string? SubmitterPhone { get; private set; }
    public string? SubmitterEmail { get; private set; }
    public string? Title { get; private set; }
    public string Description { get; private set; }
    public DateTime? OccurrenceDate { get; private set; }
    public string? LocationDescription { get; private set; }
    public Guid? CommuneId { get; private set; }
    public string? SuspectedFood { get; private set; }
    public string TrackingCode { get; private set; }  // Mã tra cứu
    public bool CaptchaVerified { get; private set; }
    public PublicSubmissionStatus Status { get; private set; }
    public Guid? AssignedToId { get; private set; }
    public Guid? AssignedOrganizationId { get; private set; }
    public string? ReviewNotes { get; private set; }
    public Guid? ConvertedAlertId { get; private set; }
    public DateTime CreatedAt { get; private set; }
}

public enum PublicSubmissionStatus { Pending = 1, UnderReview = 2, ConvertedToAlert = 3, Dismissed = 4 }
```

---

## 9. Bounded Context: DataIntegration

### Aggregate Root: ApiSpec

```csharp
public class ApiSpec : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string ApiCode { get; private set; }
    public string ApiName { get; private set; }
    public string? Version { get; private set; }
    public string PartnerSystem { get; private set; }   // Bộ Y tế, Sở NN...
    public string? BaseUrl { get; private set; }
    public string? Description { get; private set; }
    public DataSharingType DataType { get; private set; }
    public ApiDirection Direction { get; private set; }
    public ApiAuthType AuthType { get; private set; }
    public string? AuthConfigEncrypted { get; private set; }  // AES-256 encrypted
    public string? SpecDocumentPath { get; private set; }
    public bool IsActive { get; private set; }

    public static ApiSpec Create(...);
    public void UpdateCredentials(string encryptedConfig);
    public void Activate();
    public void Deactivate();
}

public enum DataSharingType { Alert = 1, InspectionResult = 2, FoodPoisoning = 3, License = 4, Product = 5, News = 6, Business = 7 }
public enum ApiDirection { Outbound = 1, Inbound = 2, Both = 3 }
public enum ApiAuthType { ApiKey = 1, OAuth2 = 2, Basic = 3, None = 4 }
```

### Aggregate Root: DataSharingHistory

```csharp
public class DataSharingHistory : Entity<Guid>
{
    public Guid OrganizationId { get; private set; }
    public Guid? ApiSpecId { get; private set; }
    public ApiDirection Direction { get; private set; }
    public DataSharingType DataType { get; private set; }
    public string? EntityType { get; private set; }
    public Guid? EntityId { get; private set; }
    public string? PartnerSystem { get; private set; }
    public string? RequestMethod { get; private set; }
    public string? RequestUrl { get; private set; }
    public string? RequestPayload { get; private set; }
    public int? ResponseStatusCode { get; private set; }
    public string? ResponsePayload { get; private set; }
    public SharingStatus Status { get; private set; }
    public string? ErrorMessage { get; private set; }
    public int RetryCount { get; private set; }
    public DateTime InitiatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public int? DurationMs { get; private set; }

    public void MarkSuccess(int statusCode, string? responsePayload, int durationMs);
    public void MarkFailed(int? statusCode, string? responsePayload, string errorMessage);
    public void IncrementRetry();
}

public enum SharingStatus { Pending = 1, Success = 2, Failed = 3, Retrying = 4 }
```

---

## Cross-Cutting: FileAttachment

```csharp
// Không phải Aggregate Root — entity cross-cutting
public class FileAttachment : Entity<Guid>
{
    public string EntityType { get; private set; }  // 'business', 'inspection_result', etc.
    public Guid EntityId { get; private set; }
    public string FileName { get; private set; }
    public string OriginalName { get; private set; }
    public string StoragePath { get; private set; }  // MinIO object path
    public long FileSize { get; private set; }
    public string? MimeType { get; private set; }
    public string? Description { get; private set; }
    public bool IsPublic { get; private set; }
    public Guid? UploadedById { get; private set; }
    public DateTime UploadTime { get; private set; }
}
```

---

## Domain Events Summary

| Event | Trigger | Handler |
|-------|---------|---------|
| `BusinessCreatedEvent` | Business.Create() | Tạo audit log, gửi notification |
| `InspectionPlanApprovedEvent` | Plan.Approve() | Gửi email thông báo cho cán bộ |
| `ReportSubmittedEvent` | Report.Submit() | Thông báo cho cấp trên xác minh |
| `ReportReturnedEvent` | Report.Return() | Thông báo cho đơn vị sửa lại |
| `AlertPublishedEvent` | Alert.Publish() | Push to public portal, notify DataIntegration |
| `PoisoningCaseReportedEvent` | Case.Submit() | Cộng vào báo cáo NĐTP tháng |
| `ProductRegistrationExpiredEvent` | Scheduled check | Gửi cảnh báo hết hạn |
| `LicenseExpiringEvent` | Scheduled (30/60/90 days) | Gửi email cảnh báo |
