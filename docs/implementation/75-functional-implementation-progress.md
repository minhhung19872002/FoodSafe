# Functional Implementation Progress — Batches A–F

**Branch**: `codex/production-readiness`
**Predecessor**: docs/implementation/74-functional-completion-backlog.md
**Last updated**: 2026-07-27

---

## Batch Summary

| Batch | FR IDs | Description | Status | Tests after |
|-------|--------|-------------|--------|-------------|
| A | FR-03-02, FR-03-03 | Audit log detail drawer + Excel export | Done | 519 BE / 112 FE |
| B | FR-02-05, FR-02-13 | User delete + user list Excel export | Done | 519 BE / 112 FE |
| C | FR-06-06 | Organization list Excel export | Done | 519 BE / 112 FE |
| D | FR-39-02 | Dashboard year + org selector | Done | 519 BE / 112 FE |
| E | FR-40-02/04/06/08, FR-40-07 | Statistics Excel export + org breakdown | Done | 519 BE / 112 FE |
| F | FR-19-02 | Business advanced search filters (type + classification) | Done | 519 BE / 112 FE |

---

## Batch A — Audit Log Improvements

**Files changed (BE)**:
- `FoodSafe.Application.Contracts/Dashboard/AuditLogDtos.cs` — `AuditLogDetailDto`, `IAuditLogExcelAppService`
- `FoodSafe.Application/Dashboard/AuditLogAppService.cs` — `GetDetailAsync(Guid id)`
- `FoodSafe.Application/Dashboard/AuditLogExcelAppService.cs` — ClosedXML workbook export
- `FoodSafe.HttpApi/Dashboard/AuditLogController.cs` — `GET /api/v1/app/audit-log/excel`

**Files changed (FE)**:
- `features/audit-logs/api/auditLogApi.ts` — `getDetail()`, `exportExcel()`
- `features/audit-logs/api/auditLogMutations.ts` — `useExportAuditLogs()`
- `features/audit-logs/pages/AuditLogPage.tsx` — detail drawer, Excel button

---

## Batch B — User Management Completion

**Files changed (BE)**:
- `FoodSafe.Domain.Shared/Permissions/FoodSafePermissions.cs` — `Users.Delete` permission
- `FoodSafe.Application.Contracts/Permissions/FoodSafePermissionDefinitionProvider.cs` — registered delete permission
- `FoodSafe.Domain.Shared/Localization/FoodSafe/en.json` + `vi.json` — delete permission labels
- `FoodSafe.Application.Contracts/IdentityAdministration/IIdentityAdministrationAppService.cs` — `DeleteUserAsync`
- `FoodSafe.Application.Contracts/IdentityAdministration/IUserExcelAppService.cs` — new interface
- `FoodSafe.Application/IdentityAdministration/IdentityAdministrationAppService.cs` — delete with scope + role + profile cleanup
- `FoodSafe.Application/IdentityAdministration/UserExcelAppService.cs` — ClosedXML export
- `FoodSafe.HttpApi/IdentityAdministration/IdentityAdministrationController.cs` — `DELETE users/{id}`, `GET users/excel`

**Files changed (FE)**:
- `features/identity/api/identityApi.ts` — `deleteUser()`, `exportUsers()`
- `features/identity/api/identityMutations.ts` — `useDeleteAdminUser()`, `useExportUsers()`
- `features/identity/pages/IdentityAdministrationPage.tsx` — delete Popconfirm, Excel button

---

## Batch C — Organization Excel Export

**Files changed (BE)**:
- `FoodSafe.Application.Contracts/Organizations/IOrganizationExcelAppService.cs` — new interface
- `FoodSafe.Application/Organizations/OrganizationExcelAppService.cs` — paginated export, max 5000 rows
- `FoodSafe.HttpApi/Organizations/OrganizationExcelController.cs` — `GET /api/v1/app/organization/excel`

**Files changed (FE)**:
- `features/organizations/api/organizationApi.ts` — `exportExcel()`
- `features/organizations/api/organizationMutations.ts` — `useExportOrganizations()`
- `features/organizations/pages/OrganizationListPage.tsx` — Excel button in PageHeader actions

---

## Batch D — Dashboard Year/Org Selector

**Files changed (BE)**:
- `FoodSafe.Application.Contracts/Dashboard/DashboardDtos.cs` — `DashboardStatsFilter { Year?, OrganizationId? }`
- `FoodSafe.Application/Dashboard/DashboardAppService.cs` — org scope narrowing + year `.WhereIf` on all 13 queries

**Files changed (FE)**:
- `features/dashboard/types/dashboard.types.ts` — `DashboardStatsFilter`
- `features/dashboard/api/dashboardApi.ts` — params forwarding
- `features/dashboard/api/dashboardQueries.ts` — filter in queryKey
- `features/dashboard/pages/DashboardPage.tsx` — year Select + org Select in PageHeader

---

## Batch E — Statistics Excel Export + Org Breakdown

**Files changed (BE)**:
- `FoodSafe.Application.Contracts/Dashboard/StatisticsDtos.cs` — `StatisticsFilterDto.OrganizationId?`
- `FoodSafe.Application.Contracts/Dashboard/IStatisticsExcelAppService.cs` — new interface
- `FoodSafe.Application/Dashboard/StatisticsAppService.cs` — org scope narrowing
- `FoodSafe.Application/Dashboard/StatisticsExcelAppService.cs` — 4-sheet workbook (businesses, licenses, inspections, poisoning)
- `FoodSafe.HttpApi/Dashboard/StatisticsExcelController.cs` — `GET /api/v1/app/statistics/excel`

**Files changed (FE)**:
- `features/statistics/types/statistics.types.ts` — `StatisticsFilter.organizationId?`
- `features/statistics/api/statisticsApi.ts` — `exportExcel()`
- `features/statistics/api/statisticsQueries.ts` — `useExportStatistics()`
- `features/statistics/pages/StatisticsPage.tsx` — org Select + "Xuat Excel" button

---

## Batch F — Business Advanced Search Filters

**Files changed (FE)**:
- `features/businesses/components/BusinessManagementView.tsx` — 3 new props (`businessTypeId`, `businessClassificationId`, options), 2 new handler props, 2 new Select dropdowns in filter toolbar
- `features/businesses/pages/BusinessManagementPage.tsx` — state for `businessTypeId`, `businessClassificationId`; computed options from `useCatalogOptions`; wired to query + view + export

**BE changes**: None — `BusinessListInput` already supported `BusinessTypeId?` and `BusinessClassificationId?`; this batch only exposed them in the FE.

---

## Test Baseline (after all batches)

```
BE HttpApi.Host.Tests:    53 passed
BE Application.Tests:    251 passed
BE Domain.Tests:         197 passed
BE EntityFrameworkCore:   18 passed
BE Total:                519 passed / 0 failed

FE Vitest:               112 passed / 0 failed
FE TypeScript:           0 errors
```
