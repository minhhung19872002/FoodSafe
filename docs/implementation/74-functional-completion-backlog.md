# 74 — Functional Completion Backlog

**Date**: 2026-07-27
**Branch**: `codex/production-readiness`
**Predecessor**: docs/implementation/73-functional-gap-reconciliation.md
**Purpose**: Ordered implementation backlog for the current and future sessions

---

## Priority Rules

- P0: Broken required flows / data loss / authorization bypass
- P1: Missing required customer functions / incomplete workflows
- P2: Secondary functions, report views, public portal attachments
- P3: External integration (requires partner APIs — not implementable this session)

---

## P1 Batch Schedule

### Batch A — Audit Log Improvements (FR-03-02, FR-03-03)
**Effort**: ~3 hours  
**Items**:
- FR-03-02: Add detail drawer to AuditLogPage showing exception text, action items, entity changes
- FR-03-03: Add Excel export to AuditLogAppService and AuditLogPage export button

**BE changes**:
- `AuditLogAppService.GetDetailAsync(Guid id)` returning `AuditLogDetailDto`
- New `AuditLogExcelAppService.ExportAsync(GetAuditLogListInput input)`
- New contract: `AuditLogDetailDto`, `IAuditLogExcelAppService`
- HTTP controller route: `GET /api/audit-logs/{id}`, `GET /api/audit-logs/excel`

**FE changes**:
- `AuditLogPage.tsx`: add detail drawer, add Excel export button, add `auditLogApi.getDetail()`, `auditLogApi.exportExcel()`

---

### Batch B — User Management Completion (FR-02-05, FR-02-13)
**Effort**: ~2 hours  
**Items**:
- FR-02-05: Add delete user action button to IdentityAdministrationPage
- FR-02-13: Add Excel export to user list

**BE changes**:
- `IIdentityAdministrationAppService.DeleteUserAsync(Guid id)` + implementation
- New `UserExcelAppService.ExportAsync(GetAdminUserListInput input)`

**FE changes**:
- `IdentityAdministrationPage.tsx`: add Delete confirm button in user row actions
- Add Excel export button to user list toolbar
- Add `deleteAdminUser` mutation hook
- Add `exportUsers` mutation hook

---

### Batch C — Organization Excel Export (FR-06-06)
**Effort**: ~1 hour  
**Items**:
- FR-06-06: Export organization list to Excel

**BE changes**:
- `IOrganizationAppService.ExportAsync(GetOrganizationListInput input)` + implementation

**FE changes**:
- `OrganizationListPage.tsx`: add Excel export button

---

### Batch D — Dashboard Year/Org Filter (FR-39-02)
**Effort**: ~2 hours  
**Items**:
- FR-39-02: Add year and organization filter to dashboard stats

**BE changes**:
- `DashboardStatsFilter` with `Year?` and `OrganizationId?`
- `DashboardAppService.GetStatsAsync(DashboardStatsFilter filter)` — filter by year for temporal counts

**FE changes**:
- `DashboardPage.tsx`: add year Select (current/previous years) + org Select for provincial admins

---

### Batch E — Statistics Excel Exports + Breakdown (FR-40-02/04/06/08, FR-40-07)
**Effort**: ~3 hours  
**Items**:
- FR-40-02: Export business statistics Excel
- FR-40-04: Export inspection statistics Excel
- FR-40-06: Export poisoning statistics Excel
- FR-40-07: Statistics with region/district/commune breakdown
- FR-40-08: Export licensing statistics Excel

**BE changes**:
- `StatisticsFilterDto`: add `OrganizationId?` and `District?` filter
- New `StatisticsExcelAppService` with 4 export methods
- Statistics breakdown by org added to `StatisticsAppService`

**FE changes**:
- `StatisticsPage.tsx`: add org filter Select, add 4 Excel export buttons

---

### Batch F — Business Advanced Search (FR-19-02)
**Effort**: ~1.5 hours  
**Items**:
- FR-19-02: Add business type, classification, and administrative-area filter dropdowns

**FE changes**:
- `BusinessManagementPage.tsx`: add type Select, classification Select, district/commune Select

**BE changes**: Already supports these filter params; just FE exposure needed.

---

### Batch G — Per-Business Detail Tabs (FR-19-11..16)
**Effort**: ~6 hours  
**Items**:
- FR-19-11: Inspection results tab
- FR-19-12: Eligibility certificates tab
- FR-19-13: CFS certificates tab
- FR-19-15: Product registrations tab
- FR-19-16: Testing results tab

**FE changes**:
- New `BusinessDetailDrawer.tsx` with tabs: Thông tin chung | Thanh kiểm tra | Giấy phép | Kiểm nghiệm
- Each tab calls the existing per-module APIs filtered by businessId

---

### Batch H — Document Type Catalog Integration (FR-38-03, FR-38-04)
**Effort**: ~1.5 hours  
**Items**:
- FR-38-03/04: Replace hard-coded document type list with the live catalog

**FE changes**:
- `DocumentsPage.tsx` document type Select: load from `useMasterCatalog('document_type')` instead of hard-coded array

---

## P2 Batch Schedule (for subsequent sessions)

| Batch | Items | Description | Effort |
|---|---|---|---|
| P2-A | FR-04-01..06 | System settings full backend + UI | 16 h |
| P2-B | FR-05-04/05 | User profile editing + avatar | 6 h |
| P2-C | FR-27-08/09 | Inspection plan attachments | 4 h |
| P2-D | FR-28-03/05 | Inspection result finalize + attachments | 4 h |
| P2-E | FR-29-06 | Citizen alert moderation queue | 6 h |
| P2-F | FR-30-07 | Citizen news submission channel | 8 h |
| P2-G | FR-33-02 | NDTP report roll-up | 12 h |
| P2-H | FR-34-08/10 + FR-35-08 | Formatted report views + auto-aggregation | 18 h |
| P2-I | FR-39-03/04/08/09 | Dashboard compliance widgets + chart/map | 8 h |
| P2-J | FR-42..47-03/04 | Public portal certificate document view | 8 h |
| P2-K | FR-LIC-01 | QuestPDF certificate generation | 16 h |
| P2-L | FR-50-02/03/05 | API specification domain model + test connection | 8 h |
| P2-M | FR-51..57 | Per-entity integration history screens | 16 h |

## P3 Batch Schedule (partner dependency)

| Batch | Items | Description | Dependency |
|---|---|---|---|
| P3-A | FR-51..57 send | Outbound integration engine | Partner API specs |
| P3-B | INT-01..05 | MoH/Agriculture/Commerce connectivity | Partner access |
