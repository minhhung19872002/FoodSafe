# F-031 — Documents (Văn bản hành chính)

## Status: VERIFIED

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
