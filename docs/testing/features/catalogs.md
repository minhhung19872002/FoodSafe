# F-004 — Master Catalogs

## Status: VERIFIED

- **Feature ID**: F-004 · **Verified Git commit**: `94f1f57` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/catalogs`
- **Endpoints**:
  - `GET /api/v1/app/master-catalog/countries` — list countries
  - `GET /api/v1/app/master-catalog/regions` — list regions
  - `GET /api/v1/app/master-catalog/document-types` — list document types
  - `POST /api/v1/app/master-catalog/document-types` — create
  - `PUT /api/v1/app/master-catalog/document-types/{id}` — update
  - `DELETE /api/v1/app/master-catalog/document-types/{id}` — delete

## Excel import (bổ sung 2026-07-31)

- **Status**: VERIFIED · **Verified Git commit**: xem `01-feature-verification-registry.md`
- **Environment**: Vite dev server `http://localhost:5173` → API `http://localhost:5019` → PostgreSQL 15 thật (`foodsafe-postgres-1`) · **API interception**: **No**
- **Account**: `admin` (login thật qua `POST /api/account/login`)
- **Endpoints**:
  - `GET /api/v1/app/master-catalog/excel/template?kind={MasterCatalogKind}` — tải file mẫu
  - `POST /api/v1/app/master-catalog/excel/preview?kind={MasterCatalogKind}` — kiểm tra file, trả lỗi theo dòng
  - `POST /api/v1/app/master-catalog/excel/confirm` — ghi dữ liệu theo `confirmationToken`
- **Phân quyền**: cả 3 endpoint yêu cầu `FoodSafe.Catalogs.Create`

`e2e/catalogs-excel-import.spec.ts` — 4 tests (đều PASS):

1. Tải file mẫu cho tab đang mở → `mau-import-loai-van-ban.xlsx`
2. Preview file hợp lệ (2 dòng) → xác nhận → toast "Đã import 2 dòng loại văn bản";
   dữ liệu xuất hiện trong danh sách lấy từ API và **còn nguyên sau khi reload trang**
3. File sai dữ liệu → báo lỗi theo dòng (thiếu tên bắt buộc, thứ tự không phải số,
   trùng mã trong file); **không có** nút xác nhận và `totalCount` trong DB = 0
4. File sai tên cột → báo `Cột 1 phải có tên "Mã*"`, không cho import

Kiểm tra thêm bằng HTTP thật: `GET .../excel/template` trả `200` cho cả 9 `MasterCatalogKind`
(Country, Region, ProductGroup, BusinessType, BusinessClassification, AdvertisementType,
DocumentType, TestingCenter, TestingService).

### Điều kiện cần retest

- Đổi `MasterCatalogExcelWorkbook` (cấu trúc cột / sheet của file mẫu)
- Đổi `MasterCatalogAppService` (các hàm `Create*`) vì bước Confirm gọi qua đó
- Đổi `ExcelImportModal` dùng chung (ảnh hưởng cả import Cơ sở/Sản phẩm — F-006)

## Evidence

`e2e/catalogs-verification.spec.ts` — 7 tests:
1. Unauthenticated → 401
2. No-permission user → 403
3. district.staff with `Catalogs.View` can GET seeded catalog types → 200
4. district.staff without `Catalogs.Create` cannot POST → 403
5. Admin full CRUD on DocumentType
6. Multiple seeded catalog types have data (`countries` and `regions` are seeded by `MasterCatalogDataSeedContributor`)
7. UI: catalog management page loads with data

## Seeded data clarification

`MasterCatalogDataSeedContributor` seeds: **Countries** and **Regions** only.
`business-types`, `product-groups`, and `document-types` are NOT seeded — tests use Countries and Regions to verify seeded data presence.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated → 401 | PASS |
| No-permission → 403 | PASS |
| district.staff view → 200 | PASS |
| district.staff create → 403 | PASS |
| Admin CRUD (DocumentType) | PASS |
| Multiple catalog types seeded | PASS |
| UI page loads | PASS |

## Notes

- `Catalogs.View` permission is granted to `district.staff` role.
- `Catalogs.Create`, `Catalogs.Edit`, `Catalogs.Delete` are NOT granted to `district.staff` — staff can only read.
- Returned lists are `PagedResultDto<T>` (has `totalCount`).

## Paths & dependencies

- FE: `src/features/catalogs/`, `src/components/ExcelImportModal.tsx`, `src/types/excelImport.ts`
- BE: `FoodSafe.Application/Catalogs/`, `FoodSafe.HttpApi/Catalogs/`
- Depends on: Authentication (F-001)
- Chia sẻ với F-006 (Businesses & Products): `ExcelImportModal` — trước đây là
  `BusinessImportModal` trong feature `businesses`, đã chuyển thành component dùng chung.
