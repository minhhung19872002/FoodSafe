# FoodSafe — Kế hoạch triển khai chi tiết

> Phần mềm quản lý an toàn thực phẩm — Chi cục ATVSTP tỉnh Quảng Ninh (Giai đoạn 1)
> Thời gian thực hiện: 90 ngày

---

## Tổng quan chức năng (57 chức năng, 6 nhóm)

| Nhóm | Số chức năng | Mô tả |
|---|---|---|
| A — Quản trị hệ thống | 5 | Users, Roles, Audit log, Settings, Login |
| B — Quản lý danh mục | 13 | Địa lý, loại hình, nhóm sản phẩm... |
| C — Quản lý ATTP | 13 | Cơ sở SXKD, sản phẩm, công bố, thanh kiểm tra, ngộ độc, báo cáo, kiểm nghiệm... |
| D — Quản lý giấy phép | 8 | DKCB, DDK, CFS, xuất khẩu, quảng cáo... |
| E — Dành cho người dân | 9 | Cổng tra cứu công khai |
| F — Tích hợp dữ liệu | 8 | API management, lịch sử chia sẻ |

---

## Phase 1 — Foundation (Tuần 1–2)

**Mục tiêu**: Solution chạy được, auth hoạt động, scaffold đủ layers.

### 1.1 Backend scaffold

- [ ] Tạo ABP solution với ABP CLI
  ```
  abp new FoodSafe -t app --dbms PostgreSQL -u none --no-ui
  ```
- [ ] Cấu hình solution structure theo CLAUDE.md
- [ ] Xóa/giữ lại ABP modules cần thiết (Identity, Audit, Settings, BackgroundJobs)
- [ ] Setup EF Core + PostgreSQL connection
- [ ] Setup Redis cache
- [ ] Cấu hình Serilog logging
- [ ] Cấu hình Swagger / OpenAPI
- [ ] Tạo `docker-compose.yml` (PostgreSQL, Redis, MinIO, Backend)
- [ ] Cấu hình `appsettings.json` + `appsettings.Development.json`
- [ ] Chạy DbMigrator lần đầu

### 1.2 Security cơ bản (bắt buộc từ đầu)

- [ ] Cấu hình ABP Identity password policy (min 8, chữ + số + ký tự đặc biệt, 90 ngày)
- [ ] Cấu hình session timeout
- [ ] Cấu hình CSRF protection (ABP có sẵn)
- [ ] Cấu hình Audit Log (ABP AuditingModule)
- [ ] Cấu hình CORS cho FE

### 1.3 Frontend scaffold

- [ ] Tạo Vite + React 19 + TypeScript project
- [ ] Cài đặt dependencies:
  - `antd` `@ant-design/icons`
  - `@tanstack/react-query`
  - `zustand`
  - `react-hook-form` `zod` `@hookform/resolvers`
  - `react-router-dom`
  - `axios`
  - `leaflet` `react-leaflet`
  - `msw`
- [ ] Cài devDependencies:
  - `vitest` `@testing-library/react` `@testing-library/user-event` `jsdom`
  - `@playwright/test`
  - `eslint` `prettier` `husky` `lint-staged`
- [ ] Setup folder structure theo CLAUDE.md
- [ ] Cấu hình ESLint + Prettier + Husky
- [ ] Setup axios instance (base URL, interceptors, token)
- [ ] Setup TanStack Query client + DevTools
- [ ] Setup React Router với lazy loading
- [ ] Tạo layout chính: AppLayout (sidebar, header, breadcrumb)
- [ ] Cấu hình Ant Design theme (màu chủ đạo y tế/xanh)
- [ ] Setup MSW worker cho development/test

### 1.4 Auth flow

**BE:**
- [ ] Kiểm tra ABP OpenIddict đã setup đúng
- [ ] API: POST `/api/account/login`, POST `/api/account/logout`
- [ ] API: POST `/api/account/change-password`
- [ ] Enforce password expiry (90 ngày) — middleware hoặc AppService
- [ ] Auto-lock account sau N lần đăng nhập sai (cấu hình trong Settings)
- [ ] API: Reset mật khẩu qua email (token hết hạn sau 8 giờ)

**FE:**
- [ ] Trang Login (có loading, error message tiếng Việt)
- [ ] CAPTCHA trên login form (hCaptcha hoặc reCAPTCHA)
- [ ] Auth store (Zustand): lưu user info, token, permissions
- [ ] PrivateRoute guard
- [ ] Trang đổi mật khẩu
- [ ] Xử lý password-expired redirect
- [ ] Xử lý 401 → redirect về login

**Tests:**
- [ ] Domain.Tests: PasswordPolicy validation
- [ ] Application.Tests: Login flow, ChangePassword
- [ ] Playwright E2E: Login happy path, login fail, logout

### 1.5 Quản trị hệ thống (nhóm A — chức năng 1–5 theo YeuCau.pdf)

**A1 — Quản lý vai trò (Roles):**
- [ ] `RoleAppService` (dựa trên ABP Identity Role): CRUD + tìm kiếm vai trò
- [ ] Đặt quyền cho vai trò (permission matrix — ABP PermissionManagement)
- [ ] FE: Trang quản lý vai trò + modal gán quyền (permission tree)

**A2 — Quản lý người dùng (Users):**
- [ ] `UserAppService` (dựa trên ABP Identity User): CRUD + tìm kiếm
- [ ] Tìm kiếm người dùng theo quyền / theo vai trò
- [ ] Gửi email kích hoạt tài khoản
- [ ] Buộc thay đổi mật khẩu ở lần đăng nhập tiếp theo
- [ ] Vô hiệu hóa / kích hoạt tài khoản; mở khóa tài khoản
- [ ] Tự động vô hiệu hóa tài khoản khi đăng nhập sai nhiều lần (đọc cấu hình từ Settings)
- [ ] Phân vai trò cho người dùng
- [ ] Tạo ngẫu nhiên mật khẩu (theo password policy)
- [ ] Xuất Excel danh sách người dùng
- [ ] FE: Trang quản lý người dùng (filter, actions, export)

**A3 — Nhật ký hệ thống (Audit Log UI):**
- [ ] `AuditLogAppService`: tìm kiếm thao tác người dùng (theo user, thời gian, chức năng)
- [ ] Xem chi tiết thao tác (request/response, entity changes)
- [ ] Xuất Excel danh sách thao tác
- [ ] FE: Trang nhật ký hệ thống (chỉ admin)

**A4 — Cài đặt (Settings UI):**
- [ ] `SystemSettingAppService` (dựa trên ABP SettingManagement)
- [ ] Thay đổi logo ứng dụng
- [ ] Thay đổi ảnh nền/màn hình đăng nhập
- [ ] Thiết lập độ dài mật khẩu lớn nhất/nhỏ nhất + mật khẩu mặc định
- [ ] Cấu hình số lần đăng nhập sai → vô hiệu hóa tài khoản + thời gian khóa
- [ ] Cấu hình Email (SMTP) — dùng cho gửi email kích hoạt/reset mật khẩu
- [ ] Cấu hình thông tin trang chủ (cổng công khai)
- [ ] FE: Trang cài đặt hệ thống (chỉ admin)

**A5 — Quản lý truy cập (bổ sung ngoài auth flow 1.4):**
- [ ] API + FE: Chỉnh sửa thông tin tài khoản cá nhân (profile)
- [ ] API + FE: Thay đổi ảnh đại diện (upload avatar → MinIO)

---

## Phase 2 — Organizations & Catalogs (Tuần 2–3)

**Mục tiêu**: Danh mục và tổ chức xây xong — các module sau dùng làm reference data.

### 2.1 Organizations (Đơn vị hành chính)

**Tiến độ 2026-07-25 — vertical slice đầu tiên:**

- [x] API-first DTO/contracts + conventional endpoints
- [x] Entity `Organization`, enum 3 cấp, chuẩn hóa mã và invariants địa bàn
- [x] `OrganizationManager`: unique code, parent level, cycle, child-delete guard
- [x] Permission definitions View/Create/Edit/Delete
- [x] AppService CRUD, search/filter, paging, tree
- [x] EF Core mapping khớp bảng `organizations` trong reviewed schema
- [x] FE route `/organizations`: list/filter/paging/tree/create form
- [x] Domain, application tree, EF mapping, component tests
- [ ] Catalog địa lý + combobox tỉnh/huyện/xã (form hiện nhận UUID danh mục)
- [ ] Application integration tests với DB thật, export Excel, edit/delete UI
- [ ] Initial migration sau khi geographic Catalog mappings hoàn thành

**Domain:**
- [ ] Entity `Organization`: Id, Name, Code, Level (Tinh/HuyenTP/XaPhuong), ParentId, Address, IsActive
- [ ] `OrganizationLevel` enum: Province = 1, District = 2, Commune = 3
- [ ] Domain Service: `OrganizationManager` (validate hierarchy, prevent circular)

**Application:**
- [ ] `OrganizationAppService`: CRUD + search + export Excel + tạo nhanh cơ sở trực thuộc
- [ ] DTO: `OrganizationDto`, `CreateOrganizationDto`, `UpdateOrganizationDto`, `OrganizationListFilterDto`

**Tests:**
- [ ] `OrganizationManager_Tests`: tạo hierarchy đúng, validate level
- [ ] `OrganizationAppService_Tests`: CRUD, search

**FE:**
- [ ] Danh sách đơn vị (tree view hoặc table có filter)
- [ ] Form thêm/sửa đơn vị
- [ ] Tạo nhanh cơ sở trực thuộc
- [ ] Xuất Excel

### 2.2 Unit Accounts (Tài khoản đơn vị)

**Domain:**
- [ ] Extend ABP User với `OrganizationId`
- [ ] Permission: Admin tỉnh quản lý tất cả, admin huyện chỉ quản lý huyện mình

**Application:**
- [ ] `UnitAccountAppService`: CRUD + search + unlock + reset password + assign role

**FE:**
- [ ] Quản lý tài khoản đơn vị (với filter theo đơn vị)

### 2.3 Catalogs (Danh mục dùng chung)

Mỗi catalog là 1 entity đơn giản: Id, Name, Code, Description, IsActive, CreatedAt

- [ ] `Country` — Quốc gia
- [ ] `Region` — Vùng miền
- [ ] `Province` — Tỉnh/Thành phố (có sẵn data Việt Nam)
- [ ] `District` — Huyện/Quận
- [ ] `Commune` — Xã/Phường/Thị trấn
- [ ] `BusinessCategory` — Phân loại cơ sở
- [ ] `BusinessType` — Loại hình cơ sở
- [ ] `ProductGroup` — Nhóm sản phẩm
- [ ] `AdvertisementType` — Loại hình quảng cáo
- [ ] `TestingFacility` — Cơ sở kiểm nghiệm
- [ ] `TestingService` — Dịch vụ kiểm nghiệm
- [ ] `DocumentType` — Loại văn bản

**Pattern chung cho mỗi catalog:**
- AppService kế thừa `CrudAppService<TEntity, TDto, TKey, TListFilter, TCreate, TUpdate>`
- Controller mỏng, chỉ delegate
- Seed data cho Province/District/Commune (63 tỉnh thành Việt Nam)

**FE:**
- [ ] Trang catalog dùng chung: DataGrid + form modal (reusable CatalogPage component)
- [ ] Import địa chỉ hành chính từ Excel

---

## Phase 3 — Business Management (Tuần 3–6)

**Module lớn nhất — chia nhỏ thành 3 sub-modules.**

### 3.1 Businesses (Cơ sở SXKD ATTP)

**Domain — `Business` Aggregate Root:**
```
Business
  ├── Id, Code, Name
  ├── OrganizationId (phân quyền dữ liệu)
  ├── BusinessTypeId, BusinessCategoryId
  ├── Address, Latitude, Longitude (map)
  ├── Status: Active | Suspended | Revoked
  ├── OwnerId (người đại diện)
  ├── IsEligibleForProduction (xác nhận đủ điều kiện SXKD)
  ├── HasCommitmentCertificate (xác nhận bản cam kết VSATTP)
  ├── ProductionStaff[] (người trực tiếp SXKD)
  └── InspectionResults[] (kết quả thanh kiểm tra gắn với cơ sở)
```

**Application:**
- [ ] `BusinessAppService`:
  - CRUD (thêm mới từng trường hợp + import Excel)
  - Search (theo tên, mã, loại hình, địa bàn, phân loại)
  - Export Excel
  - Confirm đủ điều kiện SXKD
  - Confirm bản cam kết VSATTP
  - Manage ProductionStaff
- [ ] Geocoding service: tích hợp Nominatim API để lấy lat/lng từ địa chỉ

**Tests:**
- [ ] Business creation với đầy đủ required fields
- [ ] Data scoping: user đơn vị A không thấy data đơn vị B

**FE:**
- [ ] Danh sách cơ sở (table + filter nâng cao)
- [ ] Form thêm/sửa cơ sở:
  - Tab: Thông tin chung
  - Tab: Sản phẩm kinh doanh
  - Tab: Người trực tiếp SXKD
  - Tab: Giấy phép & Xác nhận
  - Tab: Kết quả thanh kiểm tra
- [ ] **MapPicker component**: chọn vị trí trên bản đồ Leaflet
- [ ] Import Excel (validate trước khi import)
- [ ] Export Excel

### 3.2 Products (Sản phẩm)

**Domain:**
- [ ] `Product` entity: Id, BusinessId, Name, ProductGroupId, Code, Description, IsActive
- [ ] Liên kết với `Business` (nhiều sản phẩm thuộc 1 cơ sở)

**Application:**
- [ ] `ProductAppService`: CRUD + import/export Excel
- [ ] Quyền: chỉ quản lý sản phẩm của cơ sở trong đơn vị mình

### 3.3 Self-Declaration (Tự công bố sản phẩm)

**Domain:**
- [ ] `SelfDeclaration` entity: Id, ProductId, BusinessId, DeclarationNumber, IssueDate, File (attachment)

**Application:**
- [ ] `SelfDeclarationAppService`: CRUD + file đính kèm + export Excel

**FE:**
- [ ] List + form + FileUploader component (upload/xem/xóa file)

---

## Phase 4 — Licenses & Certificates (Tuần 6–7)

**5 loại giấy phép/chứng nhận — cấu trúc tương tự nhau.**

### 4.1 Product Registration (Đăng ký công bố sản phẩm — DKCB)

**Domain:**
- [ ] `ProductRegistration` entity: Id, BusinessId, ProductId, RegistrationNumber, IssueDate, ExpiryDate, Attachment[]

### 4.2 Facility Eligibility (Đăng ký cơ sở đủ điều kiện — DDK)

**Domain:**
- [ ] `FacilityEligibility` entity: Id, BusinessId, CertificateNumber, IssueDate, ExpiryDate, Attachment[]

### 4.3 Advertisement Approval (Đăng ký xác nhận nội dung quảng cáo)

**Domain:**
- [ ] `AdvertisementApproval` entity: Id, BusinessId, ProductId, ApprovalNumber, IssueDate, Attachment[]

### 4.4 Free Sale Certificate (CFS — Giấy chứng nhận lưu hành tự do)

**Domain:**
- [ ] `FreeSaleCertificate` entity: Id, BusinessId, ProductId, CertificateNumber, IssueDate, ExpiryDate, TargetCountry, Attachment[]

### 4.5 Export Certificate (Giấy chứng nhận thực phẩm xuất khẩu)

**Domain:**
- [ ] `ExportCertificate` entity: Id, BusinessId, ProductId, CertificateNumber, IssueDate, DestinationCountry, Attachment[]

**Pattern chung cho tất cả licenses:**
- AppService: CRUD + file đính kèm (upload/view/delete) + export Excel
- PDF export giấy chứng nhận bằng QuestPDF
- FE: List + filter + form modal + FileUploader + PDF preview

---

## Phase 5 — Inspection (Tuần 7–8)

### 5.1 Inspection Plan (Kế hoạch thanh kiểm tra)

**Domain:**
- [ ] `InspectionPlan` Aggregate Root:
  ```
  InspectionPlan
    ├── Id, Title, Year, Quarter, OrganizationId
    ├── Status: Draft | Active | Completed
    ├── InspectionItems[] (danh sách cơ sở cần thanh kiểm tra)
    └── Attachments[]
  ```

**Application:**
- [ ] `InspectionPlanAppService`:
  - CRUD plan
  - Add/remove businesses to plan
  - Upload/download documents
  - Export Excel

### 5.2 Inspection Results (Kết quả thanh kiểm tra)

**Domain:**
- [ ] `InspectionResult` entity (thuộc InspectionPlan):
  - Kết quả cho từng cơ sở: đạt/không đạt, vi phạm, xử lý hành chính

**Application:**
- [ ] `InspectionResultAppService`: update result per business, export Excel

**FE:**
- [ ] Danh sách kế hoạch + form tạo kế hoạch
- [ ] Màn hình nhập kết quả (từng cơ sở trong kế hoạch)
- [ ] Tải/upload tài liệu kế hoạch

---

## Phase 6 — Food Poisoning (Tuần 8–9)

### 6.1 Small Poisoning Cases (Ca ngộ độc nhỏ lẻ)

**Domain:**
- [ ] `FoodPoisoningCase` Aggregate Root:
  ```
  FoodPoisoningCase
    ├── Id, CaseNumber, ReportDate, OrganizationId
    ├── Location (địa chỉ xảy ra)
    ├── VictimCount, HospitalizedCount, DeathCount
    ├── SuspectedCause, FoodItem
    ├── Status: Reported | Verified | Error
    ├── VerificationNote
    └── ErrorReport (phiếu sai sót)
  ```

**Application:**
- [ ] `FoodPoisoningCaseAppService`: CRUD + xác minh + báo sai sót + export Excel

### 6.2 Poisoning Incidents (Vụ ngộ độc)

**Domain:**
- [ ] `FoodPoisoningIncident` Aggregate Root:
  ```
  FoodPoisoningIncident
    ├── Id, IncidentNumber, OrganizationId
    ├── Cases[] (liên kết các ca nhỏ lẻ)
    ├── Status: Reported | Verified | Concluded
    ├── ConclusionReport (phiếu kết thúc — chỉ cấp Tỉnh)
    └── ErrorReport
  ```

**Application:**
- [ ] `FoodPoisoningIncidentAppService`: CRUD + xác minh + kết thúc (cấp Tỉnh) + export Excel

**FE:**
- [ ] Danh sách ca ngộ độc + form khai báo
- [ ] Xác minh phiếu khai báo
- [ ] Phiếu sai sót
- [ ] Danh sách vụ ngộ độc + nhập phiếu kết thúc

---

## Phase 7 — Reporting Workflow (Tuần 9–10)

**3 loại báo cáo, đều có cùng workflow phê duyệt.**

### Báo cáo State Machine
```
Draft → Submitted → [Verified | Returned]
                 ↑
         ErrorReport (tuyến dưới gửi)
         ReturnDecision (tuyến trên quyết định trả lại để sửa)
```

### 7.1 Food Poisoning Report (Báo cáo tình hình NĐTP — theo tháng)

**Domain:**
- [ ] `FoodPoisoningReport` Aggregate Root với ReportingStatus state machine
- [ ] Domain Event: `ReportSubmitted`, `ReportVerified`, `ReportReturned`
- [ ] Rule: sau khi Submit → không sửa; chỉ gửi ErrorReport

**Application:**
- [ ] `FoodPoisoningReportAppService`:
  - Tạo/sửa (Draft)
  - Submit (tuyến dưới gửi lên)
  - Verify (tuyến trên xác nhận)
  - Return (tuyến trên trả lại)
  - ErrorReport (tuyến dưới báo sai sót)
  - Export Excel + xem dạng văn bản

### 7.2 ATTP Work Report (Báo cáo công tác ATTP — 6 tháng + 1 năm)

**Domain:**
- [ ] `AttpWorkReport` Aggregate Root — cấu trúc tương tự, chu kỳ 6 tháng/1 năm
- [ ] Tự tính số liệu từ data trong hệ thống

**Application:**
- [ ] `AttpWorkReportAppService`: tương tự + tự tính số liệu

### 7.3 Action Month Report (Báo cáo tháng hành động ATTP — 1 năm/1 lần)

**Domain:**
- [ ] `ActionMonthReport` Aggregate Root — cấu trúc tương tự

**FE:**
- [ ] Màn hình tạo báo cáo (form phức tạp, nhiều trường)
- [ ] Workflow buttons: Gửi / Xác minh / Trả lại / Báo sai sót
- [ ] Preview dạng văn bản
- [ ] Export Excel

---

## Phase 8 — Alerts, Testing & Documents (Tuần 10–11)

### 8.1 ATTP Alerts (Cảnh báo vệ sinh ATTP)

**Domain:**
- [ ] `AttpAlert` entity: Id, Title, Content, OrganizationId, Status: Draft | Published | Recalled
- [ ] Citizen reports: Status = PendingVerification → Verified / Rejected

**Application:**
- [ ] `AttpAlertAppService`: CRUD + duyệt cảnh báo từ người dân + thu hồi

### 8.2 News & Activities (Tin tức ATTP)

**Domain:**
- [ ] `AttpNews` entity: Id, Title, Content (rich text), Category, Status, PublishedAt
- [ ] Gắn tag cơ sở vi phạm

**Application:**
- [ ] `AttpNewsAppService`: CRUD + duyệt tin từ người dân + thu hồi

### 8.3 Testing Results (Kết quả kiểm nghiệm)

**Domain:**
- [ ] `TestingResult` entity: Id, BusinessId, TestingFacilityId, TestingServiceId, SampleDate, ResultDate, Result (đạt/không đạt), Conclusion, Attachment

**Application:**
- [ ] `TestingResultAppService`: CRUD + export Excel

### 8.4 Risk Analysis (Phân tích mối nguy cơ)

**Domain:**
- [ ] `RiskAnalysis` entity: Id, Title, Content, RiskLevel, OrganizationId, PublishedAt, IsPublished

**Application:**
- [ ] `RiskAnalysisAppService`: CRUD + công bố + export

### 8.5 Documents (Văn bản chỉ đạo, điều hành)

**Domain:**
- [ ] `Document` entity: Id, Title, DocumentNumber, DocumentTypeId, IssuedBy, IssuedDate, Content, Attachment

**Application:**
- [ ] `DocumentAppService`: CRUD + export

---

## Phase 9 — Statistics & Dashboard (Tuần 11)

### 9.1 Dashboard thống kê

**FE — sử dụng /dataviz skill:**
- [ ] Số liệu cơ sở + sản phẩm (số card, theo loại hình)
- [ ] Tình hình báo cáo công tác ATTP
- [ ] Tình hình báo cáo Tháng hành động ATTP
- [ ] **Bản đồ tình hình NĐTP** (Leaflet + cluster markers)
- [ ] **Biểu đồ cột** NĐTP theo thời gian (Recharts hoặc AntD Charts)
- [ ] Filter: theo thời gian + đơn vị quản lý
- [ ] Lưu/tải ảnh biểu đồ

**BE:**
- [ ] `DashboardAppService`: các query tổng hợp, tối ưu với raw SQL hoặc EF query

### 9.2 Báo cáo thống kê

- [ ] Thống kê số giấy phép theo loại hình → export Excel
- [ ] Thống kê tình hình ngộ độc theo địa bàn → export Excel
- [ ] Thống kê kết quả thanh kiểm tra → export Excel
- [ ] Thống kê cơ sở theo loại hình/vùng/địa bàn → export Excel

---

## Phase 10 — Public Portal (Tuần 11–12)

**Cổng tra cứu người dân — không cần đăng nhập.**

### Chức năng tra cứu (41–49)

- [ ] Tra cứu cơ sở SXKD (search by name, location)
- [ ] Tra cứu cơ sở được cấp GCN đủ điều kiện + xem/tải giấy
- [ ] Tra cứu sản phẩm tự công bố + xem/tải
- [ ] Tra cứu sản phẩm đăng ký công bố + xem/tải
- [ ] Tra cứu cơ sở bị cảnh báo
- [ ] Tra cứu CFS + xem/tải
- [ ] Tra cứu giấy chứng nhận xuất khẩu + xem/tải
- [ ] Gửi cảnh báo ATTP (từ người dân)
- [ ] Tra cứu văn bản pháp luật về VSATTP

**FE — route `/public` không cần auth:**
- [ ] Layout riêng (header đơn giản, không có sidebar admin)
- [ ] Search bar nổi bật
- [ ] Form gửi cảnh báo

---

## Phase 11 — Data Integration (Tuần 12)

### Chức năng 50–57

- [ ] `ApiSpecification` entity: Quản lý đặc tả API (Swagger/JSON)
- [ ] `DataSharingLog` entity: Id, Direction (In/Out), EntityType, ExternalSystem, Payload, Status, Timestamp

**Integration pattern:**
- Outbound: Background job gửi data theo lịch hoặc trigger
- Inbound: Webhook endpoint nhận data từ external systems
- Retry với exponential backoff khi external system fail

**Application:**
- [ ] `ApiSpecificationAppService`: CRUD + export
- [ ] `DataSharingLogAppService`: query + filter lịch sử

**FE:**
- [ ] Quản lý đặc tả API
- [ ] Lịch sử nhận/chia sẻ (7 loại: cảnh báo, thanh kiểm tra, ngộ độc, giấy phép, sản phẩm, tin tức, cơ sở SXKD)

---

## Phase 12 — Testing, Security & Production Readiness (Tuần 12)

- [ ] Full E2E Playwright: happy path cho tất cả critical flows
- [ ] `/security-review` toàn bộ codebase
- [ ] Load test: verify 30 concurrent users
- [ ] Cấu hình IPv6 trên nginx
- [ ] Cấu hình TLS 1.2+ trên nginx
- [ ] Cấu hình DNSSEC
- [ ] Security headers (CSP, X-Frame-Options, HSTS...)
- [ ] Review Audit Log coverage
- [ ] User acceptance testing với dữ liệu thực tế
- [ ] Tài liệu hướng dẫn sử dụng
- [ ] Tài liệu quản trị hệ thống
- [ ] Deploy lên staging → review → deploy production

---

## Shared Components cần build sớm (dùng nhiều nơi)

| Component | Mô tả | Dùng ở |
|---|---|---|
| `DataTable` | AntD Table + search + pagination + export | Tất cả features |
| `SearchForm` | Form filter chuẩn (collapse/expand) | Tất cả list pages |
| `FormModal` | Modal + form CRUD (thêm/sửa) | Tất cả CRUD |
| `FileUploader` | Upload/xem/xóa file attachment | Licenses, Reports, Docs |
| `MapPicker` | Leaflet map chọn lat/lng | Business |
| `ExcelImporter` | Upload Excel + validate + preview | Business, Products |
| `StatusBadge` | Badge màu theo status | Reports, Alerts |
| `WorkflowActions` | Buttons: Gửi/Xác minh/Trả lại/Báo sai sót | Reporting |
| `LoadingSpinner` | Spinner thống nhất (Ant Design Spin) | Toàn hệ thống |
| `ErrorMessage` | Thông báo lỗi tiếng Việt, phân loại | Toàn hệ thống |

---

## Dependencies & Versions

### Backend NuGet
```xml
<PackageReference Include="Volo.Abp.AspNetCore.Mvc.UI.Theme.Basic" Version="9.*" />
<PackageReference Include="Volo.Abp.EntityFrameworkCore.PostgreSql" Version="9.*" />
<PackageReference Include="Volo.Abp.BackgroundJobs.HangFire" Version="9.*" />
<PackageReference Include="Serilog.AspNetCore" Version="8.*" />
<PackageReference Include="ClosedXML" Version="0.102.*" />
<PackageReference Include="MiniExcel" Version="1.*" />
<PackageReference Include="QuestPDF" Version="2024.*" />
<PackageReference Include="AWSSDK.S3" Version="3.*" /> <!-- MinIO S3 -->
```

### Frontend package.json (key packages)
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "antd": "^5.x.x",
    "@ant-design/icons": "^5.x.x",
    "@tanstack/react-query": "^5.x.x",
    "zustand": "^5.x.x",
    "react-hook-form": "^7.x.x",
    "zod": "^3.x.x",
    "@hookform/resolvers": "^3.x.x",
    "react-router-dom": "^7.x.x",
    "axios": "^1.x.x",
    "leaflet": "^1.x.x",
    "react-leaflet": "^4.x.x"
  },
  "devDependencies": {
    "vitest": "^2.x.x",
    "@testing-library/react": "^16.x.x",
    "@playwright/test": "^1.x.x",
    "msw": "^2.x.x"
  }
}
```

---

## Milestone Checklist

| Milestone | Tuần | Deliverable |
|---|---|---|
| M1 | 2 | Solution chạy, Auth hoạt động, docker-compose up |
| M2 | 3 | Organizations + Catalogs xong, seed data |
| M3 | 6 | Business Management xong (cơ sở + sản phẩm + giấy phép) |
| M4 | 8 | Inspection + Food Poisoning xong |
| M5 | 10 | Reporting workflow xong |
| M6 | 11 | Alerts + Testing + Dashboard xong |
| M7 | 12 | Public Portal + Data Integration xong |
| M8 | 12 | Security review + Load test + Production deploy |
