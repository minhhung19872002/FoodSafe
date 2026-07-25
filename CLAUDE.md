# FoodSafe — Project Rules & Constraints

## 1. Tổng quan dự án

Phần mềm quản lý an toàn thực phẩm — Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh.
Hệ thống thông tin cấp độ 2 theo Nghị định 85/2016/NĐ-CP.

---

## 2. Stack & References

### Backend
- **Framework**: .NET 9 + ABP Framework 9
- **Database**: PostgreSQL 15 + Redis 7
- **Pattern**: Clean Architecture + DDD (Aggregate Root, Value Object, Domain Events)
- **AppService**: ABP AppService pattern — KHÔNG dùng MediatR/CQRS thuần
- **Reference**: Chỉ tham khảo BE của `C:\Users\ADMIN\workspace\Free\LMS\LabSpecimenManagementDaklak.BE`

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **UI**: Ant Design 5 (Admin dashboard)
- **Server state**: TanStack Query v5
- **Client state**: Zustand
- **Forms**: React Hook Form + Zod
- **Routing**: React Router DOM v7
- **Map**: Leaflet.js (hiển thị vị trí cơ sở, bản đồ ngộ độc)
- **KHÔNG** tham khảo FE của LMS — thiết kế mới hoàn toàn

---

## 3. Ràng buộc kiến trúc Backend

### 3.1 Solution Structure
```
FoodSafe.BE/
├── src/
│   ├── FoodSafe.Domain.Shared/
│   ├── FoodSafe.Domain/
│   │   └── Data/
│   │       ├── IFoodSafeDbSchemaMigrator.cs
│   │       └── FoodSafeDbMigrationService.cs
│   ├── FoodSafe.Application.Contracts/
│   ├── FoodSafe.Application/
│   ├── FoodSafe.EntityFrameworkCore/
│   │   └── EntityFrameworkCore/
│   │       └── EntityFrameworkCoreFoodSafeDbSchemaMigrator.cs
│   ├── FoodSafe.HttpApi/
│   ├── FoodSafe.HttpApi.Host/
│   ├── FoodSafe.HttpApi.Client/      ← ABP dynamic HTTP client proxy
│   └── FoodSafe.DbMigrator/          ← Console app chạy EF migrations + seed
└── test/
    ├── FoodSafe.TestBase/
    ├── FoodSafe.Domain.Tests/
    ├── FoodSafe.Application.Tests/
    └── FoodSafe.EntityFrameworkCore.Tests/
```

### 3.2 Domain Modules (Bounded Contexts)
Mỗi module là một thư mục con trong Domain:
- `Organizations` — Đơn vị hành chính (3 cấp: Tỉnh → Huyện/TP → Xã/Phường)
- `Catalogs` — Danh mục dùng chung (địa lý, loại hình, nhóm sản phẩm...)
- `BusinessManagement` — Cơ sở SXKD, sản phẩm, giấy phép
- `Inspection` — Kế hoạch + kết quả thanh kiểm tra
- `FoodPoisoning` — Ca ngộ độc nhỏ lẻ + vụ ngộ độc
- `Reporting` — Báo cáo NĐTP, công tác ATTP, tháng hành động
- `AlertsAndTesting` — Cảnh báo, tin tức, kiểm nghiệm, phân tích nguy cơ
- `DataIntegration` — API tích hợp external, lịch sử chia sẻ dữ liệu

### 3.3 Data Scoping — QUAN TRỌNG
- **KHÔNG** dùng ABP Multi-tenancy cho phân cấp đơn vị
- Dùng **Organization Unit pattern**: mỗi entity có `OrganizationId`
- User chỉ được xem/sửa data thuộc đơn vị mình (data filtering ở AppService layer)
- Permission check PHẢI ở server — không tin client-side

### 3.4 Reporting Workflow State Machine
Báo cáo có trạng thái: `Draft → Submitted → Verified → Returned / Completed`
- Sau khi Submit, chỉ cho phép báo cáo sai sót, không sửa trực tiếp
- Implement bằng Domain Events + ABP Background Jobs

---

## 4. Ràng buộc kiến trúc Frontend

### 4.1 Folder Structure
```
FoodSafe.FE/src/
├── app/              # Router, providers, global layout
├── features/         # Feature-based (mỗi bounded context = 1 folder)
│   └── [feature]/
│       ├── api/      # TanStack Query hooks
│       ├── components/
│       ├── pages/
│       ├── types/
│       └── __tests__/
├── components/       # Shared UI (FileUploader, MapPicker, ExcelImport...)
├── hooks/
├── lib/              # axios instance, queryClient config
└── utils/
```

### 4.2 Coding Rules
- Mỗi feature folder là **độc lập** — không import chéo giữa features
- Shared logic đưa vào `components/` hoặc `hooks/`
- API calls **chỉ** qua TanStack Query hooks trong `api/` folder
- **KHÔNG** dùng `any` trong TypeScript
- Form validation: Zod schema định nghĩa trước, React Hook Form dùng sau

---

## 5. Security Requirements (Bắt buộc — ATTT Cấp độ 2)

- **Password policy**: tối thiểu 8 ký tự, chữ + số + ký tự đặc biệt, hết hạn 90 ngày
- **Session**: timeout hợp lý, HTTP-Only cookie, Secure flag khi HTTPS
- **CSRF**: random token cho mọi request POST/PUT/DELETE
- **Input validation**: validate ở server (BE) — FE validate chỉ để UX
- **Audit log**: ghi log tất cả thao tác quan trọng (ABP built-in)
- **Password storage**: hash + salt (ABP Identity dùng ASP.NET Core Identity — đủ)
- **XSS**: html encode output, không render raw HTML từ user input
- **CAPTCHA**: trên trang đăng nhập và các chức năng quan trọng
- **HTTPS + TLS 1.2+** bắt buộc trên production
- **IPv6**: cấu hình server lắng nghe IPv6

---

## 6. Performance Requirements

- Response time trung bình < 10 giây (luồng chính)
- Response time chậm nhất < 30 giây
- Hỗ trợ ít nhất 30 concurrent users
- CPU server ≤ 75% trung bình

---

## 7. UI/UX Requirements

- Giao diện tiếng Việt hoàn toàn, Unicode, font chuẩn (Arial/Times New Roman)
- Tìm kiếm dịch vụ ≤ 3 lần click
- Loading indicator thống nhất toàn hệ thống (dùng Ant Design Spin)
- Thông báo lỗi rõ ràng, Việt hóa, phân biệt lỗi user vs lỗi hệ thống
- Required fields hiển thị dấu `*` rõ ràng
- Hỗ trợ thao tác bằng bàn phím (Tab order đúng logic)
- Responsive web — tương thích Chrome, Edge, Firefox

---

## 8. File & Document Requirements

- File đính kèm: PDF, ảnh, Excel
- File storage: MinIO (self-hosted S3 compatible)
- Xuất Excel: ClosedXML + MiniExcel
- Xuất PDF (giấy phép, chứng nhận): QuestPDF
- File import Excel phải validate trước khi insert

---

## 9. External Integration

- API tích hợp với: Bộ Y tế, Sở Nông nghiệp, Sở Công thương
- API cung cấp ra ngoài phải có đặc tả (module DataIntegration)
- Lưu lịch sử mọi API call (nhận + gửi)
- Dữ liệu liên thông tuân thủ Thông tư 31/2026/TT-BCT

---

## 10. Feature Build Loop (BẮT BUỘC tuân thủ)

Mỗi feature phải đi qua đủ các bước sau, **không được bỏ qua**:

```
1. API Contract   → Define DTOs + endpoints trước (API-first)
2. BE: Domain     → Entity, ValueObject, Domain Events
3. BE: Tests      → Domain.Tests + Application.Tests (phải pass)
4. BE: AppService → Business logic + EF migrations
5. FE: Types      → DTOs mirror từ BE
6. FE: API hooks  → TanStack Query hooks + MSW mocks
7. FE: UI         → Components + Pages
8. FE: Tests      → Vitest unit + Playwright E2E
9. /simplify      → Review & cleanup code
10. /run          → Verify chạy thật trên browser
11. /security-review → Security check trước PR
```

**Quy tắc**: Bước trước chưa pass → KHÔNG chuyển sang bước tiếp theo.

---

## 11. Skills phải dùng

| Skill | Khi nào |
|---|---|
| `/typescript-clean-code` | Viết TS mới bất kỳ |
| `/boy-scout` | Sửa code cũ |
| `/simplify` | Sau khi xong 1 feature |
| `/security-review` | Trước khi feature lên staging |
| `/run` | Verify feature chạy thật |
| `/dataviz` | Build chart/dashboard |
| `/artifact-design` | Thiết kế UI component mới |

---

## 12. Docker & Deployment

- `docker-compose.yml` bắt buộc cho local dev
- Services: PostgreSQL 15, Redis 7, MinIO, Backend, Frontend (nginx)
- Environment: `appsettings.Development.json` cho local, không commit secrets
- Production: HTTPS bắt buộc, reverse proxy nginx

---

## 13. Testing Requirements

### Backend
- xUnit với TestBase fixtures
- Application.Tests phải cover tất cả AppService methods
- Không mock database — dùng in-memory hoặc test DB thật

### Frontend
- Vitest + Testing Library cho unit/integration
- Playwright cho E2E (happy path + edge cases)
- MSW v2 cho mock API trong tests
- Coverage tối thiểu: logic phức tạp (workflow, validation)

---

## 14. Frontend Design Patterns

### 14.1 Compound Component Pattern (Composition)

Dùng khi component có nhiều sub-parts liên quan, tránh prop drilling.

```tsx
// ĐÚNG — compound components
<DataTable>
  <DataTable.Toolbar>
    <DataTable.Search />
    <DataTable.ExportButton />
  </DataTable.Toolbar>
  <DataTable.Grid columns={cols} />
  <DataTable.Pagination />
</DataTable>

// SAI — prop drilling
<DataTable showSearch showExport columns={cols} onSearch={...} onExport={...} />
```

Áp dụng cho: `DataTable`, `SearchForm`, `FormModal`, `WorkflowActions`, `FileUploader`.

---

### 14.2 Container / Presenter Pattern (Smart / Dumb)

Tách biệt data fetching khỏi rendering. Presenter là pure UI, không biết về API.

```tsx
// Container — biết về TanStack Query, routing, state
function BusinessListContainer() {
  const { data, isLoading } = useBusinessList(filters);
  const navigate = useNavigate();
  return <BusinessListView data={data} loading={isLoading} onDetail={id => navigate(`/businesses/${id}`)} />;
}

// Presenter — pure UI, dễ test
function BusinessListView({ data, loading, onDetail }: Props) {
  return <Table dataSource={data} loading={loading} ... />;
}
```

**Rule**: Presenter không import hook, không import axios, không gọi navigate.

---

### 14.3 Custom Hook Pattern (Logic Extraction)

Mọi stateful logic phức tạp phải tách vào hook riêng.

```tsx
// Hook chứa toàn bộ logic workflow báo cáo
function useReportWorkflow(reportId: string) {
  const submitMutation = useSubmitReport();
  const verifyMutation = useVerifyReport();
  const { data: report } = useReport(reportId);

  const canSubmit = report?.status === 'Draft';
  const canVerify = report?.status === 'Submitted' && hasPermission('Reports.Verify');

  return { report, canSubmit, canVerify, submit: submitMutation.mutate, verify: verifyMutation.mutate };
}

// Page chỉ dùng hook, không có logic
function ReportDetailPage() {
  const { report, canSubmit, submit } = useReportWorkflow(id);
  return <ReportDetailView report={report} canSubmit={canSubmit} onSubmit={submit} />;
}
```

**Naming rules**:
- Hook tên bắt đầu bằng `use`
- Return object `{}` (không return array, trừ `[state, setter]` pattern đơn giản)
- Hook trong `api/` folder: chỉ wrap TanStack Query
- Hook trong `hooks/` folder: logic phức tạp (workflow, form logic, permissions)

---

### 14.4 Adapter Pattern (API Response Transform)

Transform DTO từ BE → ViewModel phù hợp với UI tại `api/` layer.

```tsx
// api/businessApi.ts
function adaptBusiness(dto: BusinessDto): BusinessViewModel {
  return {
    ...dto,
    fullAddress: [dto.address, dto.commune, dto.district, dto.province].filter(Boolean).join(', '),
    statusLabel: BUSINESS_STATUS_LABELS[dto.status],
    hasValidLicense: dto.licenses.some(l => !isExpired(l.expiryDate)),
  };
}

function useBusinessList(filter: BusinessFilter) {
  return useQuery({
    queryKey: ['businesses', filter],
    queryFn: async () => {
      const res = await businessApi.getList(filter);
      return res.items.map(adaptBusiness);  // transform ở đây
    },
  });
}
```

**Rule**: Page và component chỉ làm việc với `ViewModel`, không xử lý raw DTO.

---

### 14.5 Strategy Pattern (Conditional Rendering)

Thay thế chuỗi `if/else` hoặc `switch` bằng strategy map.

```tsx
// SAI — switch dài
function StatusBadge({ status }: { status: ReportStatus }) {
  if (status === 'Draft') return <Tag color="default">Nháp</Tag>;
  if (status === 'Submitted') return <Tag color="blue">Đã gửi</Tag>;
  if (status === 'Verified') return <Tag color="green">Đã xác minh</Tag>;
  ...
}

// ĐÚNG — strategy map, dễ mở rộng
const REPORT_STATUS_CONFIG: Record<ReportStatus, { color: string; label: string }> = {
  Draft:     { color: 'default', label: 'Nháp' },
  Submitted: { color: 'blue',    label: 'Đã gửi' },
  Verified:  { color: 'green',   label: 'Đã xác minh' },
  Returned:  { color: 'orange',  label: 'Trả lại' },
};

function StatusBadge({ status }: { status: ReportStatus }) {
  const { color, label } = REPORT_STATUS_CONFIG[status];
  return <Tag color={color}>{label}</Tag>;
}
```

Áp dụng cho: status badges, action buttons, form fields theo loại entity.

---

### 14.6 Builder Pattern (Zod Schema)

Build schema phức tạp từ composable pieces, không lặp lại rules.

```tsx
// utils/schemaBuilders.ts
const addressFields = {
  provinceId: z.string().min(1, 'Vui lòng chọn tỉnh/thành'),
  districtId: z.string().min(1, 'Vui lòng chọn huyện/quận'),
  communeId:  z.string().min(1, 'Vui lòng chọn xã/phường'),
  address:    z.string().min(1, 'Vui lòng nhập địa chỉ'),
};

const baseBusinessSchema = z.object({
  name:           z.string().min(1, 'Tên cơ sở không được trống'),
  businessTypeId: z.string().min(1, 'Vui lòng chọn loại hình'),
  ...addressFields,
});

// Extend khi cần thêm fields
const businessWithLicenseSchema = baseBusinessSchema.extend({
  licenseNumber: z.string().min(1, 'Số giấy phép không được trống'),
});
```

---

### 14.7 Repository Pattern (TanStack Query hooks)

Mỗi feature có `api/` folder là "repository" — nơi duy nhất gọi API.

```
features/businesses/api/
  ├── businessQueries.ts   # useQuery hooks (read)
  ├── businessMutations.ts # useMutation hooks (write)
  ├── businessApi.ts       # axios calls thuần (không export ra ngoài api/)
  └── businessAdapters.ts  # DTO → ViewModel transforms
```

**Rule**: Component và hook KHÔNG gọi axios trực tiếp — phải qua `api/` folder.

---

## 15. Backend Design Patterns

### 15.1 Value Object Pattern

Nhóm các primitive liên quan thành Value Object — immutable, self-validating.

```csharp
// ĐÚNG
public class Address : ValueObject
{
    public string Street    { get; }
    public string CommuneId { get; }
    public string DistrictId{ get; }
    public string ProvinceId{ get; }
    public double? Latitude  { get; }
    public double? Longitude { get; }

    public Address(string street, string communeId, string districtId, string provinceId,
                   double? lat = null, double? lng = null)
    {
        Check.NotNullOrWhiteSpace(street, nameof(street));
        Street = street; CommuneId = communeId; DistrictId = districtId;
        ProvinceId = provinceId; Latitude = lat; Longitude = lng;
    }

    protected override IEnumerable<object> GetAtomicValues()
        => [Street, CommuneId, DistrictId, ProvinceId, Latitude, Longitude];
}

// SAI — primitive obsession
public class Business
{
    public string Street     { get; set; }
    public string CommuneId  { get; set; }
    public string DistrictId { get; set; }
    ...
}
```

Các Value Object bắt buộc: `Address`, `ContactInfo`, `DateRange`, `Money` (VND).

---

### 15.2 Guard Clause Pattern (Domain Validation)

Business rule validation thuộc Domain layer. AppService không chứa business logic.

```csharp
// ĐÚNG — Guard trong Domain entity
public class InspectionPlan : AggregateRoot<Guid>
{
    public void AddBusiness(Guid businessId)
    {
        if (Status != InspectionPlanStatus.Draft)
            throw new BusinessException(FoodSafeErrorCodes.InspectionPlan.CannotModifyNonDraft);

        if (Items.Any(i => i.BusinessId == businessId))
            throw new BusinessException(FoodSafeErrorCodes.InspectionPlan.DuplicateBusiness);

        Items.Add(new InspectionPlanItem(businessId));
    }
}

// SAI — validation trong AppService
public async Task AddBusinessAsync(Guid planId, Guid businessId)
{
    var plan = await _repo.GetAsync(planId);
    if (plan.Status != "Draft") throw new Exception("...");  // KHÔNG
    ...
}
```

**Rule**: AppService chỉ gọi method trên Aggregate. Aggregate chứa tất cả invariants.

---

### 15.3 Static Factory Method Pattern

Tạo Aggregate Root qua factory method, không new trực tiếp.

```csharp
// ĐÚNG — factory method kiểm soát creation logic
public class Business : AggregateRoot<Guid>
{
    private Business() { }  // EF Core constructor

    public static Business Create(
        Guid id, string name, Guid organizationId,
        Guid businessTypeId, Address address)
    {
        Check.NotNullOrWhiteSpace(name, nameof(name));

        var business = new Business { Id = id, Name = name, ... };
        business.AddDomainEvent(new BusinessCreatedEvent(id, organizationId));
        return business;
    }
}

// AppService dùng factory
public async Task<BusinessDto> CreateAsync(CreateBusinessDto input)
{
    var business = Business.Create(
        _guidGenerator.Create(), input.Name, currentOrgId, input.BusinessTypeId,
        new Address(input.Street, input.CommuneId, input.DistrictId, input.ProvinceId));

    await _businessRepo.InsertAsync(business);
    return ObjectMapper.Map<Business, BusinessDto>(business);
}
```

---

### 15.4 Specification Pattern (Complex Queries)

Tách query logic ra Specification class, tái sử dụng và combine.

```csharp
// Specifications/BusinessSpecifications.cs
public class ActiveBusinessSpec : Specification<Business>
{
    public override Expression<Func<Business, bool>> ToExpression()
        => b => b.Status == BusinessStatus.Active;
}

public class BusinessByOrganizationSpec : Specification<Business>
{
    private readonly Guid _organizationId;
    public BusinessByOrganizationSpec(Guid orgId) => _organizationId = orgId;

    public override Expression<Func<Business, bool>> ToExpression()
        => b => b.OrganizationId == _organizationId;
}

// Repository dùng specification
var spec = new BusinessByOrganizationSpec(orgId).And(new ActiveBusinessSpec());
var businesses = await _repo.GetListAsync(spec);
```

---

### 15.5 Domain Service Pattern

Khi logic liên quan nhiều Aggregate và không thuộc về Aggregate cụ thể nào.

```csharp
// Domain/Reporting/ReportCalculationService.cs
public class ReportCalculationService : IDomainService
{
    // Tính số liệu tổng hợp cho báo cáo từ nhiều nguồn
    public AttpWorkReportStats CalculateStats(
        IReadOnlyList<Business> businesses,
        IReadOnlyList<InspectionResult> inspections,
        IReadOnlyList<FoodPoisoningCase> cases,
        DateRange period)
    {
        return new AttpWorkReportStats
        {
            TotalBusinesses     = businesses.Count,
            InspectedCount      = inspections.Count,
            ViolationCount      = inspections.Count(i => i.HasViolation),
            PoisoningCaseCount  = cases.Count(c => c.OccurredAt >= period.Start),
        };
    }
}
```

**Rule**: Domain Service là stateless, không inject Repository — nhận aggregate làm params.

---

### 15.6 Strategy Pattern (Business Rules biến đổi theo loại)

Thay switch/if-else bằng strategy được inject qua DI.

```csharp
// Application/Reporting/Strategies/IReportValidationStrategy.cs
public interface IReportValidationStrategy
{
    Task ValidateAsync(Guid reportId, Guid organizationId);
}

// Strategies/NdtpReportValidationStrategy.cs
public class NdtpReportValidationStrategy : IReportValidationStrategy
{
    public async Task ValidateAsync(Guid reportId, Guid orgId)
    {
        // validate logic riêng cho báo cáo NĐTP
    }
}

// AppService resolve strategy theo loại báo cáo
public class ReportAppService : ApplicationService
{
    private readonly IEnumerable<IReportValidationStrategy> _strategies;

    public async Task SubmitAsync(Guid id, ReportType type)
    {
        var strategy = _strategies.Single(s => s.ReportType == type);
        await strategy.ValidateAsync(id, CurrentUser.OrganizationId);
        ...
    }
}
```

Áp dụng cho: validation theo loại báo cáo, tính số liệu theo chu kỳ, export template theo loại giấy phép.

---

### 15.7 Template Method Pattern (Base AppService)

Base class định nghĩa skeleton, subclass override bước cụ thể.

```csharp
// Application/Catalogs/BaseCatalogAppService.cs
public abstract class BaseCatalogAppService<TEntity, TDto, TKey, TCreateDto, TUpdateDto>
    : CrudAppService<TEntity, TDto, TKey, PagedAndSortedResultRequestDto, TCreateDto, TUpdateDto>
{
    // Template method — subclass override nếu cần validate thêm
    protected virtual Task ValidateCreateAsync(TCreateDto input) => Task.CompletedTask;
    protected virtual Task ValidateUpdateAsync(TKey id, TUpdateDto input) => Task.CompletedTask;

    public override async Task<TDto> CreateAsync(TCreateDto input)
    {
        await ValidateCreateAsync(input);  // hook
        return await base.CreateAsync(input);
    }
}

// Catalog cụ thể chỉ override nếu cần
public class BusinessTypeAppService
    : BaseCatalogAppService<BusinessType, BusinessTypeDto, Guid, CreateBusinessTypeDto, UpdateBusinessTypeDto>
{
    protected override async Task ValidateCreateAsync(CreateBusinessTypeDto input)
    {
        if (await _repo.AnyAsync(t => t.Code == input.Code))
            throw new BusinessException(FoodSafeErrorCodes.Catalog.DuplicateCode);
    }
}
```

---

### 15.8 Repository Extension Pattern (Custom Queries)

Extend IRepository với method riêng cho complex queries — không viết SQL trong AppService.

```csharp
// Domain/BusinessManagement/IBusinessRepository.cs
public interface IBusinessRepository : IRepository<Business, Guid>
{
    Task<List<Business>> GetListWithLicensesAsync(Guid organizationId, string keyword, int skip, int take);
    Task<int> GetExpiredLicenseCountAsync(Guid organizationId, DateTime asOf);
    Task<List<BusinessSummaryDto>> GetSummaryByTypeAsync(Guid organizationId);
}

// EntityFrameworkCore — implementation với EF query
public class BusinessRepository : EfCoreRepository<FoodSafeDbContext, Business, Guid>, IBusinessRepository
{
    public async Task<List<Business>> GetListWithLicensesAsync(...)
    {
        return await DbSet
            .Include(b => b.Licenses)
            .Where(b => b.OrganizationId == organizationId)
            .WhereIf(!keyword.IsNullOrWhiteSpace(), b => b.Name.Contains(keyword))
            .Skip(skip).Take(take)
            .ToListAsync();
    }
}
```

---

## 16. Không được làm

- KHÔNG commit secrets, credentials, connection strings vào git
- KHÔNG dùng `any` trong TypeScript
- KHÔNG bỏ qua bước test trong feature loop
- KHÔNG dùng ABP Multi-tenancy cho phân cấp đơn vị
- KHÔNG tham khảo FE của LMS
- KHÔNG deploy production khi chưa có `/security-review`
- KHÔNG mock chức năng — mọi feature phải chạy thật với DB thật
