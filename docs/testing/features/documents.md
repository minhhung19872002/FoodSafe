# F-031 — Documents (Văn bản hành chính)

## Status: VERIFIED

## Re-verification 2026-07-28 — production-readiness hardening

Deep FE+BE inspection of `/documents`; fixes re-proven on the rebuilt Docker
stack (no API interception). Doubles as the Level-2 retest owed by the sorting
DIRTY batch.

| # | Defect | Fix |
|---|---|---|
| 1 | `CreateAsync` used `scope.OrganizationIds.First()` — global user without an org profile → InvalidOperationException **500** (same class as F-017) | `HomeOrganizationId` first, guarded fallback → localized `DataScope.OrganizationNotFound` |
| 2 | `DocumentTypeId` never validated — bogus/`Guid.Empty` GUID died as an FK-violation **500** | `EnsureDocumentTypeAsync` (exists + active) on create/update → `FoodSafe:Document:0002`, vi/en localized |
| 3 | `SetStatus` accepted undefined enum values → DB check-constraint 500 | domain guard → `FoodSafe:Document:0003` |
| 4 | DTO had no validation attributes | `[Required]`/`[StringLength]` on DocumentNumber/Title/IssuingAuthority |
| 5 | ApplySorting had no Id tiebreaker (unstable paging) | `.ThenBy(x => x.Id)` on every branch |
| 6 | Excel export dropped `Sorting`; FE didn't pass `sorting` to export either | BE copies `Sorting`; FE sends `{...filter, sorting}` |
| 7 | Page used static antd `message` (context warning), hardcoded error toasts, `isLoading` with `keepPreviousData` | `App.useApp()` + `extractApiError` + `isFetching` |
| 8 | No date-order UX validation (hết hiệu lực trước ban hành nhập được, chỉ chết ở server nếu có rule) | antd validators: hiệu lực ≥ ban hành, hết hiệu lực ≥ hiệu lực |
| 9 | Spec clicked confirm `"OK"` | `/^(Xóa|Đồng ý|OK)$/` in dialog |

- **Evidence run** (workers=1): `documents.spec.ts` +
  `documents-verification.spec.ts` → **7/7 passed** (first attempt hit
  ECONNREFUSED mid-run — the concurrent session restarted the stack; clean
  re-run green). BE AlertsAndTesting tests **37/37**; FE Vitest documents
  **4/4**; `tsc -b` clean.

- **Feature ID**: F-031 · **Verified Git commit**: `5444001` (defect fixed before this commit) · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/documents`
- **Endpoints**:
  - `GET /POST /api/v1/app/administrative-document`
  - `GET /PUT /DELETE /api/v1/app/administrative-document/{id}`
  - `POST /api/v1/app/master-catalog/document-type` (fixture creation)
  - `DELETE /api/v1/app/master-catalog/{id}/document-type` (fixture cleanup)

## Evidence

- `e2e/documents.spec.ts` — UI smoke: column header visible, Excel export, create via modal, delete.
- `e2e/documents-verification.spec.ts` — 6 tests:
  1. Unauthenticated → 401/302
  2. `noperm` → 403
  3. `district.staff` → 403 (no `AlertsAndTesting.Documents.View` permission)
  4. Full CRUD lifecycle: create document type via catalog API → create document with that typeId → GET verify fields → PUT (set isPublic=true) → DELETE → GET 404
  5. Validation: missing `title` → 400, missing `documentNumber` → 400
  6. Persistence after reload + empty state (UI): search → assert visible → reload → re-search → empty state

## Product defect found and fixed (before verified commit)

**`DocumentsPage.tsx` form sent `documentTypeName` (a display string) instead of `documentTypeId` (Guid) to the API.** The form used a hardcoded options array with string values like "Luật", "Nghị định", "Thông tư", but the API DTO only has `documentTypeId: Guid`. Every document created via UI had `documentTypeId = Guid.Empty`, so the "Loại VB" column rendered blank for all UI-created records.

**Fix:**
1. Added `documentTypeOptions()` method to `documentApi.ts` calling `GET /api/v1/app/master-catalog/document-types`
2. Added `useDocumentTypes()` query hook to `documentQueries.ts`
3. Changed form `Form.Item name` from `"documentTypeName"` to `"documentTypeId"` with a catalog-backed searchable Select in `DocumentsPage.tsx`

**Note:** `DocumentType` catalog entries are not seeded by the data seed contributor. The verification spec creates and destroys document type fixtures via the catalog API.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission | PASS (401 / 403) |
| District staff denied | PASS |
| Full CRUD lifecycle with real catalog type | PASS after fix |
| Server-side validation | PASS |
| Persistence after reload, empty state | PASS |
| Org scope | PASS structurally — same `ScopedQueryAsync` pattern as other features |

## Paths & dependencies

- FE `src/features/documents/**`; BE `Application/AlertsAndTesting/AdministrativeDocumentAppService.cs`
- Depends on `MasterCatalogAppService` (document types catalog), auth/scope/axios (Level 3)
- Invalid for commits after this fix touching these paths
