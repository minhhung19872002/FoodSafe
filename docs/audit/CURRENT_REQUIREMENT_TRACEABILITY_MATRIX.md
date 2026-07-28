# Current Requirement Traceability Matrix

**Baseline**: branch `feat/integration-completion`, HEAD `aad87c1`, dirty working tree (see [CURRENT_REQUIREMENT_GAP_ANALYSIS.md](CURRENT_REQUIREMENT_GAP_ANALYSIS.md) §A) · 2026-07-28
**Denominator**: 469 atomic requirements per `docs/audit/60-customer-requirement-baseline.md`, whose extraction was re-verified this audit against a fresh `pdftotext` dump of `docs/Mẫu số 03. YCKT (1).pdf`. Every requirement appears below — uniform groups are expressed as ID ranges (`FR-08-01..04` = 4 atomic items), never omitted.

**Column legend / shorthand**
- **W** (weight): H = acceptance-critical main flow, M = required supporting function, L = polish/secondary.
- **Actor**: SA SystemAdmin, PA/PS Province admin/staff, DA/DS District, CA/CS Commune, CIT citizen (anonymous), PTN partner system, ALL any authenticated.
- **FE/BE/DB/Perm**: file or module evidence. `—` = not applicable for this layer; ✗ = missing (drives status).
- **Test**: executed automated evidence. `e2e:<spec>` = Playwright spec (real stack, zero interception); `BE` = backend suite (662/662 this audit); `probe:74` = executed security probes doc 74; `(built,unexec)` = code exists, no executed spec.
- **Runtime**: `286@6326614`-style = included in the 286/286 full run at `6326af4`; `manual@YYYY-MM-DD` = documented manual browser evidence; ✗ = none.
- **Status**: the mandated set (FULLY_IMPLEMENTED etc.), abbreviated: FULL, MOST, PART, UI, BE_ONLY, DB_ONLY, DOC, TEST, BROKEN, EXTBLK, MISS, N/A, INSUF.
- **Gap/Tasks**: from the gap register / [REMAINING_TASK_BACKLOG.md](../planning/REMAINING_TASK_BACKLOG.md). `—` = no open gap.

Common evidence anchors (referenced as [1]..[9] to keep rows readable):
- [1] Registry `docs/testing/01` — 34/34 features VERIFIED (stamps `8be91bc`, F-019f `adb30eb`); full-run 286/286 at `6326af4` (doc production-audit/08).
- [2] `docs/testing/73` + `75` executed requirement→browser-test matrices; `docs/implementation/77` corrections.
- [3] `docs/testing/74` executed security probes (401/403/IDOR/CSRF/org+area scope).
- [4] BE suite 662/662 executed by this audit on the dirty tree.
- [5] `docs/testing/05-load-test-results.md` k6 30-VU run (all thresholds PASS, local hardware).
- [6] This audit's source inspection (file:line cited in the gap register).
- [7] `docs/integration/` partner spec + `e2e/partner-openapi-contract.spec.ts` 1/1 at `0776230`.
- [8] Uncommitted working tree (feature present, not committed/certified).
- [9] `.github/workflows/ci.yml` (build/migration/supply-chain gates; no Playwright).

---

## Group A — Quản trị hệ thống (STT 1–5, 33 items, PDF pp.15–17)

| Requirement ID | Page | Customer requirement | W | Actor | FE | BE | DB | Perm | Test | Runtime | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FR-01-01..06 | 15 | Roles: create/update/delete/search/set permissions/assign | H | SA/PA | IdentityAdministrationPage roles tab | IdentityAdministrationAppService | AbpRoles+ | SystemAdministration.Roles.* | e2e:identity-* [1][2] | 286@6326af4 | FULL | — | — |
| FR-02-01 | 15 | Search users | H | SA/PA/DA/CA | users tab filters | GetUsersAsync | AbpUsers+AppUserProfile | Users.View | e2e:identity-* [1] | 286@6326af4 | FULL | — | — |
| FR-02-02 | 15 | Advanced search by role & by permission | M | SA/PA | role + permission dropdowns (`usePermissionOptions`) | `PermissionName`→role translation (IdentityAdministrationAppService.cs:721-746) | — | Users.View | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-02-03..06 | 15 | Create/update/delete user, admin reset password | H | SA/PA/DA/CA | UserEditorModal + actions | Create/Update/Delete/ResetPassword | AbpUsers | Users.* (triple org check) | e2e + probe:74 [1][3] | 286@6326af4 | FULL | — | — |
| FR-02-07 | 15 | Random password generation | M | SA/PA | generate button | GenerateCompliantPassword (crypto-random, 12 chars) [6] | — | Users.ResetPassword | e2e [2] | 286@6326af4 | FULL | — | — |
| FR-02-08 | 15 | Email account activation | M | SA/PA | on create | SendPasswordResetEmailAsync → ABP account flow | — | Users.Create | e2e [2] | 286@6326af4 | FULL | — | — |
| FR-02-09 | 15 | Force password change at next login | H | SA/PA | surfaced in drawer | SetShouldChangePasswordOnNextLogin + PasswordExpiryMiddleware | AppUserProfile | — | e2e:password-expiry-enforcement 4/4 [2] | 286@6326af4 | FULL | — | — |
| FR-02-10..12 | 15 | Activate/deactivate, auto-lock on failed logins, unlock | H | SA/PA | toggle/lock buttons | SetUserActivation/SetUserLock; Identity lockout 5/30min | AbpUsers | Users.Activate/Lock | e2e [1] | 286@6326af4 | FULL | G-47 (configurability, see FR-04-04) | FUNC-USER-001 |
| FR-02-13 | 15 | Export users to Excel | M | SA/PA | export button | IdentityAdministrationExcelAppService (`GET /v1/administration/excel/users`) | — | Users.View | e2e:excel-exports [2] | 286@6326af4 | FULL | — | — |
| FR-03-01 | 15–16 | Audit log search | H | SA | AuditLogPage filters | AuditLogAppService | AbpAuditLogs | SystemAdministration.AuditLogs | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-03-02 | 16 | Audit log detail view | M | SA | detail drawer (built) | included | AbpAuditLogs | same | (built,unexec) | ✗ | MOST | G-12 | FUNC-EVID-001 |
| FR-03-03 | 16 | Audit log Excel export | M | SA | export | Excel service | — | same | e2e:excel-exports [2] | 286@6326af4 | FULL | — | — |
| FR-04-01..06 | 16 | Settings: logo, login screen, password length, lockout config, email config, homepage config | M | SA | SystemSettingsPage | SettingsAppService (F-032) | settings store | SystemAdministration.Settings | e2e [1] | 286@6326af4 | FULL (lockout configurability flagged) | G-47 | FUNC-USER-001 |
| FR-05-01..03 | 17 | Self-service: login/logout/change password | H | ALL | Login page + menu | ABP account + CAPTCHA middleware | — | — | e2e:authentication [1][3] | 286@6326af4 | FULL | — | — |
| FR-05-04 | 17 | Edit own profile | M | ALL | profile UI (built) | account profile API | AppUserProfile | — | (built,unexec) | ✗ | MOST | G-12 | FUNC-EVID-001 |
| FR-05-05 | 17 | Change avatar | L | ALL | avatar upload (built) | profile API + storage | MinIO | — | (built,unexec) | ✗ | MOST | G-12 | FUNC-EVID-001 |

## Group B — Quản lý danh mục (STT 6–18, 57 items, PDF pp.17–20)

| Requirement ID | Page | Customer requirement | W | Actor | FE | BE | DB | Perm | Test | Runtime | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FR-06-01..06 | 17 | Organizations: search, advanced search, quick-create subordinates, update, delete, export | H | SA/PA | OrganizationsPage | OrganizationAppService | organizations | FoodSafe.Organizations.* | e2e:organizations-* [1] | 286@6326af4 | FULL | — | — |
| FR-07-01..06 | 17 | Organization accounts: search/create/advanced search/reset criteria/refresh/default password + lock/permission/reset flows | H | SA/PA | Identity page org filter + flows | shared identity services (org-scoped) | AbpUsers+AppUserProfile.OrganizationId | Users.* org-scoped [3] | e2e + probe:74 | 286@6326af4 | FULL (by-convention model, not distinct type) | G-47 | FUNC-USER-001 |
| FR-08-01..04 | 18 | Country catalog CRUD+search | M | SA | GeographicCatalogPage | catalog CrudAppServices | cat_* tables | Catalogs.* | e2e:geography-/catalogs- [1] | 286@6326af4 | FULL | — | — |
| FR-09-01..04 | 18 | Region catalog CRUD+search | M | SA | same | same | same | same | same | 286@6326af4 | FULL | — | — |
| FR-10-01..04 | 18 | Province catalog CRUD+search | M | SA | same | same | same | same | same | 286@6326af4 | FULL | — | — |
| FR-11-01..04 | 18 | Commune catalog CRUD+search | M | SA | same | same | same | same | same | 286@6326af4 | FULL | — | — |
| FR-12-01..04 | 18 | Business classification CRUD+search | M | SA | MasterCatalogPage | same | same | same | same | 286@6326af4 | FULL | — | — |
| FR-13-01..04 | 18 | Product group CRUD+search | M | SA | same | same | same | same | same | 286@6326af4 | FULL | — | — |
| FR-14-01..04 | 19 | Business type CRUD+search | M | SA | same | same | same | same | same | 286@6326af4 | FULL | — | — |
| FR-15-01..04 | 19 | Advertisement type CRUD+search | M | SA | same | same | same | same | same | 286@6326af4 | FULL | — | — |
| FR-16-01..04 | 19 | Testing facility CRUD+search | M | SA | same | same | same | same | same | 286@6326af4 | FULL | — | — |
| FR-17-01..05 | 19 | Testing service CRUD+search+Excel export | M | SA | same + export | same + Excel | same | same | e2e:excel-exports | 286@6326af4 | FULL | — | — |
| FR-18-01..04 | 20 | Document type CRUD+search | M | SA | same | same | same | same | same | 286@6326af4 | FULL | — | — |

## Group C — Quản lý về ATTP (STT 19–40 + LIC, 216 items, PDF pp.20–36)

| Requirement ID | Page | Customer requirement | W | Actor | FE | BE | DB | Perm | Test | Runtime | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FR-19-01..15,18 | 20–21 | Businesses: search/adv-search/reset, Excel import+export, create/update/delete, map location, product groups, attached papers CRUD, direct-handler persons CRUD, inspection-result links | H | PA/DA/CA staff | businesses feature pages + map | BusinessAppService + import/export + attachments | businesses + child tables | Businesses.* + org/area scope [3] | e2e:business-* (incl. import/filters) [1][2] | 286@6326af4 | FULL | — | — |
| FR-19-16 | 21 | Xác nhận cơ sở đủ điều kiện SXKD | H | PA/DA | eligibility flow (F-010) | EligibilityCertificate flow | eligibility_certificates | EligibilityCerts.* | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-19-17 | 21 | **Xác nhận cơ sở đã nộp bản cam kết bảo đảm VSATTP** (+ attachable giấy xác nhận bản cam kết) | H | PA/DA/CA | ✗ (no UI beyond flag) | Business.HasVsattpCommitment bool only (Business.cs:29,144) [6] | has_vsattp_commitment column | — | ✗ | ✗ | **PART** | G-08 | FUNC-COMMIT-001 |
| FR-20-01..08 | 21–22 | Products: list/search/create/update/delete/detail/Excel import/Excel export | H | staff | products pages | ProductAppService | products | Products.* + scope | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-21-01..09 | 22 | Self-declarations: search/adv/create/update/delete/detail/attach/view+delete file/export | H | staff | self-declarations feature | SelfDeclarationAppService + attachments | self_declarations | SelfDeclarations.* + scope | e2e [1][3] | 286@6326af4 | FULL | — | — |
| FR-22-01..09 | 23 | Product registrations: same lifecycle + attachment of giấy tiếp nhận | H | staff | product-registrations feature | ProductRegistrationAppService | product_registrations | ProductRegistrations.* | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-23-01..11 | 23–24 | Ad registrations: search/adv/create/update/delete/detail/**select products (multi)**/attach/delete/view confirmation docs/export | H | staff | AdvertisementRegistrationPage + editor (multi-product) | AdvertisementRegistrationAppService (`ProductIds`, EnsureProductsAsync) + attachment service (ClamAV, signed download) [6] | advertisement_registrations | AdRegistrations.* + ScopedQueryAsync [6] | e2e [1] | 286@6326af4 | FULL (revocation incl.) | — | — |
| FR-24-01..10 | 24–25 | Eligibility certificates lifecycle + attach/delete/view + export + refresh | H | staff | eligibility feature | EligibilityCertificateAppService | eligibility_certificates | EligibilityCerts.* | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-25-01..11 | 25–26 | CFS certificates lifecycle + product selection + attachments + export | H | staff | cfs feature | CfsCertificateAppService | cfs_certificates | CfsCerts.* | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-26-01..11 | 26 | Export-food certificates lifecycle + product selection + attachments + export | H | staff | export-certs feature | ExportFoodCertificateAppService | export_food_certificates | ExportFoodCerts.* | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-LIC-01 | 22–26 | License PDFs per NĐ 15/2018 official forms | M | staff/CIT | PDF download buttons | QuestPDF generators | — | anonymous for public types (F-034) | e2e:certificate-pdf 5/5 [2] | 286@6326af4 | MOST (layout ≠ official template) | G-13 | FUNC-LIC-001, EXT-001 |
| FR-LIC-02 | 22–26 | License data scoped by managing area/authority | H | staff | filters | scope provider on all license services | — | probe:74 [3] | e2e | 286@6326af4 | FULL | — | — |
| FR-27-01..11 | 27 | Inspection plans: filter/create/add-remove businesses/update/upload docs/view docs/download docs/delete/detail/export | H | PA/DA | inspection feature | InspectionPlanAppService + attachments | inspection_plans | Inspection.* + scope | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-28-01..07 | 28 | Inspection results: filter/search/view plan/reload results/reset criteria/post detail per business/update per business (+docs) | H | PA/DA | results pages | InspectionResultAppService | inspection_results | Inspection.* | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-29-01..05,07,09 | 29 | Alerts: filter/create/update/delete/view + recall + reset criteria | H | staff | AlertsNewsPage | AtpAlertAppService | atp_alerts | Alerts.* + scope | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-29-06 | 29 | Duyệt cảnh báo do người dân gửi (moderation) | H | PA/DA | source-filter queue + publish/delete | publish endpoint; reject = delete (no comment) [6] | atp_alerts (Source=PublicReport) | Alerts.Publish | e2e:citizen-moderation [2] | 286@6326af4 | MOST | G-09 | FUNC-CIT-001 |
| FR-29-08 | 29 | Gắn cảnh báo cơ sở vi phạm (link business) | M | staff | detail shows link; editor lacks selector [6] | BusinessId on DTO | FK present | — | partial | 286@6326af4 | MOST | G-09 | FUNC-CIT-001 |
| FR-30-01..06,08,09 | 29–30 | News: filter/create/update/delete/link business alert/view/recall/reset | H | staff | AlertsNewsPage news tab | AtpNewsAppService | atp_news | News.* | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-30-07 | 30 | Duyệt tin tức do người dân gửi | H | PA/DA | same moderation path | publish; reject=delete | atp_news | News.Publish | e2e:citizen-moderation [2] | 286@6326af4 | MOST | G-09 | FUNC-CIT-001 |
| FR-31-01..11 | 30 | Poisoning cases: search/declare/verify/detail/update/delete/error-report create+view/verified view/Excel export | H | CS→PS | food-poisoning feature | FoodPoisoningCaseAppService | fp_cases | Cases.* + area scope [3] | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-32-01..10 | 30–31 | Poisoning incidents: search/create/update/delete/verify/view verified/error slip/closing slip (province-only)/view closing/Excel | H | CS→PS (close: PA) | incidents pages | FoodPoisoningIncidentAppService | fp_incidents | Incidents.* + area scope | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-33-01..11 | 31 | Báo cáo NĐTP (monthly): search/adv/create/update/send/error-report/delete/verify/detail/return/Excel | H | CS→PS | reporting feature | NdtpReportAppService (state machine) | ndtp_reports | NdtpReports.* | e2e incl. workflow+error-notify [1][2] | 286@6326af4 | FULL | — | — |
| FR-34-01..07,09..11 | 32 | Báo cáo công tác ATTP (6M/1Y): lifecycle + send-up + error-report + return + delete + view + Excel + auto-aggregation | H | CS→PS | reporting feature | AtpWorkReportAppService | atp_work_reports | AtpWorkReports.* | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-34-08 | 32 | Xem dưới dạng văn bản (formatted view) | M | staff | formatted view (built) | included | — | — | (built,unexec) | ✗ | MOST | G-12 | FUNC-EVID-001 |
| FR-35-01..07,09,10 | 33 | Báo cáo Tháng hành động: lifecycle + send + error + return + delete + Excel | H | CS→PS | reporting feature | ActionMonthReportAppService | action_month_reports | ActionMonthReports.* | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-35-08 | 33 | Formatted document view | M | staff | (built) | included | — | — | (built,unexec) | ✗ | MOST | G-12 | FUNC-EVID-001 |
| FR-36-01..08 | 33–34 | Risk analysis: list/search/create/update/view/delete/publish/print-export | H | PA/PS | risk-analysis feature | RiskAnalysisAppService | risk_analyses | RiskAnalysis.* | e2e incl. public exposure [1] | 286@6326af4 | FULL | — | — |
| FR-37-01..06 | 34 | Testing results: search/add/update/detail/delete/Excel | H | staff | testing-results feature | TestingResultAppService | testing_results | TestingResults.* | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-38-01,02,05..07 | 34–35 | Directive documents: list/search/create-update-delete/detail/print-export | H | staff | documents feature | AdministrativeDocumentAppService | administrative_documents | Documents.* | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-38-03/04 | 35 | Document type from catalog (Loại văn bản) | L | staff | hard-coded list (works) [6] | — | cat exists (STT 18) | — | e2e | 286@6326af4 | MOST | G-14 | FUNC-DOC-001 |
| FR-39-01..09 | 35 | Dashboard: stats by level/time/org; business+product counts; report compliance (NĐTP/ATTP/Action-Month); poisoning map+time series; save/download chart data | H | ALL (authenticated) | DashboardPage (tiles, compliance table, expiring licenses) + StatisticsPage charts + map + PNG download | DashboardAppService + StatisticsAppService | aggregates | [Authorize] (open by design — policy flag) | e2e incl. FR-39-09 PNG [1][2] | 286@6326af4 | FULL | G-22 (policy) | SEC-006 |
| FR-40-01..02 | 36 | Thống kê giấy phép theo loại hình + Excel | H | PA/PS | ReportStatisticsSection tab 1 | `/statistics/excel/licenses-by-business-type` | aggregates | [Authorize] | e2e 4-export spec [2] | 286@6326af4 | FULL (org-filter/print residual tracked as G-10) | G-10 | FUNC-STAT-001 |
| FR-40-03..04 | 36 | Thống kê tình hình NĐTP + Excel | H | PA/PS | tab 2 | `/statistics/excel/poisoning-by-area` | aggregates | [Authorize] | e2e [2] | 286@6326af4 | FULL (same residual) | G-10 | FUNC-STAT-001 |
| FR-40-05..06 | 36 | Thống kê kết quả thanh kiểm tra (vi phạm/xử lý/kế hoạch) + Excel | H | PA/PS | tab 3 | `/statistics/excel/inspection-summary` | aggregates | [Authorize] | e2e [2] | 286@6326af4 | FULL (same residual) | G-10 | FUNC-STAT-001 |
| FR-40-07 | 36 | Thống kê cơ sở theo loại hình/vùng/địa bàn/đầu mối + Excel | H | PA/PS | tab 4 sub-tabs (type/region/province/district/managing org) | `/statistics/excel/business-breakdown` | aggregates | [Authorize] | e2e [2] | 286@6326af4 | FULL (same residual) | G-10 | FUNC-STAT-001 |
| FR-40-08 | 36 | Further breakdown exports + report-status-by-organization output | M | PA/PS | dashboard table only (no export); breakdown exports built, unexec | ✗ dedicated export | — | — | (built,unexec) | ✗ | **PART** | G-10, G-12 | FUNC-STAT-001, FUNC-EVID-001 |

## Group E — Cổng thông tin công dân (STT 41–49, 32 items, PDF pp.36–38)

| Requirement ID | Page | Customer requirement | W | Actor | FE | BE | DB | Perm | Test | Runtime | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FR-41-01..04 | 36–37 | Public general lookup: business search + results, product search + results | H | CIT | PublicGeneralSearchPage | `GET /api/v1/public/businesses/search` [AllowAnonymous] | — | anonymous [3] | e2e:public-portal [1] | 286@6326af4 | FULL | — | — |
| FR-42-01..04 | 37 | Eligibility-cert lookup: list/detail/view cert/print-download | H | CIT | PublicCertificateSearchPage | public search + `/public/{type}/{id}/pdf` [AllowAnonymous] | — | anonymous | e2e:certificate-pdf 5/5 [2] | 286@6326af4 | FULL (print = PDF download; original scan not public — see G-11) | G-11 | FUNC-PUB-001 |
| FR-43-01..04 | 37 | Self-declaration lookup incl. view/print certificate | H | CIT | same page | same | — | anonymous | e2e [2] | 286@6326af4 | FULL (same caveat) | G-11 | FUNC-PUB-001 |
| FR-44-01..04 | 37 | Product-registration lookup incl. view/print | H | CIT | same | same | — | anonymous | e2e [2] | 286@6326af4 | FULL (same caveat) | G-11 | FUNC-PUB-001 |
| FR-45-01..03 | 38 | Warned businesses: list/detail/view alert content | H | CIT | warned-businesses public page | public alerts endpoints | — | anonymous | e2e [1] | 286@6326af4 | FULL | — | — |
| FR-46-01..04 | 38 | CFS lookup incl. view/print | H | CIT | same search page | same + PDF | — | anonymous | e2e [2] | 286@6326af4 | FULL (same caveat) | G-11 | FUNC-PUB-001 |
| FR-47-01..04 | 38 | Export-cert lookup incl. view/print | H | CIT | same | same + PDF | — | anonymous | e2e [2] | 286@6326af4 | FULL (same caveat) | G-11 | FUNC-PUB-001 |
| FR-48-01..03 | 38 | Citizen alerts: news list/search + **gửi cảnh báo ATVSTP** (CAPTCHA) | H | CIT | `/gui-phan-anh` CitizenAlertReportPage (+news report) | `POST /api/v1/public/alert-reports`, `/news-reports` + LoginCaptchaMiddleware 400 on bad token [6] | atp_alerts Draft/PublicReport | anonymous + CAPTCHA | e2e:public-portal:167 + citizen-moderation [2] | 286@6326af4 | FULL (downstream moderation depth = G-09) | — | — |
| FR-49-01..02 | 38 | Legal document lookup + view info | M | CIT | PublicDocumentsPage | `GET /api/v1/public/documents` [AllowAnonymous] | administrative_documents | anonymous | e2e [1] | 286@6326af4 | MOST (metadata only — attachments not public, no print) | G-11 | FUNC-PUB-001 |

## Group F — Tích hợp dữ liệu (STT 50–57, 34 items, PDF pp.39–41)

| Requirement ID | Page | Customer requirement | W | Actor | FE | BE | DB | Perm | Test | Runtime | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FR-50-01..04,06 | 39 | API spec list/add/update/delete/export + endpoint config + test connection | H | SA/PA | EndpointsTab (real CRUD, encrypted creds) | ApiEndpoint CRUD + test-connection | di_api_endpoints | DataIntegration.ApiEndpoints.* | e2e:data-integration* (F-019c 6/6) [1] | 286@6326af4 | FULL | G-16 (hardcoded system list) | FUNC-INT-005 |
| FR-50-05 | 39 | Đặc tả API: hiển thị/tìm kiếm/xem chi tiết đặc tả, hướng dẫn cấu hình kết nối | H | SA/PA + PTN | ApiSpecsTab (upload/publish/download/detail) **uncommitted** [8] | ApiSpecificationAppService + OpenApiSpecValidator + anonymous `GET /api/v1/partner/api-spec/{name}` [8]; published docs/integration spec [7] | di_api_specifications (migration uncommitted) | ApiSpecs.* (not yet in route map — G-02) | contract test 1/1 [7]; feature e2e spec (built,unexec) [8] | partial (spec docs verified; in-app feature ✗) | MOST | G-01, G-02 | BASE-001..004 |
| FR-51..57-01 (7 items) | 39–41 | Per-type display of **received**/shared history (Alert, InspectionResult, FoodPoisoning, License, Product, News, Business) | H | PA/PS | CallHistoryTab per-type sub-tabs + InboundSubmissionsTab (read-only) | ApiCallLog both directions + PartnerInboundAppService (7 types) | di_api_call_logs, di_inbound_submissions | CallHistory.View / Partners.View | e2e:data-integration-share 3/3, -retry, -partners 3/3 [1] | 286@6326af4 + adb30eb | MOST ×7 (received items un-dispositionable — G-04; no partner status feedback — G-06) | G-04..06 | FUNC-INT-001..003 |
| FR-51..57-02 (7 items) | 39–41 | Share/send each data type outbound | H | PA/PS | share action per type | typed payload builders (7) carrying real records; retry + attempt history (Batch F-1) | di_api_call_logs (correlation/attempt/checksum) | DataSharing.Share | e2e share/retry suites [1] | 286@6326af4 | FULL ×7 | — | — |
| FR-51..57-03 (7 items) | 39–41 | Search/filter history (partner, time, result, direction) | M | PA/PS | filters incl. date-range picker | ApiCallLogAppService filters | same | CallHistory.View | e2e [1] | 286@6326af4 | FULL ×7 | — | — |
| FR-51..57-04 (7 items) | 39–41 | Detail view (payload, response, time, error) | M | PA/PS | detail modal (headers/body/response/checksum/attempt) | scoped GetAsync | same | CallHistory.View | e2e [1] | 286@6326af4 | FULL ×7 | — | — |

## Integration (INT-01..05, PDF §2.4 pp.2–3)

| Requirement ID | Page | Customer requirement | W | Actor | FE | BE | DB | Perm | Test | Runtime | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| INT-01 | 2 | Connect/share with Bộ Y tế ATTP system | H | PTN | endpoint config | outbound engine + SSRF caps (`0776230`); no resilience policy; real endpoint external | di_* | — | e2e vs real receiver [1] | proven vs test receiver | PART | G-07 | FUNC-INT-004, EXT-001 |
| INT-02 | 2 | TT 31/2026 + NĐ 37/2026 data interchange compliance | H | PTN | — | versioned envelopes w/ real records; official field map absent | — | — | — | — | **EXTBLK** | G-05, G-46 | EXT-001, FUNC-INT-003 |
| INT-03 | 2–3 | Provide connection accounts (login/API) to Sở NN & Sở CT systems | H | PTN | PartnersTab (accounts, keys shown once) | PartnerAccount + hashed keys + inbound endpoints (7 types) | di_partner_accounts, di_partner_api_keys | Partners.* | e2e:data-integration-partners 3/3 (F-019f) [1] | adb30eb certified | FULL | — | — |
| INT-04 | 3 | APIs specified per API specification document | H | PTN | — | published spec + OpenAPI + onboarding + examples [7] | — | — | contract test 1/1 [7] | 0776230 | FULL (living-doc upkeep via G-01) | — | BASE-004 |
| INT-05 | 3 | Interchange history stored for management/lookup | H | PA/PS | history tabs | ApiCallLog both directions | di_api_call_logs | CallHistory.View | e2e [1] | 286@6326af4 | FULL | — | — |

## Performance (NFR-01..06, PDF §2.5 p.3)

| Requirement ID | Page | Customer requirement | W | Test/Runtime evidence | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|
| NFR-01 | 3 | Avg response < 10 s (main flows) | H | k6: avg 31 ms, p95 42 ms [5] — local hardware only | MOST | G-33 | OPS-003 |
| NFR-02 | 3 | Max response < 30 s | H | k6 max 418 ms [5] | MOST | G-33 | OPS-003 |
| NFR-03 | 3 | DB server CPU ≤ 75% | M | k6: postgres ~20% avg [5] | MOST | G-33 | OPS-003 |
| NFR-04 | 3 | App server CPU ≤ 75% | M | k6: api ~54% avg (peak sample 77.8%) [5] | MOST | G-33 | OPS-003 |
| NFR-05 | 3 | ≥ 30 concurrent connections | H | k6 30 VUs held 2 min, 0% failures [5] | MOST | G-33 | OPS-003 |
| NFR-06 | 3 | Active users ≥ 1/6 of concurrent (≥5) | M | covered by same run [5] | MOST | G-33 | OPS-003 |

## IPv6/TLS/DNSSEC (IPV-01..06, PDF §2.6 p.3)

| Requirement ID | Page | Customer requirement | W | Evidence | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|
| IPV-01 | 3 | Software supports IPv6 | M | Kestrel dual-stack capable; unverified in deployment | MOST | G-32 | OPS-002 |
| IPV-02..05 | 3 | ISP IPv6, webserver listens on IPv6, AAAA record, DNS hosting IPv6+DNSSEC-ready | M | No production DNS/hosting exists | MISS (deploy) | G-32 | OPS-002 |
| IPV-06 | 3 | HTTPS TLS ≥ 1.2, secure ciphers | H | Code: HSTS 365d + redirect + `PostgreSqlSslValidator`; CI validates prod frontend TLS overlay [9]; no production TLS endpoint | MISS (deploy; code-ready) | G-31 | OPS-001 |

## Application security (SEC-01..25, PDF §3.1 pp.4–8)

| Requirement ID | Page | Customer requirement | W | Evidence | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|
| SEC-01 | 4 | Username unique, charset letters/digits/underscore | M | Unique ✓; charset = ABP default pending customer ruling (M-7) | PART (ruling) | G-21 | SEC-005, EXT-001 |
| SEC-02..04 | 4 | Password ≥8, complexity, 90-day expiry no-reuse | H | Config + `PasswordExpiryMiddleware`; e2e:password-expiry 4/4 [2] | FULL | — | — |
| SEC-05..06 | 4–5 | Reset link single-use/8h expiry; random emailed password policy-compliant | H | verified in password-management spec [2]; GenerateCompliantPassword [6] | FULL | — | — |
| SEC-07 | 5 | Hash+salt password storage | H | ASP.NET Core Identity PBKDF2 (per-user salt) — meets intent (SHA-256/512 is "khuyến nghị") | FULL | — | — |
| SEC-08 | 5 | CAPTCHA on login + important functions, server-verified | H | LoginCaptchaMiddleware over real HTTP (400 on missing/invalid) [2][6]; real-key staging probe owed | MOST | G-17 | SEC-001 |
| SEC-09 | 5 | Sensitive data via POST | M | probe:74 [3] | FULL | — | — |
| SEC-10..11 | 5 | Session timeout; new session at login, destroyed at logout | H | probe:74 [3] | FULL | — | — |
| SEC-12 | 5 | HttpOnly + Secure cookies | H | HttpOnly ✓ [3]; Secure verifiable only on TLS deployment | MOST | G-31 | OPS-001 |
| SEC-13 | 6 | CSRF token on state-changing requests | H | probe:74 CSRF→400 [3] | FULL | — | — |
| SEC-14 | 6 | UI shows only authorized elements | H | permission-gated menus/routes (routePermissions.ts single source, uncommitted) [6] | FULL (commit via BASE-001) | G-02 | BASE-002 |
| SEC-15 | 6 | Server-side function authorization every request | H | [Authorize] per service + probe:74 403s [3] | FULL | — | — |
| SEC-16 | 6 | Server-side data-scope authorization every request | H | ICurrentDataScopeProvider across services + probe:74 IDOR/org isolation [3]; open aggregates flagged | FULL (policy note) | G-22 | SEC-006 |
| SEC-17 | 6 | AuthZ from server-stored state, not client values | H | ABP claims/DB [3] | FULL | — | — |
| SEC-18 | 6–7 | Server-side input validation (type/range/length/format/whitelist) | H | DTO validation + domain guards; BE suite [4]; probe:74 | FULL | — | — |
| SEC-19..20 | 7 | XSS/HTML-encode; response-splitting filter | H | React encoding + server validation; probes [3] | FULL | — | — |
| SEC-21..23 | 7 | No sensitive cookie data; redirect whitelist; safe XML (no XXE) | M | probes + code inspection [3][6] | FULL | — | — |
| SEC-24..25 | 7–8 | Generic error messages; error logging outside webroot, no sensitive data | H | ProblemDetails + `adb30eb` leaked-500 fix; Serilog files | FULL | — | — |

## Database security (DBS-01..10, PDF §3.2 pp.8–10)

| Requirement ID | Page | Customer requirement | W | Evidence | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|
| DBS-01..03, 05, 07, 08 | 8–9 | DBMS hardening, patch level, remove surplus, account policy, non-OS-admin service, login audit (3+6 months), IP restrictions | H | Local compose only — production DB does not exist yet | MISS (deploy) | G-34 | OPS-004 |
| DBS-04 | 9 | App connects with least-privilege dedicated account | H | dedicated app account in compose/config | FULL | — | — |
| DBS-06 | 9 | DB credentials encrypted in config with protected key | M | env-var injection; partner creds encrypted at rest; conn-string encryption per YCKT scheme not implemented | PART | G-34/G-38 | OPS-004, OPS-008 |
| DBS-09 | 9–10 | Encryption at rest + in transit, masking, privileged-user controls | H | in-transit ready (SSL validator); at-rest/masking absent | MISS (deploy) | G-35 | OPS-005 |
| DBS-10 | 10 | Third-party DB Activity Monitoring/Firewall | M | absent (procurement) | MISS (deploy) | G-35 | OPS-005 |

## UI/UX (UI-01..10, PDF §3.4 pp.10–11) & Data tolerance (DT-01..12, §3.5 pp.11–12) & Technology (TECH-01..05, §2.2 p.2)

| Requirement ID | Page | Customer requirement | W | Evidence | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|
| UI-01..03, 05..10 | 10–11 | Intuitive VN web UI, ≤3-click search, consistent screens/icons, simple effective layouts, Unicode/TCVN fonts, friendly VN error split user-vs-system, unified loading indicator, TT 39/2017 content compliance | H | exercised across 286-test suite + design-system pass `17ea0ae` [1][2] | FULL | G-15 (dead header controls) | FUNC-UX-001 |
| UI-04 | 10 | Full keyboard operability, consistent tab order | M | spot-checked only; no dedicated spec | MOST | — | TEST-track (P3, see backlog TEST-005 note) |
| DT-01..12 | 11–12 | dd/mm/yyyy 4-digit year; VND 15+2; instant + file-import validation; referential integrity; required-field markers; specialized inputs; logical tab order; fixed-list dropdowns; defect-reduction process; TT 39/2017 file formats | H | exercised across suite [1][2]; CI format/lint gates [9] | FULL | — | — |
| TECH-01..05 | 2 | Stable server OS / popular DBMS / supported stack / open architecture / Chrome-Edge-Firefox | M | .NET 9 + PostgreSQL 15 + React 19; REST APIs + OpenAPI [7] | FULL | — | — |

## Level-2 InfoSec, Support, Training, Ownership, Handover, Acceptance (PDF §§3.3, 3.6–3.9, 5)

| Requirement ID | Page | Customer requirement | W | Evidence | Status | Gap | Tasks |
|---|---|---|---|---|---|---|---|
| L2-01 | 12 | ATTT level-2 dossier per NĐ 85/2016 + TT 12/2022 + QĐ 742 | H | absent from tree (go/no-go G10) | MISS (doc) | G-40 | DOC-001 |
| SUP-01..04 | 10 | 48 h incident recovery; continuity during repair; ≥2 support channels; 24×7 | M | no process established | MISS (ops) | G-39 | OPS-009 |
| TRN-01 | 12 | Training: 1 class, 1 day, 120 attendees, hands-on | M | not prepared | MISS (ops) | G-44 | DOC-005 |
| OWN-01 | 13 | Data formed during service is customer property | M | contractual + export capability; no signed instrument in repo scope | MISS (doc) | G-45 | DOC-006 |
| OWN-02 | 13 | Full information/data + tools handover at contract end | M | capability exists (dumps, Excel); procedure not documented | MISS (doc) | G-45 | DOC-006 |
| OWN-03..04 | 13 | Provider confidentiality commitment; Vietnamese-controlled legal entity | M | contractual, outside software scope | N/A | — | — |
| HND-01 | 13 | On termination: all data in readable, extractable form | M | capability exists; procedure not documented | MISS (doc) | G-45 | DOC-006 |
| HND-02 | 13 | Provider confidentiality of structures/diagrams/data | M | contractual | N/A | — | — |
| ACC-01..06 | 41–42 | Acceptance per NĐ 224/2026: contract-item completion check; function/business-process testing; integration/data-sharing check; stability/performance/security check; user+admin manuals; acceptance/handover records | H | not yet performed; manuals absent (M-8) | MISS (pending UAT/acceptance) | G-40..43 | DOC-001..004 |

---

### Roll-up (must match gap analysis §C and REMAINING_PLAN_SUMMARY.json)

FULLY 400 · MOSTLY 31 · PARTIALLY 5 · NOT_IMPLEMENTED 28 · EXTERNALLY_BLOCKED 2 · NOT_APPLICABLE 3 · total 469.

> **PHASE-0 ADDENDUM (freeze `17149f6`)**: FR-50-05 row is now **FULL** (G-01/G-02 closed — feature committed at `5bc0d86`, route permission fixed and spec 5/5 at the freeze). Post-freeze roll-up: **FULLY 401 · MOSTLY 30** · PARTIALLY 5 · NOT_IMPLEMENTED 28 · EXTERNALLY_BLOCKED 2 · N/A 3; FR subset FULLY 350 · MOSTLY 20 · PARTIALLY 2.
FR subset (372): FULLY 349 (A 30, B 57, C 206, E 30, F 26) · MOSTLY 21 (A 3: FR-03-02, FR-05-04/05; C 8: FR-29-06, FR-29-08, FR-30-07, FR-LIC-01, FR-34-08, FR-35-08, FR-38-03, FR-38-04; E 2: FR-49-01/02; F 8: FR-50-05, FR-51..57-01 ×7) · PARTIALLY 2 (FR-19-17, FR-40-08).
