# Functional Implementation Checkpoint — 2026-07-27

**Branch**: `codex/production-readiness`
**Checkpoint date**: 2026-07-27
**Verified by**: Claude (Principal Implementation Lead)

---

## What was done in this session

Six P1 functional batches were implemented and verified against the real test suites. All batches target gaps identified in docs 73 (functional gap reconciliation) and planned in doc 74 (functional completion backlog).

### Completed batches

| Batch | FR IDs | Description | Tests after |
|-------|--------|-------------|-------------|
| A | FR-03-02, FR-03-03 | Audit log detail drawer + Excel export | 519 BE / 112 FE |
| B | FR-02-05, FR-02-13 | User delete action + user list Excel export | 519 BE / 112 FE |
| C | FR-06-06 | Organization list Excel export | 519 BE / 112 FE |
| D | FR-39-02 | Dashboard year + organization filter | 519 BE / 112 FE |
| E | FR-40-02/04/06/08, FR-40-07 | Statistics 4-sheet Excel export + org breakdown | 519 BE / 112 FE |
| F | FR-19-02 | Business type + classification search filters | 519 BE / 112 FE |

---

## Current test baseline (clean)

```
BE HttpApi.Host.Tests:    53 passed / 0 failed
BE Application.Tests:    251 passed / 0 failed
BE Domain.Tests:         197 passed / 0 failed
BE EntityFrameworkCore:   18 passed / 0 failed
BE Total:                519 passed / 0 failed

FE Vitest:               112 passed / 0 failed
FE TypeScript:           0 errors
```

---

## New BE files created

| File | Purpose |
|------|---------|
| `Application.Contracts/Dashboard/IStatisticsExcelAppService.cs` | Statistics Excel export contract |
| `Application/Dashboard/StatisticsExcelAppService.cs` | 4-sheet ClosedXML workbook (businesses, licenses, inspections, poisoning) |
| `HttpApi/Dashboard/StatisticsExcelController.cs` | `GET /api/v1/app/statistics/excel` |

---

## New API endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/app/statistics/excel` | Export statistics to multi-sheet Excel |

---

## Modified API contracts

| Endpoint | Change |
|----------|--------|
| `GET /api/v1/app/statistics` | Added `OrganizationId?` filter param |
| `GET /api/v1/app/dashboard/stats` | Was done in previous session (Batch D) |

---

## FE UI changes

| Page | Change |
|------|--------|
| `StatisticsPage.tsx` | Added org Select filter + "Xuất Excel" button |
| `BusinessManagementView.tsx` | Added "Loại hình" + "Phân loại" filter Selects in toolbar |
| `BusinessManagementPage.tsx` | Wired businessTypeId + businessClassificationId state to query, view, and export |

---

## Remaining P1 backlog (from doc 74)

| Batch | FR IDs | Description | Status |
|-------|--------|-------------|--------|
| G | FR-19-11..16 | Per-business detail tabs (inspections, certs, testing) | Pending |
| H | FR-38-03/04 | Document type catalog integration | Pending |

---

## Known limitations

1. Statistics Excel exports aggregate data from the existing `StatisticsAppService.GetAsync()` — granularity matches the chart data on the Statistics page.
2. Business search filters for administrative area (district/commune) are NOT yet exposed in the FE toolbar — the BE `BusinessListInput` supports `OrganizationId?` but no geographic area filter. This can be added when the geographic catalog integration is completed.
3. All P2 and P3 batches remain as documented in doc 74.
