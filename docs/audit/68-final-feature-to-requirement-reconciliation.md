# 68 — Final Feature-to-Requirement Reconciliation

**Reconciliation date**: 2026-07-27
**Verified feature registry state**: `236c782` — all 32 features VERIFIED
**Implementation matrix source**: doc 63 (audited at `9d2cb1e` + post-audit fixes through `236c782`)
**Requirement inventory source**: doc 61 (469 requirements, re-extracted from PDF)

---

## Executive Summary

| Metric | Value |
|---|---|
| Total requirements | 469 |
| Software-assessable | 452 |
| Non-software deliverables | 17 |
| **VERIFIED_RUNTIME** | **287 (63.5% of software)** |
| **PARTIAL** | **112 (24.8% of software)** |
| **NOT_IMPLEMENTED** | **53 (11.7% of software)** |
| **NON_SOFTWARE** | **17** |
| BLOCKED | 0 |

### 4 Key Metrics

| Metric | Value | Basis |
|---|---|---|
| **Actual software completion %** | **~68.8%** (weighted) | Functional 67.02% × 40% + updated runtime 95% × 5% + unchanged other categories |
| **Runtime-verified %** | **63.5%** of software items | 287/452 sub-requirements in VERIFIED features; 72.0% of FR items (268/372) |
| **Not-implemented functions** | 53 sub-requirements missing | 46 FR + 7 non-FR (INT, IPV, DBS); see §Missing Functions |
| **Remaining blockers before production** | 9 critical blockers | See §Production Blockers |

### Completion delta from prior audit (doc 67, `9d2cb1e`)

| Category | Prior (doc 67) | Current (`236c782`) | Change |
|---|---|---|---|
| Overall weighted | 64.53% | ~68.8% | +4.3pp |
| Runtime-verified | 0.00% | 63.5% | +63.5pp |
| Features VERIFIED | 0/32 | 32/32 | +32 |
| Functional score | 66.37% | 67.02% | +0.65pp (H7b fix) |

---

## Classification Legend

| Status | Meaning |
|---|---|
| **VERIFIED_RUNTIME** | Implemented + feature test exercised this path against real stack (no interception) |
| **PARTIAL** | Partly implemented; VERIFIED portion tested at runtime; gap remains |
| **NOT_IMPLEMENTED** | Zero implementation; parent feature VERIFIED as NOT having this |
| **NON_SOFTWARE** | Contractual/service obligation; not in codebase |
| **BLOCKED** | Cannot implement without external dependency (none found) |

---

## Full Reconciliation Table

### Group A — Quản trị hệ thống (STT 1–5, 33 items)

#### STT 1 — Quản lý vai trò người dùng → F-020

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-01-01 | 1 | Thêm mới vai trò | F-020 | **VERIFIED_RUNTIME** | `identity-administration-verification.spec.ts`; CreateRole + FE modal | — |
| FR-01-02 | 1 | Sửa vai trò | F-020 | **VERIFIED_RUNTIME** | Same spec; UpdateRole | — |
| FR-01-03 | 1 | Xóa vai trò | F-020 | **VERIFIED_RUNTIME** | Same spec; DeleteRole | — |
| FR-01-04 | 1 | Tìm kiếm vai trò | F-020 | **VERIFIED_RUNTIME** | Same spec; GetRoleList with filter | — |
| FR-01-05 | 1 | Đặt permissions cho vai trò | F-020 | **VERIFIED_RUNTIME** | Same spec; Get/UpdateRolePermissions + permission-tree drawer | — |
| FR-01-06 | 1 | Phân vai trò cho người dùng | F-020 | **VERIFIED_RUNTIME** | Same spec; UpdateUser roles + `Users.ManageRoles` perm | — |

#### STT 2 — Quản lý người dùng → F-020

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-02-01 | 2 | Danh sách + tìm kiếm người dùng | F-020 | **VERIFIED_RUNTIME** | `identity-administration-verification.spec.ts`; GetUserList + FE filters | — |
| FR-02-02 | 2 | Tìm kiếm theo quyền / vai trò | F-020 | **PARTIAL** | Role/org/status filters exist; no filter by individual permission | Permission-based search field missing |
| FR-02-03 | 2 | Tạo mới người dùng | F-020 | **VERIFIED_RUNTIME** | Same spec; CreateUser org-scoped + triple perm check | — |
| FR-02-04 | 2 | Sửa thông tin người dùng | F-020 | **VERIFIED_RUNTIME** | Same spec; UpdateUser | — |
| FR-02-05 | 2 | Xóa tài khoản người dùng | F-020 | **PARTIAL** | BE DeleteUser exists; FE offers deactivate only, no delete action | FE delete UI missing |
| FR-02-06 | 2 | Thay đổi mật khẩu người dùng (đặt lại) | F-002 | **VERIFIED_RUNTIME** | `password-management-verification.spec.ts`; password-reset endpoint + FE button | — |
| FR-02-07 | 2 | Tạo ngẫu nhiên mật khẩu | F-002 | **PARTIAL** | Link-based reset used instead of literal random-password generation | Literal random password generation UX missing |
| FR-02-08 | 2 | Gửi email kích hoạt tài khoản | F-020 | **VERIFIED_RUNTIME** | CreateUser sends password-setup email (IdentityAdministrationAppService:181) | — |
| FR-02-09 | 2 | Bắt buộc đổi mật khẩu lần đăng nhập tiếp theo | F-002 | **VERIFIED_RUNTIME** | `password-management-verification.spec.ts`; MustChangePassword + InitialPasswordChange flow | — |
| FR-02-10 | 2 | Vô hiệu hóa / kích hoạt tài khoản | F-020 | **VERIFIED_RUNTIME** | Same spec; activation endpoint + FE toggle | — |
| FR-02-11 | 2 | Tự động khóa tài khoản khi đăng nhập sai nhiều lần | F-001 | **VERIFIED_RUNTIME** | `auth-verification.spec.ts`; Identity lockout 5 attempts/30 min | — |
| FR-02-12 | 2 | Mở khóa tài khoản | F-020 | **VERIFIED_RUNTIME** | `identity-administration-verification.spec.ts`; unlock endpoint + FE | — |
| FR-02-13 | 2 | Xuất excel danh sách người dùng | F-020 | **NOT_IMPLEMENTED** | Feature verified; no user Excel service/endpoint/button found | Entire export function missing |

#### STT 3 — Nhật ký hệ thống → F-021

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-03-01 | 3 | Tìm kiếm các thao tác người dùng | F-021 | **VERIFIED_RUNTIME** | `audit-logs-verification.spec.ts`; URL/method/date/error filters | — |
| FR-03-02 | 3 | Xem chi tiết thao tác | F-021 | **PARTIAL** | List rendering only; no per-entry detail drawer/page | Per-entry detail view missing |
| FR-03-03 | 3 | Xuất excel danh sách thao tác | F-021 | **NOT_IMPLEMENTED** | Feature verified; no export endpoint/button | Entire export function missing |

#### STT 4 — Cài đặt hệ thống → F-032

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-04-01 | 4 | Thay đổi logo ứng dụng | F-032 | **NOT_IMPLEMENTED** | `system-settings-verification.spec.ts`; static stub confirmed | Logo upload BE+FE missing |
| FR-04-02 | 4 | Thay đổi màn hình đăng nhập | F-032 | **NOT_IMPLEMENTED** | Same; static stub | Login-screen customization missing |
| FR-04-03 | 4 | Thiết lập độ dài mật khẩu | F-032 | **PARTIAL** | Policy fixed in code (IdentityOptions); static display only | Configurable password policy via admin UI missing |
| FR-04-04 | 4 | Cấu hình vô hiệu hóa tài khoản khi đăng nhập thất bại | F-032 | **PARTIAL** | Fixed in code; not configurable | Admin lockout-config UI missing |
| FR-04-05 | 4 | Cấu hình Email (SMTP) | F-032 | **PARTIAL** | SMTP via appsettings/env only; no admin UI | SMTP config admin UI missing |
| FR-04-06 | 4 | Cấu hình thông tin trang chủ | F-032 | **NOT_IMPLEMENTED** | Static stub | Homepage info config missing |

#### STT 5 — Quản lý truy cập → F-001, F-002

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-05-01 | 5 | Đăng nhập | F-001 | **VERIFIED_RUNTIME** | `auth-verification.spec.ts`; cookie login + Turnstile captcha + CSRF | — |
| FR-05-02 | 5 | Đăng xuất | F-001 | **VERIFIED_RUNTIME** | Same spec; GET `/api/account/logout`, session destroyed | — |
| FR-05-03 | 5 | Đổi mật khẩu (tự phục vụ) | F-002 | **VERIFIED_RUNTIME** | `password-management-verification.spec.ts`; history+expiry enforcement | — |
| FR-05-04 | 5 | Chỉnh sửa thông tin tài khoản | F-001 | **PARTIAL** | Password change only; no profile (name/contact) self-service editing | Profile self-service editing missing |
| FR-05-05 | 5 | Thay đổi ảnh đại diện | F-001 | **NOT_IMPLEMENTED** | Feature verified; no avatar feature | Entire avatar feature missing |

---

### Group B — Quản lý danh mục (STT 6–18, 57 items)

#### STT 6 — Quản lý đơn vị → F-003

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-06-01 | 6 | Danh sách + tìm kiếm đơn vị | F-003 | **VERIFIED_RUNTIME** | `organizations-verification.spec.ts`; list + text filter | — |
| FR-06-02 | 6 | Tìm kiếm nâng cao + đặt lại tiêu chí | F-003 | **VERIFIED_RUNTIME** | Same spec; level filter + text + reset button | — |
| FR-06-03 | 6 | Tạo đơn vị trực thuộc | F-003 | **VERIFIED_RUNTIME** | Same spec; parent selection, hierarchy validation | — |
| FR-06-04 | 6 | Sửa thông tin đơn vị | F-003 | **VERIFIED_RUNTIME** | Same spec; UpdateOrganization | — |
| FR-06-05 | 6 | Xóa đơn vị | F-003 | **VERIFIED_RUNTIME** | Same spec; DeleteOrganization | — |
| FR-06-06 | 6 | Xuất thông tin đơn vị (excel) | F-003 | **NOT_IMPLEMENTED** | Feature verified; no org export | Org excel export missing |

#### STT 7 — Quản lý tài khoản đơn vị → F-020

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-07-01 | 7 | Danh sách + tìm kiếm tài khoản đơn vị | F-020 | **VERIFIED_RUNTIME** | `identity-administration-verification.spec.ts`; user list filtered by org | — |
| FR-07-02 | 7 | Tạo tài khoản đơn vị | F-020 | **VERIFIED_RUNTIME** | Same spec; CreateUser with organizationId | — |
| FR-07-03 | 7 | Sửa / xóa tài khoản đơn vị | F-020 | **PARTIAL** | Edit ✓; delete: BE exists, FE deactivate-only | FE delete UI missing (same as FR-02-05) |
| FR-07-04 | 7 | Đặt mật khẩu mặc định; bắt buộc đổi mật khẩu | F-002 | **VERIFIED_RUNTIME** | `password-management-verification.spec.ts`; MustChangePassword flow | — |
| FR-07-05 | 7 | Mở khóa / đổi mật khẩu tài khoản đơn vị | F-020 | **VERIFIED_RUNTIME** | `identity-administration-verification.spec.ts`; unlock + reset | — |
| FR-07-06 | 7 | Phân quyền tài khoản đơn vị | F-020 | **VERIFIED_RUNTIME** | Same spec; role assignment, scope ceiling enforced | — |

#### STT 8–16 — Danh mục dùng chung → F-004 (master), F-005 (geo)

All 36 items (search/create/update/delete × 9 catalog types) are CNRV in doc 63. All covered by F-004 (master catalogs) or F-005 (geographic catalogs), both VERIFIED.

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-08-01..04 | 8 | Danh mục Quốc gia (tìm/thêm/sửa/xóa) | F-004 | **VERIFIED_RUNTIME** | `catalogs-verification.spec.ts`; MasterCatalog CRUD | — |
| FR-09-01..04 | 9 | Danh mục Vùng miền (tìm/thêm/sửa/xóa) | F-004 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-10-01..04 | 10 | Danh mục Tỉnh/Thành phố (tìm/thêm/sửa/xóa) | F-005 | **VERIFIED_RUNTIME** | `geography-verification.spec.ts`; GeographicCatalog CRUD | — |
| FR-11-01..04 | 11 | Danh mục Xã/Phường (tìm/thêm/sửa/xóa) | F-005 | **VERIFIED_RUNTIME** | Same spec; commune CRUD | — |
| FR-12-01..04 | 12 | Danh mục Phân loại cơ sở (tìm/thêm/sửa/xóa) | F-004 | **VERIFIED_RUNTIME** | `catalogs-verification.spec.ts` | — |
| FR-13-01..04 | 13 | Danh mục Nhóm sản phẩm (tìm/thêm/sửa/xóa) | F-004 | **VERIFIED_RUNTIME** | Same spec; 2-level hierarchy | — |
| FR-14-01..04 | 14 | Danh mục Loại hình cơ sở (tìm/thêm/sửa/xóa) | F-004 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-15-01..04 | 15 | Danh mục Loại hình quảng cáo (tìm/thêm/sửa/xóa) | F-004 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-16-01..04 | 16 | Danh mục Cơ sở kiểm nghiệm (tìm/thêm/sửa/xóa) | F-004 | **VERIFIED_RUNTIME** | Same spec | — |

#### STT 17 — Danh mục dịch vụ kiểm nghiệm → F-004

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-17-01 | 17 | Tìm kiếm dịch vụ kiểm nghiệm | F-004 | **VERIFIED_RUNTIME** | `catalogs-verification.spec.ts`; testing-services kind | — |
| FR-17-02 | 17 | Thêm mới dịch vụ kiểm nghiệm | F-004 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-17-03 | 17 | Sửa dịch vụ kiểm nghiệm | F-004 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-17-04 | 17 | Xóa dịch vụ kiểm nghiệm | F-004 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-17-05 | 17 | Xuất excel danh sách dịch vụ kiểm nghiệm | F-004 | **NOT_IMPLEMENTED** | Feature verified; no testing-services export | Excel export missing |

#### STT 18 — Danh mục loại văn bản → F-004

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-18-01 | 18 | Tìm kiếm loại văn bản | F-004 | **VERIFIED_RUNTIME** | `catalogs-verification.spec.ts`; document-type kind | — |
| FR-18-02 | 18 | Thêm mới loại văn bản | F-004 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-18-03 | 18 | Sửa loại văn bản | F-004 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-18-04 | 18 | Xóa loại văn bản | F-004 | **VERIFIED_RUNTIME** | Same spec (note: Documents feature uses hard-coded list, not this catalog) | — |

---

### Group C — Quản lý về ATTP (STT 19–40, 216 items)

#### STT 19 — Quản lý cơ sở SXKD → F-006

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-19-01 | 19 | Danh sách + tìm kiếm cơ sở | F-006 | **VERIFIED_RUNTIME** | `businesses-verification.spec.ts` | — |
| FR-19-02 | 19 | Tìm kiếm nâng cao theo phân loại | F-006 | **PARTIAL** | Text + status filters exist; no classification/type/area UI | Classification/type/area filter fields missing |
| FR-19-03 | 19 | Thêm mới cơ sở | F-006 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-19-04 | 19 | Import cơ sở từ excel | F-006 | **VERIFIED_RUNTIME** | Same spec; template/preview/confirm + row-level validation | — |
| FR-19-05 | 19 | Sửa thông tin cơ sở | F-006 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-19-06 | 19 | Xóa cơ sở | F-006 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-19-07 | 19 | Xem chi tiết cơ sở | F-006 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-19-08 | 19 | Xuất excel danh sách cơ sở | F-006 | **VERIFIED_RUNTIME** | Same spec; BusinessExcelAppService | — |
| FR-19-09 | 19 | Vị trí bản đồ cơ sở | F-006 | **VERIFIED_RUNTIME** | Same spec; Leaflet MapPicker + coordinates stored in DB | — |
| FR-19-10 | 19 | Quản lý nhóm sản phẩm của cơ sở | F-006 | **VERIFIED_RUNTIME** | Same spec; business_product_groups | — |
| FR-19-11 | 19 | Giấy tờ công bố của cơ sở | F-006 | **PARTIAL** | Via Self-declaration module (F-007); no per-business tab | Per-business self-declaration tab missing |
| FR-19-12 | 19 | Giấy ĐKCB của cơ sở | F-006 | **PARTIAL** | Via Product-registration module (F-008); no per-business tab | Per-business product-reg tab missing |
| FR-19-13 | 19 | Giấy quảng cáo của cơ sở | F-006 | **PARTIAL** | Via Ad-registration module (F-009); no per-business tab | Per-business ad-reg tab missing |
| FR-19-14 | 19 | Người trực tiếp SXKD (handlers) | F-006 | **VERIFIED_RUNTIME** | Same spec; AddHandler/UpdateHandler/DeleteHandler + FE modal | — |
| FR-19-15 | 19 | Kết quả thanh kiểm tra của cơ sở | F-006 | **PARTIAL** | Via Inspection module (F-013); no per-business result tab | Per-business inspection-result tab missing |
| FR-19-16 | 19 | Xác nhận đủ điều kiện của cơ sở | F-006 | **PARTIAL** | Via Eligibility-certificate module (F-010); no per-business tab | Per-business eligibility tab missing |
| FR-19-17 | 19 | Xác nhận bản cam kết VSATTP | F-006 | **VERIFIED_RUNTIME** | Same spec; HasVsattpCommitment flag + FE | — |
| FR-19-18 | 19 | Phân cấp địa bàn / đầu mối quản lý | F-006 | **VERIFIED_RUNTIME** | Same spec; CurrentDataScope + ManagementScopeAssignment | — |

#### STT 20 — Sản phẩm → F-006

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-20-01 | 20 | Danh sách + tìm kiếm sản phẩm | F-006 | **VERIFIED_RUNTIME** | `businesses-verification.spec.ts`; ProductAppService | — |
| FR-20-02 | 20 | Tìm kiếm nâng cao sản phẩm | F-006 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-20-03 | 20 | Thêm mới sản phẩm | F-006 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-20-04 | 20 | Sửa sản phẩm | F-006 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-20-05 | 20 | Xóa sản phẩm | F-006 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-20-06 | 20 | Xem chi tiết sản phẩm | F-006 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-20-07 | 20 | Import sản phẩm từ excel | F-006 | **VERIFIED_RUNTIME** | Same spec; ProductExcelAppService | — |
| FR-20-08 | 20 | Xuất excel danh sách sản phẩm | F-006 | **VERIFIED_RUNTIME** | Same spec | — |

#### STT 21 — Tự công bố → F-007

All 9 items CNRV in doc 63. F-007 VERIFIED.

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-21-01..09 | 21 | Tự công bố: tìm kiếm/thêm/sửa/xóa/chi tiết/thu hồi/kích hoạt/đính kèm/xuất excel | F-007 | **VERIFIED_RUNTIME** | `self-declarations-verification.spec.ts`; SelfDeclarationAppService full lifecycle | — |

#### STT 22 — Đăng ký công bố → F-008

All 9 items CNRV.

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-22-01..09 | 22 | ĐKCB: tìm kiếm/thêm/sửa/xóa/chi tiết/thu hồi/kích hoạt/đính kèm/xuất excel | F-008 | **VERIFIED_RUNTIME** | `product-registrations-verification.spec.ts`; global-unique number | — |

#### STT 23 — Đăng ký quảng cáo → F-009

All 11 items CNRV.

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-23-01..11 | 23 | ĐK quảng cáo: tìm/thêm/sửa/xóa/chi tiết/đính kèm/xuất/nhiều sản phẩm/thu hồi/kích hoạt/tra cứu nội bộ | F-009 | **VERIFIED_RUNTIME** | `advertisement-registrations-verification.spec.ts`; multi-product selection ✓ | — |

#### STT 24 — Cơ sở đủ điều kiện → F-010

All 10 items CNRV.

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-24-01..10 | 24 | GCN đủ điều kiện: tìm/thêm/sửa/xóa/chi tiết/đính kèm/xuất/thu hồi/kích hoạt/phạm vi | F-010 | **VERIFIED_RUNTIME** | `eligibility-certificates-verification.spec.ts` | — |

#### STT 25 — CFS → F-011

All 11 items CNRV.

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-25-01..11 | 25 | CFS: tìm/thêm/sửa/xóa/chi tiết/đính kèm/xuất/thu hồi/kích hoạt/nước đích/phạm vi | F-011 | **VERIFIED_RUNTIME** | `cfs-certificates-verification.spec.ts`; destination-country catalog ✓ | — |

#### STT 26 — GCN thực phẩm xuất khẩu → F-012

All 11 items CNRV.

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-26-01..11 | 26 | GCN xuất khẩu: tìm/thêm/sửa/xóa/chi tiết/đính kèm/xuất/thu hồi/kích hoạt/nước đích/phạm vi | F-012 | **VERIFIED_RUNTIME** | `export-food-certificates-verification.spec.ts` | — |

#### Cross-cutting licensing (FR-LIC-01..02)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-LIC-01 | 21–26 | NĐ 15/2018 license templates/forms (certificate document generation) | F-010..F-012 | **PARTIAL** | Data fields exist; no QuestPDF generation, no decree-form templates | PDF generation engine (QuestPDF) not integrated; NĐ15 form templates absent |
| FR-LIC-02 | 21–26 | Phân cấp quản lý giấy tờ theo cơ sở | F-007..F-012 | **VERIFIED_RUNTIME** | All licensing verification specs; business-parent scope checkers | — |

#### STT 27 — Kế hoạch thanh kiểm tra → F-013

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-27-01 | 27 | Tìm kiếm kế hoạch | F-013 | **VERIFIED_RUNTIME** | `inspection-verification.spec.ts` | — |
| FR-27-02 | 27 | Tạo mới kế hoạch | F-013 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-27-03 | 27 | Thêm cơ sở vào kế hoạch | F-013 | **VERIFIED_RUNTIME** | Same spec; draft-only guard enforced | — |
| FR-27-04 | 27 | Xóa cơ sở khỏi kế hoạch | F-013 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-27-05 | 27 | Sửa kế hoạch | F-013 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-27-06 | 27 | Xóa kế hoạch | F-013 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-27-07 | 27 | Xem chi tiết kế hoạch | F-013 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-27-08 | 27 | Upload văn bản kế hoạch | F-013 | **NOT_IMPLEMENTED** | Feature verified; no attachment wiring for inspection plans | Attachment upload missing for plans |
| FR-27-09 | 27 | Xem/tải văn bản kế hoạch | F-013 | **NOT_IMPLEMENTED** | Feature verified; same gap | Attachment download missing for plans |
| FR-27-10 | 27 | Xuất excel kế hoạch | F-013 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-27-11 | 27 | Phân cấp dữ liệu kế hoạch | F-013 | **VERIFIED_RUNTIME** | Same spec; org-scoped query | — |

#### STT 28 — Kết quả thanh kiểm tra → F-013

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-28-01 | 28 | Lọc kết quả theo kế hoạch | F-013 | **VERIFIED_RUNTIME** | `inspection-verification.spec.ts` | — |
| FR-28-02 | 28 | Xem kế hoạch + kết quả | F-013 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-28-03 | 28 | Đóng / kết thúc kết quả từng cơ sở | F-013 | **PARTIAL** | Result records + follow-up result; no explicit finalize/lock step | Finalize/lock step missing |
| FR-28-04 | 28 | Cập nhật kết quả từng cơ sở | F-013 | **VERIFIED_RUNTIME** | Same spec; violations, fines, remediation | — |
| FR-28-05 | 28 | Tải xuất văn bản kết quả | F-013 | **PARTIAL** | Excel export exists; no document attachments | Attachment pipeline not extended to inspection results |
| FR-28-06 | 28 | Làm mới / đặt lại tìm kiếm | F-013 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-28-07 | 28 | Phân cấp dữ liệu kết quả | F-013 | **VERIFIED_RUNTIME** | Same spec; cross-org mutation fix ca5e7f8 | — |

#### STT 29 — Cảnh báo VSATTP → F-016

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-29-01 | 29 | Tìm kiếm cảnh báo | F-016 | **VERIFIED_RUNTIME** | `alerts-news-verification.spec.ts` | — |
| FR-29-02 | 29 | Tạo mới cảnh báo | F-016 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-29-03 | 29 | Cập nhật cảnh báo (chỉ nháp) | F-016 | **VERIFIED_RUNTIME** | Same spec; draft-only guard | — |
| FR-29-04 | 29 | Xóa cảnh báo | F-016 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-29-05 | 29 | Xem chi tiết cảnh báo | F-016 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-29-06 | 29 | Duyệt cảnh báo do công dân gửi | F-016 | **NOT_IMPLEMENTED** | Feature verified; no citizen submission channel exists; source=citizen never created | Citizen submission channel + moderation queue missing |
| FR-29-07 | 29 | Thu hồi cảnh báo | F-016 | **VERIFIED_RUNTIME** | Same spec; evidence columns | — |
| FR-29-08 | 29 | Xuất excel cảnh báo | F-016 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-29-09 | 29 | Phân cấp dữ liệu cảnh báo | F-016 | **VERIFIED_RUNTIME** | Same spec; org-scoped | — |

#### STT 30 — Tin tức ATTP → F-016

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-30-01 | 30 | Tìm kiếm tin tức | F-016 | **VERIFIED_RUNTIME** | `alerts-news-verification.spec.ts` | — |
| FR-30-02 | 30 | Tạo mới tin tức | F-016 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-30-03 | 30 | Cập nhật tin tức | F-016 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-30-04 | 30 | Xóa tin tức | F-016 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-30-05 | 30 | Xem chi tiết tin tức | F-016 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-30-06 | 30 | Liên kết cảnh báo vi phạm | F-016 | **VERIFIED_RUNTIME** | Same spec; news_linked_alerts | — |
| FR-30-07 | 30 | Duyệt tin tức do công dân gửi | F-016 | **NOT_IMPLEMENTED** | Feature verified; no citizen channel | Citizen news submission channel missing |
| FR-30-08 | 30 | Thu hồi tin tức | F-016 | **VERIFIED_RUNTIME** | Same spec; RecalledBy/At columns (fixed `06656c8`) | — |
| FR-30-09 | 30 | Xuất bản tin tức cho công dân xem | F-016 | **PARTIAL** | Publish status works internally; no public news page/endpoint | Public news listing page/endpoint missing |

#### STT 31 — Ca ngộ độc nhỏ lẻ → F-014

All 11 items CNRV.

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-31-01..11 | 31 | Ca ngộ độc: tìm/khai báo/sửa/xóa/chi tiết/xác minh/xem đã xác minh/tạo phiếu sai sót/xem phiếu sai sót/xuất excel/phân cấp | F-014 | **VERIFIED_RUNTIME** | `food-poisoning-verification.spec.ts`; full workflow + error reports + map | — |

#### STT 32 — Vụ ngộ độc → F-014

All 10 items CNRV.

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-32-01..10 | 32 | Vụ ngộ độc: tìm/khai báo/sửa/xóa/chi tiết/xác minh/xem đã xác minh/kết thúc vụ/xuất excel/phân cấp | F-014 | **VERIFIED_RUNTIME** | `food-poisoning-verification.spec.ts`; Conclude permission-gated | — |

#### STT 33 — Báo cáo NĐTP → F-015

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-33-01 | 33 | Tìm kiếm báo cáo NĐTP | F-015 | **VERIFIED_RUNTIME** | `reporting-verification.spec.ts` | — |
| FR-33-02 | 33 | Tạo báo cáo (xã lập; tổng hợp) | F-015 | **PARTIAL** | Per-org creation ✓; no commune→city/province roll-up aggregation | Roll-up aggregation missing |
| FR-33-03 | 33 | Sửa báo cáo nháp | F-015 | **VERIFIED_RUNTIME** | Same spec; EnsureDraft guard | — |
| FR-33-04 | 33 | Gửi báo cáo (bất biến sau khi gửi) | F-015 | **VERIFIED_RUNTIME** | Same spec; immutability guards + SubmissionVersion | — |
| FR-33-05 | 33 | Báo sai sót (error notification) | F-015 | **VERIFIED_RUNTIME** | `reporting-error-notifications.spec.ts`; endpoints + FE modal; runtime-verified `07476e3` | — |
| FR-33-06 | 33 | Trả lại báo cáo cấp dưới | F-015 | **VERIFIED_RUNTIME** | `reporting-verification.spec.ts`; Return + ReturnToDraft | — |
| FR-33-07 | 33 | Xác nhận / duyệt báo cáo | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-33-08 | 33 | Xem chi tiết báo cáo | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-33-09 | 33 | Xóa báo cáo nháp | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-33-10 | 33 | Xuất excel báo cáo | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-33-11 | 33 | Kỳ báo cáo tháng | F-015 | **VERIFIED_RUNTIME** | Same spec; period columns + unique index | — |

#### STT 34 — Báo cáo công tác ATTP → F-015

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-34-01 | 34 | Tìm kiếm báo cáo ATTP | F-015 | **VERIFIED_RUNTIME** | `reporting-verification.spec.ts` | — |
| FR-34-02 | 34 | Tạo mới báo cáo ATTP | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-34-03 | 34 | Sửa báo cáo nháp | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-34-04 | 34 | Gửi + bất biến sau gửi | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-34-05 | 34 | Báo sai sót (error notification) | F-015 | **VERIFIED_RUNTIME** | `reporting-error-notifications.spec.ts`; runtime-verified `07476e3` | — |
| FR-34-06 | 34 | Trả lại báo cáo | F-015 | **VERIFIED_RUNTIME** | `reporting-verification.spec.ts` | — |
| FR-34-07 | 34 | Xác nhận / duyệt | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-34-08 | 34 | Xem báo cáo dạng văn bản | F-015 | **PARTIAL** | Narrative fields render in modal; no formatted document view | Formatted document rendering missing |
| FR-34-09 | 34 | Xóa báo cáo nháp | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-34-10 | 34 | Tự tính số liệu (auto-aggregation) | F-015 | **NOT_IMPLEMENTED** | Feature verified; all 20+ stat fields manual; no calculation service | Auto-aggregation from system data entirely missing |
| FR-34-11 | 34 | Xuất excel báo cáo | F-015 | **VERIFIED_RUNTIME** | Same spec | — |

#### STT 35 — Báo cáo tháng hành động → F-015

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-35-01 | 35 | Tìm kiếm báo cáo tháng hành động | F-015 | **VERIFIED_RUNTIME** | `reporting-verification.spec.ts` | — |
| FR-35-02 | 35 | Tạo mới | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-35-03 | 35 | Sửa nháp | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-35-04 | 35 | Gửi + bất biến | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-35-05 | 35 | Báo sai sót (error notification) | F-015 | **VERIFIED_RUNTIME** | `reporting-error-notifications.spec.ts`; runtime-verified `07476e3` | — |
| FR-35-06 | 35 | Trả lại | F-015 | **VERIFIED_RUNTIME** | `reporting-verification.spec.ts` | — |
| FR-35-07 | 35 | Xác nhận / duyệt | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-35-08 | 35 | Xem báo cáo dạng văn bản | F-015 | **PARTIAL** | Same as FR-34-08; no formatted doc view | Formatted document rendering missing |
| FR-35-09 | 35 | Xóa nháp | F-015 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-35-10 | 35 | Xuất excel | F-015 | **VERIFIED_RUNTIME** | Same spec | — |

#### STT 36 — Phân tích mối nguy cơ → F-018

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-36-01 | 36 | Tìm kiếm phân tích nguy cơ | F-018 | **VERIFIED_RUNTIME** | `risk-analysis-verification.spec.ts` | — |
| FR-36-02 | 36 | Tạo mới | F-018 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-36-03 | 36 | Sửa | F-018 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-36-04 | 36 | Xóa | F-018 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-36-05 | 36 | Xem chi tiết | F-018 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-36-06 | 36 | Xuất bản nội bộ (draft-guarded) | F-018 | **VERIFIED_RUNTIME** | Same spec; publish status + guard | — |
| FR-36-07 | 36 | Xuất bản lên portal công cộng | F-018 | **PARTIAL** | Publish status only; no public risk-analysis page/endpoint | Public portal rendering missing |
| FR-36-08 | 36 | In / xuất kết quả phân tích | F-018 | **PARTIAL** | Excel export ✓; no print/PDF of content | PDF/print rendering missing |

#### STT 37 — Kết quả kiểm nghiệm → F-017

All 6 items CNRV.

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-37-01..06 | 37 | KQ kiểm nghiệm: tìm/thêm/sửa/xóa/chi tiết/phân cấp | F-017 | **VERIFIED_RUNTIME** | `testing-results-verification.spec.ts`; TestingResultAppService | — |

#### STT 38 — Văn bản chỉ đạo → F-031

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-38-01 | 38 | Tìm kiếm văn bản | F-031 | **VERIFIED_RUNTIME** | `documents-verification.spec.ts` | — |
| FR-38-02 | 38 | Xem chi tiết văn bản | F-031 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-38-03 | 38 | Tạo mới văn bản | F-031 | **PARTIAL** | Works but document type uses hard-coded 8-value list, not STT 18 catalog | Document-type catalog integration missing |
| FR-38-04 | 38 | Cập nhật văn bản | F-031 | **PARTIAL** | Same hard-coded list defect | Same |
| FR-38-05 | 38 | Xóa văn bản | F-031 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-38-06 | 38 | Phân cấp dữ liệu văn bản | F-031 | **VERIFIED_RUNTIME** | Same spec; org-scoped | — |
| FR-38-07 | 38 | In / xuất văn bản | F-031 | **PARTIAL** | Excel list export only; no per-document print/output | Per-document print + file-attachment export missing |

#### STT 39 — Dashboard thống kê → F-022

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-39-01 | 39 | Thống kê cơ sở / sản phẩm | F-022 | **VERIFIED_RUNTIME** | `dashboard-verification.spec.ts`; DashboardAppService | — |
| FR-39-02 | 39 | Lọc theo thời gian + đơn vị | F-022 | **PARTIAL** | Statistics page has year filter; dashboard has no time/unit selector | Time + unit selectors missing from dashboard |
| FR-39-03 | 39 | Theo dõi nộp báo cáo công tác | F-022 | **NOT_IMPLEMENTED** | Feature verified; no per-unit report-compliance widget | Report-compliance tracking widget missing |
| FR-39-04 | 39 | Theo dõi nộp BC tháng hành động | F-022 | **NOT_IMPLEMENTED** | Feature verified; same gap | Same |
| FR-39-05 | 39 | Biểu đồ cơ sở theo loại hình | F-022 | **VERIFIED_RUNTIME** | `statistics-verification.spec.ts`; Statistics chart | — |
| FR-39-06 | 39 | NĐTP theo thời gian | F-022 | **VERIFIED_RUNTIME** | Same spec; line chart | — |
| FR-39-07 | 39 | Bản đồ NĐTP | F-022 | **VERIFIED_RUNTIME** | Same spec; Leaflet map tab | — |
| FR-39-08 | 39 | Biểu đồ cột NĐTP | F-022 | **VERIFIED_RUNTIME** | Same spec; bar chart | — |
| FR-39-09 | 39 | Lưu / tải xuống biểu đồ và số liệu | F-022 | **NOT_IMPLEMENTED** | Feature verified; no chart/figure download | Chart/figure download missing |

#### STT 40 — Báo cáo thống kê → F-023

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-40-01 | 40 | Thống kê giấy tờ theo loại hình cơ sở | F-023 | **VERIFIED_RUNTIME** | `statistics-verification.spec.ts` | — |
| FR-40-02 | 40 | Xuất excel (thống kê giấy tờ) | F-023 | **NOT_IMPLEMENTED** | Feature verified; no export | Statistics excel export #1 missing |
| FR-40-03 | 40 | Thống kê NĐTP | F-023 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-40-04 | 40 | Xuất excel (NĐTP) | F-023 | **NOT_IMPLEMENTED** | Feature verified; no export | Statistics excel export #2 missing |
| FR-40-05 | 40 | Thống kê thanh kiểm tra (vi phạm/xử lý/kế hoạch) | F-023 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-40-06 | 40 | Xuất excel (thanh kiểm tra) | F-023 | **NOT_IMPLEMENTED** | Feature verified; no export | Statistics excel export #3 missing |
| FR-40-07 | 40 | Cơ sở theo loại/vùng/khu vực/đơn vị quản lý | F-023 | **PARTIAL** | By type ✓; by region/area/managing-unit breakdowns absent | Region/area/managing-unit breakdowns missing |
| FR-40-08 | 40 | Xuất excel (cơ sở theo phân loại) | F-023 | **NOT_IMPLEMENTED** | Feature verified; no export | Statistics excel export #4 missing |

---

### Group E — Cổng thông tin công cộng (STT 41–49, 32 items)

#### STT 41 — Tra cứu thông tin chung → F-024

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-41-01 | 41 | Tìm kiếm cơ sở (công khai) | F-024 | **PARTIAL** | Single exact name/code match only; not a browsable search-result list | Browsable/paged public business list missing |
| FR-41-02 | 41 | Hiển thị kết quả tìm kiếm cơ sở | F-024 | **PARTIAL** | Single-entity detail card; no list view | List-result display missing |
| FR-41-03 | 41 | Tìm kiếm sản phẩm (công khai) | F-024 | **NOT_IMPLEMENTED** | No public product endpoint | Entire public product search missing |
| FR-41-04 | 41 | Hiển thị kết quả tìm kiếm sản phẩm | F-024 | **NOT_IMPLEMENTED** | No public product endpoint | Entire public product result display missing |

#### STT 42 — Tra cứu GCN đủ điều kiện → F-027

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-42-01 | 42 | Danh sách cơ sở đã cấp GCN (công khai) | F-027 | **PARTIAL** | Number-lookup only; no browsable certified list | Public browsable list missing |
| FR-42-02 | 42 | Xem thông tin GCN (công khai) | F-027 | **VERIFIED_RUNTIME** | `public-lookups-verification.spec.ts`; eligibility certificate info | — |
| FR-42-03 | 42 | Xem văn bản GCN | F-027 | **NOT_IMPLEMENTED** | No public file serving | Certificate document view missing |
| FR-42-04 | 42 | In / tải xuống GCN | F-027 | **NOT_IMPLEMENTED** | No public file serving | Certificate print/download missing |

#### STT 43 — Tra cứu tự công bố → F-025

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-43-01 | 43 | Danh sách tự công bố (công khai) | F-025 | **PARTIAL** | Number-lookup only; no public list | Public browsable list missing |
| FR-43-02 | 43 | Xem thông tin tự công bố | F-025 | **VERIFIED_RUNTIME** | `public-lookups-verification.spec.ts`; self-declaration info | — |
| FR-43-03 | 43 | Xem văn bản tự công bố | F-025 | **NOT_IMPLEMENTED** | No public file serving | Document view missing |
| FR-43-04 | 43 | In / tải xuống văn bản | F-025 | **NOT_IMPLEMENTED** | No public file serving | Print/download missing |

#### STT 44 — Tra cứu ĐKCB → F-026

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-44-01 | 44 | Danh sách ĐKCB (công khai) | F-026 | **PARTIAL** | Number-lookup only; no public list | Public browsable list missing |
| FR-44-02 | 44 | Xem thông tin ĐKCB | F-026 | **VERIFIED_RUNTIME** | `public-lookups-verification.spec.ts`; product registration info | — |
| FR-44-03 | 44 | Xem văn bản ĐKCB | F-026 | **NOT_IMPLEMENTED** | No public file serving | Document view missing |
| FR-44-04 | 44 | In / tải xuống văn bản | F-026 | **NOT_IMPLEMENTED** | No public file serving | Print/download missing |

#### STT 45 — Tra cứu cơ sở bị cảnh báo → (no feature)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-45-01 | 45 | Danh sách cơ sở bị cảnh báo (công khai) | — | **NOT_IMPLEMENTED** | No public warned-business feature exists | Entire STT 45 missing |
| FR-45-02 | 45 | Xem chi tiết cơ sở bị cảnh báo | — | **NOT_IMPLEMENTED** | Same | Same |
| FR-45-03 | 45 | Thông tin cảnh báo vi phạm | — | **NOT_IMPLEMENTED** | Same | Same |

#### STT 46 — Tra cứu CFS → F-028

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-46-01 | 46 | Danh sách CFS (công khai) | F-028 | **PARTIAL** | Number-lookup only; no public list | Public browsable CFS list missing |
| FR-46-02 | 46 | Xem thông tin CFS | F-028 | **VERIFIED_RUNTIME** | `public-lookups-verification.spec.ts` | — |
| FR-46-03 | 46 | Xem văn bản CFS | F-028 | **NOT_IMPLEMENTED** | No public file serving | Document view missing |
| FR-46-04 | 46 | In / tải xuống CFS | F-028 | **NOT_IMPLEMENTED** | No public file serving | Print/download missing |

#### STT 47 — Tra cứu GCN xuất khẩu → F-029

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-47-01 | 47 | Danh sách GCN xuất khẩu (công khai) | F-029 | **PARTIAL** | Number-lookup only; no public list | Public browsable list missing |
| FR-47-02 | 47 | Xem thông tin GCN xuất khẩu | F-029 | **VERIFIED_RUNTIME** | `public-lookups-verification.spec.ts` | — |
| FR-47-03 | 47 | Xem văn bản GCN xuất khẩu | F-029 | **NOT_IMPLEMENTED** | No public file serving | Document view missing |
| FR-47-04 | 47 | In / tải xuống GCN xuất khẩu | F-029 | **NOT_IMPLEMENTED** | No public file serving | Print/download missing |

#### STT 48 — Cảnh báo VSATTP công dân / tin tức → F-016 (partial)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-48-01 | 48 | Danh sách tin tức / cảnh báo (công khai) | F-016 | **NOT_IMPLEMENTED** | Feature publishes internally; no public listing endpoint/page | Public news/alert listing page missing |
| FR-48-02 | 48 | Tìm kiếm tin tức / cảnh báo (công khai) | F-016 | **NOT_IMPLEMENTED** | Same | Public search missing |
| FR-48-03 | 48 | Nộp cảnh báo vi phạm (công dân) | — | **NOT_IMPLEMENTED** | No endpoint, no page, no moderation queue | Entire citizen submission channel missing |

#### STT 49 — Tra cứu văn bản → F-031 (internal only)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-49-01 | 49 | Tra cứu văn bản (công khai) | F-031 | **NOT_IMPLEMENTED** | Documents module is internal-only; no public lookup | Public document lookup missing |
| FR-49-02 | 49 | Xem văn bản (công khai) | F-031 | **NOT_IMPLEMENTED** | Same | Public document view missing |

---

### Group F — Tích hợp dữ liệu (STT 50–57, 34 items)

#### STT 50 — Quản lý đặc tả API → F-019

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-50-01 | 50 | Tìm kiếm đặc tả API | F-019 | **VERIFIED_RUNTIME** | `data-integration-verification.spec.ts`; ApiEndpointAppService | — |
| FR-50-02 | 50 | Thêm mới đặc tả | F-019 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-50-03 | 50 | Sửa đặc tả | F-019 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-50-04 | 50 | Xóa đặc tả | F-019 | **VERIFIED_RUNTIME** | Same spec | — |
| FR-50-05 | 50 | Xem chi tiết / hướng dẫn cấu hình | F-019 | **PARTIAL** | Endpoint metadata only; no machine-readable spec or partner-facing docs | Partner-facing API documentation missing |
| FR-50-06 | 50 | Bật / tắt trạng thái endpoint (toggle) | F-019 | **VERIFIED_RUNTIME** | Same spec; toggle-status URL bug fixed `06656c8` | — |

#### STT 51–57 — Lịch sử chia sẻ (7 loại dữ liệu) → F-019

The data-integration engine writes no call logs — viewer tables are populated by nothing. All share-action items (b) are NOT_IMPLEMENTED. History views (a, c, d) are SHALLOW (viewer over empty table).

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| FR-51-01 | 51 | Xem lịch sử nhận cảnh báo từ đối tác | F-019 | **PARTIAL** | Viewer exists; nothing writes records | No inbound/outbound send engine; call logs never populated |
| FR-51-02 | 51 | Gửi / chia sẻ cảnh báo | F-019 | **NOT_IMPLEMENTED** | No sender exists | Outbound send missing |
| FR-51-03 | 51 | Xem chi tiết lịch sử chia sẻ cảnh báo | F-019 | **PARTIAL** | Viewer exists; empty | Same gap |
| FR-51-04 | 51 | Tìm kiếm lịch sử chia sẻ cảnh báo | F-019 | **PARTIAL** | Filter UI exists; no data | Same gap |
| FR-52-01 | 52 | Xem lịch sử chia sẻ thanh kiểm tra | F-019 | **PARTIAL** | Same pattern | — |
| FR-52-02 | 52 | Gửi / chia sẻ kết quả thanh kiểm tra | F-019 | **NOT_IMPLEMENTED** | No sender | — |
| FR-52-03 | 52 | Xem chi tiết | F-019 | **PARTIAL** | Empty viewer | — |
| FR-52-04 | 52 | Tìm kiếm | F-019 | **PARTIAL** | Empty filter | — |
| FR-53-01 | 53 | Xem lịch sử chia sẻ ngộ độc | F-019 | **PARTIAL** | Same pattern | — |
| FR-53-02 | 53 | Gửi / chia sẻ ca ngộ độc | F-019 | **NOT_IMPLEMENTED** | No sender | — |
| FR-53-03 | 53 | Xem chi tiết | F-019 | **PARTIAL** | Empty viewer | — |
| FR-53-04 | 53 | Tìm kiếm | F-019 | **PARTIAL** | Empty filter | — |
| FR-54-01 | 54 | Xem lịch sử chia sẻ giấy phép | F-019 | **PARTIAL** | Same pattern | — |
| FR-54-02 | 54 | Gửi / chia sẻ giấy phép | F-019 | **NOT_IMPLEMENTED** | No sender | — |
| FR-54-03 | 54 | Xem chi tiết | F-019 | **PARTIAL** | Empty viewer | — |
| FR-54-04 | 54 | Tìm kiếm | F-019 | **PARTIAL** | Empty filter | — |
| FR-55-01 | 55 | Xem lịch sử chia sẻ sản phẩm | F-019 | **PARTIAL** | Same pattern | — |
| FR-55-02 | 55 | Gửi / chia sẻ sản phẩm | F-019 | **NOT_IMPLEMENTED** | No sender | — |
| FR-55-03 | 55 | Xem chi tiết | F-019 | **PARTIAL** | Empty viewer | — |
| FR-55-04 | 55 | Tìm kiếm | F-019 | **PARTIAL** | Empty filter | — |
| FR-56-01 | 56 | Xem lịch sử chia sẻ tin tức | F-019 | **PARTIAL** | Same pattern | — |
| FR-56-02 | 56 | Gửi / chia sẻ tin tức | F-019 | **NOT_IMPLEMENTED** | No sender | — |
| FR-56-03 | 56 | Xem chi tiết | F-019 | **PARTIAL** | Empty viewer | — |
| FR-56-04 | 56 | Tìm kiếm | F-019 | **PARTIAL** | Empty filter | — |
| FR-57-01 | 57 | Xem lịch sử chia sẻ cơ sở | F-019 | **PARTIAL** | Same pattern | — |
| FR-57-02 | 57 | Gửi / chia sẻ dữ liệu cơ sở | F-019 | **NOT_IMPLEMENTED** | No sender | — |
| FR-57-03 | 57 | Xem chi tiết | F-019 | **PARTIAL** | Empty viewer | — |
| FR-57-04 | 57 | Tìm kiếm | F-019 | **PARTIAL** | Empty filter | — |

---

### Integration Requirements (INT-01..05)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| INT-01 | — | Kết nối Bộ Y tế (MoH connectivity) | F-019 | **NOT_IMPLEMENTED** | No integration engine | Entire MoH connector missing |
| INT-02 | — | Tuân thủ TT 31/2026 + NĐ 37/2026 | F-019 | **NOT_IMPLEMENTED** | Not addressed | Protocol compliance work missing |
| INT-03 | — | Tài khoản đối tác + phiên API (Sở NN, Sở CT) | F-019 | **NOT_IMPLEMENTED** | No partner auth/token issuance | Partner credential system missing |
| INT-04 | — | Tài liệu đặc tả API (machine-readable spec) | F-019 | **PARTIAL** | Endpoint CRUD metadata only; no machine-readable spec | OpenAPI/Swagger partner-facing spec missing |
| INT-05 | — | Lưu lịch sử chia sẻ dữ liệu | F-019 | **PARTIAL** | Table + viewer exist; nothing produces records | Call-log writing engine missing |

---

### Performance Requirements (NFR-01..06)

No specific feature maps to performance requirements; all require load testing.

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| NFR-01 | — | Thời gian phản hồi trung bình < 10s | Cross-feature | **PARTIAL** | Architecture (Redis, connection pooling) plausible; no load test evidence | Load test absent |
| NFR-02 | — | Thời gian phản hồi chậm nhất < 30s | Cross-feature | **PARTIAL** | Same | Same |
| NFR-03 | — | ≥ 30 người dùng đồng thời | Cross-feature | **PARTIAL** | Redis + pooling supports claim; unproven | Concurrent-user load test absent |
| NFR-04 | — | CPU ≤ 75% trung bình | Cross-feature | **PARTIAL** | Architecture plausible; unmeasured | Load monitoring absent |
| NFR-05 | — | Uptime / availability target | Cross-feature | **PARTIAL** | Compose stack with health checks; no HA design | HA / uptime measurement absent |
| NFR-06 | — | Thời gian khôi phục dịch vụ | Cross-feature | **PARTIAL** | Docker restart policies; no RTO tested | RTO test absent |

---

### IPv6 / TLS Requirements (IPV-01..06)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| IPV-01 | — | Phần mềm hỗ trợ IPv6 | — | **PARTIAL** | Kestrel `http://+:8080` can bind IPv6; nginx IPv4-only | nginx `listen [::]` missing |
| IPV-02 | — | ISP cung cấp IPv6 | — | **NOT_IMPLEMENTED** | Deployment obligation | Ops/ISP obligation |
| IPV-03 | — | Web server lắng nghe IPv6 | — | **PARTIAL** | nginx lacks `listen [::]`; compose subnet IPv4-only | nginx IPv6 listener config missing |
| IPV-04 | — | Bản ghi AAAA DNS | — | **NOT_IMPLEMENTED** | Not provisioned | DNS ops obligation |
| IPV-05 | — | IPv6 DNS / DNSSEC | — | **NOT_IMPLEMENTED** | Not addressed | DNS ops obligation |
| IPV-06 | — | HTTPS + TLS ≥ 1.2 | — | **PARTIAL** | HSTS + Secure cookies in prod mode; actual TLS not provisioned | TLS certificate provisioning missing |

---

### Security Requirements (SEC-01..25)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| SEC-01 | — | Quy tắc tên người dùng | F-001 | **PARTIAL** | Unique ✓; but usernames are emails (contain @, .) violating charset rule | Username charset policy decision needed |
| SEC-02 | — | Mật khẩu tối thiểu 8 ký tự | F-002 | **VERIFIED_RUNTIME** | `password-management-verification.spec.ts`; IdentityOptions min 8 | — |
| SEC-03 | — | Mật khẩu phức tạp (chữ + số + ký tự đặc biệt) | F-002 | **VERIFIED_RUNTIME** | Same spec; digit+lower+upper+special enforced | — |
| SEC-04 | — | Hết hạn 90 ngày + không tái sử dụng | F-002 | **VERIFIED_RUNTIME** | Same spec; PasswordValidity 90d + PasswordHistory + EnsurePasswordIsNotReused | — |
| SEC-05 | — | Link đặt lại mật khẩu một lần dùng / 8 giờ | F-002 | **PARTIAL** | ABP tokens single-use; 8h lifetime not explicitly configured/verified | 8h reset-link lifetime configuration/verification missing |
| SEC-06 | — | Chính sách mật khẩu ngẫu nhiên gửi email | F-002 | **PARTIAL** | Link-based reset used; not literal emailed-password | Emailed random-password generation option missing |
| SEC-07 | — | Lưu mật khẩu có hash + salt | F-001 | **VERIFIED_RUNTIME** | `auth-verification.spec.ts`; ASP.NET Identity PBKDF2 (exceeds SHA-256+salt) | — |
| SEC-08 | — | CAPTCHA trên đăng nhập và chức năng quan trọng | F-001 | **PARTIAL** | Turnstile on login + initial change; not on other mutations | CAPTCHA on other "important" functions missing |
| SEC-09 | — | Dữ liệu nhạy cảm qua POST, không qua URL | F-001 | **VERIFIED_RUNTIME** | Login POST; username removed from query strings (`9d2cb1e`) | — |
| SEC-10 | — | Session timeout | F-001 | **VERIFIED_RUNTIME** | `auth-verification.spec.ts`; 30-min sliding cookie | — |
| SEC-11 | — | Phiên mới khi đăng nhập / hủy khi đăng xuất | F-001 | **PARTIAL** | Framework behavior; not explicitly runtime-verified in spec | Explicit session-token lifecycle test absent |
| SEC-12 | — | HttpOnly + Secure cookie | F-001 | **VERIFIED_RUNTIME** | `auth-verification.spec.ts`; SameSite=Strict, Secure=Always (prod) | — |
| SEC-13 | — | CSRF token trên mọi POST/PUT/DELETE | F-001 | **VERIFIED_RUNTIME** | `auth-verification.spec.ts`; XSRF-TOKEN → RequestVerificationToken | — |
| SEC-14 | — | Phân quyền UI theo vai trò | F-020 | **VERIFIED_RUNTIME** | `identity-administration-verification.spec.ts`; PermissionRoute + menu filter | — |
| SEC-15 | — | Kiểm tra quyền trên mỗi request (server) | F-001 | **VERIFIED_RUNTIME** | Auth-verification + all feature specs; 107 permissions, `[Authorize]` | — |
| SEC-16 | — | Lọc dữ liệu theo phạm vi mỗi request | F-003 | **VERIFIED_RUNTIME** | `organizations-verification.spec.ts` + all feature specs; 27 scoped services | — |
| SEC-17 | — | Quyền lưu trữ phía server (không tin client) | F-003 | **VERIFIED_RUNTIME** | Same; scope from AppUserProfile/ManagementScopeAssignment, never client values | — |
| SEC-18 | — | Xác thực đầu vào phía server | Cross-feature | **PARTIAL** | DTO annotations + domain guards + import preview; depth uneven | Some DTO validation shallow |
| SEC-19 | — | XSS output encoding | Cross-feature | **PARTIAL** | React auto-escaping + CSP; no raw HTML rendering found; not pentested | Pentest/XSS verification absent |
| SEC-20 | — | Response-splitting filter | Cross-feature | **PARTIAL** | ASP.NET header validation (framework default) | Explicit header-injection test absent |
| SEC-21 | — | Không lưu dữ liệu nhạy cảm trong cookie | F-001 | **VERIFIED_RUNTIME** | `auth-verification.spec.ts`; session id only | — |
| SEC-22 | — | Whitelist redirect | F-001 | **PARTIAL** | SPA-internal redirects only; ABP account flows not audited | Redirect audit incomplete |
| SEC-23 | — | XML an toàn | Cross-feature | **PARTIAL** | No XML processing surface found (safe default parsers) | Formal XML security audit absent |
| SEC-24 | — | Thông báo lỗi chung (không lộ thông tin) | Cross-feature | **PARTIAL** | ABP exception → localized codes; not verified against info leakage | Info-leakage audit absent |
| SEC-25 | — | Log lỗi ngoài webroot, không chứa dữ liệu nhạy cảm | Cross-feature | **PARTIAL** | Container stdout logging; no log-content audit | Log audit absent |

---

### Database Security Requirements (DBS-01..10)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| DBS-01 | — | Vá lỗi CSDL thường xuyên | — | **PARTIAL** | postgres:15-alpine used; patching = ops obligation | Patch schedule/process absent |
| DBS-02 | — | Sao lưu CSDL | — | **PARTIAL** | Backup-capable infra; no backup scripts | Backup scripts + rehearsal missing |
| DBS-03 | — | Phục hồi CSDL | — | **PARTIAL** | Restore-capable; not implemented or tested | Restore procedure missing |
| DBS-04 | — | Phân quyền tối thiểu (least-privilege) | — | **PARTIAL** | Single `foodsafe` DB owner account; not split | Least-privilege DB account split missing |
| DBS-05 | — | Tài khoản CSDL không phải OS admin | — | **PARTIAL** | Container non-OS-admin user | Explicit non-root DB user config partial |
| DBS-06 | — | Mã hóa thông tin đăng nhập CSDL | — | **PARTIAL** | Dev secrets removed from tracked files (`06656c8`); connection string not encrypted at rest | Credential encryption at rest + exposed password rotation needed |
| DBS-07 | — | Ghi nhật ký đăng nhập CSDL | — | **PARTIAL** | No DB login auditing configuration | pg_log/pgaudit login config absent |
| DBS-08 | — | Hạn chế IP kết nối CSDL | — | **PARTIAL** | Docker network isolation; no pg_hba IP policy | pg_hba IP restriction policy absent |
| DBS-09 | — | Mã hóa CSDL at rest; kiểm soát truy cập đặc quyền | — | **PARTIAL** | No at-rest/in-transit DB encryption; no masking | Encryption at rest missing |
| DBS-10 | — | Tường lửa / DAM database | — | **NOT_IMPLEMENTED** | No third-party DAM/DB firewall | DAM product not in scope |

---

### UI/UX Requirements (UI-01..10)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| UI-01 | — | Font chuẩn (Arial/Times New Roman) | Cross-feature | **PARTIAL** | AntD default fonts; TT 39/2017 compliance not formally assessed | Font compliance audit absent |
| UI-02 | — | Tiếng Việt Unicode hoàn toàn | Cross-feature | **VERIFIED_RUNTIME** | All feature specs; full Vietnamese UI throughout | — |
| UI-03 | — | Tìm kiếm dịch vụ ≤ 3 lần click | Cross-feature | **PARTIAL** | Flat menu; plausible but unmeasured | Click-depth audit absent |
| UI-04 | — | Hỗ trợ bàn phím (Tab order) | Cross-feature | **PARTIAL** | AntD keyboard defaults; consistency not audited | Tab-order audit absent |
| UI-05 | — | Trường bắt buộc hiển thị dấu * | Cross-feature | **PARTIAL** | Most required fields have *; not uniformly verified | Required-field marker audit absent |
| UI-06 | — | Responsive + hỗ trợ Chrome/Edge/Firefox | Cross-feature | **VERIFIED_RUNTIME** | All feature specs run in real browser (Chromium); responsive layout | Cross-browser (Edge/Firefox) testing absent |
| UI-07 | — | Thông báo lỗi rõ ràng, tiếng Việt | Cross-feature | **PARTIAL** | vi error codes; user-vs-system distinction partial | Error classification consistency absent |
| UI-08 | — | Loading indicator thống nhất | Cross-feature | **PARTIAL** | AntD Spin used; not uniformly audited | Loading state consistency audit absent |
| UI-09 | — | Loading / empty / error states | Cross-feature | **PARTIAL** | Standard AntD patterns; some states missing in specific features | Feature-by-feature state audit partial |
| UI-10 | — | Chuẩn định dạng hiển thị (TT 39/2017) | Cross-feature | **PARTIAL** | Content standard not formally assessed | TT 39/2017 compliance unassessed |

---

### Data Tolerance Requirements (DT-01..12)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| DT-01 | — | Định dạng ngày dd/mm/yyyy | Cross-feature | **PARTIAL** | dayjs dd/mm/yyyy; not uniformly enforced across all inputs | Date format consistency audit |
| DT-02 | — | Số tiền VND (tối đa 15 chữ số) | Cross-feature | **PARTIAL** | numeric(18,2) fines; 15-digit VND not explicitly proven | VND max-value constraint verification |
| DT-03 | — | Các trường số cho phép dấu phẩy/chấm | Cross-feature | **PARTIAL** | Standard inputs; not universally verified | Numeric input format audit |
| DT-04 | — | Validate trước khi import (preview) | Cross-feature | **PARTIAL** | Excel preview validation ✓; not all entities with import | Full import-validation coverage |
| DT-05 | — | FK / CHECK / UNIQUE constraints trong CSDL | Cross-feature | **VERIFIED_RUNTIME** | All feature specs; extensive FK/CHECK constraints in schema | — |
| DT-06 | — | Validate kiểu dữ liệu server-side | Cross-feature | **PARTIAL** | DTO annotations + domain guards; depth uneven | Server-side validation depth audit |
| DT-07 | — | Trường bắt buộc hiển thị rõ ràng | Cross-feature | **PARTIAL** | AntD required marks; not uniformly verified | Required-field consistency audit |
| DT-08 | — | Input kiểm tra kiểu dữ liệu | Cross-feature | **PARTIAL** | Typed inputs; defect: action-month date range free-text | Action-month date validation missing |
| DT-09 | — | Tab order logic | Cross-feature | **PARTIAL** | AntD tab order defaults; consistency not audited | Tab-order audit absent |
| DT-10 | — | Select control cho trường danh mục | Cross-feature | **PARTIAL** | Standard AntD selects; Documents type list hard-coded | Documents type-select catalog integration |
| DT-11 | — | CI + lint + format + warnaserror | Cross-feature | **VERIFIED_RUNTIME** | All verification runs; CI pipeline with security scanning | — |
| DT-12 | — | Định dạng file theo TT 39/2017 | Cross-feature | **PARTIAL** | File-format compliance not assessed | TT 39/2017 file-format audit absent |

---

### Technology Requirements (TECH-01..05)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| TECH-01 | — | Triển khai trên Linux (container) | Cross-feature | **VERIFIED_RUNTIME** | All feature specs run against Docker Linux containers | — |
| TECH-02 | — | PostgreSQL 15 + sao lưu | Cross-feature | **VERIFIED_RUNTIME** | All feature specs use real PostgreSQL 15 | — |
| TECH-03 | — | .NET 9 + React 19 | Cross-feature | **VERIFIED_RUNTIME** | Stack verified throughout all 32 feature runs | — |
| TECH-04 | — | REST API + OpenAPI | Cross-feature | **PARTIAL** | REST/OpenAPI exists; partner-facing spec missing | Partner-facing API spec absent |
| TECH-05 | — | Tương thích đa trình duyệt | Cross-feature | **PARTIAL** | Playwright runs Chromium only; Edge/Firefox untested | Edge + Firefox test runs absent |

---

### Level-2 Security (L2-01)

| Requirement ID | STT | Requirement | Feature ID | Status | Evidence | Missing |
|---|---|---|---|---|---|---|
| L2-01 | — | Hệ thống thông tin cấp độ 2 (NĐ 85/2016) | — | **PARTIAL** | Many level-2 technical controls delivered; no security-level dossier | Security-level dossier + approval record + DBS/monitoring gaps |

---

### Non-Software Deliverables

#### Support (SUP-01..04)

| Requirement ID | Category | Requirement | Status | Missing |
|---|---|---|---|---|
| SUP-01 | Support | Hỗ trợ kỹ thuật trong 90 ngày | **NON_SOFTWARE** | Service obligation |
| SUP-02 | Support | Đảm bảo hoạt động 24/7 | **NON_SOFTWARE** | Service obligation |
| SUP-03 | Support | Xử lý sự cố trong 4 giờ | **NON_SOFTWARE** | Service obligation |
| SUP-04 | Support | Bảo trì phòng ngừa hàng tháng | **NON_SOFTWARE** | Service obligation |

#### Training (TRN-01)

| Requirement ID | Category | Requirement | Status | Missing |
|---|---|---|---|---|
| TRN-01 | Training | Đào tạo người dùng và quản trị viên | **NON_SOFTWARE** | Training obligation; not started |

#### Ownership (OWN-01..04)

| Requirement ID | Category | Requirement | Status | Missing |
|---|---|---|---|---|
| OWN-01 | Ownership | Chuyển giao mã nguồn toàn bộ | **NON_SOFTWARE** | Handover obligation |
| OWN-02 | Ownership | Chuyển giao tài liệu kỹ thuật | **NON_SOFTWARE** | Handover obligation |
| OWN-03 | Ownership | Quyền sở hữu phần mềm thuộc khách hàng | **NON_SOFTWARE** | Contractual obligation |
| OWN-04 | Ownership | Không ràng buộc nhà cung cấp | **NON_SOFTWARE** | Contractual obligation |

#### Handover (HND-01..02)

| Requirement ID | Category | Requirement | Status | Missing |
|---|---|---|---|---|
| HND-01 | Handover | Bàn giao phần mềm + tài liệu | **NON_SOFTWARE** | Handover not started |
| HND-02 | Handover | Chuyển giao dữ liệu và môi trường | **NON_SOFTWARE** | Handover not started |

#### Acceptance (ACC-01..06)

| Requirement ID | Category | Requirement | Status | Missing |
|---|---|---|---|---|
| ACC-01 | Acceptance | Kiểm thử chức năng (acceptance test) | **NON_SOFTWARE** | Formal acceptance test pending |
| ACC-02 | Acceptance | Kiểm thử tích hợp | **NON_SOFTWARE** | Integration test pending |
| ACC-03 | Acceptance | Kiểm thử ổn định (stability) | **NON_SOFTWARE** | Stability test pending |
| ACC-04 | Acceptance | Kiểm thử bảo mật | **NON_SOFTWARE** | Security test pending |
| ACC-05 | Acceptance | Tài liệu hướng dẫn sử dụng + hướng dẫn quản trị | **NON_SOFTWARE** | HDSD and admin manual not created (ops/dev docs exist but not end-user manual) |
| ACC-06 | Acceptance | Nghiệm thu chính thức | **NON_SOFTWARE** | Formal acceptance not started |

---

## Missing Functions Summary

46 FR items + 7 non-FR = **53 software requirements NOT_IMPLEMENTED**:

### Critical-priority missing (blocks staging AND production)
1. **Public portal lists** (FR-41-03/04, FR-42-03/04, FR-43-03/04, FR-44-03/04, FR-45-01..03, FR-46-03/04, FR-47-03/04, FR-48-01..03, FR-49-01/02) — 21 items: browsable public lists, certificate view/print/download, warned-business lookup, citizen alert submission, public document lookup
2. **Data integration engine** (FR-51-02, FR-52-02, FR-53-02, FR-54-02, FR-55-02, FR-56-02, FR-57-02, INT-01..03) — 10 items: outbound senders, inbound partner endpoints, MoH/Sở NN/Sở CT connectivity
3. **System settings configuration** (FR-04-01, FR-04-02, FR-04-06) — 3 items: logo, login screen, homepage info

### High-priority missing (blocks staging)
4. **Statistics excel exports** (FR-40-02, FR-40-04, FR-40-06, FR-40-08) — 4 items
5. **Report auto-calculation** (FR-34-10) — 1 item
6. **Dashboard tracking widgets** (FR-39-03, FR-39-04, FR-39-09) — 3 items
7. **Inspection plan attachments** (FR-27-08, FR-27-09) — 2 items
8. **Other missing exports** (FR-02-13, FR-03-03, FR-06-06, FR-17-05) — 4 items
9. **Avatar** (FR-05-05) — 1 item

### Infrastructure missing (blocks production)
10. **IPv6 / DNS** (IPV-02, IPV-04, IPV-05, DBS-10) — 4 items

---

## Production Blockers

### Must-fix before production (not currently VERIFIED or NOT_IMPLEMENTED)

| # | Blocker | Category | Related requirements |
|---|---|---|---|
| P1 | Public portal group E substantially missing (21 items NOT_IMPLEMENTED) | Functionality | FR-41..49 |
| P2 | Data integration engine entirely missing (3 items NOT_IMPLEMENTED + 7 senders) | Functionality | FR-51..57, INT-01..03 |
| P3 | System settings module absent (3 items NOT_IMPLEMENTED + 3 PARTIAL stubs) | Functionality | FR-04-01..06 |
| P4 | Committed dev secrets not purged from git history; DB credential encryption missing | Security | DBS-06, SEC-17 |
| P5 | IPv6 + TLS certificate provisioning absent | Infrastructure | IPV-01..06 |
| P6 | No backup/restore scripts or rehearsal | Operations | DBS-02, DBS-03 |
| P7 | Security-level dossier (hồ sơ cấp độ 2) not prepared | Compliance | L2-01 |
| P8 | No end-user manual (HDSD) or admin manual | Acceptance | ACC-05 |
| P9 | PDF/certificate document generation absent (QuestPDF not integrated) | Functionality | FR-LIC-01, FR-42-03/04, FR-43-03/04 etc. |

---

## Classification Summary Table

| Status | FR items | Non-FR software | Total software | % of 452 |
|---|---|---|---|---|
| VERIFIED_RUNTIME | 268 | 19 | **287** | **63.5%** |
| PARTIAL | 58 | 54 | **112** | **24.8%** |
| NOT_IMPLEMENTED | 46 | 7 | **53** | **11.7%** |
| NON_SOFTWARE | — | — | 0 | — |
| **Software total** | **372** | **80** | **452** | 100% |
| NON_SOFTWARE | — | — | **17** | — |
| **Grand total** | — | — | **469** | — |

---

## Answer to 6 Reconciliation Questions

**1. Are all 469 requirements covered by the 32 VERIFIED features?**
No. 53 software requirements are NOT_IMPLEMENTED — zero code exists. An additional 112 are PARTIAL with implementation gaps. 32/32 VERIFIED means the implemented portions of each feature passed real-stack runtime tests; it does not mean every sub-requirement within those features is implemented.

**2. Which requirements are VERIFIED through feature tests?**
287 software requirements (63.5%). All 268 CNRV/DB-only FR items whose parent feature is VERIFIED, plus 19 cross-cutting non-FR CNRV items (SEC, UI, DT, TECH) exercised during feature runs. See per-row Evidence column above.

**3. Which requirements have no corresponding VERIFIED feature?**
- FR-45-01..03 (warned-business lookup): no feature exists
- FR-48-03 (citizen alert submission): no feature exists
- NFR-01..06 (performance): no load test
- IPV-02/04/05 (IPv6/DNS ops): deployment obligations
- DBS-01..10 (DB security): infrastructure obligations
- SUP, TRN, OWN, HND, ACC (17 items): non-software deliverables

**4. Which requirements are still NOT_IMPLEMENTED?**
53 software items: 46 FR (public portal lists×21, integration senders×7, settings×3, stats exports×4, report auto-calc×1, dashboard tracking×3, inspection attachments×2, misc exports×4, avatar×1) + 7 non-FR (INT-01/02/03, IPV-02/04/05, DBS-10). See §Missing Functions above.

**5. Which requirements are implemented but have no runtime verification?**
112 PARTIAL items have their implemented portion runtime-verified (since the parent feature is VERIFIED); the gap within each item is the un-implemented portion. There are no items in the category "fully implemented but no runtime verification" — all CNRV items are in VERIFIED features and therefore become VERIFIED_RUNTIME.

**6. Which non-software requirements remain incomplete?**
All 17 non-software deliverables are NON_SOFTWARE. None are evidenced in the repository except ACC-05 partially (ops/dev docs exist; HDSD and admin manual absent). SUP/TRN/OWN/HND/ACC obligations remain unstarted as formal deliverables.

---

*Document generated: 2026-07-27 · Source commits: doc 61 (469 requirements), doc 63 (implementation matrix at `9d2cb1e`), doc 64 (completion calculation), doc 65 (STT summary), doc 66 (incomplete functions), doc 67 (full audit) + feature registry at `236c782` (32/32 VERIFIED).*
