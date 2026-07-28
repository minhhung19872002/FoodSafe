# FoodSafe — Route Inventory

Source of truth: `FoodSafe.FE/src/app/router.tsx` (audited 2026-07-28, branch `feat/integration-completion`).
45 concrete routes + authenticated catch-all 404. Base URL (local compose): `http://127.0.0.1:8080`.

## 1. Public portal (anonymous)

| # | Path | Page component | Menu label / purpose |
|---|---|---|---|
| 1 | `/cong-thong-tin` | PublicPortalHomePage | Public portal home |
| 2 | `/tra-cuu-chung` | PublicGeneralSearchPage | General public search |
| 3 | `/tra-cuu-giay-phep` | PublicCertificateSearchPage | Certificate/license search |
| 4 | `/co-so-bi-canh-bao` | PublicWarnedBusinessesPage | Warned businesses list |
| 5 | `/tin-tuc` | PublicNewsPage | Public news list |
| 6 | `/tin-tuc/:id` | PublicNewsPage | News detail (same component) |
| 7 | `/tra-cuu-van-ban` | PublicDocumentsPage | Legal document lookup |
| 8 | `/gui-phan-anh` | CitizenAlertReportPage | Citizen incident report form |
| 9 | `/gui-tin` | CitizenNewsReportPage | Citizen news submission form |

## 2. Public certificate lookups (anonymous)

| # | Path | Page component |
|---|---|---|
| 10 | `/tra-cuu-giay-du-dieu-kien` | PublicEligibilityCertificateLookupPage |
| 11 | `/tra-cuu-cfs` | PublicCfsCertificateLookupPage |
| 12 | `/tra-cuu-gcn-xuat-khau` | PublicExportFoodCertificateLookupPage |
| 13 | `/tra-cuu-dang-ky-cong-bo` | PublicProductRegistrationLookupPage |
| 14 | `/tra-cuu-co-so` | PublicBusinessLookupPage |
| 15 | `/tra-cuu-tu-cong-bo` | PublicSelfDeclarationLookupPage |
| 16 | `/tra-cuu-dang-ky-quang-cao` | PublicAdRegistrationLookupPage |

## 3. Account / auth (anonymous)

| # | Path | Page component |
|---|---|---|
| 17 | `/login` | LoginPage (Turnstile CAPTCHA) |
| 18 | `/account/forgot-password` | ForgotPasswordPage |
| 19 | `/account/reset-password` | ResetPasswordPage |
| 20 | `/account/complete-password-change` | CompleteInitialPasswordChangePage |

## 4. Authenticated app (inside `PrivateRoute` + `AppLayout`)

| # | Path | Page component | Required permission (`PermissionRoute`) | Sidebar group |
|---|---|---|---|---|
| 21 | `/` → `/dashboard` | DashboardPage | — (login only) | Tổng quan |
| 22 | `/statistics` | StatisticsPage | **none — not permission-gated** | Tổng quan |
| 23 | `/businesses` | BusinessManagementPage | BusinessManagement.Businesses.View ∨ Products.View | Cơ sở & giấy phép |
| 24 | `/self-declarations` | SelfDeclarationPage | BusinessManagement.SelfDeclarations.View | Cơ sở & giấy phép |
| 25 | `/product-registrations` | ProductRegistrationPage | Licensing.ProductRegistrations.View | Cơ sở & giấy phép |
| 26 | `/advertisement-registrations` | AdvertisementRegistrationPage | Licensing.AdRegistrations.View | Cơ sở & giấy phép |
| 27 | `/eligibility-certificates` | EligibilityCertificatePage | Licensing.EligibilityCertificates.View | Cơ sở & giấy phép |
| 28 | `/cfs-certificates` | CfsCertificatePage | Licensing.CfsCertificates.View | Cơ sở & giấy phép |
| 29 | `/export-food-certificates` | ExportFoodCertificatePage | Licensing.ExportCertificates.View | Cơ sở & giấy phép |
| 30 | `/inspection` | InspectionPage | Inspection.Plans.View ∨ Results.View | Nghiệp vụ |
| 31 | `/food-poisoning` | FoodPoisoningPage | FoodPoisoning.Cases.View (route) / Cases.View ∨ Incidents.View (menu) | Nghiệp vụ |
| 32 | `/alerts-news` | AlertsNewsPage | AlertsAndTesting.Alerts.View ∨ News.View | Nghiệp vụ |
| 33 | `/risk-analysis` | RiskAnalysisPage | AlertsAndTesting.RiskAnalyses.View | Nghiệp vụ |
| 34 | `/testing-results` | TestingResultsPage | AlertsAndTesting.TestingResults.View | Nghiệp vụ |
| 35 | `/documents` | DocumentsPage | AlertsAndTesting.Documents.View | Nghiệp vụ |
| 36 | `/reporting` | ReportingPage | Reporting.NdtpReports.View (route) / + AtpWork, ActionMonth (menu) | Nghiệp vụ |
| 37 | `/administration/identity` | IdentityAdministrationPage | FoodSafe.SystemAdmin | Quản trị hệ thống |
| 38 | `/organizations` | OrganizationListPage | Organizations.View | Quản trị hệ thống |
| 39 | `/geography` | GeographicCatalogPage | GeographicCatalogs.View | Quản trị hệ thống |
| 40 | `/catalogs` | MasterCatalogPage | Catalogs.View | Quản trị hệ thống |
| 41 | `/data-integration` | DataIntegrationPage | DataIntegration.ApiEndpoints.View ∨ CallHistory.View | Quản trị hệ thống |
| 42 | `/administration/audit-logs` | AuditLogPage | SystemAdmin.AuditLogs | Quản trị hệ thống |
| 43 | `/administration/settings` | SystemSettingsPage | SystemAdmin.Settings | Quản trị hệ thống |
| 44 | `/account/change-password` | ChangePasswordPage | — (login only) | user dropdown |
| 45 | `/account/profile` | ProfilePage | — (login only) | user dropdown |
| 46 | `*` (e.g. `/khong-ton-tai`) | NotFoundPage | — renders inside AppLayout for logged-in users; anonymous users are bounced to `/login` | — |

## Static-analysis observations feeding the audit

- **`/statistics` is the only business page without a `PermissionRoute`** and its menu entry has no `permission` key — every authenticated account (including `noperm`) can open it; whether its APIs 403-and-degrade gracefully is probed in `user-flow.spec.ts`.
- Menu↔route permission drift: `/food-poisoning` menu shows for `Incidents.View` but the route only accepts `Cases.View`; `/reporting` menu shows for AtpWork/ActionMonth report permissions but the route demands `NdtpReports.View` specifically. A user holding only the "menu" permission would see the entry and land on a 403 — probed with the role accounts.
- The 403 `Result` action button uses `href="/"` (full page reload) instead of client-side navigation — cosmetic, verified in role flows.
- Fixture accounts and roles: see `test-plan.md` §1.
