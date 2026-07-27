# Handoff triển khai STT 25 — CFS Certificates

> Cập nhật: 2026-07-25, nhánh `codex/production-readiness`.
>
> Mục đích của file này là để một agent khác (đặc biệt Claude Code) có thể
> tiếp tục ngay, không phải audit lại từ đầu.

## 1. Trạng thái nền đã ổn định

STT 21–24 đã hoàn tất và đã commit. Commit ổn định gần nhất:

```text
fef368a feat: complete eligibility certificate lifecycle
```

Commit này đã qua:

- backend Release build 0 warning;
- 126 backend tests;
- 44 frontend tests;
- EF không có pending model changes;
- Docker API/frontend và hạ tầng healthy;
- authenticated Docker E2E cho STT24;
- kiểm tra PostgreSQL constraints/indexes/FKs và Hangfire recurring job.

Không revert hoặc reset các commit trước. Worktree hiện tại chứa phần triển
khai STT25 chưa commit và phải được giữ nguyên.

## 2. Yêu cầu đã chốt cho STT25

Nguồn đối chiếu:

- `docs/01-functional-requirements.md`, STT 25;
- `docs/02-domain-model.md`, aggregate `CfsCertificate`;
- `docs/04-state-machines.md`, license expiry;
- `docs/05-permission-matrix.md`;
- `docs/06-api-contracts.md`;
- `docs/08-database-requirement-traceability.md`;
- `docs/09-database-data-dictionary.md`;
- `docs/15-database-assumptions-and-open-questions.md`, OQ-006 và
  ASM-v22-001.

Phạm vi implementation:

- CFS thuộc một cơ sở và organization;
- sản phẩm là liên kết nullable theo domain model, nhưng nếu có thì phải thuộc
  đúng cơ sở và organization;
- quốc gia đích là bắt buộc và phải trỏ đến country đang active;
- số CFS chuẩn hóa uppercase, unique toàn cục và không được tái sử dụng sau
  soft delete;
- trạng thái Active/Expired/Revoked, revoke là terminal;
- cảnh báo 30/60/90 ngày và Hangfire đồng bộ hết hạn hằng ngày;
- data scope theo organization/geography/business/business type/product group;
- quyền Create/Edit chỉ SystemAdmin, ProvinceAdmin, ProvinceStaff;
- DistrictAdmin, DistrictStaff và hai vai trò commune chỉ View;
- Delete hiện dành cho nhóm administrator thông qua permission seed;
- file riêng tư qua document owner + MinIO + ClamAV;
- Excel export theo scope;
- anonymous exact-number lookup chỉ trả safe projection;
- UI quản trị tiếng Việt và trang `/tra-cuu-cfs`;
- authenticated Docker E2E trước khi commit.

Theo OQ-006, CFS và Export Food Certificate là hai aggregate độc lập; không
áp mutual-exclusion rule.

## 3. Phần STT25 đã triển khai nhưng CHƯA commit

### Backend/domain/contracts

Đã tạo:

- `FoodSafe.BE/src/FoodSafe.Domain/Licensing/CfsCertificate.cs`
- `FoodSafe.BE/src/FoodSafe.Application.Contracts/Licensing/CfsCertificateDtos.cs`
- `FoodSafe.BE/src/FoodSafe.Application.Contracts/Licensing/CfsCertificateExcelDtos.cs`
- `FoodSafe.BE/src/FoodSafe.Application/Licensing/CfsCertificateAppService.cs`
- `FoodSafe.BE/src/FoodSafe.Application/Licensing/CfsCertificateDataScopeChecker.cs`
- `FoodSafe.BE/src/FoodSafe.Application/Licensing/CfsCertificateExpiryJob.cs`
- `FoodSafe.BE/src/FoodSafe.Application/Licensing/CfsCertificateExcelAppService.cs`
- `FoodSafe.BE/src/FoodSafe.Application/Licensing/PublicCfsCertificateAppService.cs`
- `FoodSafe.BE/src/FoodSafe.Application/FileManagement/CfsCertificateAttachmentAppService.cs`
- các HTTP controllers cho attachment, Excel và public lookup;
- `FoodSafe.BE/test/FoodSafe.Domain.Tests/Licensing/CfsCertificateTests.cs`.

Đã nối:

- permissions, permission definition, localization và current-user projection;
- role seed đúng ma trận nêu trên;
- AutoMapper;
- `DbSet<CfsCertificate>`;
- EF mapping;
- Hangfire recurring job `cfs-certificate-expiry`;
- attachment contract.

Data-scope implementation dùng bản sửa an toàn của STT22–24:

- product-group scope chỉ mở sản phẩm thuộc đúng group;
- không dùng product-group link để mở toàn bộ sản phẩm của cùng business;
- attachment scope checker dùng direct business access hoặc linked product
  group riêng biệt.

### Migration

Đã generate:

```text
FoodSafe.BE/src/FoodSafe.EntityFrameworkCore/Migrations/
  20260725154114_AddCfsCertificates.cs
  20260725154114_AddCfsCertificates.Designer.cs
```

Snapshot đã cập nhật. Migration có:

- `cfs_certificates`;
- date/status/revoke CHECK constraints;
- composite FK business + organization;
- composite FK product + business + organization;
- FK destination country;
- FK organization;
- global unique index cho `certificate_number`;
- business/product/country/expiry/organization indexes;
- FK thủ công `fk_cfs_document_owner` từ certificate ID đến
  `document_owners.id`.

### Frontend

Đã tạo feature:

```text
FoodSafe.FE/src/features/cfs-certificates/
```

Đã có:

- API, React Query hooks/mutations;
- types;
- editor có business, optional product, required destination country,
  certificate number, issue/expiry, authority và notes;
- internal page;
- public lookup page;
- route `/cfs-certificates`;
- anonymous route `/tra-cuu-cfs`;
- menu permission.

### Gate đã chạy trên trạng thái hiện tại

Các lệnh sau đã pass:

```text
dotnet build FoodSafe.sln --no-restore
dotnet test FoodSafe.sln --no-build --no-restore
npm run lint:ts
npm run lint
```

Kết quả backend hiện tại:

- Domain: 50;
- Application: 46;
- EF: 18;
- Host: 15;
- tổng: 129 tests pass.

Frontend TypeScript và Oxlint pass. Chưa chạy frontend unit tests sau khi
clone/chỉnh STT25.

## 4. Việc BẮT BUỘC sửa trước khi coi STT25 hoàn tất

### 4.1 Sửa document-owner insert ordering

Trong `CfsCertificateAppService.CreateAsync`, đoạn insert document owner hiện
được clone với `autoSave: false`. Phải đổi thành `autoSave: true` trước khi
insert certificate.

STT23/STT24 đã chứng minh PostgreSQL runtime có thể insert certificate trước
owner nếu để `false`, làm `fk_cfs_document_owner` fail dù unit build xanh.

### 4.2 Dọn UI được clone từ Product Registration

Các file page/public/tests ban đầu được clone cơ học từ STT22 nên vẫn còn
label/column/fixture cũ như:

- receipt number/date;
- product snapshot name/manufacturer;
- “đăng ký công bố”/DKCB;
- text thông báo và aria labels cũ.

Cần dọn:

- internal table chỉ nên hiển thị số CFS, cơ sở, linked product, quốc gia
  đích, ngày cấp/hết hạn, trạng thái, actions;
- thêm filter destination country đã có state/query/select nhưng xác nhận nó
  xuất hiện đúng trong UI;
- search placeholder chỉ nói số CFS;
- title/subtitle/message/delete/revoke strings đổi sang CFS;
- public lookup hiển thị số CFS, business, linked product, destination
  country, issue/expiry, authority, status;
- bỏ các field legacy khỏi TypeScript type sau khi page/public/tests không
  còn dùng. Hiện `receiptNumber`, `receiptDate`, `productName`,
  `manufacturer` được giữ optional tạm thời chỉ để TypeScript compile;
- attachment UI đang tái sử dụng
  `ProductRegistrationAttachmentsModal` qua `documentNumber` và
  `titlePrefix`; đây là chủ ý, không cần clone thêm modal.

Kiểm tra hiển thị Unicode tiếng Việt sau quá trình clone cơ học. PowerShell
output có thể hiển thị mojibake; dùng Prettier/editor/browser để xác nhận nội
dung file và UI thực tế.

### 4.3 Sửa frontend tests

Hai test được clone vẫn mang fixtures/assertions của product registration:

- `api/cfsCertificateApi.test.ts`
- `pages/CfsCertificatePage.test.tsx`

Phải cập nhật payload/response/assertions cho:

- `certificateNumber`;
- `issueDate`;
- `destinationCountryId`/`destinationCountryName`;
- country-options endpoint;
- quyền read-only và write actions;
- không còn receipt/manufacturer/product snapshot.

Sau đó chạy toàn bộ Vitest, không chỉ file mới.

### 4.4 Bổ sung backend contract/mapping tests

Cần cập nhật:

- `CurrentUserContextPermissionContractTests` để assert đủ 4 quyền CFS;
- EF mapping test để assert table/checks/FKs/indexes của CFS;
- cân nhắc thêm test country required/invalid country và retained unique
  number qua application/E2E.

### 4.5 Localizations/domain errors

Permission localizations đã thêm. Nên thêm localization message cho sáu error
codes CFS nếu convention các slice trước yêu cầu:

```text
FoodSafe:CfsCertificate:0001 DuplicateNumber
FoodSafe:CfsCertificate:0002 InvalidDateRange
FoodSafe:CfsCertificate:0003 ProductMismatch
FoodSafe:CfsCertificate:0004 AlreadyRevoked
FoodSafe:CfsCertificate:0005 CannotModifyRevoked
FoodSafe:CfsCertificate:0006 CountryNotFound
```

### 4.6 Format và model verification

Sau khi sửa code:

```powershell
cd FoodSafe.BE
dotnet format FoodSafe.sln
dotnet build FoodSafe.sln -c Release --no-restore -warnaserror
dotnet test FoodSafe.sln -c Release --no-build --no-restore
dotnet ef migrations has-pending-model-changes `
  --project src/FoodSafe.EntityFrameworkCore/FoodSafe.EntityFrameworkCore.csproj `
  --startup-project src/FoodSafe.HttpApi.Host/FoodSafe.HttpApi.Host.csproj `
  --context FoodSafeDbContext --no-build

cd ../FoodSafe.FE
npm run format
npx prettier --write e2e/cfs-certificates.spec.ts
npm run format:check
npm run lint
npm run lint:ts
npm test -- --run
npm run build

cd ..
git diff --check
```

Không format toàn bộ thư mục `e2e` một cách mù quáng: hiện có cảnh báo
Prettier ở `e2e/businesses.spec.ts` đã tồn tại ngoài phạm vi STT25. Chỉ format
file E2E mới hoặc xử lý file cũ trong một commit riêng.

## 5. Docker và E2E còn thiếu

Chưa rebuild/migrate Docker với migration CFS. Cần:

1. rebuild migrator/API/frontend bằng `FoodSafe.BE/docker-compose.yml`;
2. dùng `--env-file .env.example` nếu shell thiếu env;
3. xác nhận mọi container healthy;
4. kiểm tra OpenAPI có conventional endpoints:
   - `/api/v1/app/cfs-certificate`
   - business/product/country options
   - revoke
   - attachment routes
   - Excel
   - `/api/v1/public/cfs-certificates`;
5. kiểm tra PostgreSQL constraints/indexes/FKs, đặc biệt
   `fk_cfs_document_owner` và global retained-number unique index;
6. kiểm tra Hangfire job `cfs-certificate-expiry`, cron daily,
   timezone `Asia/Bangkok`;
7. tạo `FoodSafe.FE/e2e/cfs-certificates.spec.ts`.

E2E tối thiểu:

```text
login admin
→ chọn business/product/country active
→ create CFS
→ list/filter country/status/expiry
→ Excel export
→ upload PDF sạch
→ download
→ delete attachment
→ anonymous exact-number lookup
→ revoke
→ upload sau revoke phải bị chặn
→ soft-delete
→ tạo lại cùng certificate number phải bị từ chối
```

Nên thêm negative-scope scenario nếu test fixture cho phép: user chỉ có
product-group scope không được nhìn sản phẩm khác của cùng cơ sở.

## 6. Documentation và commit còn thiếu

Khi tất cả gate xanh:

- tạo `docs/53-cfs-certificate-management.md` hoặc đổi số phù hợp nếu có tài
  liệu khác được thêm trước;
- cập nhật:
  - `docs/00-index.md`
  - `docs/16-implementation-gap-analysis.md`
  - `docs/20-implementation-roadmap.md`
  - `docs/41-implementation-progress.md`;
- tăng test/migration counts theo kết quả thực tế;
- ghi rõ STT25 Done, STT26 còn lại trong Milestone 3.

Commit đề xuất:

```text
feat: complete CFS certificate lifecycle
```

Chỉ commit sau khi Release gates, migration check, Docker E2E và database
inspection đều pass. Sau đó mới audit/triển khai STT26 Export Food
Certificates.

## 7. Lệnh bắt đầu nhanh cho agent tiếp theo

```powershell
cd C:\Users\ADMIN\workspace\Free\FoodSafe
Get-Content CLAUDE.md
Get-Content docs/52-stt25-cfs-handoff.md
git status --short

# Sửa đầu tiên:
rg -n -C 5 "DocumentOwner.Create|autoSave" `
  FoodSafe.BE/src/FoodSafe.Application/Licensing/CfsCertificateAppService.cs

# Tìm toàn bộ dấu vết UI clone cần dọn:
rg -n "receipt|manufacturer|productName|DKCB|đăng ký công bố|Ä|Ã" `
  FoodSafe.FE/src/features/cfs-certificates
```

Không cần move `.claude`; Codex/Claude đều đọc trực tiếp được thư mục này.
Đọc root `CLAUDE.md` và các file `.claude` liên quan trước khi tiếp tục.
