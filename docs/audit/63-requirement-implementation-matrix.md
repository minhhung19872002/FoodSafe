# 63 — Requirement → Implementation Traceability Matrix

Audited state: commit `9d2cb1e` + uncommitted working tree (2026-07-27). One row per sub-requirement from doc 61.

**Status legend** (maps to the mandated status set):
- **CNRV** = COMPLETE_NOT_RUNTIME_VERIFIED (0.85) — full FE+BE+DB chain, permission + scope where applicable, but no runtime acceptance evidence (registry: 0/32 VERIFIED; last real e2e run had 25 failures)
- **PART(x)** = PARTIALLY_IMPLEMENTED, score x
- **BE_ONLY** = BACKEND_ONLY (0.50)
- **SHALLOW(x)** = PLACEHOLDER_OR_SHALLOW, score x ≤ 0.20
- **MISS** = NOT_IMPLEMENTED (0.00)
- **NSD** = NON_SOFTWARE_DELIVERABLE

No item qualifies for COMPLETE_RUNTIME_VERIFIED: the feature-verification registry (docs/testing/01) records **zero VERIFIED features**, no verified commit for any feature, and the 25-spec real e2e suite is not green at any recorded commit.

Common evidence shorthands:
- BE = `FoodSafe.BE/src/FoodSafe.Application/...AppService.cs` (auto-exposed at `/api/v1/app/*` + manual controllers `/api/v1/...`)
- FE = `FoodSafe.FE/src/features/<feature>/pages/...`
- Perm = named permission in `FoodSafePermissions.cs` with `[Authorize]` at method level (verified by inspection + contract tests)
- Scope = `ICurrentDataScopeProvider`-filtered query (verified in service code)

---

## Group A — Quản trị hệ thống

### STT 1 — Roles (BE `IdentityAdministrationAppService`, FE `identity/IdentityAdministrationPage` roles tab; perms `SystemAdministration.Roles.*`)
| ID | Status | Evidence / missing |
|---|---|---|
| FR-01-01 create | CNRV | CreateRole + FE modal |
| FR-01-02 update | CNRV | UpdateRole + FE modal |
| FR-01-03 delete | CNRV | DeleteRole + FE action |
| FR-01-04 search | CNRV | GetRoleList w/ filter + FE search |
| FR-01-05 set permissions | CNRV | Get/UpdateRolePermissions + FE permission-tree drawer |
| FR-01-06 assign roles to users | CNRV | UpdateUser roles + `Users.ManageRoles` perm |

### STT 2 — Users (same service/page, users tab; perms `SystemAdministration.Users.*`)
| ID | Status | Evidence / missing |
|---|---|---|
| FR-02-01 list+search | CNRV | GetUserList + FE filters |
| FR-02-02 search by role/permission | PART(0.60) | Role/org/status filters exist; no search by individual permission |
| FR-02-03 create | CNRV | CreateUser (org-scoped, triple perm check) |
| FR-02-04 update | CNRV | UpdateUser |
| FR-02-05 delete | BE_ONLY | DeleteUser exists in BE; FE offers deactivate only, no delete action |
| FR-02-06 admin reset password | CNRV | password-reset endpoint + FE button |
| FR-02-07 random password generation | PART(0.50) | Reset implemented as emailed reset link, not random-password generation (functional equivalent, not literal) |
| FR-02-08 activation email | CNRV | CreateUser sends password-setup email (`SendPasswordResetEmailAsync`, IdentityAdministrationAppService:181) |
| FR-02-09 force change next login | CNRV | `MustChangePassword` + CompleteInitialPasswordChange flow |
| FR-02-10 deactivate/activate | CNRV | activation endpoint + FE toggle |
| FR-02-11 auto-lockout on failed logins | CNRV | Identity lockout: 5 attempts/30 min + `FailedLoginCount/LockedUntil` |
| FR-02-12 unlock | CNRV | lock endpoint + FE |
| FR-02-13 export excel users | MISS | No user Excel service/endpoint/button |

### STT 3 — Audit log (BE `AuditLogAppService` → ABP `AbpAuditLogs`; FE `audit-logs/AuditLogPage`; perm `SystemAdministration.AuditLogs`)
| ID | Status | Evidence / missing |
|---|---|---|
| FR-03-01 search operations | CNRV | URL/method/date/error filters |
| FR-03-02 view detail | PART(0.60) | List rendering only; no per-entry detail view of actions/property changes |
| FR-03-03 export excel | MISS | No export |

### STT 4 — Settings (no backend service; FE `settings/SystemSettingsPage` = static stub)
| ID | Status | Evidence / missing |
|---|---|---|
| FR-04-01 change logo | MISS | Nothing |
| FR-04-02 change login screen | MISS | Nothing |
| FR-04-03 password length config | SHALLOW(0.10) | Policy fixed in code (`IdentityOptions`); static display only, not configurable |
| FR-04-04 lockout config | SHALLOW(0.10) | Fixed in code; not configurable |
| FR-04-05 email config | SHALLOW(0.10) | SMTP via appsettings/env only; no admin UI |
| FR-04-06 homepage info config | MISS | Nothing |

### STT 5 — Access management (BE `AccountSecurityAppService`, ABP account; FE auth pages)
| ID | Status | Evidence / missing |
|---|---|---|
| FR-05-01 login | CNRV | Cookie login + Turnstile captcha + CSRF |
| FR-05-02 logout | CNRV | Logout mutation, session destroyed |
| FR-05-03 change password | CNRV | ChangePassword w/ history+expiry enforcement |
| FR-05-04 edit account info | PART(0.25) | Only password change; no profile (name/contact) self-service editing |
| FR-05-05 change avatar | MISS | No avatar feature |

## Group B — Danh mục

### STT 6 — Organizations (BE `OrganizationAppService` scoped; FE `organizations/OrganizationListPage`; perms `Organizations.*`)
| ID | Status |
|---|---|
| FR-06-01 list+search | CNRV |
| FR-06-02 advanced search + reset | CNRV (level filter + text + reset) |
| FR-06-03 create (+subordinate) | CNRV (parent selection, hierarchy validation) |
| FR-06-04 update | CNRV |
| FR-06-05 delete | CNRV |
| FR-06-06 export excel | MISS — no org export |

### STT 7 — Unit accounts (implemented via user management + org assignment)
| ID | Status |
|---|---|
| FR-07-01 list+search unit accounts | CNRV (user list filtered by organization) |
| FR-07-02 create unit account | CNRV (CreateUser with organizationId) |
| FR-07-03 edit/delete | PART(0.50) — edit ✓; delete BE-only |
| FR-07-04 default password + force change | CNRV |
| FR-07-05 unlock/change password | CNRV |
| FR-07-06 assign permissions | CNRV (role assignment, scope ceiling) |

### STT 8–16 — Nine catalogs (BE `MasterCatalogAppService` + `GeographicCatalogAppService`; FE `catalogs/MasterCatalogPage` + `geography/GeographicCatalogPage`; perms `Catalogs.*`/`GeographicCatalogs.*`)
All 36 items (search/create/update/delete × quốc gia, vùng miền, tỉnh, xã, phân loại cơ sở, nhóm SP, loại hình cơ sở, loại hình QC, cơ sở kiểm nghiệm): **CNRV**. Duplicate-code guards in BE; catalogs are global (unscoped by design).

### STT 17 — Testing services
FR-17-01..04 CRUD: **CNRV** (testing-services catalog kind, per-center). FR-17-05 export excel: **MISS**.

### STT 18 — Document types
FR-18-01..04: **CNRV** (catalog kind `document-type`). Defect note: the Documents feature (STT 38) ignores this catalog (hard-coded list) — scored there.

## Group C — Quản lý ATTP

### STT 19 — Businesses (BE `BusinessAppService` + `BusinessExcelAppService`, scoped, perms incl. `Import`; FE `businesses/BusinessManagementPage`; DB `businesses` + children)
| ID | Status | Notes |
|---|---|---|
| FR-19-01 list+search | CNRV | |
| FR-19-02 advanced search by classification | PART(0.50) | Text+status filters; no classification/type/area filter UI |
| FR-19-03 create | CNRV | |
| FR-19-04 import excel | CNRV | template/preview/confirm, row-level validation |
| FR-19-05 update | CNRV | |
| FR-19-06 delete | CNRV | |
| FR-19-07 detail | CNRV | |
| FR-19-08 export excel | CNRV | |
| FR-19-09 map position | CNRV | Leaflet MapPicker + coordinates CHECK in DB |
| FR-19-10 product groups | CNRV | business_product_groups |
| FR-19-11 giấy tờ công bố per business | PART(0.70) | Fulfilled via Self-declaration module linked by businessId; no per-business document tab |
| FR-19-12 giấy ĐKCB per business | PART(0.70) | Via Product-registration module |
| FR-19-13 giấy quảng cáo per business | PART(0.70) | Via Ad-registration module |
| FR-19-14 handlers (người trực tiếp SXKD) | CNRV | AddHandler/UpdateHandler/DeleteHandler + FE modal; health/training cert dates |
| FR-19-15 inspection results per business | PART(0.70) | Via Inspection module; no per-business result tab |
| FR-19-16 confirm đủ điều kiện | PART(0.70) | Via Eligibility-certificate module |
| FR-19-17 confirm bản cam kết VSATTP | CNRV | `HasVsattpCommitment` flag in entity+DTO+FE |
| FR-19-18 data scope địa bàn/đầu mối | CNRV | `CurrentDataScope` + `ManagementScopeAssignment` (geographic + business-type + product-group + per-business scopes) |

### STT 20 — Products
FR-20-01..08 (list, search, create, update, delete, detail, excel import, excel export): all **CNRV** (`ProductAppService`, `ProductExcelAppService`, attachments extra).

### STT 21 — Self-declarations
FR-21-01..09: all **CNRV** (`SelfDeclarationAppService` + attachments service + excel export; revoke/activate beyond spec).

### STT 22 — Product registrations
FR-22-01..09: all **CNRV** (same pattern; global-unique number; public lookup extra).

### STT 23 — Advertisement registrations
FR-23-01..11: all **CNRV** (multi-product selection ✓, attachments ✓, export ✓).

### STT 24 — Eligibility certificates
FR-24-01..10: all **CNRV**.

### STT 25 — CFS certificates
FR-25-01..11: all **CNRV** (destination-country catalog link ✓).

### STT 26 — Export food certificates
FR-26-01..11: all **CNRV**.

### Cross-cutting licensing
| ID | Status | Notes |
|---|---|---|
| FR-LIC-01 NĐ 15/2018 license templates/forms | PART(0.30) | Data fields exist; **no certificate document generation (QuestPDF absent), no decree-form templates** |
| FR-LIC-02 license data scope | CNRV | Business-parent scope checkers |

### STT 27 — Inspection plans (BE `InspectionPlanAppService` full workflow; FE inspection plans tab; DB evidence CHECKs)
| ID | Status | Notes |
|---|---|---|
| FR-27-01 search | CNRV | |
| FR-27-02 create | CNRV | |
| FR-27-03 add businesses | CNRV | draft-only guard |
| FR-27-04 remove businesses | CNRV | |
| FR-27-05 update | CNRV | |
| FR-27-06 delete | CNRV | |
| FR-27-07 detail | CNRV | |
| FR-27-08 upload plan documents | MISS | No attachment wiring for inspection plans (7 attachment services cover products+licenses only) |
| FR-27-09 view/download plan documents | MISS | Same |
| FR-27-10 export excel | CNRV | |
| FR-27-11 data scope | CNRV | |

### STT 28 — Inspection results
| ID | Status | Notes |
|---|---|---|
| FR-28-01 filter by plan | CNRV | |
| FR-28-02 view plan+results | CNRV | |
| FR-28-03 close/finalize per-business result | PART(0.70) | Result records + follow-up result; no explicit finalize/lock step |
| FR-28-04 update per-business result | CNRV | violations, fines, remediation |
| FR-28-05 download/export result documents | PART(0.40) | Excel export exists; no document attachments |
| FR-28-06 reload/reset search | CNRV | |
| FR-28-07 data scope | CNRV | (cross-org plan mutation fix ca5e7f8) |

### STT 29 — Alerts (BE `AtpAlertAppService`; FE alerts tab; publish/recall evidence CHECKs)
| ID | Status | Notes |
|---|---|---|
| FR-29-01 search | CNRV | |
| FR-29-02 create | CNRV | |
| FR-29-03 update | CNRV | draft-only |
| FR-29-04 delete | CNRV | |
| FR-29-05 view | CNRV | |
| FR-29-06 approve citizen-submitted alerts | MISS | **No citizen submission channel exists**, so no approval queue (source enum has citizen value but nothing creates it) |
| FR-29-07 recall | CNRV | evidence columns |
| FR-29-08 export | CNRV | |
| FR-29-09 scope | CNRV | |

### STT 30 — News
| ID | Status | Notes |
|---|---|---|
| FR-30-01..05 search/create/update/delete/view | CNRV ×5 | |
| FR-30-06 link violating-business alerts | CNRV | news_linked_alerts |
| FR-30-07 approve citizen-submitted news | MISS | No citizen channel |
| FR-30-08 recall | CNRV | (defect: RecalledBy/At not stored for news) |
| FR-30-09 publish for citizens to read | PART(0.40) | Publish status works internally; **no public news page/endpoint** — citizens cannot read published news |

### STT 31 — Poisoning cases (BE `FoodPoisoningCaseAppService`; workflow Draft→Reported→Verified; error reports)
FR-31-01..11 (search, declare, update, delete, detail, verify, view verified, create error report, view error report, export excel, scope): all **CNRV**. Map view extra.

### STT 32 — Poisoning incidents
FR-32-01..10: all **CNRV** (incl. Conclude = phiếu kết thúc with `Incidents.Conclude` permission; province-only enforcement is via permission grant rather than explicit level check — note).

### STT 33 — NĐTP reports (BE `NdtpReportAppService`; BaseReport 5-state machine; immutable after submit; error notifications; unique (org, period))
| ID | Status | Notes |
|---|---|---|
| FR-33-01 search | CNRV | |
| FR-33-02 create (xã lập; TP tổng hợp) | PART(0.60) | Per-org creation ✓; **no roll-up/aggregation of commune reports at city/province level** |
| FR-33-03 edit draft | CNRV | EnsureDraft |
| FR-33-04 submit + immutable | CNRV | guards + SubmissionVersion |
| FR-33-05 error notification upward | **COMPLETE_RUNTIME_VERIFIED (1.00)** | Implemented + runtime-verified 2026-07-27 (`07476e3`): endpoints `{id}/error-notification(s)`, acknowledge/respond; FE modal in all report tabs; spec `reporting-error-notifications.spec.ts` (lifecycle, validation, permission denial, persistence) |
| FR-33-06 return to lower level | CNRV | Return + ReturnToDraft |
| FR-33-07 verify | CNRV | |
| FR-33-08 view detail | CNRV | |
| FR-33-09 delete draft | CNRV | |
| FR-33-10 export excel | CNRV | |
| FR-33-11 monthly period | CNRV | period columns + unique index |

### STT 34 — ATTP work reports
| ID | Status | Notes |
|---|---|---|
| FR-34-01..04,06,07,09,11 | CNRV ×8 | Same machine as STT 33 |
| FR-34-05 error notification | **COMPLETE_RUNTIME_VERIFIED (1.00)** | Same implementation as FR-33-05 (`07476e3`); shared FE modal + endpoints verified for NDTP; ATP endpoints identical code path |
| FR-34-08 view as document | PART(0.50) | Narrative fields render in modal; no formatted document view |
| FR-34-10 auto-calculate figures | MISS | All 20+ statistic fields are manual inputs (`UpdateStats`); no aggregation from system data (verified: no calculation service exists) |

### STT 35 — Action-month reports
FR-35-01..04,06,07,09,10: **CNRV** ×8. FR-35-05 error notification: **COMPLETE_RUNTIME_VERIFIED (1.00)** (`07476e3`, same implementation as FR-33-05). FR-35-08 view as document: **PART(0.50)**. (Defect: action-month date range is free-text without validation.)

### STT 36 — Risk analysis
| ID | Status | Notes |
|---|---|---|
| FR-36-01..06 | CNRV ×6 | CRUD + draft-guarded publish |
| FR-36-07 publish to public portal | PART(0.40) | Publish status only; **no public risk-analysis page/endpoint** |
| FR-36-08 print/export | PART(0.60) | Excel export ✓; no print/PDF of content |

### STT 37 — Testing results
FR-37-01..06: all **CNRV** (minor: testing center free-text instead of catalog link).

### STT 38 — Administrative documents
| ID | Status | Notes |
|---|---|---|
| FR-38-01,02,05,06 | CNRV ×4 | |
| FR-38-03 create | PART(0.70) | Works, but document type is a hard-coded 8-value list ignoring the STT 18 catalog |
| FR-38-04 update | PART(0.70) | Same |
| FR-38-07 print/export | PART(0.60) | Excel list export only; no per-document print/output; no file attachment of the document itself |

### STT 39 — Dashboard (BE `DashboardAppService` real aggregates, org-scoped; FE DashboardPage + StatisticsPage + PoisoningMap)
| ID | Status | Notes |
|---|---|---|
| FR-39-01 business/product counts | CNRV | |
| FR-39-02 filter by time + unit | PART(0.30) | Statistics page has year filter only; dashboard has neither time nor unit selector |
| FR-39-03 work-report submission tracking | MISS | No per-unit report-compliance widget |
| FR-39-04 action-month report tracking | MISS | Same |
| FR-39-05 businesses by type | CNRV | Statistics chart |
| FR-39-06 NĐTP stats over time | CNRV | Line chart |
| FR-39-07 NĐTP map | CNRV | Leaflet map tab (cases+incidents coordinates) |
| FR-39-08 NĐTP bar chart | CNRV | |
| FR-39-09 save/download charts & figures | MISS | No chart/figure download |

### STT 40 — Statistics reports (BE `StatisticsAppService`)
| ID | Status | Notes |
|---|---|---|
| FR-40-01 licenses by business type | CNRV | |
| FR-40-02 export excel | MISS | Statistics page has no excel export |
| FR-40-03 NĐTP statistics | CNRV | |
| FR-40-04 export excel | MISS | |
| FR-40-05 inspection stats (violations/handled/plans) | CNRV | |
| FR-40-06 export excel | MISS | |
| FR-40-07 businesses by type/region/area/manager | PART(0.50) | By type ✓; by region/area/managing-unit breakdowns absent |
| FR-40-08 export excel | MISS | |

## Group E — Public portal

Backend anonymous surface = 7 exact-number lookup endpoints only (verified: `[AllowAnonymous]` grep + service bodies return single DTO). No public listing, no file/certificate serving, no public news/alerts/documents/risk content, no citizen submission.

| ID | Status | Notes |
|---|---|---|
| FR-41-01 public business search | PART(0.60) | Single exact name/code match, not a search-result experience |
| FR-41-02 business results display | PART(0.50) | One Descriptions card; no list |
| FR-41-03 public product search | MISS | No public product endpoint |
| FR-41-04 product results display | MISS | |
| FR-42-01 eligibility-certified list | PART(0.30) | Number-lookup only, no browsable list |
| FR-42-02 view certificate info | CNRV | Fields incl. effective status |
| FR-42-03 view certificate document | MISS | No file exposure |
| FR-42-04 print/download certificate | MISS | |
| FR-43-01..04 self-declaration lookup | PART(0.30)/CNRV/MISS/MISS | Same pattern |
| FR-44-01..04 ĐKCB lookup | PART(0.30)/CNRV/MISS/MISS | Same pattern |
| FR-45-01..03 warned-business lookup | MISS ×3 | Nothing public for alerts/warned businesses |
| FR-46-01..04 CFS lookup | PART(0.30)/CNRV/MISS/MISS | |
| FR-47-01..04 export-cert lookup | PART(0.30)/CNRV/MISS/MISS | |
| FR-48-01 public news/alert list | MISS | Publish exists internally; no public rendering |
| FR-48-02 public news search | MISS | |
| FR-48-03 citizen alert submission | MISS | No endpoint, no page, no moderation queue |
| FR-49-01 public document lookup | MISS | Documents module is internal-only |
| FR-49-02 view document | MISS | |

## Group F — Integration

### STT 50 — API spec management (BE `ApiEndpointAppService` CRUD, scoped, permission-gated; FE data-integration endpoints tab)
FR-50-01..04, 06: **CNRV** ×5. FR-50-05 spec detail/config guidance: **PART(0.50)** (endpoint metadata only — no machine-readable spec, no partner-facing documentation). FE toggle-status button broken (`/api/api/...` URL) — defect, not a PDF sub-item.

### STT 51–57 — Share history (7 data types)
Infrastructure exists (`di_api_call_logs` + viewer + filters + excel export) but **no code path ever writes a call log**: there is no outbound sender, no inbound partner endpoint, no partner authentication. The 7 required data types are not modeled as distinct share flows — only a generic call log.

Per data type (×7 — alerts, inspection results, poisoning, licenses, products, news, businesses):
| Sub-item | Status |
|---|---|
| (a) display received-history | SHALLOW(0.20) — viewer over a table nothing populates |
| (b) share/send data | MISS |
| (c) view detail | SHALLOW(0.20) |
| (d) search | SHALLOW(0.20) |

## Non-functional categories

### INT (§2.4)
| ID | Status | Notes |
|---|---|---|
| INT-01 MoH connectivity | MISS | No integration engine |
| INT-02 TT 31/2026 + NĐ 37/2026 compliance | MISS | Not addressed |
| INT-03 partner accounts + API sessions (Sở NN, Sở CT) | MISS | No partner auth/token issuance |
| INT-04 API spec documents | SHALLOW(0.20) | Endpoint CRUD metadata only |
| INT-05 share-history persistence | PART(0.30) | Table+viewer exist; nothing produces records |

### NFR performance (§2.5) — no load-test evidence at any commit
NFR-01 PART(0.50); NFR-02 PART(0.50); NFR-03 PART(0.25); NFR-04 PART(0.25); NFR-05 PART(0.50) (30-user target plausible with Redis/pooling, unproven); NFR-06 PART(0.50).

### IPV (§2.6)
| ID | Status | Notes |
|---|---|---|
| IPV-01 software IPv6 | PART(0.50) | Kestrel/`http://+:8080` can bind IPv6, but delivered network + nginx are IPv4-only |
| IPV-02 ISP IPv6 | MISS | Deployment obligation, nothing prepared |
| IPV-03 webserver IPv6 listener | PART(0.25) | nginx lacks `listen [::]`; compose subnet IPv4-only |
| IPV-04 AAAA record | MISS | |
| IPV-05 IPv6 DNS/DNSSEC | MISS | |
| IPV-06 HTTPS TLS ≥1.2 | PART(0.50) | HSTS+HTTPS-redirect+Secure cookies in prod mode; actual TLS termination/certificates not provisioned |

### SEC (§3.1)
| ID | Status/score | Evidence |
|---|---|---|
| SEC-01 username rules | PART(0.40) | Unique ✓ (ABP); but usernames are set to email addresses (`@`, `.`) violating the letters/digits/underscore rule |
| SEC-02 min length 8 | CNRV | IdentityOptions |
| SEC-03 complexity | CNRV | digit+lower+upper+special |
| SEC-04 90-day expiry + no reuse | CNRV | PasswordValidity 90d, PasswordHistory + EnsurePasswordIsNotReused |
| SEC-05 reset link one-use/8h | PART(0.50) | ABP tokens single-use; 8-hour lifetime not explicitly configured/verified |
| SEC-06 random emailed password policy | PART(0.50) | Link-based reset used instead of emailed passwords |
| SEC-07 hash+salt | CNRV | ASP.NET Identity PBKDF2 (exceeds SHA-256+salt recommendation) |
| SEC-08 captcha on login + important functions | PART(0.70) | Turnstile on login + initial password change, server-verified middleware; not on other "important" mutations; action/hostname check skipped outside Production |
| SEC-09 POST for sensitive data | CNRV | Login POST; username removed from query strings (9d2cb1e) |
| SEC-10 session timeout | CNRV | 30-min sliding cookie |
| SEC-11 new session at login / destroy at logout | PART(0.70) | Framework behavior; not runtime-verified |
| SEC-12 HttpOnly + Secure | CNRV | SameSite=Strict, Secure=Always (prod) |
| SEC-13 CSRF token on mutations | CNRV | XSRF-TOKEN → RequestVerificationToken validated |
| SEC-14 permission-based UI | CNRV | Menu + PermissionRoute filtered; no CSS-hiding |
| SEC-15 function permission every request | CNRV | 107 permissions, method-level `[Authorize]` on all business services |
| SEC-16 data-scope every request | CNRV | 27 services scoped; child entities via parent-business checkers |
| SEC-17 server-held authority | CNRV | Scope from `AppUserProfile`/`ManagementScopeAssignment`, never client values |
| SEC-18 server-side validation | PART(0.70) | DTO annotations + domain guards + import preview; depth uneven across DTOs |
| SEC-19 XSS output encoding | PART(0.70) | React auto-escaping + CSP; no raw-HTML rendering found; not pentested |
| SEC-20 response-splitting filter | PART(0.70) | ASP.NET header validation (framework default) |
| SEC-21 no sensitive cookie data | CNRV | Session id only |
| SEC-22 redirect whitelist | PART(0.60) | SPA-internal redirects only; ABP account flows not audited |
| SEC-23 XML safety | PART(0.70) | No XML processing surface found (default safe parsers) |
| SEC-24 generic error messages | PART(0.70) | ABP exception → localized codes (vi+en); not verified against info leakage |
| SEC-25 error logging outside webroot, no sensitive data | PART(0.60) | Container stdout logging; no log-content audit |

### DBS (§3.2) — mostly deployment obligations; assessed for delivered support
DBS-01 PART(0.30) (postgres:15-alpine; patching = ops) · DBS-02 PART(0.30) · DBS-03 PART(0.30) · DBS-04 PART(0.20) (single `foodsafe` DB owner account — not least-privilege split) · DBS-05 PART(0.40) (container non-OS-admin) · DBS-06 SHALLOW(0.10) (**connection credentials in plaintext appsettings/env; committed dev secrets `FoodSafe@Dev2026!`, `change-this-in-production`**) · DBS-07 PART(0.20) (no DB login auditing config) · DBS-08 PART(0.30) (docker network isolation; no pg_hba IP policy) · DBS-09 PART(0.20) (no at-rest/in-transit DB encryption, no masking, no privileged-user controls) · DBS-10 MISS (no third-party DAM/DB firewall).

### UI (§3.4)
UI-01 PART(0.70) · UI-02 CNRV · UI-03 PART(0.70) (flat menu, ≤3 clicks plausible; unmeasured) · UI-04 PART(0.50) (AntD keyboard defaults; consistency not audited) · UI-05 PART(0.70) · UI-06 CNRV (full Vietnamese Unicode) · UI-07 PART(0.70) (vi error codes; user-vs-system distinction partial) · UI-08 PART(0.50) · UI-09 PART(0.70) (AntD Spin/loading states standard) · UI-10 PART(0.30) (TT 39/2017 content standard unassessed).

### DT (§3.5)
DT-01 PART(0.70) (dd/mm/yyyy via dayjs) · DT-02 PART(0.70) (numeric(18,2) fines; 15-digit VND not explicitly proven) · DT-03 PART(0.70) · DT-04 PART(0.70) (excel preview validation) · DT-05 CNRV (extensive FK/CHECK constraints) · DT-06 PART(0.70) · DT-07 PART(0.70) (AntD required marks) · DT-08 PART(0.60) (typed inputs; defect: action-month date free-text) · DT-09 PART(0.50) (tab order unaudited) · DT-10 PART(0.70) (selects; documents-type list hard-coded) · DT-11 PART(0.70) (CI + lint + format + warnaserror) · DT-12 PART(0.30) (TT 39/2017 file-format compliance unassessed).

### TECH (§2.2)
TECH-01 CNRV (Linux containers) · TECH-02 CNRV (PostgreSQL 15 + backup-capable) · TECH-03 CNRV (.NET 9/React 19) · TECH-04 PART(0.70) (REST/OpenAPI; partner-facing spec missing) · TECH-05 PART(0.70) (modern-browser stack; not cross-browser-tested — Playwright config runs Chromium only).

### L2 (§3.7)
L2-01 PART(0.40): many level-2 technical controls delivered (authn/authz/audit/captcha/lockout); no security-level dossier (hồ sơ đề xuất cấp độ), no approval record, DBS/monitoring gaps above.

### Non-software deliverables (§3.3, 3.6, 3.8, 3.9, §5)
SUP-01..04, TRN-01, OWN-01..04, HND-01..02: **NSD** — no evidence in repository (contractual/service obligations; nothing to assess in code). ACC-01..04, 06: NSD process items pending; ACC-05 (user manual + admin manual): **PART(0.30)** — ops/dev docs exist (docs 36–40), **no end-user manual (HDSD), no admin manual for acceptance**.
