# Functional Audit — Implementation Progress (Step 5)

**Batch**: F-1 — "STT 51–57 share completion" (per [02-prioritized-functional-backlog.md](02-prioritized-functional-backlog.md))
**Date**: 2026-07-28 · baseline `78322f2` + working tree

## Requirement IDs addressed

- FR-51..57-02 / INT-02 (software side) — outbound share now carries **real typed records** (P1-A)
- FR-51..57 "Thử lại" — retry of failed communications (P1-B)
- FR-51..57 attempt history — correlation id + attempt number + SHA-256 checksum, immutable rows (P1-C)
- FR-51..57-03 — history **time-range filter** in the UI (P1-D)

## Changes

### Backend
| File | Change |
|---|---|
| `FoodSafe.Domain/DataIntegration/ApiCallLog.cs` | + `EndpointId`, `CorrelationId`, `AttemptNumber` (≥1), `PayloadChecksum` — factory-validated, immutable |
| `FoodSafe.EntityFrameworkCore/.../FoodSafeDbContextModelCreatingExtensions.cs` | Column mappings, default `attempt_number=1`, check `chk_di_cl_attempt`, partial index `idx_di_cl_correlation` |
| `Migrations/20260728001241_AddApiCallLogRetryAttempts` | 4 columns + index + check constraint on `di_api_call_logs` |
| `FoodSafe.Application/DataIntegration/SharedDataPayloadBuilders.cs` (new) | `ISharedDataPayloadBuilder` strategy per `SharedDataType` (CLAUDE.md §15.6): Alert, News, InspectionResult, FoodPoisoning, Product, Business + License (4 kinds merged with `kind` discriminator). Org-data-scope enforced inside every builder; specific record when `EntityId` given (Vietnamese not-found error when out of scope), latest-N otherwise |
| `FoodSafe.Application/DataIntegration/DataSharingAppService.cs` | `ShareAsync` builds versioned envelope `{schemaVersion, dataType, note, organizationId, sharedAt, source, recordCount, records[]}` (camelCase + string enums), records checksum/endpoint/attempt. New `RetryAsync(logId)`: Share permission (class-level), data-scope check on log **and** endpoint, Outbound-only, failed-only, endpoint-must-exist + active, re-sends the **stored body verbatim**, appends attempt max+1 chained to the envelope root. Send path extracted to `SendAndLogAsync` (SSRF guard + auth-header injection unchanged) |
| `FoodSafe.Application.Contracts/DataIntegration/*` | `IDataSharingAppService.RetryAsync`; DTOs expose `endpointId`, `correlationId`, `attemptNumber` (+ `payloadChecksum` on detail) |
| `FoodSafe.HttpApi/DataIntegration/DataSharingController.cs` | `POST /api/v1/app/data-sharing/retry/{logId}` |

### Frontend
| File | Change |
|---|---|
| `types/dataIntegration.types.ts` | Mirror new DTO fields |
| `api/dataIntegrationApi.ts`, `api/dataIntegrationMutations.ts` | `retryCallLog` + `useRetryCallLog` (invalidates history) |
| `pages/DataIntegrationPage.tsx` | "Thử lại" button (Popconfirm) on failed Outbound rows, gated by `DataIntegration.Share`; "Lần" attempt column (#n tag for retries); date-range filter (fromDate/toDate); detail modal shows attempt + checksum; server business errors surfaced in Vietnamese |

### Tests
| Layer | Test | Result |
|---|---|---|
| BE contract | `DataIntegrationApplicationContractTests` +2: Share/Retry permission policy; exactly one payload builder per data type | pass |
| BE mapping | `DataIntegrationMappingTests` (new): columns, default, max-length, partial index, check constraint | pass |
| BE full | `dotnet test` | **621/621** |
| E2E | `data-integration-retry.spec.ts` (new, 3 tests): typed-payload proof at a real receiver; UI retry → linked immutable attempt + reload persistence + range filter; guards (successful-refused VN error, noperm 403) | see doc 04 |
| E2E regression | data-integration subset (credentials 6, verification, data-integration, share 3) | see doc 04 |

## Design notes

- Retry re-sends the **stored** payload rather than rebuilding it — the envelope is the auditable unit; checksum equality across attempts proves nothing was rewritten (docs/01 §STT 51–57 attempt-history requirement).
- Old rows (pre-migration) have `endpoint_id = NULL` → retry refuses with a Vietnamese message instead of guessing the endpoint.
- The TT 31/2026 **exact field mapping** remains the blocked-external remainder (backlog P2-3); the envelope now carries the real records so the mapping layer is a serialization concern, not a data-plumbing one.

## Deviations / incidents

- Repaired 3 stale EF mapping assertions (`BusinessManagementMappingTests`) that predated the intentional C-4 soft-delete-filter change — the tests asserted no filter, the committed schema has `is_deleted = FALSE`. Test-only fix; not a weakening (assertions now pin the intended filter).
- A **parallel agent session** is active in this repo (CI/deps/Dockerfile work). It transiently wrote an invalid `common.props` (XML comment containing `--`), which broke one `dotnet build`/restore of mine mid-session; the file returned to the committed valid state and the build passed unchanged. Batch F-1 touches a disjoint file set.
