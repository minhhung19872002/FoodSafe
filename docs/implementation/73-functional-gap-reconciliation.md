# 73 — Functional Gap Reconciliation

**Date**: 2026-07-27
**Branch**: `codex/production-readiness`
**Based on**: docs/audit/61 (corrected), docs/audit/65, docs/audit/68
**Purpose**: Enumerate every incomplete software requirement to drive the current implementation session

---

## Scope Separation

### DEFERRED_INFRASTRUCTURE (excluded from implementation denominator)
- Production TLS / HTTPS certificate
- Public DNS / AAAA / DNSSEC
- PostgreSQL `ssl=on` server-side configuration
- `pg_hba.conf` production TLS enforcement
- Redis production provisioning (authentication is implemented; provisioning is deferred)
- MinIO production TLS (env flag exists; provisioning deferred)
- Server firewall, server monitoring, hosting configuration

### SOFTWARE ACCEPTANCE COMPLETION (in scope)
All items in FR groups 1–57, NFR, SEC, DBS (application layer), UI, DT, TECH.

---

## Current Software Scores (from doc 61 corrected)

| Group | Score | Items | % |
|---|---|---|---|
| A — System Admin | 18.75 | 33 | 56.8% |
| B — Catalogs | 46.40 | 57 | 81.4% |
| C — ATTP Management | 167.95 | 216 | 77.8% |
| E — Public Portal | 18.70 | 32 | 58.4% |
| F — Data Integration | 6.25 | 34 | 18.4% |
| **FR Total** | **258.05** | **372** | **69.4%** |
| NFR Total | 52.65 | 80 | 65.8% |
| **Software Total** | **310.70** | **452** | **68.7%** |

---

## Incomplete Requirements By Priority

### P0 — Broken Required Flows

| Req ID | Group | Operation | Status | FE Gap | BE Gap | DB Gap | Priority |
|---|---|---|---|---|---|---|---|
| FR-04-03 | STT 4 | Password policy config admin UI | SHALLOW | Admin config UI | Static hardcoded | — | P0/P2 |
| FR-04-04 | STT 4 | Lockout config admin UI | SHALLOW | Admin config UI | Static hardcoded | — | P0/P2 |
| FR-04-05 | STT 4 | SMTP config admin UI | SHALLOW | Admin config UI | Static hardcoded | — | P0/P2 |

### P1 — Missing Required Customer Functions

| Req ID | Group | Operation | Status | FE Gap | BE Gap | DB Gap | Priority |
|---|---|---|---|---|---|---|---|
| FR-02-05 | STT 2 | Delete user | PARTIAL | Delete button missing in FE | BE exists | — | P1 |
| FR-02-13 | STT 2 | Export user list Excel | NOT_IMPLEMENTED | Export button | ExcelAppService | — | P1 |
| FR-03-02 | STT 3 | Audit log detail view | PARTIAL | No detail drawer | GetDetailAsync missing | — | P1 |
| FR-03-03 | STT 3 | Export audit log Excel | NOT_IMPLEMENTED | Export button | ExcelAppService | — | P1 |
| FR-06-06 | STT 6 | Export organization list Excel | NOT_IMPLEMENTED | Export button | ExcelAppService | — | P1 |
| FR-07-03 | STT 7 | Delete unit account | PARTIAL | Delete button missing in FE | BE exists | — | P1 |
| FR-17-05 | STT 17 | Export testing services Excel | NOT_IMPLEMENTED | Export button | ExcelAppService | — | P1 |
| FR-19-02 | STT 19 | Business advanced search | PARTIAL | Type/class/area filters missing | Backend filter params exist | — | P1 |
| FR-19-11 | STT 19 | Per-business inspection tab | PARTIAL | No tab | Backend exists via module | — | P1 |
| FR-19-12 | STT 19 | Per-business licensing tab | PARTIAL | No tab | Backend exists via module | — | P1 |
| FR-19-13 | STT 19 | Per-business self-declaration tab | PARTIAL | No tab | Backend exists via module | — | P1 |
| FR-19-15 | STT 19 | Per-business product-reg tab | PARTIAL | No tab | Backend exists via module | — | P1 |
| FR-19-16 | STT 19 | Per-business testing tab | PARTIAL | No tab | Backend exists via module | — | P1 |
| FR-38-03 | STT 38 | Document type catalog (create) | PARTIAL | Hard-coded list | Catalog exists separately | — | P1 |
| FR-38-04 | STT 38 | Document type catalog (edit) | PARTIAL | Hard-coded list | Catalog exists separately | — | P1 |
| FR-39-02 | STT 39 | Dashboard time/unit selector | NOT_IMPLEMENTED | No DatePicker/Select | GetStatsAsync no params | — | P1 |
| FR-40-02 | STT 40 | Statistics — business by type Excel | NOT_IMPLEMENTED | No export button | No StatisticsExcel | — | P1 |
| FR-40-04 | STT 40 | Statistics — inspection Excel | NOT_IMPLEMENTED | No export button | No StatisticsExcel | — | P1 |
| FR-40-06 | STT 40 | Statistics — poisoning Excel | NOT_IMPLEMENTED | No export button | No StatisticsExcel | — | P1 |
| FR-40-07 | STT 40 | Statistics by region/unit | SHALLOW | No breakdown UI | StatisticsFilterDto has only Year | — | P1 |
| FR-40-08 | STT 40 | Statistics — licensing Excel | NOT_IMPLEMENTED | No export button | No StatisticsExcel | — | P1 |

### P2 — Incomplete Workflows / Secondary Functions

| Req ID | Group | Operation | Status | FE Gap | BE Gap | DB Gap | Priority |
|---|---|---|---|---|---|---|---|
| FR-02-02 | STT 2 | Search user by permission | PARTIAL | No per-permission filter | — | — | P2 |
| FR-02-07 | STT 2 | Random password generation UX | PARTIAL | Link-based reset; no generate button | — | — | P2 |
| FR-04-01 | STT 4 | Logo upload | NOT_IMPLEMENTED | Stub page | No endpoint | — | P2 |
| FR-04-02 | STT 4 | Login screen customization | NOT_IMPLEMENTED | Stub page | No endpoint | — | P2 |
| FR-04-06 | STT 4 | Homepage config | NOT_IMPLEMENTED | Stub page | No endpoint | — | P2 |
| FR-05-04 | STT 5 | User profile self-service editing | SHALLOW | Only password change; no name/phone/email | No profile endpoint | — | P2 |
| FR-05-05 | STT 5 | Avatar | NOT_IMPLEMENTED | No avatar feature | No endpoint | — | P2 |
| FR-27-08 | STT 27 | Inspection plan attachment upload | NOT_IMPLEMENTED | No attachment UI | No attachment service | — | P2 |
| FR-27-09 | STT 27 | Inspection plan attachment download | NOT_IMPLEMENTED | No attachment UI | No attachment service | — | P2 |
| FR-28-03 | STT 28 | Inspection result finalize/lock | PARTIAL | No lock action | Business rule not enforced | — | P2 |
| FR-28-05 | STT 28 | Inspection result document download | PARTIAL | Excel only; no attachment pipeline | No attachment service | — | P2 |
| FR-29-06 | STT 29 | Citizen alert moderation queue | PARTIAL | No separate moderation tab | Alerts created as Draft | — | P2 |
| FR-30-07 | STT 30 | Citizen news submission | NOT_IMPLEMENTED | No citizen news channel | No endpoint | — | P2 |
| FR-33-02 | STT 33 | NDTP report roll-up aggregation | PARTIAL | — | Commune→city→province rollup | — | P2 |
| FR-34-08 | STT 34 | ATTP report formatted document view | PARTIAL | Table only; no formatted view | — | — | P2 |
| FR-34-10 | STT 34 | Report auto-aggregation from data | NOT_IMPLEMENTED | — | Cross-module calculation | — | P2 |
| FR-35-08 | STT 35 | Action Month report document view | PARTIAL | Table only; no formatted view | — | — | P2 |
| FR-36-08 | STT 36 | Risk analysis PDF/print | PARTIAL | Excel only | No PDF | — | P2 |
| FR-38-07 | STT 38 | Per-document print/attachment | PARTIAL | Excel only | No per-doc output | — | P2 |
| FR-39-03 | STT 39 | Dashboard report compliance widget | NOT_IMPLEMENTED | No widget | No endpoint | — | P2 |
| FR-39-04 | STT 39 | Dashboard report timeliness widget | NOT_IMPLEMENTED | No widget | No endpoint | — | P2 |
| FR-39-08 | STT 39 | Dashboard map/chart visualization | PARTIAL | Progress bars only | Map/Recharts not on dashboard | — | P2 |
| FR-39-09 | STT 39 | Dashboard/statistics chart download | NOT_IMPLEMENTED | No download | No export | — | P2 |
| FR-42-03 | STT 42 | Eligibility certificate document view | NOT_IMPLEMENTED | No public file serving | — | — | P2 |
| FR-42-04 | STT 42 | Eligibility certificate print | NOT_IMPLEMENTED | No print/download | — | — | P2 |
| FR-43-03 | STT 43 | Self-declaration document view | NOT_IMPLEMENTED | No public file serving | — | — | P2 |
| FR-43-04 | STT 43 | Self-declaration print | NOT_IMPLEMENTED | No print/download | — | — | P2 |
| FR-44-03 | STT 44 | Product registration document view | NOT_IMPLEMENTED | No public file serving | — | — | P2 |
| FR-44-04 | STT 44 | Product registration print | NOT_IMPLEMENTED | No print/download | — | — | P2 |
| FR-46-03 | STT 46 | CFS certificate document view | NOT_IMPLEMENTED | No public file serving | — | — | P2 |
| FR-46-04 | STT 46 | CFS certificate print | NOT_IMPLEMENTED | No print/download | — | — | P2 |
| FR-47-03 | STT 47 | Export certificate document view | NOT_IMPLEMENTED | No public file serving | — | — | P2 |
| FR-47-04 | STT 47 | Export certificate print | NOT_IMPLEMENTED | No print/download | — | — | P2 |
| FR-LIC-01 | LIC | Certificate PDF generation (QuestPDF) | PARTIAL | Data fields exist | QuestPDF not integrated | — | P2 |
| FR-50-02 | STT 50 | API specification domain model | MOSTLY_COMPLETE | Incomplete fields | DataType/Direction missing | migration | P2 |
| FR-50-03 | STT 50 | API specification config | MOSTLY_COMPLETE | Incomplete | Same as FR-50-02 | — | P2 |
| FR-50-05 | STT 50 | Test Connection | SHALLOW | Dead code | No connection test | — | P2 |
| FR-51..57×3 | STT 51-57 | Per-entity integration history | SHALLOW | Generic screen | No DataType discrimination | migration | P2 |
| FR-51..57×7 | STT 51-57 | Outbound integration engine | NOT_IMPLEMENTED | — | No outbound dispatcher | — | P3 |

### P3 — External Integration (requires partner APIs)

| Req ID | Group | Operation | Status | Dependency |
|---|---|---|---|---|
| FR-51-57 (send) | STT 51-57 | Send data to MoH/Agriculture/Commerce | NOT_IMPLEMENTED | Partner API access required |
| INT-01..05 | Integration | MoH/TT31 protocol connectivity | NOT_IMPLEMENTED | Partner systems not available |

---

## Non-Functional Gaps

| ID | Category | Status | Gap |
|---|---|---|---|
| SEC-08 | Security | PARTIAL (0.70) | CAPTCHA wired; B8 tests added; resolved |
| DBS-07 | DB Security | PARTIAL | pgaudit extension not installed |
| DBS-09 | DB Security | CODE_READY_INFRA | SslMode validator deployed; server provisioning deferred |
| NFR-01..06 | Performance | NOT_VERIFIED | No load tests; k6 not run |
| IPV-01..06 | IPv6/TLS | DEFERRED_INFRASTRUCTURE | Server-side items deferred |
| ACC-01..06 | Acceptance | NOT_IMPLEMENTED | No test evidence, manuals, or formal records |

---

## Summary Counts

| Category | Count |
|---|---|
| P0 blockers to implement | 3 |
| P1 missing functions | 20 |
| P2 incomplete workflows | 34 |
| P3 external integration | 14 |
| DEFERRED_INFRASTRUCTURE | 12 |
| **Total open software items** | **57** |

---

## Completion Percentages (current)

| Metric | Score | % |
|---|---|---|
| Functional software | 258.05/372 | 69.4% |
| NFR software | 52.65/80 | 65.8% |
| **Software acceptance** | **310.70/452** | **68.7%** |
| Deferred infrastructure | — | DEFERRED |
| Full contractual (466) | 312.35/466 | 67.0% |
