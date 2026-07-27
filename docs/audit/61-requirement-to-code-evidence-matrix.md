# 61 — Requirement-to-Code Evidence Matrix

**Audit date**: 2026-07-27
**Branch**: `codex/production-readiness` at `c55b57f`
**Source**: Independent code-evidence audit (6 agents + targeted verification)
**Corrections from prior audit (doc 68)**: 20 items upgraded (see doc 65 §1)

---

## Scoring Convention

| Score | Meaning |
|---|---|
| 0.85 | VERIFIED_RUNTIME — implemented + feature E2E tested against real stack |
| 0.70 | MOSTLY_COMPLETE — implemented, minor gaps, tested |
| 0.50 | PARTIAL — partially implemented, significant gap remains |
| 0.30 | SHALLOW — structure exists but no real behavior |
| 0.20 | DATABASE_ONLY — schema exists, no API/UI |
| 0.00 | NOT_IMPLEMENTED — zero code evidence |

No item scores 1.00 — production acceptance testing not yet conducted.

---

## Group A — Quản trị hệ thống (STT 1–5, 33 items)

### STT 1 — Quản lý vai trò (6 items) — Score: 5.10/6 = 85%

| ID | Requirement | Score | BE Evidence | FE Evidence |
|---|---|---|---|---|
| FR-01-01 | Thêm mới vai trò | 0.85 | `IdentityAdministrationAppService.CreateRoleAsync` | `RoleFormModal` |
| FR-01-02 | Sửa vai trò | 0.85 | `UpdateRoleAsync` | Same modal |
| FR-01-03 | Xóa vai trò | 0.85 | `DeleteRoleAsync` | Delete confirm |
| FR-01-04 | Tìm kiếm vai trò | 0.85 | `GetRoleListAsync` | Filter input |
| FR-01-05 | Đặt permissions | 0.85 | `Get/UpdateRolePermissionsAsync` | `RolePermissionsDrawer` |
| FR-01-06 | Phân vai trò cho user | 0.85 | `UpdateUser` role assignment | Role select in user form |

### STT 2 — Quản lý người dùng (13 items) — Score: 9.25/13 = 71%

| ID | Requirement | Score | Evidence | Gap |
|---|---|---|---|---|
| FR-02-01 | Danh sách + tìm kiếm | 0.85 | `GetUserListAsync` + FE filters | — |
| FR-02-02 | Tìm kiếm theo quyền | 0.50 | Role/org/status filters; no per-permission filter | Permission search |
| FR-02-03 | Tạo mới | 0.85 | `CreateUserAsync` org-scoped | — |
| FR-02-04 | Sửa | 0.85 | `UpdateUserAsync` | — |
| FR-02-05 | Xóa | 0.50 | BE `DeleteUserAsync` exists; FE offers deactivate only | FE delete UI |
| FR-02-06 | Đặt lại mật khẩu | 0.85 | `password-management-verification.spec.ts` | — |
| FR-02-07 | Tạo ngẫu nhiên mật khẩu | 0.50 | Link-based reset used | Literal random password UX |
| FR-02-08 | Email kích hoạt | 0.85 | `CreateUser` sends setup email | — |
| FR-02-09 | Bắt buộc đổi MK | 0.85 | `MustChangePassword` flow | — |
| FR-02-10 | Vô hiệu hóa/kích hoạt | 0.85 | Activation toggle | — |
| FR-02-11 | Tự động khóa | 0.85 | Identity lockout 5/30min | — |
| FR-02-12 | Mở khóa | 0.85 | Unlock endpoint + FE | — |
| FR-02-13 | Xuất excel | 0.00 | No user Excel service | Missing |

### STT 3 — Nhật ký hệ thống (3 items) — Score: 1.45/3 = 48%

| ID | Requirement | Score | Evidence | Gap |
|---|---|---|---|---|
| FR-03-01 | Tìm kiếm thao tác | 0.85 | `AuditLogAppService` + URL/method/date/error filters | — |
| FR-03-02 | Xem chi tiết thao tác | 0.60 | List rendering; no per-entry detail drawer | Detail view |
| FR-03-03 | Xuất excel | 0.00 | No export endpoint/button | Missing |

### STT 4 — Cài đặt hệ thống (6 items) — Score: 0.30/6 = 5%

| ID | Requirement | Score | Evidence | Gap |
|---|---|---|---|---|
| FR-04-01 | Logo upload | 0.00 | Static stub page | Missing |
| FR-04-02 | Login screen customization | 0.00 | Static stub | Missing |
| FR-04-03 | Password policy config | 0.10 | Fixed in code; static display | Admin UI |
| FR-04-04 | Lockout config | 0.10 | Fixed in code; static | Admin UI |
| FR-04-05 | SMTP config | 0.10 | appsettings only; no admin UI | Admin UI |
| FR-04-06 | Homepage config | 0.00 | Static stub | Missing |

### STT 5 — Quản lý truy cập (5 items) — Score: 2.80/5 = 56%

| ID | Requirement | Score | Evidence | Gap |
|---|---|---|---|---|
| FR-05-01 | Đăng nhập | 0.85 | Cookie login + Turnstile CAPTCHA + CSRF | — |
| FR-05-02 | Đăng xuất | 0.85 | `GET /api/account/logout` | — |
| FR-05-03 | Đổi mật khẩu | 0.85 | History+expiry enforcement | — |
| FR-05-04 | Chỉnh sửa thông tin | **0.10** | Password change only; no profile editing UI or API for name/phone/email/department | Profile edit (**↓ was 0.25**) |
| FR-05-05 | Ảnh đại diện | 0.00 | No avatar feature | Missing |

**Group A total: 18.75/33 = 56.8%** (↓ was 18.90/33 = 57.3%; FR-05-04 corrected)

---

## Group B — Quản lý danh mục (STT 6–18, 57 items)

### STT 6 — Đơn vị (6 items) — Score: 4.25/6 = 71%

| ID | Score | Evidence | Gap |
|---|---|---|---|
| FR-06-01..05 | 0.85 ea | `OrganizationAppService` CRUD + hierarchy | — |
| FR-06-06 (Excel) | 0.00 | No export | Missing |

### STT 7 — Tài khoản đơn vị (6 items) — Score: 4.75/6 = 79%

| ID | Score | Evidence | Gap |
|---|---|---|---|
| FR-07-01/02/04/05/06 | 0.85 ea | Identity admin scoped by org | — |
| FR-07-03 (sửa/xóa) | 0.50 | Edit ✓; delete: FE deactivate-only | FE delete |

### STT 8–16 — 9 Geographic + Master Catalogs (36 items) — Score: 30.60/36 = 85%

All 36 items (search/create/update/delete × 9 types) at 0.85 via `MasterCatalogAppService` + `GeographicCatalogAppService`. All verified in `catalogs-verification.spec.ts` and `geography-verification.spec.ts`.

### STT 17 — Dịch vụ kiểm nghiệm (5 items) — Score: 3.40/5 = 68%

| ID | Score | Evidence | Gap |
|---|---|---|---|
| FR-17-01..04 | 0.85 ea | Testing services catalog CRUD | — |
| FR-17-05 (Excel) | 0.00 | No export | Missing |

### STT 18 — Loại văn bản (4 items) — Score: 3.40/4 = 85%

All 4 CRUD items at 0.85. Note: Documents feature uses hard-coded list, not this catalog.

**Group B total: 46.40/57 = 81.4%** (unchanged)

---

## Group C — Quản lý ATTP (STT 19–40, 216 items)

### STT 19 — Cơ sở SXKD (18 items) — Score: 14.35/18 = 80%

| ID | Score | Evidence | Gap |
|---|---|---|---|
| FR-19-01,03..10,14,17,18 | 0.85 ea (12 items) | `BusinessAppService` full CRUD + import/export + map + handlers + scope | — |
| FR-19-02 | 0.50 | Text+status filters; no type/classification/area | Advanced filters |
| FR-19-11..13,15,16 | 0.50 ea (5 items) | Via separate modules; no per-business tab | Per-business tabs |

### STT 20 — Sản phẩm (8 items) — Score: 6.80/8 = 85%

All 8 items at 0.85: `ProductAppService` CRUD + import/export + file attachments.

### STT 21–26 + LIC — Licensing (63 items) — Score: 53.85/63 = 85%

61 items at 0.85 (full CRUD + revoke + file attachments + Excel + public lookup).
FR-LIC-01 (certificate PDF generation): 0.50 — data fields exist; QuestPDF not integrated.
FR-LIC-02 (facility-scoped licenses): 0.85.

### STT 27 — Kế hoạch thanh kiểm tra (11 items) — Score: 7.65/11 = 70%

| ID | Score | Evidence | Gap |
|---|---|---|---|
| FR-27-01..07 + 10 + 11 | 0.85 ea (9 items) | 6-state machine, CRUD, Excel, org-scoped | — |
| FR-27-08/09 | 0.00 ea | No attachment support for inspection plans | Missing |

### STT 28 — Kết quả thanh kiểm tra (7 items) — Score: 5.35/7 = 76%

| ID | Score | Evidence | Gap |
|---|---|---|---|
| FR-28-01/02/04/06/07 | 0.85 ea | Result CRUD, violations, follow-up | — |
| FR-28-03 (finalize) | 0.50 | Results recorded; no explicit lock step | Lock step |
| FR-28-05 (document download) | 0.50 | Excel ✓; no attachments | Attachment pipeline |

### STT 29 — Cảnh báo (9 items) — Score: 7.30/9 = 81% ★CORRECTED

| ID | Score | Prior | Change | Evidence |
|---|---|---|---|---|
| FR-29-01..05,07,08,09 | 0.85 ea | same | — | Alert CRUD + publish/revoke + Excel |
| FR-29-06 (citizen moderation) | **0.50** | 0.00 | **+0.50** | `CitizenAlertReportAppService` creates Draft alerts with `Source=PublicReport`; officers moderate via existing alert list |

### STT 30 — Tin tức (9 items) — Score: 6.70/9 = 74% ★CORRECTED

| ID | Score | Prior | Change | Evidence |
|---|---|---|---|---|
| FR-30-01..06,08 | 0.85 ea | same | — | News CRUD + linked alerts + publish/recall |
| FR-30-07 (citizen news submit) | 0.00 | same | — | No citizen news channel |
| FR-30-09 (publish to citizens) | **0.85** | 0.50 | **+0.35** | `PublicNewsPage.tsx` renders published news publicly |

### STT 31–32 — Ngộ độc (21 items) — Score: 17.85/21 = 85%

All 21 items at 0.85: full case+incident lifecycle + error reports + map + Excel.

### STT 33–35 — Báo cáo (32 items) — Score: 25.55/32 = 80%

27 items at 0.85 (full 5-state workflow + error notifications + Excel).
Gaps: FR-33-02 roll-up (0.50), FR-34-08/35-08 formatted doc view (0.50 ea), FR-34-10 auto-aggregation (0.00).

### STT 36 — Phân tích nguy cơ (8 items) — Score: 6.45/8 = 81% ★CORRECTED

| ID | Score | Prior | Change | Evidence |
|---|---|---|---|---|
| FR-36-01..06 | 0.85 ea | same | — | Risk analysis CRUD + publish |
| FR-36-07 (public portal) | **0.85** | 0.50 | **+0.35** | `PublicContentAppService.GetRiskAnalysesAsync` + news page risk tab |
| FR-36-08 (print/export) | 0.50 | same | — | Excel ✓; no PDF/print |

### STT 37 — Kiểm nghiệm (6 items) — Score: 5.10/6 = 85%

All 6 at 0.85.

### STT 38 — Văn bản (7 items) — Score: 5.40/7 = 77%

| ID | Score | Evidence | Gap |
|---|---|---|---|
| FR-38-01/02/05/06 | 0.85 ea | CRUD + org-scoped | — |
| FR-38-03/04 | 0.50 ea | Hard-coded document type list | Catalog integration |
| FR-38-07 | 0.50 | Excel list only; no per-document output | Print/attachment |

### STT 39 — Dashboard (9 items) — Score: 3.80/9 = 42% (↓ was 4.55/9 = 51%)

| ID | Score | Evidence | Gap |
|---|---|---|---|
| FR-39-01,05,06,07 | 0.85 ea | `DashboardAppService` + 8 stat cards | — |
| FR-39-08 | **0.40** | Only Ant Design `Progress` bars on dashboard; Leaflet map and Recharts exist in other features but not here | Map/chart on dashboard (**↓ was 0.85**) |
| FR-39-02 | **0.00** | `DashboardPage.tsx` has no DatePicker, RangePicker, or unit Select; `GetStatsAsync()` accepts no filter params | Time/unit selector (**↓ was 0.50**) |
| FR-39-03/04 | 0.00 ea | No report compliance widgets | Missing |
| FR-39-09 | 0.00 | No chart download | Missing |

### STT 40 — Báo cáo thống kê (8 items) — Score: 2.65/8 = 33% (↓ was 3.05/8 = 38%)

| ID | Score | Evidence | Gap |
|---|---|---|---|
| FR-40-01,03,05 | 0.85 ea | `StatisticsAppService` + Recharts | — |
| FR-40-07 | **0.10** | `StatisticsFilterDto` has only `Year`; no sub-unit/region/area breakdown exists | Breakdowns (**↓ was 0.50**) |
| FR-40-02,04,06,08 | 0.00 ea | No `StatisticsExcelAppService` | 4 missing Excel exports |

**Group C total: 167.95/216 = 77.8%** (↓ was 169.40; FR-39-02 −0.50, FR-39-08 −0.45, FR-40-07 −0.40, food poisoning error report −0.10)

---

## Group E — Cổng thông tin công cộng (STT 41–49, 32 items) ★MAJOR CORRECTIONS

### STT 41 — Tra cứu thông tin chung (4 items) — Score: 3.40/4 = 85% ★CORRECTED (was 28%)

| ID | Score | Prior | Change | Evidence |
|---|---|---|---|---|
| FR-41-01 | **0.85** | 0.30 | **+0.55** | `PublicGeneralSearchPage.tsx` Business tab — paginated list, not single-item |
| FR-41-02 | **0.85** | 0.30 | **+0.55** | Same — paginated table with business info |
| FR-41-03 | **0.85** | 0.00 | **+0.85** | Product tab in same page + `PublicDirectoryAppService.SearchProductsAsync` |
| FR-41-04 | **0.85** | 0.00 | **+0.85** | Paginated product table with name/code/brand/business/group |

### STT 42 — Tra cứu GCN đủ điều kiện (4 items) — Score: 1.70/4 = 43% ★CORRECTED (was 29%)

| ID | Score | Prior | Change | Evidence |
|---|---|---|---|---|
| FR-42-01 | **0.85** | 0.30 | **+0.55** | `PublicCertificateSearchPage.tsx` "Giấy đủ ĐK ATTP" tab — browsable paginated list |
| FR-42-02 | 0.85 | same | — | Lookup + info display |
| FR-42-03 | 0.00 | same | — | No public file serving |
| FR-42-04 | 0.00 | same | — | No print/download |

### STT 43 — Tra cứu tự công bố (4 items) — Score: 1.70/4 = 43% ★CORRECTED (was 29%)

| ID | Score | Prior | Change |
|---|---|---|---|
| FR-43-01 | **0.85** | 0.30 | **+0.55** — browsable list tab |
| FR-43-02 | 0.85 | same | — |
| FR-43-03/04 | 0.00 ea | same | — |

### STT 44 — Tra cứu ĐKCB (4 items) — Score: 1.70/4 = 43% ★CORRECTED (was 29%)

Same pattern as STT 42/43. FR-44-01 upgraded 0.30→0.85.

### STT 45 — Tra cứu cơ sở bị cảnh báo (3 items) — Score: 2.55/3 = 85% ★CORRECTED (was 0%)

| ID | Score | Prior | Change | Evidence |
|---|---|---|---|---|
| FR-45-01 | **0.85** | 0.00 | **+0.85** | `PublicWarnedBusinessesPage.tsx` — paginated table, severity tags |
| FR-45-02 | **0.85** | 0.00 | **+0.85** | Expandable rows showing alert content |
| FR-45-03 | **0.85** | 0.00 | **+0.85** | Alert info + severity + published date displayed |

### STT 46 — Tra cứu CFS (4 items) — Score: 1.70/4 = 43% ★CORRECTED (was 29%)

FR-46-01 upgraded 0.30→0.85 (browsable list tab). FR-46-03/04 remain 0.00.

### STT 47 — Tra cứu GCN xuất khẩu (4 items) — Score: 1.70/4 = 43% ★CORRECTED (was 29%)

FR-47-01 upgraded 0.30→0.85. FR-47-03/04 remain 0.00.

### STT 48 — Cảnh báo VSATTP công dân (3 items) — Score: 2.55/3 = 85% ★CORRECTED (was 0%)

| ID | Score | Prior | Change | Evidence |
|---|---|---|---|---|
| FR-48-01 | **0.85** | 0.00 | **+0.85** | `PublicNewsPage.tsx` — news cards + alerts table + risk analyses |
| FR-48-02 | **0.85** | 0.00 | **+0.85** | Keyword search on news page |
| FR-48-03 | **0.85** | 0.00 | **+0.85** | `CitizenAlertReportPage.tsx` — full form + Zod + CAPTCHA + `CitizenAlertReportAppService` persists to DB |

### STT 49 — Tra cứu văn bản (2 items) — Score: 1.70/2 = 85% ★CORRECTED (was 0%)

| ID | Score | Prior | Change | Evidence |
|---|---|---|---|---|
| FR-49-01 | **0.85** | 0.00 | **+0.85** | `PublicDocumentsPage.tsx` — searchable paginated table |
| FR-49-02 | **0.85** | 0.00 | **+0.85** | Document details displayed in table columns |

**Group E total: 18.70/32 = 58.4%** (was 6.85/32 = 21.4%, **+37.0pp**)

---

## Group F — Tích hợp dữ liệu (STT 50–57, 34 items)

### STT 50 — Đặc tả API (6 items) — Score: 4.15/6 = 69% (↓ was 4.75/6 = 79%)

| ID | Score | Evidence | Gap |
|---|---|---|---|
| FR-50-01 | 0.85 | `ApiEndpointAppService.CreateAsync` | — |
| FR-50-02 | **0.70** | CRUD exists but `ApiEndpoint` entity lacks `DataType`, `Direction`, version, code, encrypted credentials, OpenAPI upload | Incomplete domain model (**↓ was 0.85**) |
| FR-50-03 | **0.70** | Same domain model gaps as FR-50-02 | (**↓ was 0.85**) |
| FR-50-04 | 0.85 | Delete endpoint | — |
| FR-50-05 | **0.20** | FE `getEndpoint()` defined but never called; no Test Connection; no partner config guidance | Dead code on FE (**↓ was 0.50**) |
| FR-50-06 | 0.85 | Toggle status | — |

### STT 51–57 — Lịch sử chia sẻ (28 items) — Score: 2.10/28 = 7.5% (↓ was 4.20/28 = 15%)

- 21 viewer items (a/c/d per entity type): **0.10 ea = 2.10** (↓ was 0.20 ea = 4.20; one generic screen instead of 7 per-type screens; `ApiCallLog` has no `DataType` column; nothing writes to the log table; permanently empty)
- 7 send items (b per entity type): 0.00 ea (no outbound engine)

**Group F total: 6.25/34 = 18.4%** (↓ was 8.95/34 = 26.3%; STT 50 −0.60, STT 51-57 −2.10)

---

## Non-Functional Requirements (80 items)

See [doc 64](64-non-functional-and-security-compliance.md) for per-item scoring.

| Category | Score | Items | % |
|---|---|---|---|
| SEC (application security) | **20.05** | 25 | **80.2%** | ↑ SEC-22 redirect whitelist verified (+0.35); ↓ SEC-08 CAPTCHA missing on pwd reset (−0.15) |
| DBS (database security) | 5.00 | 10 | 50.0% |
| NFR (performance) | 3.00 | 6 | 50.0% |
| IPV (IPv6/TLS/DNSSEC) | 1.75 | 6 | 29.2% |
| INT (integration) | **0.60** | 5 | **12.0%** | ↓ INT-05 call log table never populated (−0.20) |
| UI (UI/UX) | 8.00 | 10 | 80.0% |
| DT (data tolerance) | 9.60 | 12 | 80.0% |
| TECH (technology) | 4.25 | 5 | 85.0% |
| L2 (InfoSec level 2) | 0.40 | 1 | 40.0% |
| **Total** | **52.65** | **80** | **65.8%** |

---

## Grand Total

| Category | Prior Score | Corrected Score | Items | Prior % | Corrected % |
|---|---|---|---|---|---|
| Functional (FR) | 262.35 | **258.05** | 372 | 70.52% | **69.37%** |
| Non-functional (NFR) | 52.65 | **52.65** | 80 | 65.81% | **65.81%** |
| **Software total** | **315.00** | **310.70** | **452** | **69.69%** | **68.74%** |
| Non-software (restored 14) | ~0.30 | **1.65** | 14 | ~1.8% | **11.8%** |
| Purely legal (excluded) | — | — | 3 | — | NOT_APPLICABLE |
| **Overall (466 assessable)** | **—** | **312.35** | **466** | **—** | **67.03%** |

**Independent review weighted overall: 67.0% strict / 69.5% optimistic** (was 71.4%; see doc 68 §7)

---

### Batch 5 Remediation Corrections Applied (2026-07-27)

Based on `docs/audit/69-implementation-batch-independent-verification.md` and the
remediation work in `docs/audit/70-acceptance-blocker-remediation-verification.md`.

| Item | Change | Code evidence | Infrastructure still required | Impact |
|---|---|---|---|---|
| IPV-03 (IPv6 listen) | 0.00 → 0.85 | `nginx.conf`: `listen [::]:8080;` confirmed by B4 (doc 69) | None — code-complete | +0.85 |
| IPV-06 (HTTPS/TLS) | 0.50 → 0.65 | `nginx.prod.conf.template`: TLS 1.2/1.3 only, HTTP→HTTPS redirect, HSTS in HTTPS context; `nginx -t` PASS with dummy cert | Production TLS certificate; AAAA DNS record | +0.15 |
| DBS-09 (PG SSL) | 0.20 → 0.50 | `PostgreSqlSslValidator.cs` startup validation; docker-compose `:?` enforcement; 23 tests | `ssl=on` in `postgresql.conf` on server | +0.30 |
| SEC-08 (CAPTCHA pwd-reset) | 0.70 → 0.85 | `PasswordResetCaptchaTests.cs` (14 tests); `TurnstileCaptchaVerifierTests.cs` (+1 network-failure test); all 53 Host tests pass | None — code-complete | +0.15 |
| **Net non-functional** | | | | **+1.45** |

#### Revised Non-Functional Totals

| Category | Previous | New | Items | % |
|---|---|---|---|---|
| SEC (application security) | 20.05 | **20.20** | 25 | **80.8%** |
| DBS (database security) | 5.00 | **5.30** | 10 | **53.0%** |
| IPV (IPv6/TLS/DNSSEC) | 1.75 | **2.75** | 6 | **45.8%** |
| NFR, INT, UI, DT, TECH, L2 | 25.85 | 25.85 | 33 | (unchanged) |
| **Non-functional total** | **52.65** | **54.10** | 80 | **67.6%** |

#### Revised Grand Total (after Batch 5 remediation)

| Category | Score | Items | % |
|---|---|---|---|
| Functional (FR) | 258.05 | 372 | 69.4% |
| Non-functional (NFR) | 54.10 | 80 | 67.6% |
| **Software total** | **312.15** | **452** | **69.1%** |
| Non-software | 1.65 | 14 | 11.8% |
| **Overall (466 assessable)** | **313.80** | **466** | **67.3%** |

**Strict implementation completion: 67.3%** (was 67.0%)

Note: This includes only code-verified changes. External infrastructure (server-side PostgreSQL SSL cert, production TLS cert for nginx, DNS AAAA records) are not counted.

### Independent Review Corrections Applied (doc 68, 2026-07-27)

| Item | Change | Impact |
|---|---|---|
| FR-05-04 | 0.25 → 0.10 | −0.15 |
| FR-39-02 | 0.50 → 0.00 | −0.50 |
| FR-39-08 | 0.85 → 0.40 | −0.45 |
| FR-40-07 | 0.50 → 0.10 | −0.40 |
| Food poisoning error report | ~−0.10 | −0.10 |
| FR-50-02 | 0.85 → 0.70 | −0.15 |
| FR-50-03 | 0.85 → 0.70 | −0.15 |
| FR-50-05 | 0.50 → 0.20 | −0.30 |
| STT 51-57 viewers (×21) | 0.20 → 0.10 ea | −2.10 |
| SEC-08 | 0.85 → 0.70 | −0.15 |
| SEC-22 | 0.50 → 0.85 | +0.35 |
| INT-05 | 0.30 → 0.10 | −0.20 |
| 14 non-SW items restored | NOT_APPLICABLE → scored | +1.65 |
| **Net functional** | | **−4.30** |
| **Net non-functional** | | **0.00** |
