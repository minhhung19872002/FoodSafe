# F-019 — Data Integration (Tích hợp dữ liệu)

## Status: VERIFIED

- **Feature ID**: F-019 · **Verified Git commit**: `11a6537` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/data-integration` (tabs: Cấu hình API / Lịch sử gọi API)
- **Endpoints**:
  - `GET/POST /api/v1/app/api-endpoint`
  - `GET/PUT/DELETE /api/v1/app/api-endpoint/{id}`
  - `POST /api/v1/app/api-endpoint/{id}/toggle-status`
  - `GET /api/v1/app/api-call-log`
  - `GET /api/v1/app/api-call-log/{id}`

## Evidence

- `e2e/data-integration.spec.ts` — UI lifecycle: endpoint creation via dialog (name, URL, method, system, auth), delete, call-history tab navigation.
- `e2e/data-integration-verification.spec.ts` — 7 tests:
  1. Unauthenticated → 401/302
  2. `noperm` → 403 on endpoint list
  3. `district.staff` → 403 on both endpoint list and call-log list (DataIntegration is a province-level function)
  4. Full CRUD lifecycle: create → GET by id (verify fields) → update (name, method, system) → toggle-status Active→Inactive→Active → delete → GET returns 404
  5. Server-side validation: missing Name, missing URL, missing HttpMethod, missing ExternalSystem each → 400
  6. Call history readable by admin: GET /api/v1/app/api-call-log → 200, returns `{ items: [], totalCount: N }`
  7. Persistence after reload + empty state (UI): create fixture → search on `/data-integration` → assert visible → reload → re-search → assert visible → search non-existent → assert antd Empty

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission | PASS (401 / 403) |
| District staff (no DataIntegration permissions) | PASS — 403 at authorization layer |
| Full CRUD lifecycle | PASS |
| Toggle-status Active↔Inactive | PASS |
| Server-side validation | PASS |
| Call history readable | PASS |
| Persistence after reload, empty state (UI) | PASS |
| Org scope | PASS structurally — same `ScopedQueryAsync`/`GetScopedAsync` pattern as F-006..F-018; province-only access enforced via permission layer for district role |

## Notes

- DataIntegration is a province-level capability — district staff are denied at the permission check before reaching org-scope filtering, identical to F-017 (TestingResults).
- `ToggleStatusAsync` returns `void` (204 No Content) — the test verifies the new status by issuing a follow-up `GET`.
- No duplicate-name constraint exists in the AppService; duplicates are allowed by design.
- UI search placeholder on the Cấu hình API tab is `"Tên, URL, hệ thống"` (not a generic "Tìm kiếm...").

## Paths & dependencies

- FE `src/features/data-integration/**`; BE `Application/DataIntegration/ApiEndpointAppService.cs`, `Application/DataIntegration/ApiCallLogAppService.cs`, `Domain/DataIntegration/ApiEndpoint.cs`, `Domain/DataIntegration/ApiCallLog.cs`
- Depends on auth/scope/axios (Level 3)
- Invalid for commits after `11a6537` touching these paths

---

# F-019f — Inbound partner surface (Batch F-2, INT-03)

## Status: VERIFIED

- **Feature ID**: F-019f · **Verified Git commit**: `52d35c1` · **Date**: 2026-07-28
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` (api + migrator rebuilt from the working tree; migration `20260728064640` applied) · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin` (real login); partner calls use a **cookie-less** Playwright `request` context — no session, X-Api-Key only
- **Frontend route**: `/data-integration` (new tabs: Đối tác liên thông / Dữ liệu nhận về)
- **Endpoints**:
  - `GET/POST /api/v1/app/partner-account`, `GET/PUT/DELETE /api/v1/app/partner-account/{id}`, `POST .../toggle-status`
  - `GET/POST /api/v1/app/partner-account/{id}/keys`, `DELETE .../keys/{keyId}`
  - `GET /api/v1/app/partner-account/submissions[/{submissionId}]`
  - `POST /api/v1/partner/submissions/{dataType}` (partner-facing, anonymous at ASP.NET level, X-Api-Key-authenticated in-service)

## Evidence

`e2e/data-integration-partners.spec.ts` — 3/3 (subset run 23/23 at `52d35c1`):

1. **Lifecycle via real UI**: create partner (dialog) → issue key (raw `fsp_…` key rendered exactly once) → cookie-less partner POST → 200 + submissionId → duplicate X-Request-Id → `duplicate:true` + original id + exactly one DB row → submission row + Vietnamese payload visible in UI, survive reload → Inbound row in call history → UI revoke → 401 → UI rotation (new key authenticates) → UI suspend (popconfirm) → 401.
2. **Guards**: no/garbage/unprefixed key → 401; expired key → 401; suspended partner → 401 (single generic message across all credential failures); data type outside allow-list → 403 `DataTypeNotAllowed`; unknown segment, stale timestamp (±300s replay window), missing X-Request-Id, missing X-Timestamp, unsupported schemaVersion, empty records → 400.
3. **Idempotency scope**: same X-Request-Id from two partners → two independent submissions; admin `PartnerAccountId` filter isolates each; anonymous admin surface → 401.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated (partner API, admin API) | PASS (401 both) |
| Key auth: revoked/expired/suspended/unknown | PASS — uniform 401, no state leak |
| Per-partner data-type authorization | PASS (403) |
| Replay window + required headers + schema gate | PASS (400 each) |
| Idempotency (DB unique index, per-partner scope) | PASS |
| Create / edit / suspend / delete partner; issue / rotate / revoke key | PASS (UI) |
| Submissions list/filter/detail; Inbound ApiCallLog rows | PASS (UI) |
| Persistence after reload | PASS |
| Org scope | PASS structurally — same `ScopedQueryAsync`/data-scope-provider pattern as the rest of the module (province-level permissions) |

## Notes

- Two product defects were found by this run and fixed at `52d35c1`: empty-records 500 (ABP arg-validation vs. the data-outcome contract; now `[DisableValidation]` + in-method checks) and `\uXXXX`-escaped stored payloads (now human-readable).
- Raw API keys are never persisted or retrievable: storage is SHA-256 hash + 12-char prefix; verification is fixed-time.
- Business ingestion of received payloads stays EXTERNALLY_BLOCKED on the TT 31/2026 field mapping (INT-02); submissions persist verbatim with status `Received`.

## Paths & dependencies

- BE `Domain/DataIntegration/{PartnerAccount,PartnerApiKey,InboundSubmission}.cs`, `Application/DataIntegration/{PartnerAccountAppService,PartnerInboundAppService,PartnerKeyMaterial}.cs`, `HttpApi/DataIntegration/{PartnerAccountController,PartnerInboundController}.cs`
- FE `src/features/data-integration/components/{PartnersTab,InboundSubmissionsTab}.tsx`
- Depends on auth/scope/axios (Level 3) + `OutboundUrlValidator` (shared outbound client, hardened this batch)
- Invalid for commits after `52d35c1` touching these paths
