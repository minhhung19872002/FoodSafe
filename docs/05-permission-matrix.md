# Ma trận Phân quyền — FoodSafe

> Dựa theo mô hình RBAC (Role-Based Access Control) của ABP Framework  
> Data scoping theo OrganizationId — server-side filtering bắt buộc

---

## Vai trò hệ thống

| Vai trò | Mô tả | Phạm vi dữ liệu |
|---------|-------|-----------------|
| **SystemAdmin** | Quản trị hệ thống, siêu quản trị | Toàn tỉnh |
| **ProvinceAdmin** | Admin cấp tỉnh | Toàn tỉnh |
| **ProvinceStaff** | Cán bộ cấp tỉnh | Toàn tỉnh (xem) + đơn vị tỉnh (thêm/sửa) |
| **DistrictAdmin** | Admin cấp huyện/TP | Huyện + các xã thuộc huyện |
| **DistrictStaff** | Cán bộ cấp huyện/TP | Huyện + các xã thuộc huyện |
| **CommuneAdmin** | Admin cấp xã/phường | Xã của mình |
| **CommuneStaff** | Cán bộ cấp xã/phường | Xã của mình |

---

## Cây Permissions (ABP Permission)

```
FoodSafe
├── SystemAdmin
│   ├── SystemAdmin.Users          (CRUD users)
│   ├── SystemAdmin.Roles          (CRUD roles)
│   ├── SystemAdmin.AuditLogs      (view audit logs)
│   └── SystemAdmin.Settings       (view & edit settings)
│
├── Organizations
│   ├── Organizations.View
│   ├── Organizations.Create
│   ├── Organizations.Edit
│   └── Organizations.Delete
│
├── Catalogs
│   ├── Catalogs.View
│   ├── Catalogs.Create
│   ├── Catalogs.Edit
│   └── Catalogs.Delete
│
├── BusinessManagement
│   ├── Businesses
│   │   ├── Businesses.View
│   │   ├── Businesses.Create
│   │   ├── Businesses.Edit
│   │   ├── Businesses.Delete
│   │   └── Businesses.Import      (import Excel)
│   ├── Products
│   │   ├── Products.View
│   │   ├── Products.Create
│   │   ├── Products.Edit
│   │   └── Products.Delete
│   └── SelfDeclarations
│       ├── SelfDeclarations.View
│       ├── SelfDeclarations.Create
│       ├── SelfDeclarations.Edit
│       └── SelfDeclarations.Delete
│
├── Licensing
│   ├── ProductRegistrations.*     (View/Create/Edit/Delete)
│   ├── AdRegistrations.*
│   ├── EligibilityCertificates.*
│   ├── CfsCertificates.*
│   └── ExportCertificates.*
│
├── Inspection
│   ├── Plans
│   │   ├── Plans.View
│   │   ├── Plans.Create
│   │   ├── Plans.Edit
│   │   ├── Plans.Delete
│   │   ├── Plans.Submit
│   │   └── Plans.Approve          (chỉ cấp cao hơn)
│   └── Results
│       ├── Results.View
│       ├── Results.Create
│       ├── Results.Edit
│       └── Results.Delete
│
├── FoodPoisoning
│   ├── Cases
│   │   ├── Cases.View
│   │   ├── Cases.Create
│   │   ├── Cases.Edit
│   │   ├── Cases.Delete
│   │   ├── Cases.Submit
│   │   └── Cases.Verify
│   └── Incidents
│       ├── Incidents.View
│       ├── Incidents.Create
│       ├── Incidents.Edit
│       ├── Incidents.Delete
│       ├── Incidents.Submit
│       ├── Incidents.Verify
│       └── Incidents.Conclude
│
├── Reporting
│   ├── NdtpReports.*              (View/Create/Edit/Delete/Submit/Verify/Return/Complete)
│   ├── AtpWorkReports.*
│   └── ActionMonthReports.*
│
├── AlertsAndTesting
│   ├── Alerts
│   │   ├── Alerts.View
│   │   ├── Alerts.Create
│   │   ├── Alerts.Edit
│   │   ├── Alerts.Delete
│   │   ├── Alerts.Publish
│   │   └── Alerts.Recall
│   ├── News.*
│   ├── RiskAnalyses.*
│   ├── TestingResults.*
│   └── Documents.*
│
├── Dashboard
│   └── Dashboard.View
│
└── DataIntegration
    ├── ApiSpecs.*
    └── DataSharingHistories.View
```

---

## Ma trận Phân quyền theo Vai trò

### NHÓM A — Quản trị Hệ thống

| Permission | SystemAdmin | ProvinceAdmin | ProvinceStaff | DistrictAdmin | DistrictStaff | CommuneAdmin | CommuneStaff |
|-----------|:-----------:|:-------------:|:-------------:|:-------------:|:-------------:|:------------:|:------------:|
| SystemAdmin.Users | ✓ | ✓ (trong tỉnh) | ✗ | ✓ (trong huyện) | ✗ | ✓ (trong xã) | ✗ |
| SystemAdmin.Roles | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| SystemAdmin.AuditLogs | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| SystemAdmin.Settings | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### NHÓM B — Danh mục

| Permission | SystemAdmin | ProvinceAdmin | ProvinceStaff | DistrictAdmin | DistrictStaff | CommuneAdmin | CommuneStaff |
|-----------|:-----------:|:-------------:|:-------------:|:-------------:|:-------------:|:------------:|:------------:|
| Organizations.View | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Organizations.Create/Edit/Delete | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Catalogs.View | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Catalogs.Create/Edit/Delete | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

### NHÓM C — Quản lý ATTP

#### Cơ sở SXKD

| Permission | SystemAdmin | ProvinceAdmin | ProvinceStaff | DistrictAdmin | DistrictStaff | CommuneAdmin | CommuneStaff |
|-----------|:-----------:|:-------------:|:-------------:|:-------------:|:-------------:|:------------:|:------------:|
| Businesses.View | ✓ (tất cả) | ✓ (tất cả) | ✓ (tất cả) | ✓ (huyện+xã) | ✓ (huyện+xã) | ✓ (xã mình) | ✓ (xã mình) |
| Businesses.Create | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Businesses.Edit | ✓ | ✓ | ✓ | ✓ (thuộc huyện) | ✓ (thuộc huyện) | ✓ (thuộc xã) | ✗ |
| Businesses.Delete | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Businesses.Import | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |

#### Giấy phép (Licensing)

| Permission | SystemAdmin | ProvinceAdmin | ProvinceStaff | DistrictAdmin | DistrictStaff | CommuneAdmin | CommuneStaff |
|-----------|:-----------:|:-------------:|:-------------:|:-------------:|:-------------:|:------------:|:------------:|
| ProductRegistrations.View | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ProductRegistrations.Create/Edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| EligibilityCertificates.Create/Edit | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| CfsCertificates.Create/Edit | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| ExportCertificates.Create/Edit | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

#### Thanh Kiểm tra

| Permission | SystemAdmin | ProvinceAdmin | ProvinceStaff | DistrictAdmin | DistrictStaff | CommuneAdmin | CommuneStaff |
|-----------|:-----------:|:-------------:|:-------------:|:-------------:|:-------------:|:------------:|:------------:|
| Plans.View | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Plans.Create/Edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Plans.Submit | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Plans.Approve | ✓ | ✓ | ✗ | ✓ (kế hoạch của xã thuộc huyện) | ✗ | ✗ | ✗ |
| Results.Create/Edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

#### Ngộ độc Thực phẩm

| Permission | SystemAdmin | ProvinceAdmin | ProvinceStaff | DistrictAdmin | DistrictStaff | CommuneAdmin | CommuneStaff |
|-----------|:-----------:|:-------------:|:-------------:|:-------------:|:-------------:|:------------:|:------------:|
| Cases.View | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cases.Create/Edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cases.Submit | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cases.Verify | ✓ | ✓ | ✓ | ✓ (verify của xã) | ✗ | ✗ | ✗ |
| Incidents.Submit | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Incidents.Verify | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Incidents.Conclude | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |

#### Báo cáo

| Permission | SystemAdmin | ProvinceAdmin | ProvinceStaff | DistrictAdmin | DistrictStaff | CommuneAdmin | CommuneStaff |
|-----------|:-----------:|:-------------:|:-------------:|:-------------:|:-------------:|:------------:|:------------:|
| NdtpReports.View | ✓ | ✓ | ✓ | ✓ (huyện+xã) | ✓ (huyện+xã) | ✓ (xã mình) | ✓ (xã mình) |
| NdtpReports.Create/Edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NdtpReports.Submit | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NdtpReports.Verify | ✓ | ✓ | ✓ | ✓ (verify xã) | ✗ | ✗ | ✗ |
| NdtpReports.Return | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| NdtpReports.Complete | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |

#### Cảnh báo, Tin tức

| Permission | SystemAdmin | ProvinceAdmin | ProvinceStaff | DistrictAdmin | DistrictStaff | CommuneAdmin | CommuneStaff |
|-----------|:-----------:|:-------------:|:-------------:|:-------------:|:-------------:|:------------:|:------------:|
| Alerts.View | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Alerts.Create/Edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Alerts.Publish/Recall | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| News.Create/Edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| News.Publish/Recall | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| RiskAnalyses.Create | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| TestingResults.Create/Edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Documents.Create/Edit | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |

### Data Integration

| Permission | SystemAdmin | ProvinceAdmin | ProvinceStaff | Others |
|-----------|:-----------:|:-------------:|:-------------:|:------:|
| ApiSpecs.View | ✓ | ✓ | ✓ | ✗ |
| ApiSpecs.Create/Edit | ✓ | ✓ | ✗ | ✗ |
| DataSharingHistories.View | ✓ | ✓ | ✓ | ✗ |

---

## Data Scoping Rules (Server-Side)

### Rule 1: Xem theo cấp tổ chức

```csharp
// AppService layer — filter theo OrganizationId
public async Task<PagedResult<BusinessDto>> GetListAsync(GetBusinessListInput input)
{
    var currentOrgId = CurrentUser.GetOrganizationId();
    var currentOrgLevel = await _orgRepository.GetLevelAsync(currentOrgId);
    
    IQueryable<Business> query;
    
    if (currentOrgLevel == OrganizationLevel.Province)
    {
        // Province: xem tất cả
        query = _repo.GetQueryable();
    }
    else if (currentOrgLevel == OrganizationLevel.District)
    {
        // District: xem của district + tất cả communes thuộc district
        var childOrgIds = await _orgRepository.GetChildIdListAsync(currentOrgId);
        query = _repo.GetQueryable().Where(b => childOrgIds.Contains(b.OrganizationId));
    }
    else // Commune
    {
        // Commune: chỉ xem của mình
        query = _repo.GetQueryable().Where(b => b.OrganizationId == currentOrgId);
    }
    
    // ... Apply additional filters
}
```

### Rule 2: Tạo mới — luôn gắn với org của user

```csharp
var business = Business.Create(
    _guidGenerator.Create(),
    CurrentUser.GetOrganizationId(),  // Luôn dùng org của user hiện tại
    input.Code, input.Name, ...);
```

### Rule 3: Sửa — chỉ được sửa của đơn vị mình hoặc cấp dưới

```csharp
var business = await _repo.GetAsync(id);
await CheckOrganizationAccessAsync(business.OrganizationId); // throws if no access
```

---

## Permissions ABP Format (dùng trong code)

```csharp
public static class FoodSafePermissions
{
    public const string GroupName = "FoodSafe";

    public static class SystemAdmin
    {
        public const string Default = GroupName + ".SystemAdmin";
        public const string Users = Default + ".Users";
        public const string Roles = Default + ".Roles";
        public const string AuditLogs = Default + ".AuditLogs";
        public const string Settings = Default + ".Settings";
    }

    public static class Businesses
    {
        public const string Default = GroupName + ".Businesses";
        public const string View = Default + ".View";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
        public const string Import = Default + ".Import";
    }

    public static class NdtpReports
    {
        public const string Default = GroupName + ".NdtpReports";
        public const string View = Default + ".View";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
        public const string Submit = Default + ".Submit";
        public const string Verify = Default + ".Verify";
        public const string Return = Default + ".Return";
        public const string Complete = Default + ".Complete";
    }

    // ... other permission groups
}
```
