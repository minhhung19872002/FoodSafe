# 01 — Requirement Production Readiness Matrix

**Audit date**: 2026-07-27  
**HEAD commit**: `fe3dbd2` (merge: feature/close-remaining-gaps)  
**Auditor role**: Independent Principal Software Auditor  
**Sources reconciled**: PDF YCKT (42 pp.), doc 61 (requirement inventory), doc 63 (implementation matrix at `9d2cb1e`), doc 68 (reconciliation at `236c782`), feature verification registry (doc 01 — last updated `5aff855`), actual code inspection at HEAD `fe3dbd2`  
**Key finding**: Commits `8fe0320..fe3dbd2` (~39k lines) added substantial implementations after the last registry update. This matrix re-verifies all items against real code at HEAD.

---

## Status Legend

| Status | Meaning |
|---|---|
| **READY_FOR_PRODUCTION** | Implemented + runtime-verified against real stack at a post-`9d2cb1e` commit; code unchanged in new batch |
| **READY_WITH_MINOR_ISSUES** | Implemented in code (inspected at HEAD); code-verified but not re-run through Playwright E2E since the new batch — or has a minor remaining gap |
| **IMPLEMENTED_NOT_ACCEPTABLE** | Code exists but with a significant structural defect that makes it non-compliant with the requirement |
| **PARTIAL** | Partly implemented; a meaningful portion of the sub-requirement is missing or broken |
| **NOT_IMPLEMENTED** | Zero useful implementation in the software deliverable |
| **BLOCKED** | Cannot implement in software without external infrastructure / ISP / third-party obligation |

> **Conservative rule applied**: anything added in commits `8fe0320..fe3dbd2` that has not been exercised by a `-verification.spec.ts` test against the real stack is capped at **READY_WITH_MINOR_ISSUES**. The commit message `0eba6b6` claims 235/235 E2E pass, but the feature verification registry (doc 01) was not re-stamped with verified commits for the new batch items; those claims are treated as code-verified evidence only.

---

## Group A — Quản trị hệ thống (STT 1–5)

### STT 1 — Quản lý vai trò người dùng

| Req ID | Requirement | Status | BE Evidence | FE Evidence | Runtime Test | Remaining Issue | Production Impact |
|---|---|---|---|---|---|---|---|
| FR-01-01 | Thêm mới vai trò | **READY_FOR_PRODUCTION** | `IdentityAdministrationAppService.CreateRoleAsync` | `IdentityAdministrationPage` roles tab | `identity-administration-verification.spec.ts` F-020 VERIFIED | None | None |
| FR-01-02 | Sửa vai trò | **READY_FOR_PRODUCTION** | `UpdateRoleAsync` | Same | Same | None | None |
| FR-01-03 | Xóa vai trò | **READY_FOR_PRODUCTION** | `DeleteRoleAsync` | Same | Same | None | None |
| FR-01-04 | Tìm kiếm vai trò | **READY_FOR_PRODUCTION** | `GetRoleListAsync` with filter | Same | Same | None | None |
| FR-01-05 | Đặt permissions cho vai trò | **READY_FOR_PRODUCTION** | `Get/UpdateRolePermissionsAsync` | Permission-tree drawer | Same | None | None |
| FR-01-06 | Phân vai trò cho người dùng | **READY_FOR_PRODUCTION** | `UpdateUserAsync` roles field, `Users.ManageRoles` perm | Same | Same | None | None |

### STT 2 — Quản lý người dùng

| Req ID | Requirement | Status | BE Evidence | FE Evidence | Runtime Test | Remaining Issue | Production Impact |
|---|---|---|---|---|---|---|---|
| FR-02-01 | Danh sách + tìm kiếm người dùng | **READY_FOR_PRODUCTION** | `GetUsersAsync` w/ filters | `IdentityAdministrationPage` users tab | F-020 VERIFIED | None | None |
| FR-02-02 | Tìm kiếm theo quyền / vai trò | **READY_WITH_MINOR_ISSUES** | `GetUsersAsync` — role/org/status + permission filter added `fcb4f82` | Filter dropdowns | Not re-verified in new batch | Permission-based search UI added in new batch; not re-verified | Low — filter works but not runtime-tested |
| FR-02-03 | Tạo mới người dùng | **READY_FOR_PRODUCTION** | `CreateUserAsync` org-scoped + triple perm check | Create modal | F-020 VERIFIED | None | None |
| FR-02-04 | Sửa thông tin người dùng | **READY_FOR_PRODUCTION** | `UpdateUserAsync` | Edit modal | F-020 VERIFIED | None | None |
| FR-02-05 | Xóa tài khoản người dùng | **READY_WITH_MINOR_ISSUES** | `DeleteUserAsync` BE + FE delete action added `fcb4f82` | Delete button + confirm dialog | Not re-verified in new batch | FE delete wired in new batch; not runtime-tested | Medium — deletion is a permanent action |
| FR-02-06 | Thay đổi mật khẩu người dùng (đặt lại) | **READY_FOR_PRODUCTION** | `ResetPasswordAsync` endpoint | Reset button | `password-management-verification.spec.ts` F-002 VERIFIED | None | None |
| FR-02-07 | Tạo ngẫu nhiên mật khẩu | **READY_WITH_MINOR_ISSUES** | `GenerateRandomPasswordAsync` added `fcb4f82` | Generate button in user modal | Not re-verified | Added in new batch; not runtime-tested | Low — functional alternative existed before |
| FR-02-08 | Gửi email kích hoạt tài khoản | **READY_FOR_PRODUCTION** | `SendPasswordResetEmailAsync` in `CreateUserAsync` | Implicit on create | F-020 VERIFIED | None | None |
| FR-02-09 | Bắt buộc đổi mật khẩu lần đăng nhập tiếp theo | **READY_FOR_PRODUCTION** | `MustChangePassword` + `CompleteInitialPasswordChange` flow | Force-change page | F-002 VERIFIED | None | None |
| FR-02-10 | Vô hiệu hóa / kích hoạt tài khoản | **READY_FOR_PRODUCTION** | Activation endpoint | FE toggle | F-020 VERIFIED | None | None |
| FR-02-11 | Tự động khóa khi đăng nhập sai nhiều lần | **READY_FOR_PRODUCTION** | ABP lockout: 5 attempts/30 min; `FailedLoginCount/LockedUntil` | N/A | `auth-verification.spec.ts` F-001 VERIFIED | None | None |
| FR-02-12 | Mở khóa tài khoản | **READY_FOR_PRODUCTION** | Unlock endpoint | FE unlock button | F-020 VERIFIED | None | None |
| FR-02-13 | Xuất excel danh sách người dùng | **READY_WITH_MINOR_ISSUES** | `UserExcelAppService.ExportAsync` (`FoodSafe.Application/IdentityAdministration/UserExcelAppService.cs`) | Export button wired in `8fe0320` | Not re-verified in new batch | Code-verified; not runtime-tested | Low — excel infra proven in other services |

### STT 3 — Nhật ký hệ thống (Audit Log)

| Req ID | Requirement | Status | BE Evidence | FE Evidence | Runtime Test | Remaining Issue | Production Impact |
|---|---|---|---|---|---|---|---|
| FR-03-01 | Tìm kiếm thao tác người dùng | **READY_FOR_PRODUCTION** | `AuditLogAppService.GetListAsync` w/ URL/method/date/error filters | `AuditLogPage` | `audit-logs-verification.spec.ts` F-021 VERIFIED | None | None |
| FR-03-02 | Xem chi tiết thao tác | **READY_WITH_MINOR_ISSUES** | Per-entry detail added `8fe0320` | Detail panel/drawer | Not re-verified | Added in new batch; controller confirmed (`AuditLogController.cs`) | Low |
| FR-03-03 | Xuất excel thao tác | **READY_WITH_MINOR_ISSUES** | `AuditLogExcelAppService.ExportAsync` (`Dashboard/AuditLogExcelAppService.cs`) | Export button | Not re-verified | Added in new batch | Low |

### STT 4 — Cài đặt hệ thống

| Req ID | Requirement | Status | BE Evidence | FE Evidence | Runtime Test | Remaining Issue | Production Impact |
|---|---|---|---|---|---|---|---|
| FR-04-01 | Thay đổi logo ứng dụng | **READY_WITH_MINOR_ISSUES** | `SystemSettingsAppService.SetLogoAsync` — MinIO blob + setting record (`Settings/SystemSettingsAppService.cs`) | Logo upload in settings page | `system-settings-verification.spec.ts` F-032 VERIFIED (prior branch) | New implementation in `b1873a4`; F-032 verified at `d855990` which precedes new batch | Medium — branding required for acceptance |
| FR-04-02 | Thay đổi màn hình đăng nhập | **READY_WITH_MINOR_ISSUES** | `SystemSettingsAppService.SetLoginBackgroundAsync` | Login bg upload | Same as above | Same | Medium |
| FR-04-03 | Thiết lập độ dài mật khẩu | **READY_WITH_MINOR_ISSUES** | `UpdateAsync` — `IdentitySettingNames.Password.RequiredLength` + `FoodSafeSettings.Security.PasswordMaxLength` | Password policy form | Same as above | New batch implementation; not post-batch runtime tested | Medium |
| FR-04-04 | Cấu hình vô hiệu tài khoản khi đăng nhập thất bại | **READY_WITH_MINOR_ISSUES** | `IdentitySettingNames.Lockout.*` via `ISettingManager` | Lockout config form | Same as above | Same | Medium |
| FR-04-05 | Cấu hình Email (SMTP) | **READY_WITH_MINOR_ISSUES** | `EmailSettingNames.Smtp.*` via `ISettingManager` | SMTP config form | Same as above | SMTP password field; send-test button not confirmed | Medium |
| FR-04-06 | Cấu hình thông tin trang chủ | **READY_WITH_MINOR_ISSUES** | `FoodSafeSettings.Homepage.*` title/description/contact via `ISettingManager` | Homepage info form | Same as above | `PublicBrandingAppService` serves branding to public portal | Low |

### STT 5 — Quản lý truy cập

| Req ID | Requirement | Status | BE Evidence | FE Evidence | Runtime Test | Remaining Issue | Production Impact |
|---|---|---|---|---|---|---|---|
| FR-05-01 | Đăng nhập | **READY_FOR_PRODUCTION** | `AccountSecurityAppService` + Turnstile captcha + CSRF | `LoginPage` | `auth-verification.spec.ts` F-001 VERIFIED | None | None |
| FR-05-02 | Đăng xuất | **READY_FOR_PRODUCTION** | `GET /api/account/logout` — session destroyed | Logout button | F-001 VERIFIED | None | None |
| FR-05-03 | Đổi mật khẩu (tự phục vụ) | **READY_FOR_PRODUCTION** | `ChangePasswordAsync` — history + expiry enforcement | Change-password page | F-002 VERIFIED | None | None |
| FR-05-04 | Chỉnh sửa thông tin tài khoản | **READY_WITH_MINOR_ISSUES** | `UserProfileAppService` — name, phone, email (`Security/UserProfileAppService.cs`) | `ProfilePage.tsx` added `71e0b3b` | Not re-verified in new batch | Profile self-service new in new batch | Low |
| FR-05-05 | Thay đổi ảnh đại diện | **READY_WITH_MINOR_ISSUES** | `UserProfileAppService.UploadAvatarAsync` + MinIO blob | Avatar upload in `ProfilePage.tsx` (`71e0b3b`) | Not re-verified in new batch | Avatar new in new batch | Low |

---

## Group B — Quản lý danh mục (STT 6–18)

### STT 6 — Quản lý đơn vị

| Req ID | Requirement | Status | BE Evidence | FE Evidence | Runtime Test | Remaining Issue | Production Impact |
|---|---|---|---|---|---|---|---|
| FR-06-01 | Danh sách + tìm kiếm đơn vị | **READY_FOR_PRODUCTION** | `OrganizationAppService.GetListAsync` | `OrganizationListPage` | `organizations-verification.spec.ts` F-003 VERIFIED | None | None |
| FR-06-02 | Tìm kiếm nâng cao + đặt lại | **READY_FOR_PRODUCTION** | Level filter + text + reset | Same | F-003 VERIFIED | None | None |
| FR-06-03 | Tạo đơn vị trực thuộc | **READY_FOR_PRODUCTION** | `CreateAsync` — parent selection + hierarchy validation | Create modal | F-003 VERIFIED | None | None |
| FR-06-04 | Sửa thông tin đơn vị | **READY_FOR_PRODUCTION** | `UpdateAsync` | Edit modal | F-003 VERIFIED | None | None |
| FR-06-05 | Xóa đơn vị | **READY_FOR_PRODUCTION** | `DeleteAsync` | Delete action | F-003 VERIFIED | None | None |
| FR-06-06 | Xuất excel đơn vị | **READY_WITH_MINOR_ISSUES** | `OrganizationExcelAppService.ExportAsync` (`Organizations/OrganizationExcelAppService.cs`) | Export button `8fe0320` | Not re-verified | Added in new batch | Low |

### STT 7 — Quản lý tài khoản đơn vị

All 6 items share implementation with STT 2 (user management filtered by organization).

| Req ID | Requirement | Status |
|---|---|---|
| FR-07-01 | Danh sách + tìm kiếm tài khoản đơn vị | **READY_FOR_PRODUCTION** — user list filtered by org; F-020 VERIFIED |
| FR-07-02 | Tạo tài khoản đơn vị | **READY_FOR_PRODUCTION** — `CreateUser` with organizationId; F-020 VERIFIED |
| FR-07-03 | Sửa / xóa tài khoản đơn vị | **READY_WITH_MINOR_ISSUES** — edit verified; delete FE added `fcb4f82`, not re-verified |
| FR-07-04 | Đặt mật khẩu mặc định; bắt buộc đổi mật khẩu | **READY_FOR_PRODUCTION** — MustChangePassword flow; F-002 VERIFIED |
| FR-07-05 | Mở khóa / đổi mật khẩu | **READY_FOR_PRODUCTION** — F-020 VERIFIED |
| FR-07-06 | Phân quyền tài khoản đơn vị | **READY_FOR_PRODUCTION** — role assignment + scope ceiling; F-020 VERIFIED |

### STT 8–16 — Danh mục dùng chung (9 catalog types × 4 operations = 36 items)

BE: `MasterCatalogAppService` (quốc gia, vùng miền, phân loại cơ sở, nhóm SP, loại hình cơ sở, loại hình QC, cơ sở kiểm nghiệm) + `GeographicCatalogAppService` (tỉnh/TP, xã/phường).  
FE: `MasterCatalogPage`, `GeographicCatalogPage`.  
Runtime: `catalogs-verification.spec.ts` (F-004 VERIFIED), `geography-verification.spec.ts` (F-005 VERIFIED).

**All 36 FR-08-01..FR-16-04 items: READY_FOR_PRODUCTION.** Duplicate-code guards in BE; global unscoped catalogs; full CRUD with search verified.

### STT 17 — Danh mục dịch vụ kiểm nghiệm

| Req ID | Status |
|---|---|
| FR-17-01..04 | **READY_FOR_PRODUCTION** — `testing-services` catalog kind in `MasterCatalogAppService`; F-004 VERIFIED |
| FR-17-05 | **READY_WITH_MINOR_ISSUES** — `TestingServiceExcelAppService` (`Catalogs/TestingServiceExcelAppService.cs`) added `8fe0320`; not re-verified |

### STT 18 — Danh mục loại văn bản

FR-18-01..04: **READY_FOR_PRODUCTION** — `document-type` catalog kind; F-004 VERIFIED.  
**Note**: STT 38 (Documents feature) still uses a hard-coded type list rather than this catalog — see FR-38-03/04 defect.

---

## Group C — Quản lý về ATTP (STT 19–40)

### STT 19 — Quản lý cơ sở SXKD ATTP

BE: `BusinessAppService` + `BusinessExcelAppService` (`BusinessManagement/`).  
FE: `BusinessManagementPage` + `BusinessDetailDrawer.tsx`.

| Req ID | Requirement | Status | Remaining Issue |
|---|---|---|---|
| FR-19-01 | Danh sách + tìm kiếm cơ sở | **READY_FOR_PRODUCTION** | None — `businesses-verification.spec.ts` F-006 VERIFIED |
| FR-19-02 | Tìm kiếm nâng cao theo phân loại | **READY_WITH_MINOR_ISSUES** | Classification/type/area filters added `f752c38`; code-verified, not re-E2E'd |
| FR-19-03 | Thêm mới cơ sở | **READY_FOR_PRODUCTION** | F-006 VERIFIED |
| FR-19-04 | Import excel | **READY_FOR_PRODUCTION** | Template/preview/confirm + row-level validation; F-006 VERIFIED |
| FR-19-05 | Sửa thông tin cơ sở | **READY_FOR_PRODUCTION** | F-006 VERIFIED |
| FR-19-06 | Xóa cơ sở | **READY_FOR_PRODUCTION** | F-006 VERIFIED |
| FR-19-07 | Xem chi tiết cơ sở | **READY_FOR_PRODUCTION** | F-006 VERIFIED |
| FR-19-08 | Xuất excel cơ sở | **READY_FOR_PRODUCTION** | F-006 VERIFIED |
| FR-19-09 | Vị trí bản đồ | **READY_FOR_PRODUCTION** | Leaflet MapPicker + coordinates stored; F-006 VERIFIED |
| FR-19-10 | Nhóm sản phẩm của cơ sở | **READY_FOR_PRODUCTION** | `business_product_groups`; F-006 VERIFIED |
| FR-19-11 | Giấy tờ công bố (per-business tab) | **READY_WITH_MINOR_ISSUES** | Tab in `BusinessDetailDrawer.tsx` added `f752c38`; code-verified |
| FR-19-12 | Giấy ĐKCB (per-business tab) | **READY_WITH_MINOR_ISSUES** | Same drawer, same batch |
| FR-19-13 | Giấy quảng cáo (per-business tab) | **READY_WITH_MINOR_ISSUES** | Same |
| FR-19-14 | Người trực tiếp SXKD (handlers) | **READY_FOR_PRODUCTION** | AddHandler/UpdateHandler/DeleteHandler; F-006 VERIFIED |
| FR-19-15 | Kết quả thanh tra (per-business tab) | **READY_WITH_MINOR_ISSUES** | Tab in drawer added `f752c38`; code-verified |
| FR-19-16 | Xác nhận đủ điều kiện (per-business tab) | **READY_WITH_MINOR_ISSUES** | Tab in drawer added `f752c38`; code-verified |
| FR-19-17 | Xác nhận bản cam kết VSATTP | **READY_FOR_PRODUCTION** | `HasVsattpCommitment` flag; F-006 VERIFIED |
| FR-19-18 | Phân cấp dữ liệu địa bàn / đầu mối | **READY_FOR_PRODUCTION** | `CurrentDataScope` + `ManagementScopeAssignment`; F-006 VERIFIED |

### STT 20 — Sản phẩm của cơ sở

BE: `ProductAppService` + `ProductExcelAppService`. FE: Products tab in `BusinessManagementPage`.  
FR-20-01..08 (list, search, create, update, delete, detail, import excel, export excel): **All READY_FOR_PRODUCTION** — F-006 VERIFIED.

### STT 21 — Tự công bố sản phẩm

BE: `SelfDeclarationAppService` + `SelfDeclarationAttachmentAppService` + `SelfDeclarationExcelAppService`.  
FR-21-01..09: **All READY_FOR_PRODUCTION** — `self-declarations-verification.spec.ts` F-007 VERIFIED. Full lifecycle including revoke/activate beyond PDF spec.

### STT 22 — Đăng ký công bố sản phẩm

BE: `ProductRegistrationAppService` + `ProductRegistrationAttachmentAppService` + `ProductRegistrationExcelAppService`.  
FR-22-01..09: **All READY_FOR_PRODUCTION** — `product-registrations-verification.spec.ts` F-008 VERIFIED.

### STT 23 — Đăng ký quảng cáo

BE: `AdvertisementRegistrationAppService` + `AdvertisementRegistrationAttachmentAppService` + `AdvertisementRegistrationExcelAppService`.  
FR-23-01..11: **All READY_FOR_PRODUCTION** — `advertisement-registrations-verification.spec.ts` F-009 VERIFIED. Multi-product selection verified.

### STT 24 — Cơ sở đủ điều kiện ATTP

BE: `EligibilityCertificateAppService` + `EligibilityCertificateAttachmentAppService` + `EligibilityCertificateExcelAppService`.  
FR-24-01..10: **All READY_FOR_PRODUCTION** — `eligibility-certificates-verification.spec.ts` F-010 VERIFIED.

### STT 25 — Giấy chứng nhận lưu hành tự do (CFS)

BE: `CfsCertificateAppService` + `CfsCertificateAttachmentAppService` + `CfsCertificateExcelAppService`.  
FR-25-01..11: **All READY_FOR_PRODUCTION** — `cfs-certificates-verification.spec.ts` F-011 VERIFIED.

### STT 26 — GCN thực phẩm xuất khẩu

BE: `ExportFoodCertificateAppService` + `ExportFoodCertificateAttachmentAppService` + `ExportFoodCertificateExcelAppService`.  
FR-26-01..11: **All READY_FOR_PRODUCTION** — `export-food-certificates-verification.spec.ts` F-012 VERIFIED.

### Cross-cutting licensing (FR-LIC-01..02)

| Req ID | Requirement | Status | Remaining Issue | Production Impact |
|---|---|---|---|---|
| FR-LIC-01 | Biểu mẫu giấy phép theo NĐ 15/2018 | **IMPLEMENTED_NOT_ACCEPTABLE** | `CertificatePdfAppService` (`Public/CertificatePdfAppService.cs`) uses QuestPDF to generate PDF for 5 certificate types. Layout: bilingual header (CHXHCNVN), certificate title, key fields, status, page number. However: layout is functional but **not in the prescribed NĐ 15/2018/NĐ-CP form template** (circular format, ministry seal placement, number format). Customers may refuse acceptance if decree form is required. | High for formal acceptance |
| FR-LIC-02 | Phân cấp quản lý giấy tờ theo cơ sở | **READY_FOR_PRODUCTION** | Business-parent scope checkers; all licensing specs verified | None |

### STT 27 — Kế hoạch thanh kiểm tra

BE: `InspectionPlanAppService` + `InspectionPlanExcelAppService`. FE: Inspection plans page.

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-27-01..07 | **READY_FOR_PRODUCTION** | `inspection-verification.spec.ts` F-013 VERIFIED |
| FR-27-08 | **READY_WITH_MINOR_ISSUES** | `InspectionPlanAttachmentAppService.UploadAsync` added in `InspectionAttachmentAppServices.cs` (`71e0b3b`); `InspectionAttachmentsModal.tsx` in FE. Code-verified; not re-E2E'd |
| FR-27-09 | **READY_WITH_MINOR_ISSUES** | `InspectionPlanAttachmentAppService.DownloadAsync`; same batch | 
| FR-27-10 | **READY_FOR_PRODUCTION** | Excel export; F-013 VERIFIED |
| FR-27-11 | **READY_FOR_PRODUCTION** | Org-scoped queries; F-013 VERIFIED |

### STT 28 — Kết quả thanh kiểm tra

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-28-01 | **READY_FOR_PRODUCTION** | F-013 VERIFIED |
| FR-28-02 | **READY_FOR_PRODUCTION** | F-013 VERIFIED |
| FR-28-03 | **READY_WITH_MINOR_ISSUES** | `InspectionFollowUpModal.tsx` + finalize step added `71e0b3b`; code-verified |
| FR-28-04 | **READY_FOR_PRODUCTION** | Violations, fines, remediation; F-013 VERIFIED |
| FR-28-05 | **READY_WITH_MINOR_ISSUES** | `InspectionResultAttachmentAppService` added in `InspectionAttachmentAppServices.cs` (`71e0b3b`); code-verified |
| FR-28-06 | **READY_FOR_PRODUCTION** | F-013 VERIFIED |
| FR-28-07 | **READY_FOR_PRODUCTION** | Cross-org mutation fix `ca5e7f8`; F-013 VERIFIED |

### STT 29 — Cảnh báo vệ sinh ATTP

BE: `AtpAlertAppService` + `AtpAlertExcelAppService`. FE: alerts tab.

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-29-01..05 | **READY_FOR_PRODUCTION** | `alerts-news-verification.spec.ts` F-016 VERIFIED |
| FR-29-06 | **READY_WITH_MINOR_ISSUES** | `CitizenAlertReportAppService` creates `Draft` alert with `AlertSource.PublicReport` for officer moderation. The moderation queue is the existing Alerts module filtered by source. Added `71e0b3b`; code-verified but not runtime-tested end-to-end for the moderation workflow |
| FR-29-07..09 | **READY_FOR_PRODUCTION** | F-016 VERIFIED |

### STT 30 — Tin tức, hoạt động ATTP

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-30-01..06 | **READY_FOR_PRODUCTION** | F-016 VERIFIED |
| FR-30-07 | **READY_WITH_MINOR_ISSUES** | `CitizenNewsReportAppService` + `CitizenNewsReportPage.tsx` added `71e0b3b`; moderation queue via admin panel; code-verified |
| FR-30-08 | **READY_FOR_PRODUCTION** | `RecalledBy/At` columns fixed `06656c8`; F-016 VERIFIED |
| FR-30-09 | **READY_WITH_MINOR_ISSUES** | Publish status controls visibility on `PublicNewsPage.tsx` (`features/public-portal/pages/PublicNewsPage.tsx`); code-verified via `public-portal-verification.spec.ts` F-033 VERIFIED (prior branch commit) |

### STT 31 — Ca ngộ độc nhỏ lẻ

FR-31-01..11: **All READY_FOR_PRODUCTION** — `food-poisoning-verification.spec.ts` F-014 VERIFIED. Full workflow (declare → verify → error report), map view, excel export, org scope.

### STT 32 — Vụ ngộ độc

FR-32-01..10: **All READY_FOR_PRODUCTION** — F-014 VERIFIED. Conclude permission-gated (province-level enforcement via role grant). Excel export and org scope verified.

### STT 33 — Báo cáo NĐTP (hàng tháng)

BE: `NdtpReportAppService` + `NdtpReportExcelAppService` + `ReportCalculationAppService`.

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-33-01 | **READY_FOR_PRODUCTION** | `reporting-verification.spec.ts` F-015 VERIFIED |
| FR-33-02 | **READY_WITH_MINOR_ISSUES** | `ReportCalculationAppService.GetNdtpAggregationAsync` aggregates submitted child-org reports for city/province consolidation (`f4d5dfd`). Code-verified; not re-E2E'd |
| FR-33-03 | **READY_FOR_PRODUCTION** | `EnsureDraft` guard; F-015 VERIFIED |
| FR-33-04 | **READY_FOR_PRODUCTION** | Immutability guards + SubmissionVersion; F-015 VERIFIED |
| FR-33-05 | **READY_FOR_PRODUCTION** | `reporting-error-notifications.spec.ts`; runtime-verified `07476e3` |
| FR-33-06..11 | **READY_FOR_PRODUCTION** | F-015 VERIFIED |

### STT 34 — Báo cáo công tác ATTP (6 tháng + 1 năm)

BE: `AtpWorkReportAppService` + `AtpWorkReportExcelAppService` + `ReportCalculationAppService`.

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-34-01..04, 06, 07, 09, 11 | **READY_FOR_PRODUCTION** | F-015 VERIFIED |
| FR-34-05 | **READY_FOR_PRODUCTION** | `reporting-error-notifications.spec.ts`; runtime-verified `07476e3` |
| FR-34-08 | **READY_WITH_MINOR_ISSUES** | `ReportDocumentViewModal.tsx` renders narrative fields in modal (`f4d5dfd`). Code-verified; not a fully formatted decree-form document view |
| FR-34-10 | **READY_WITH_MINOR_ISSUES** | `ReportCalculationAppService.GetAtpWorkStatsAsync` computes 15+ metrics from businesses/licenses/inspections/poisoning (`f4d5dfd`). Code-verified (`Reporting/ReportCalculationAppService.cs`); not re-E2E'd. **This is the most significant new feature in the batch** |

### STT 35 — Báo cáo Tháng hành động ATTP (1 năm/lần)

BE: `ActionMonthReportAppService` + `ActionMonthReportExcelAppService`.

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-35-01..04, 06, 07, 09 | **READY_FOR_PRODUCTION** | F-015 VERIFIED |
| FR-35-05 | **READY_FOR_PRODUCTION** | `reporting-error-notifications.spec.ts`; runtime-verified `07476e3` |
| FR-35-08 | **READY_WITH_MINOR_ISSUES** | `ReportDocumentViewModal.tsx` (same as FR-34-08); code-verified |
| FR-35-10 | **READY_FOR_PRODUCTION** | Annual period columns; F-015 VERIFIED. Date-range validation added `0eba6b6` (DT-08 fix: dd/MM/yyyy format enforced) |

### STT 36 — Phân tích mối nguy cơ

BE: `RiskAnalysisAppService` + `RiskAnalysisExcelAppService`. FE: risk-analysis module.

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-36-01..06 | **READY_FOR_PRODUCTION** | `risk-analysis-verification.spec.ts` F-018 VERIFIED |
| FR-36-07 | **READY_WITH_MINOR_ISSUES** | `PublicContentAppService` exposes published risk analyses on public portal (`PublicNewsPage.tsx` includes risk analysis tab); code-verified via F-033 VERIFIED (prior branch) |
| FR-36-08 | **READY_WITH_MINOR_ISSUES** | Excel export (existing) + `printHtml.ts` print view added `0eba6b6` (`utils/printHtml.ts`); code-verified |

### STT 37 — Kết quả kiểm nghiệm

BE: `TestingResultAppService` + `TestingResultExcelAppService`. FE: testing-results module.  
FR-37-01..06: **All READY_FOR_PRODUCTION** — `testing-results-verification.spec.ts` F-017 VERIFIED. Minor: testing center is free-text (not catalog-linked) — acceptable.

### STT 38 — Văn bản chỉ đạo, điều hành

BE: `AdministrativeDocumentAppService` + `AdministrativeDocumentExcelAppService` + `AdministrativeDocumentAttachmentAppService`.

| Req ID | Status | Remaining Issue | Production Impact |
|---|---|---|---|
| FR-38-01, 02, 05, 06 | **READY_FOR_PRODUCTION** | `documents-verification.spec.ts` F-031 VERIFIED | None |
| FR-38-03 | **PARTIAL** | Creates document, but document type is from a **hard-coded 8-value list** in code, not the STT 18 catalog. STT 18 catalog data is ignored at create time. | Medium — creates disconnect between catalog management and document use |
| FR-38-04 | **PARTIAL** | Same hard-coded type list defect on update | Medium |
| FR-38-07 | **READY_WITH_MINOR_ISSUES** | `DocumentAttachmentsModal.tsx` (upload/download/delete) + `printHtml.ts` print view added `0eba6b6`. Per-document file attachment now works. Code-verified | Low |

### STT 39 — Dashboard thống kê

BE: `DashboardAppService` (real aggregates, org-scoped). FE: `DashboardPage.tsx` + `StatisticsPage.tsx` + `PoisoningMap`.

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-39-01 | **READY_FOR_PRODUCTION** | `dashboard-verification.spec.ts` F-022 VERIFIED |
| FR-39-02 | **READY_WITH_MINOR_ISSUES** | Time + unit selectors added `0763d1f` in DashboardPage; code-verified |
| FR-39-03 | **READY_WITH_MINOR_ISSUES** | `useReportCompliance` hook + compliance table in `DashboardPage.tsx` added `0763d1f`; code-verified |
| FR-39-04 | **READY_WITH_MINOR_ISSUES** | Action-month compliance widget added `0763d1f`; code-verified |
| FR-39-05 | **READY_FOR_PRODUCTION** | Statistics chart; `statistics-verification.spec.ts` F-023 VERIFIED |
| FR-39-06 | **READY_FOR_PRODUCTION** | Line chart; F-023 VERIFIED |
| FR-39-07 | **READY_FOR_PRODUCTION** | Leaflet map tab; F-023 VERIFIED |
| FR-39-08 | **READY_FOR_PRODUCTION** | Bar chart; F-023 VERIFIED |
| FR-39-09 | **READY_WITH_MINOR_ISSUES** | `chartExport.ts` utility added `71e0b3b` (`utils/chartExport.ts`); chart download button wired; code-verified |

### STT 40 — Báo cáo thống kê

BE: `StatisticsAppService` + `StatisticsExcelAppService` (new) + `ReportStatisticsAppService`.

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-40-01 | **READY_FOR_PRODUCTION** | `statistics-verification.spec.ts` F-023 VERIFIED |
| FR-40-02 | **READY_WITH_MINOR_ISSUES** | `StatisticsExcelAppService.ExportLicensesByBusinessTypeAsync` (`Dashboard/StatisticsExcelAppService.cs`) added `8fe0320`; code-verified |
| FR-40-03 | **READY_FOR_PRODUCTION** | F-023 VERIFIED |
| FR-40-04 | **READY_WITH_MINOR_ISSUES** | `StatisticsExcelAppService.ExportPoisoningByAreaAsync`; code-verified |
| FR-40-05 | **READY_FOR_PRODUCTION** | F-023 VERIFIED |
| FR-40-06 | **READY_WITH_MINOR_ISSUES** | `StatisticsExcelAppService.ExportInspectionSummaryAsync`; code-verified |
| FR-40-07 | **READY_WITH_MINOR_ISSUES** | `StatisticsExcelAppService.ExportBusinessBreakdownAsync` — multi-sheet: by type, by region, by province/district, by managing-unit (`8fe0320`). Also `StatisticsAppService` computes breakdowns. Code-verified |
| FR-40-08 | **READY_WITH_MINOR_ISSUES** | `StatisticsExcelAppService.ExportBusinessBreakdownAsync` (sheet "Theo đầu mối quản lý"); code-verified |

---

## Group E — Cổng thông tin công cộng (STT 41–49)

BE: `PublicDirectoryAppService`, `PublicContentAppService`, `PublicCertificateSearchAppService`, `CitizenAlertReportAppService`, `CitizenNewsReportAppService`, `CertificatePdfAppService` + 7 existing public single-lookup services.  
FE: `features/public-portal/pages/` — `PublicPortalHomePage`, `PublicGeneralSearchPage`, `PublicWarnedBusinessesPage`, `PublicNewsPage`, `PublicDocumentsPage`, `PublicCertificateSearchPage` + 7 single-lookup pages.  
**Security**: All public endpoints confirmed `[AllowAnonymous]`. Draft/non-public filter enforced at query level.

### STT 41 — Tra cứu thông tin chung

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-41-01 | **READY_WITH_MINOR_ISSUES** | `PublicDirectoryAppService.SearchBusinessesAsync` — paged, keyword filter (`features/public-portal/pages/PublicGeneralSearchPage.tsx` tab). Code-verified via F-033 VERIFIED (prior branch) |
| FR-41-02 | **READY_WITH_MINOR_ISSUES** | Paginated table result; same |
| FR-41-03 | **READY_WITH_MINOR_ISSUES** | `PublicDirectoryAppService.SearchProductsAsync` — paged, keyword filter. Products tab in `PublicGeneralSearchPage.tsx`. Code-verified |
| FR-41-04 | **READY_WITH_MINOR_ISSUES** | Paginated product table result; same |

### STT 42 — Tra cứu GCN đủ điều kiện (công khai)

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-42-01 | **READY_WITH_MINOR_ISSUES** | `PublicCertificateSearchAppService` provides browsable list; F-033 VERIFIED (prior branch) |
| FR-42-02 | **READY_FOR_PRODUCTION** | `PublicEligibilityCertificateAppService` single-entity lookup; `public-lookups-verification.spec.ts` F-027 VERIFIED |
| FR-42-03 | **READY_WITH_MINOR_ISSUES** | `CertificatePdfAppService.GetEligibilityCertificatePdfAsync` — QuestPDF renders PDF; `certificate-pdf-verification.spec.ts` F-034 VERIFIED (prior branch) |
| FR-42-04 | **READY_WITH_MINOR_ISSUES** | PDF download endpoint; same |

### STT 43–44, 46–47 — Tra cứu tự công bố / ĐKCB / CFS / GCN xuất khẩu

Same implementation pattern as STT 42 for each of 4 certificate types.

| STT | FR-xx-01 (list) | FR-xx-02 (view info) | FR-xx-03 (view doc) | FR-xx-04 (print/download) |
|---|---|---|---|---|
| 43 (TCB) | **READY_WITH_MINOR_ISSUES** | **READY_FOR_PRODUCTION** (F-025 VERIFIED) | **READY_WITH_MINOR_ISSUES** | **READY_WITH_MINOR_ISSUES** |
| 44 (ĐKCB) | **READY_WITH_MINOR_ISSUES** | **READY_FOR_PRODUCTION** (F-026 VERIFIED) | **READY_WITH_MINOR_ISSUES** | **READY_WITH_MINOR_ISSUES** |
| 46 (CFS) | **READY_WITH_MINOR_ISSUES** | **READY_FOR_PRODUCTION** (F-028 VERIFIED) | **READY_WITH_MINOR_ISSUES** | **READY_WITH_MINOR_ISSUES** |
| 47 (XK) | **READY_WITH_MINOR_ISSUES** | **READY_FOR_PRODUCTION** (F-029 VERIFIED) | **READY_WITH_MINOR_ISSUES** | **READY_WITH_MINOR_ISSUES** |

### STT 45 — Tra cứu cơ sở bị cảnh báo (công khai)

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-45-01 | **READY_WITH_MINOR_ISSUES** | `PublicWarnedBusinessesPage.tsx` + `usePublicWarnedBusinesses` hook + backend public endpoint added in new batch; F-033 VERIFIED (prior branch) |
| FR-45-02 | **READY_WITH_MINOR_ISSUES** | Expandable row shows full alert content; same |
| FR-45-03 | **READY_WITH_MINOR_ISSUES** | Alert content in expandable row; same |

### STT 48 — Cảnh báo VSATTP (công dân)

| Req ID | Status | Remaining Issue | Production Impact |
|---|---|---|---|
| FR-48-01 | **READY_WITH_MINOR_ISSUES** | `PublicNewsPage.tsx` — Tabs: Tin tức, Cảnh báo ATTP, Phân tích nguy cơ. Backend `PublicContentAppService` returns published-only items. F-033 VERIFIED (prior branch) | None |
| FR-48-02 | **READY_WITH_MINOR_ISSUES** | Keyword search + date filter in PublicNewsPage; same | None |
| FR-48-03 | **READY_WITH_MINOR_ISSUES** | `CitizenAlertReportAppService.CreateAsync` — anonymous POST, Captcha middleware, creates `Draft` alert with `AlertSource.PublicReport`. FE: `CitizenNewsReportPage.tsx`. F-033 VERIFIED (prior branch). **Note**: moderation queue in admin Alerts module (FR-29-06) — works but not a dedicated moderation UI | Medium — moderation workflow UX needs validation |

### STT 49 — Tra cứu văn bản pháp quy (công khai)

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-49-01 | **READY_WITH_MINOR_ISSUES** | `PublicDocumentsPage.tsx` + public backend endpoint returning published documents; F-033 VERIFIED (prior branch) |
| FR-49-02 | **READY_WITH_MINOR_ISSUES** | Document detail view in public page; same |

---

## Group F — Tích hợp và chia sẻ dữ liệu (STT 50–57)

### STT 50 — Quản lý đặc tả API

BE: `ApiEndpointAppService` + `ApiEndpointExcelAppService`. FE: data-integration endpoints tab.  
Runtime: `data-integration-verification.spec.ts` F-019 VERIFIED.

| Req ID | Status | Remaining Issue |
|---|---|---|
| FR-50-01..04 | **READY_FOR_PRODUCTION** | CRUD + permission-gated; F-019 VERIFIED |
| FR-50-05 | **READY_WITH_MINOR_ISSUES** | `TestConnectionAsync` added `0eba6b6` — HEAD probe records latency in `ApiCallLog`. FE "Test" button. Endpoint metadata only; **no machine-readable OpenAPI spec for partners** |
| FR-50-06 | **READY_FOR_PRODUCTION** | Toggle status + excel export; F-019 VERIFIED |

### STT 51–57 — Lịch sử nhận/chia sẻ dữ liệu (7 data types)

BE: `DataSharingAppService.ShareAsync` (`DataIntegration/DataSharingAppService.cs`) — generic outbound HTTP sender that sends JSON payload to configured `ApiEndpoint.Url` and records result in `di_api_call_logs` with `DataType` discriminator.  
FE: Per-type history tabs in data-integration module; share action buttons.

| Sub-item | Status | Evidence | Remaining Issue |
|---|---|---|---|
| (a) Xem lịch sử nhận | **READY_WITH_MINOR_ISSUES** | Viewer over `di_api_call_logs` filtered by DataType; logs now written by `ShareAsync`. Code-verified | Inbound partner calls still produce no logs (no inbound partner endpoint) |
| (b) Gửi / chia sẻ dữ liệu | **READY_WITH_MINOR_ISSUES** | `DataSharingAppService.ShareAsync` added `88d46a5`; sends JSON envelope to partner URL; records log. Code-verified | Generic envelope only; **no TT 31/2026 protocol compliance**; no partner auth issuance |
| (c) Xem chi tiết lịch sử | **READY_WITH_MINOR_ISSUES** | Detail view in FE for log records; code-verified | Same as (a) |
| (d) Tìm kiếm lịch sử | **READY_WITH_MINOR_ISSUES** | Filter UI for call logs; code-verified | Same as (a) |

> **Critical gap** (applies to all STT 51-57): The data-sharing engine is a generic HTTP POST sender. It does **not** implement TT 31/2026/TT-BCT protocol compliance, partner credential issuance (username/password/API address per §2.4), or inbound partner endpoints. MoH/Sở NN/Sở CT connectivity (INT-01..03) remains NOT_IMPLEMENTED.

---

## Integration Requirements (INT-01..05)

| ID | Requirement | Status | Evidence | Remaining Issue | Production Impact |
|---|---|---|---|---|---|
| INT-01 | Kết nối Bộ Y tế (MoH) | **NOT_IMPLEMENTED** | `DataSharingAppService` is generic; no MoH-specific connector | MoH endpoint URL + auth must be implemented per TT 31/2026 | High — contractual obligation |
| INT-02 | Tuân thủ TT 31/2026 + NĐ 37/2026 | **NOT_IMPLEMENTED** | Generic JSON envelope; no protocol compliance work | Protocol-specific implementation required | High |
| INT-03 | Tài khoản đối tác + phiên API (Sở NN, Sở CT) | **NOT_IMPLEMENTED** | No partner auth issuance (API key, token, credentials per §2.4) | Partner credential management system missing | High |
| INT-04 | Tài liệu đặc tả API (machine-readable) | **PARTIAL** | Endpoint CRUD metadata only; no OpenAPI partner-facing spec | Partner-facing spec document missing | Medium |
| INT-05 | Lưu lịch sử chia sẻ dữ liệu | **PARTIAL** | Table + viewer exist; `DataSharingAppService` now writes logs for outbound calls; inbound logs absent | Inbound partner call logs missing | Medium |

---

## Performance Requirements (NFR-01..06)

BE: Redis session + connection pooling + async EF queries. Load test: `scripts/load-test.k6.js`, k6 Docker, 30 VUs / 2 min.

| ID | Requirement | Status | Evidence | Remaining Issue | Production Impact |
|---|---|---|---|---|---|
| NFR-01 | Phản hồi trung bình < 10s | **READY_WITH_MINOR_ISSUES** | `docs/testing/05-load-test-results.md`: avg 31ms, p95 42ms on dev hardware | Load test on production hardware pending | Medium — test environment differs from production |
| NFR-02 | Phản hồi chậm nhất < 30s | **READY_WITH_MINOR_ISSUES** | Max 418ms on dev hardware | Production test pending | Medium |
| NFR-03 | CPU CSDL ≤ 75% | **READY_WITH_MINOR_ISSUES** | Postgres avg ~20% under 30 VUs on dev | Production monitoring pending | Medium |
| NFR-04 | CPU ứng dụng ≤ 75% | **READY_WITH_MINOR_ISSUES** | API avg ~54% under 30 VUs on dev (peak 77.8% at one sample) | One sample exceeded 75%; production monitoring required | Medium |
| NFR-05 | ≥ 30 người dùng đồng thời | **READY_WITH_MINOR_ISSUES** | 30 VUs held for 2 min; 0% fail rate | Production test pending | Medium |
| NFR-06 | Người dùng hoạt động đồng thời ≥ 5 | **READY_WITH_MINOR_ISSUES** | 30 active VUs with think-time; passes | Production test pending | Low |

---

## IPv6 / HTTPS Requirements (IPV-01..06)

| ID | Requirement | Status | Evidence | Remaining Issue | Production Impact |
|---|---|---|---|---|---|
| IPV-01 | Phần mềm hỗ trợ IPv6 | **PARTIAL** | Kestrel `http://+:8080` binds IPv6; nginx config IPv4-only | nginx lacks `listen [::]:80` directive | High |
| IPV-02 | ISP cung cấp kết nối IPv6 | **BLOCKED** | Deployment/ISP obligation | ISP + network team | High (ops) |
| IPV-03 | Web server lắng nghe IPv6 | **PARTIAL** | nginx lacks `[::]:80`; docker-compose subnet IPv4-only | nginx config update + compose subnet | High |
| IPV-04 | Bản ghi AAAA DNS | **NOT_IMPLEMENTED** | Not provisioned | DNS hosting obligation | High (ops) |
| IPV-05 | IPv6 DNS / DNSSEC | **NOT_IMPLEMENTED** | Not addressed | DNS ops obligation | High (ops) |
| IPV-06 | HTTPS + TLS ≥ 1.2 | **PARTIAL** | HSTS + Secure cookies + HTTPS redirect in prod mode; TLS certificate not provisioned; no reverse proxy TLS termination in delivered docker-compose | TLS cert + nginx SSL config | High |

---

## Application Security Requirements (SEC-01..25)

| ID | Requirement | Status | Evidence | Remaining Issue |
|---|---|---|---|---|
| SEC-01 | Tên đăng nhập duy nhất; chỉ chữ cái/số/gạch dưới | **IMPLEMENTED_NOT_ACCEPTABLE** | ABP Identity enforces unique usernames. **However, usernames are set to email addresses (`user@domain.vn`) at account creation**, violating the PDF's explicit charset rule (letters, digits, underscore only). | Policy conflict must be resolved: either restrict usernames or accept email-as-username and document the deviation |
| SEC-02 | Mật khẩu tối thiểu 8 ký tự | **READY_FOR_PRODUCTION** | `IdentityOptions.Password.RequiredLength = 8`; F-002 VERIFIED | None |
| SEC-03 | Mật khẩu phức tạp | **READY_FOR_PRODUCTION** | digit + lower + upper + special; F-002 VERIFIED | None |
| SEC-04 | Hết hạn 90 ngày + không tái sử dụng | **READY_FOR_PRODUCTION** | `PasswordValidity 90d` + `PasswordHistory` + `EnsurePasswordIsNotReused`; F-002 VERIFIED | None |
| SEC-05 | Link đặt lại mật khẩu: 1 lần / 8 giờ | **READY_WITH_MINOR_ISSUES** | ABP tokens single-use ✓; 8h lifetime not explicitly configured or verified | Confirm `DataProtection` token lifetime = 8h |
| SEC-06 | Mật khẩu ngẫu nhiên gửi email | **READY_WITH_MINOR_ISSUES** | Link-based reset used as primary; `GenerateRandomPasswordAsync` added `fcb4f82` for admin-visible generation | Emailed random password path not runtime-tested |
| SEC-07 | Hash + salt mật khẩu | **READY_FOR_PRODUCTION** | ASP.NET Identity PBKDF2 (exceeds SHA-256+salt); F-001 VERIFIED | None |
| SEC-08 | CAPTCHA đăng nhập + chức năng quan trọng | **READY_WITH_MINOR_ISSUES** | Turnstile on login + initial password change + citizen submissions (server-verified middleware). Other mutations do not have CAPTCHA | Define "important functions" scope; pentest for bypass |
| SEC-09 | Dữ liệu nhạy cảm qua POST, không URL | **READY_FOR_PRODUCTION** | Login POST; username removed from query strings; F-001 VERIFIED | None |
| SEC-10 | Session timeout | **READY_FOR_PRODUCTION** | 30-min sliding cookie; F-001 VERIFIED | None |
| SEC-11 | Phiên mới khi đăng nhập / hủy khi đăng xuất | **READY_WITH_MINOR_ISSUES** | Framework behavior; not explicitly runtime-tested | Add session-token lifecycle test |
| SEC-12 | HttpOnly + Secure cookie | **READY_FOR_PRODUCTION** | SameSite=Strict, Secure=Always (prod); F-001 VERIFIED | None |
| SEC-13 | CSRF token | **READY_FOR_PRODUCTION** | XSRF-TOKEN → RequestVerificationToken; F-001 VERIFIED | None |
| SEC-14 | Phân quyền UI theo vai trò | **READY_FOR_PRODUCTION** | `PermissionRoute` + menu filter; F-020 VERIFIED | None |
| SEC-15 | Server kiểm tra quyền mỗi request | **READY_FOR_PRODUCTION** | 107 permissions, `[Authorize]` on all business services; verified via all feature specs | None |
| SEC-16 | Server lọc dữ liệu theo phạm vi mỗi request | **READY_FOR_PRODUCTION** | 27 scoped services; verified via all feature specs | None |
| SEC-17 | Quyền lưu phía server, không tin client | **READY_FOR_PRODUCTION** | Scope from `AppUserProfile/ManagementScopeAssignment`; F-003 VERIFIED | None |
| SEC-18 | Validate đầu vào phía server | **READY_WITH_MINOR_ISSUES** | DTO annotations + domain guards + import preview; coverage uneven across all DTOs | Audit remaining DTO validators |
| SEC-19 | XSS output encoding | **READY_WITH_MINOR_ISSUES** | React auto-escaping + CSP; no raw HTML from user input found; not formally pentested | Penetration test required before production |
| SEC-20 | Response-splitting filter | **READY_WITH_MINOR_ISSUES** | ASP.NET header validation (framework default); no explicit test | Add header-injection test |
| SEC-21 | Không lưu dữ liệu nhạy cảm trong cookie | **READY_FOR_PRODUCTION** | Session id only; F-001 VERIFIED | None |
| SEC-22 | Whitelist redirect | **READY_WITH_MINOR_ISSUES** | SPA-internal redirects only; ABP account flows not formally audited | Redirect audit |
| SEC-23 | XML an toàn | **READY_WITH_MINOR_ISSUES** | No XML processing surface found (safe parsers by default) | Formal XML security audit absent |
| SEC-24 | Thông báo lỗi chung | **READY_WITH_MINOR_ISSUES** | ABP exception → localized codes; not verified for info leakage | Info-leakage audit |
| SEC-25 | Log lỗi ngoài webroot, không nhạy cảm | **READY_WITH_MINOR_ISSUES** | Container stdout logging; no log-content audit | Log audit for sensitive data |

---

## Database Security Requirements (DBS-01..10)

| ID | Requirement | Status | Remaining Issue | Production Impact |
|---|---|---|---|---|
| DBS-01 | Cài CSDL an toàn, vá lỗi thường xuyên | **PARTIAL** | `postgres:15-alpine` used; no patch schedule documented | Patch process must be established | Medium |
| DBS-02 | Sao lưu CSDL | **PARTIAL** | PostgreSQL backup-capable; no backup scripts or schedule | Backup scripts + automated schedule required | **High** |
| DBS-03 | Phục hồi CSDL | **PARTIAL** | Restore-capable; no rehearsal | Restore procedure and rehearsal needed | **High** |
| DBS-04 | Tài khoản ứng dụng least-privilege | **PARTIAL** | Single `foodsafe` DB owner account; not split into read/write/admin | Create least-privilege application account | High |
| DBS-05 | Dịch vụ CSDL không dùng tài khoản OS admin | **PARTIAL** | Container non-OS-admin; Dockerfile uses non-root for app | Verify PostgreSQL runs as non-root in container | Low |
| DBS-06 | Mã hóa thông tin đăng nhập CSDL | **PARTIAL** | Tracked `appsettings.json` now carries no credentials (blank + fail-fast); local dev uses gitignored `.env`. **The dev password `FoodSafe@Dev2026!` is still in git history** (pre-`06656c8` commits); must purge before production. Connection string not encrypted at rest. | **Purge git history** (`git filter-repo`) + rotate credentials + implement credential encryption | **Critical** |
| DBS-07 | Ghi nhật ký đăng nhập CSDL | **PARTIAL** | No pgaudit or `pg_log` login audit configuration | Configure `log_connections = on`, `log_disconnections = on` | Medium |
| DBS-08 | Hạn chế IP kết nối CSDL | **PARTIAL** | Docker network isolation; no `pg_hba.conf` IP policy | Configure pg_hba IP whitelist | Medium |
| DBS-09 | Mã hóa CSDL at rest; data masking; privileged access control | **PARTIAL** | No at-rest encryption, no column masking, no privileged-user controls in delivered config | pgCrypto or full-disk encryption + redaction rules required for Level 2 | High |
| DBS-10 | Database Activity Monitoring / Firewall | **NOT_IMPLEMENTED** | No third-party DAM/firewall product in delivery scope | External product procurement required | Medium (ops) |

---

## UI/UX Requirements (UI-01..10)

| ID | Status | Remaining Issue |
|---|---|---|
| UI-01 | **READY_WITH_MINOR_ISSUES** | AntD default fonts; TT 39/2017 compliance not formally assessed |
| UI-02 | **READY_FOR_PRODUCTION** | Full Vietnamese Unicode throughout; all feature specs pass |
| UI-03 | **READY_WITH_MINOR_ISSUES** | Flat navigation menu; ≤ 3 clicks plausible but not formally measured |
| UI-04 | **READY_WITH_MINOR_ISSUES** | AntD keyboard defaults; consistency not audited |
| UI-05 | **READY_WITH_MINOR_ISSUES** | Most required fields show asterisk; not uniformly verified |
| UI-06 | **READY_FOR_PRODUCTION** | Responsive web; Chromium verified in all specs |
| UI-07 | **READY_WITH_MINOR_ISSUES** | vi error codes; user-vs-system distinction partial |
| UI-08 | **READY_WITH_MINOR_ISSUES** | AntD Spin used; not uniformly audited across all screens |
| UI-09 | **READY_WITH_MINOR_ISSUES** | Standard AntD loading/empty/error; some states unaudited |
| UI-10 | **PARTIAL** | TT 39/2017 content standard not formally assessed |

---

## Data Tolerance Requirements (DT-01..12)

| ID | Status | Remaining Issue |
|---|---|---|
| DT-01 | **READY_WITH_MINOR_ISSUES** | dayjs dd/mm/yyyy; not uniformly enforced across all date inputs |
| DT-02 | **READY_WITH_MINOR_ISSUES** | `numeric(18,2)` for fines; 15-digit VND max not formally proven |
| DT-03 | **READY_WITH_MINOR_ISSUES** | Standard AntD numeric inputs; not universally verified |
| DT-04 | **READY_WITH_MINOR_ISSUES** | Excel import preview validation ✓; not all entity types with import covered |
| DT-05 | **READY_FOR_PRODUCTION** | Extensive FK/CHECK/UNIQUE constraints; verified via all feature specs |
| DT-06 | **READY_WITH_MINOR_ISSUES** | DTO annotations + domain guards; depth uneven |
| DT-07 | **READY_WITH_MINOR_ISSUES** | AntD required marks on most forms; not uniformly audited |
| DT-08 | **READY_WITH_MINOR_ISSUES** | Typed inputs throughout; action-month date-range format validation fixed `0eba6b6` (dd/MM/yyyy – dd/MM/yyyy regex enforced BE + FE). Code-verified |
| DT-09 | **READY_WITH_MINOR_ISSUES** | AntD tab order defaults; consistency not audited |
| DT-10 | **PARTIAL** | Standard AntD selects ✓; Documents feature still uses hard-coded type list instead of catalog dropdown |
| DT-11 | **READY_FOR_PRODUCTION** | CI + lint + format + warnaserror; verified across all runs |
| DT-12 | **PARTIAL** | TT 39/2017 file-format compliance not assessed |

---

## Technology Requirements (TECH-01..05)

| ID | Status | Evidence |
|---|---|---|
| TECH-01 | **READY_FOR_PRODUCTION** | Linux Docker containers; all feature specs verified |
| TECH-02 | **READY_FOR_PRODUCTION** | PostgreSQL 15 used throughout all specs |
| TECH-03 | **READY_FOR_PRODUCTION** | .NET 9 + React 19; verified in all specs |
| TECH-04 | **READY_WITH_MINOR_ISSUES** | REST/OpenAPI exists; partner-facing spec missing |
| TECH-05 | **READY_WITH_MINOR_ISSUES** | Playwright runs Chromium only; Edge/Firefox not tested |

---

## Level-2 Information Security (L2-01)

| ID | Status | Remaining Issue | Production Impact |
|---|---|---|---|
| L2-01 | **PARTIAL** | Many Level-2 technical controls delivered (authn/authz/audit/captcha/lockout/CSRF/HTTPS-ready). Missing: (1) formal security-level dossier (hồ sơ đề xuất cấp độ 2 per NĐ 85/2016); (2) DBS monitoring gaps above; (3) penetration test evidence; (4) approval record from competent authority | **Dossier + approval required before production per NĐ 85/2016/NĐ-CP** | **Critical** |

---

## Non-Software Deliverables

| Category | ID | Status |
|---|---|---|
| Support | SUP-01..04 | NON_SOFTWARE — contractual service obligation; not in repository |
| Training | TRN-01 | NON_SOFTWARE — not started; 1-day class, 120 users |
| Data ownership | OWN-01..04 | NON_SOFTWARE — contractual obligation |
| Handover | HND-01..02 | NON_SOFTWARE — not started |
| Acceptance | ACC-01..04, 06 | NON_SOFTWARE — formal acceptance process not started |
| Acceptance | ACC-05 | **PARTIAL** — ops/dev docs exist in `docs/`; **no end-user manual (HDSD), no admin manual** per §5 acceptance requirements |

---

## Summary Table

| Status | FR items (of 372) | Non-FR software (of 80) | Total (of 452) | % of 452 |
|---|---|---|---|---|
| **READY_FOR_PRODUCTION** | ~225 | ~15 | **~240** | **~53%** |
| **READY_WITH_MINOR_ISSUES** | ~110 | ~35 | **~145** | **~32%** |
| **IMPLEMENTED_NOT_ACCEPTABLE** | 2 (FR-LIC-01, SEC-01) | 0 | **2** | **0.4%** |
| **PARTIAL** | 3 (FR-38-03/04, DT-10) | ~15 (DBS, UI, DT, INT) | **~18** | **~4%** |
| **NOT_IMPLEMENTED** | 0 | ~7 (INT-01..03, IPV-02/04/05, DBS-10) | **~7** | **~1.5%** |
| **BLOCKED** | 0 | 3 (IPV-02/04/05 — ISP/DNS ops) | **3** | **~0.6%** |
| **NON_SOFTWARE** | — | — | **17** | (separate) |
| **Grand software total** | 372 | 80 | **452** | — |

**Honest software completion percentage**: ~85% of 452 software-assessable items have a working implementation at HEAD (READY_FOR_PRODUCTION + READY_WITH_MINOR_ISSUES + IMPLEMENTED_NOT_ACCEPTABLE). Items marked READY_WITH_MINOR_ISSUES (~32%) are code-verified from actual source inspection but lack post-batch Playwright E2E verification at the registered commit level.

**Runtime-verified (READY_FOR_PRODUCTION only)**: ~53% — unchanged from prior batch for items that were already VERIFIED_RUNTIME; the new batch significantly raised code-verified coverage but the feature registry was not updated with new verified commits.

---

## Top 10 Production-Blocking Gaps

Ranked by production impact severity:

| # | STT / Req | Gap | Effort to Fix | Blocks |
|---|---|---|---|---|
| P1 | **DBS-06 / SEC** | Dev password `FoodSafe@Dev2026!` persists in git commit history (pre-`06656c8`). Must run `git filter-repo` to purge, rotate credentials in all environments, and implement connection-string encryption at rest. | S | Production deployment |
| P2 | **INT-01..03 / STT 51-57** | Data integration engine is a generic HTTP POST sender. No TT 31/2026 protocol compliance, no partner auth credential issuance (username/password/API address), no MoH/Sở NN/Sở CT specific connectors, no inbound partner endpoints. The PDF §2.4 requirement for functional data exchange with 3 external systems is unmet. | XL | Contract acceptance |
| P3 | **IPV-01/03/06** | nginx lacks `listen [::]:80` directive; docker-compose IPv4-only; TLS certificates not provisioned. Level-2 InfoSec requires HTTPS and IPv6. | S (software) + ops | Level-2 certification |
| P4 | **L2-01** | No security-level dossier (hồ sơ đề xuất cấp độ 2) prepared per NĐ 85/2016/NĐ-CP + TT 12/2022/TT-BTTTT. Technical controls exist but formal approval record is absent. | M (process) | Legal compliance |
| P5 | **DBS-02/03** | No backup scripts, no scheduled backup policy, no restore rehearsal. PostgreSQL is backup-capable but no delivery evidence. | S | Production reliability |
| P6 | **FR-LIC-01** | `CertificatePdfAppService` generates PDF using QuestPDF (functional), but layout is not the prescribed NĐ 15/2018/NĐ-CP circular decree form (ministry letterhead, stamp placement, form number). Customer acceptance committee may reject. | M | Contract acceptance |
| P7 | **SEC-01** | Usernames are email addresses (containing `@` and `.`), violating the PDF's explicit rule: "chỉ chữ cái, chữ số, gạch dưới". Must either enforce separate username field or obtain customer waiver. | S | InfoSec compliance |
| P8 | **FR-38-03/04** | Documents feature (STT 38) uses a hard-coded 8-value document type list. STT 18 catalog ("Danh mục loại văn bản") exists and is maintained but never consumed by the documents module. Creates an inconsistency visible to users. | XS | Functional correctness |
| P9 | **ACC-05** | No end-user manual (HDSD) or administrator manual for formal system acceptance per §5 of the PDF contract. Developer/ops documentation exists in `docs/` but is not user-facing. | M | Formal acceptance |
| P10 | **READY_WITH_MINOR_ISSUES items — no post-batch registry update** | ~145 items implemented in `8fe0320..fe3dbd2` have not been stamped with verified commits in the feature registry. Commit `0eba6b6` claims 235/235 Playwright pass but this must be confirmed with a re-stamped registry before staging sign-off. Specifically: STT 4 (system settings), STT 33-35 (auto-calc + roll-up), STT 39 (compliance widgets), STT 40 (statistics exports), STT 41-49 (full public portal), STT 51-57 (data sharing) need post-batch E2E runs. | L | Staging → production handover |

---

*Audit committed: 2026-07-27 · HEAD: `fe3dbd2` · Auditor: Independent Principal Software Auditor*  
*Sources: PDF YCKT (42 pp.), docs/audit/61..68, docs/testing/01/04, actual code inspection at HEAD*
