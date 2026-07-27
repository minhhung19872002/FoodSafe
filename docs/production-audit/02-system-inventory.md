# System Inventory — FoodSafe Production Readiness Audit

**Audit commit:** fe3dbd2  
**Inventory date:** 2026-07-27  
**Auditor:** Phase 2 — complete system inventory derived from source code only

---

## 1. Frontend (FoodSafe.FE/src)

### 1.1 Router — All Defined Routes

Source: `FoodSafe.FE/src/app/router.tsx`

| Route path | Component | Access | Notes |
|---|---|---|---|
| `/cong-thong-tin` | `PublicPortalHomePage` | Anonymous | Portal home with 12 lookup cards |
| `/tra-cuu-chung` | `PublicGeneralSearchPage` | Anonymous | General cross-entity search |
| `/tra-cuu-giay-phep` | `PublicCertificateSearchPage` | Anonymous | Certificate search across 6 types |
| `/co-so-bi-canh-bao` | `PublicWarnedBusinessesPage` | Anonymous | Warned businesses list |
| `/tin-tuc` | `PublicNewsPage` | Anonymous | Public news list |
| `/tin-tuc/:id` | `PublicNewsPage` | Anonymous | News detail (same component, param) |
| `/tra-cuu-van-ban` | `PublicDocumentsPage` | Anonymous | Administrative documents search |
| `/gui-phan-anh` | `CitizenAlertReportPage` | Anonymous | Citizen alert report form |
| `/gui-tin` | `CitizenNewsReportPage` | Anonymous | Citizen news tip form |
| `/tra-cuu-giay-du-dieu-kien` | `PublicEligibilityCertificateLookupPage` | Anonymous | Eligibility cert public lookup |
| `/tra-cuu-cfs` | `PublicCfsCertificateLookupPage` | Anonymous | CFS cert public lookup |
| `/tra-cuu-gcn-xuat-khau` | `PublicExportFoodCertificateLookupPage` | Anonymous | Export cert public lookup |
| `/tra-cuu-dang-ky-cong-bo` | `PublicProductRegistrationLookupPage` | Anonymous | Product registration lookup |
| `/tra-cuu-co-so` | `PublicBusinessLookupPage` | Anonymous | Business lookup |
| `/tra-cuu-tu-cong-bo` | `PublicSelfDeclarationLookupPage` | Anonymous | Self-declaration lookup |
| `/tra-cuu-dang-ky-quang-cao` | `PublicAdRegistrationLookupPage` | Anonymous | Ad registration lookup |
| `/login` | `LoginPage` | Anonymous | Login with CAPTCHA (Turnstile) |
| `/account/forgot-password` | `ForgotPasswordPage` | Anonymous | Password recovery request |
| `/account/reset-password` | `ResetPasswordPage` | Anonymous | Password reset via token |
| `/account/complete-password-change` | `CompleteInitialPasswordChangePage` | Anonymous | First-login password change |
| `/dashboard` | `DashboardPage` | Authenticated | KPI cards + compliance table |
| `/organizations` | `OrganizationListPage` | `Organizations.View` | 3-level org tree |
| `/geography` | `GeographicCatalogPage` | `GeographicCatalogs.View` | Country/Region/Province/District/Commune |
| `/businesses` | `BusinessManagementPage` | `Businesses.View OR Products.View` | Business + product management |
| `/self-declarations` | `SelfDeclarationPage` | `SelfDeclarations.View` | Self-declaration CRUD |
| `/product-registrations` | `ProductRegistrationPage` | `ProductRegistrations.View` | Product registration CRUD |
| `/advertisement-registrations` | `AdvertisementRegistrationPage` | `AdRegistrations.View` | Ad registration CRUD |
| `/eligibility-certificates` | `EligibilityCertificatePage` | `EligibilityCertificates.View` | Eligibility cert CRUD |
| `/cfs-certificates` | `CfsCertificatePage` | `CfsCertificates.View` | CFS cert CRUD |
| `/export-food-certificates` | `ExportFoodCertificatePage` | `ExportCertificates.View` | Export food cert CRUD |
| `/inspection` | `InspectionPage` | `Inspection.Plans.View` | Inspection plans + results |
| `/alerts-news` | `AlertsNewsPage` | `AlertsAndTesting.Alerts.View` | Alerts + news tabs |
| `/food-poisoning` | `FoodPoisoningPage` | `FoodPoisoning.Cases.View` | Cases + incidents + map |
| `/reporting` | `ReportingPage` | `Reporting.NdtpReports.View` | 3 report types, full workflow |
| `/risk-analysis` | `RiskAnalysisPage` | `AlertsAndTesting.RiskAnalyses.View` | Risk analysis CRUD + publish |
| `/testing-results` | `TestingResultsPage` | `AlertsAndTesting.TestingResults.View` | Testing results CRUD |
| `/documents` | `DocumentsPage` | `AlertsAndTesting.Documents.View` | Admin documents CRUD |
| `/data-integration` | `DataIntegrationPage` | `DataIntegration.ApiEndpoints.View` | API endpoints + call log |
| `/statistics` | `StatisticsPage` | Authenticated (no perm gate) | Charts + map + report stats |
| `/catalogs` | `MasterCatalogPage` | `Catalogs.View` | Master catalog management |
| `/administration/audit-logs` | `AuditLogPage` | `SystemAdmin.AuditLogs` | ABP audit log viewer |
| `/administration/settings` | `SystemSettingsPage` | `SystemAdmin.Settings` | System settings + branding |
| `/administration/identity` | `IdentityAdministrationPage` | `SystemAdmin` | Users + roles management |
| `/account/change-password` | `ChangePasswordPage` | Authenticated | Change own password |
| `/account/profile` | `ProfilePage` | Authenticated | Profile + avatar |

**Total routes:** 45 (10 public portal, 7 public lookup, 4 auth/account, 24 authenticated admin)

**Route index redirect:** `/` → `/dashboard`

### 1.2 Feature Folders and Components

| Feature | Pages | Components | API hooks | Has api/ | Tests (unit) | E2E specs |
|---|---|---|---|---|---|---|
| `advertisement-registrations` | `AdvertisementRegistrationPage`, `PublicAdRegistrationLookupPage` | `AdvertisementRegistrationEditorModal` | Yes | Yes | 3 | 2 |
| `alerts-news` | `AlertsNewsPage` | `AlertEditorModal`, `NewsEditorModal` | Yes | Yes | 2 | 2 |
| `audit-logs` | `AuditLogPage` | `AuditLogDetailDrawer` | Yes | Yes | 1 | 2 |
| `auth` | `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `CompleteInitialPasswordChangePage`, `ChangePasswordPage`, `ProfilePage` | `CaptchaWidget` | Yes | Yes | 7 | 2 |
| `businesses` | `BusinessManagementPage`, `PublicBusinessLookupPage`, `PublicSelfDeclarationLookupPage` | `BusinessDetailDrawer`, `BusinessEditorModal`, `BusinessHandlersModal`, `BusinessImportModal`, `BusinessLocationMap`, `BusinessManagementView`, `MapPicker`, `ProductAttachmentsModal`, `ProductEditorModal` | Yes | Yes | 4 | 2 |
| `catalogs` | `MasterCatalogPage` | `CatalogEditorModal`, `MasterCatalogView` | Yes | Yes | 2 | 2 |
| `cfs-certificates` | `CfsCertificatePage`, `PublicCfsCertificateLookupPage` | `CfsCertificateEditorModal` | Yes | Yes | 3 | 2 |
| `dashboard` | `DashboardPage` | — | Yes | Yes | 1 | 2 |
| `data-integration` | `DataIntegrationPage` | — | Yes | Yes | 2 | 2 |
| `documents` | `DocumentsPage` | `DocumentAttachmentsModal` | Yes | Yes | 2 | 2 |
| `eligibility-certificates` | `EligibilityCertificatePage`, `PublicEligibilityCertificateLookupPage` | `EligibilityCertificateEditorModal` | Yes | Yes | 3 | 2 |
| `export-food-certificates` | `ExportFoodCertificatePage`, `PublicExportFoodCertificateLookupPage` | `ExportFoodCertificateEditorModal` | Yes | Yes | 3 | 2 |
| `food-poisoning` | `FoodPoisoningPage` | `CaseEditorModal`, `IncidentEditorModal`, `PoisoningMap` | Yes | Yes | 2 | 2 |
| `geography` | `GeographicCatalogPage` | `GeographicCatalogModal` | **No api/ folder** | No | 2 | 2 |
| `identity` | `IdentityAdministrationPage` | `RoleEditorModal`, `RolePermissionsDrawer`, `UserActivityDrawer`, `UserEditorModal` | Yes | Yes | 2 | 2 |
| `inspection` | `InspectionPage` | `InspectionAttachmentsModal`, `InspectionFollowUpModal`, `InspectionPlanEditorModal`, `InspectionResultEditorModal` | Yes | Yes | 2 | 2 |
| `organizations` | `OrganizationListPage` | `OrganizationCreateModal`, `OrganizationListView` | Yes | Yes | 1 | 2 |
| `product-registrations` | `ProductRegistrationPage`, `PublicProductRegistrationLookupPage` | `ProductRegistrationAttachmentsModal`, `ProductRegistrationEditorModal` | Yes | Yes | 3 | 2 |
| `public-portal` | `PublicPortalHomePage`, `CitizenAlertReportPage`, `CitizenNewsReportPage`, `PublicCertificateSearchPage`, `PublicDocumentsPage`, `PublicGeneralSearchPage`, `PublicNewsPage`, `PublicWarnedBusinessesPage` | `PublicShell` | Yes | Yes | — | 2 |
| `reporting` | `ReportingPage` | `ActionMonthReportEditorModal`, `AtpWorkReportEditorModal`, `NdtpReportEditorModal`, `ReportDocumentViewModal`, `ReportErrorNotificationsModal` | Yes | Yes | 2 | 3 |
| `risk-analysis` | `RiskAnalysisPage` | — | Yes | Yes | 2 | 2 |
| `self-declarations` | `SelfDeclarationPage` | `SelfDeclarationAttachmentsModal`, `SelfDeclarationEditorModal` | Yes | Yes | 2 | 2 |
| `settings` | `SystemSettingsPage` | — | Yes | Yes | 1 | 2 |
| `statistics` | `StatisticsPage` | `ReportStatisticsSection` | Yes | Yes | 1 | 2 |
| `testing-results` | `TestingResultsPage` | — | Yes | Yes | 2 | 2 |

**Total feature folders:** 25  
**Total page components:** 56 (admin + public)  
**Total Vitest unit/integration test files:** 59  
**Total Playwright E2E spec files:** 55  

### 1.3 Shared Components

Located in `FoodSafe.FE/src/components/`:

| Component | Purpose |
|---|---|
| `EmptyState` | Empty-state display |
| `ExpiryTag` | License expiry indicator tag |
| `PageHeader` | Common page header with title/actions |
| `RevokeModal` | Generic revocation confirm modal |
| `StatusBadge` | Status tag/badge with strategy map |

Located in `FoodSafe.FE/src/hooks/`:

| Hook | Purpose |
|---|---|
| `useGeography` | Province/district/commune query hooks (wraps shared `lib/geographyApi`) |
| `useBranding` | Logo/background branding queries |

### 1.4 Export / Upload / Map Components

| Type | Components |
|---|---|
| Excel export | Every feature page has `ExportOutlined` button calling a dedicated export mutation |
| Excel import | `BusinessImportModal` (businesses feature) |
| PDF export | Certificate PDF download via `GET /api/v1/public/{type}/{id}/pdf` — buttons in CFS, Eligibility, Export-food certificate pages |
| Print | `printHtml` utility used in risk-analysis, documents, food-poisoning, inspection pages |
| Map — admin | `BusinessLocationMap`, `MapPicker` (Leaflet.js, businesses feature), `PoisoningMap` (food-poisoning) |
| Map — statistics | `PoisoningMap` reused on StatisticsPage |
| File attachments | Modals: `ProductAttachmentsModal`, `ProductRegistrationAttachmentsModal`, `SelfDeclarationAttachmentsModal`, `DocumentAttachmentsModal`, `InspectionAttachmentsModal` |

### 1.5 Dashboard Widgets

`DashboardPage` (`FoodSafe.FE/src/features/dashboard/pages/DashboardPage.tsx`) renders:
- KPI stat cards (total businesses, licensed, expiring, inspections, violations, poisoning cases)
- Report compliance table (org-level submission status)

`StatisticsPage` renders:
- Bar chart: businesses by type
- Pie chart: license distribution
- Line chart: poisoning cases by month
- Bar chart: inspection results
- PoisoningMap (Leaflet)
- `ReportStatisticsSection` sub-component with report-type statistics

---

## 2. Backend (FoodSafe.BE/src)

### 2.1 HTTP Controllers — FoodSafe.HttpApi

All controllers derive from `AbpControllerBase`. ABP also generates dynamic proxy controllers for all `IApplicationService` interfaces in `Application.Contracts`.

**Manual controllers in FoodSafe.HttpApi (49 controller files):**

| Namespace/Area | Controllers | Purpose |
|---|---|---|
| `AlertsAndTesting` | `AdministrativeDocumentExcelController`, `AtpAlertExcelController`, `AtpNewsExcelController`, `RiskAnalysisExcelController`, `TestingResultExcelController` | Excel export for 5 alert/testing entity types |
| `BusinessManagement` | `BusinessExcelController`, `ProductExcelController`, `SelfDeclarationExcelController`, `PublicBusinessController`, `PublicSelfDeclarationController` | Excel export + public lookup |
| `Catalogs` | `TestingServiceExcelController` | Testing service catalog Excel template |
| `Dashboard` | `AuditLogController`, `AuditLogExcelController`, `StatisticsExcelController` | Audit log read + Excel exports |
| `DataIntegration` | `ApiCallLogExcelController`, `ApiEndpointExcelController`, `DataSharingController` | Data sharing API + Excel exports |
| `FileManagement` | `AdvertisementRegistrationAttachmentController`, `CfsCertificateAttachmentController`, `EligibilityCertificateAttachmentController`, `ExportFoodCertificateAttachmentController`, `InspectionAttachmentControllers` (3 classes), `ProductAttachmentController`, `ProductRegistrationAttachmentController`, `SelfDeclarationAttachmentController` | File upload/download for 8 entity types |
| `FoodPoisoning` | `FoodPoisoningCaseExcelController`, `FoodPoisoningIncidentExcelController` | Excel export |
| `IdentityAdministration` | `IdentityAdministrationController`, `IdentityAdministrationExcelController` | User/role management + Excel |
| `Inspection` | `InspectionPlanExcelController`, `InspectionResultExcelController` | Excel export |
| `Licensing` | `AdvertisementRegistrationExcelController`, `CfsCertificateExcelController`, `EligibilityCertificateExcelController`, `ExportFoodCertificateExcelController`, `ProductRegistrationExcelController`, `PublicAdRegistrationController`, `PublicCfsCertificateController`, `PublicEligibilityCertificateController`, `PublicExportFoodCertificateController`, `PublicProductRegistrationController` | Excel export + public lookup for 5 licensing types |
| `Organizations` | `OrganizationExcelController` | Organization Excel export |
| `Public` | `PublicPortalControllers.cs` (contains: `PublicDirectoryController`, `PublicCertificateSearchController`, `CitizenAlertReportController`, `CitizenNewsReportController`, `CertificatePdfController`) | Public portal API endpoints |
| `Reporting` | `ActionMonthReportExcelController`, `AtpWorkReportExcelController`, `NdtpReportExcelController` | Reporting Excel export |
| `Security` | `UserProfileController` (in HttpApi), `CaptchaController` (in HttpApi.Host) | Profile management + CAPTCHA verify |
| `Settings` | `PublicBrandingController`, `SystemSettingsController` | Branding + system settings |

**Total manual controller classes:** approximately 58 (49 files, some contain multiple classes)

### 2.2 AppServices — FoodSafe.Application (85 files)

| Module | AppServices | Key public methods |
|---|---|---|
| **AlertsAndTesting** | `AdministrativeDocumentAppService`, `AdministrativeDocumentExcelAppService`, `AtpAlertAppService`, `AtpAlertExcelAppService`, `AtpNewsAppService`, `AtpNewsExcelAppService`, `RiskAnalysisAppService`, `RiskAnalysisExcelAppService`, `TestingResultAppService`, `TestingResultExcelAppService` | CRUD + publish + Excel export for all 5 types |
| **BusinessManagement** | `BusinessAppService`, `BusinessExcelAppService`, `ProductAppService`, `ProductExcelAppService`, `PublicBusinessAppService`, `PublicSelfDeclarationAppService`, `SelfDeclarationAppService`, `SelfDeclarationExcelAppService` | CRUD + import + public search |
| **Catalogs** | `GeographicCatalogAppService`, `MasterCatalogAppService`, `TestingServiceExcelAppService` | Geographic hierarchy + master catalogs CRUD |
| **Dashboard** | `AuditLogAppService`, `AuditLogExcelAppService`, `DashboardAppService`, `ReportStatisticsAppService`, `StatisticsAppService`, `StatisticsExcelAppService` | Dashboard KPIs, statistics, audit logs |
| **DataIntegration** | `ApiCallLogAppService`, `ApiCallLogExcelAppService`, `ApiEndpointAppService`, `ApiEndpointExcelAppService`, `DataSharingAppService` | API endpoints CRUD + call log + data sharing |
| **FileManagement** | `AdvertisementRegistrationAttachmentAppService`, `CfsCertificateAttachmentAppService`, `EligibilityCertificateAttachmentAppService`, `ExportFoodCertificateAttachmentAppService`, `ProductAttachmentAppService`, `ProductRegistrationAttachmentAppService`, `SelfDeclarationAttachmentAppService` | File upload (MinIO) + download + delete |
| **FoodPoisoning** | `FoodPoisoningCaseAppService`, `FoodPoisoningCaseExcelAppService`, `FoodPoisoningIncidentAppService`, `FoodPoisoningIncidentExcelAppService` | Cases + incidents CRUD + workflow (verify/conclude) |
| **IdentityAdministration** | `IdentityAdministrationAppService`, `IdentityAdministrationExcelAppService`, `UserExcelAppService` | User/role administration |
| **Inspection** | `InspectionPlanAppService`, `InspectionPlanExcelAppService`, `InspectionResultAppService`, `InspectionResultExcelAppService` | Plans (draft/approve) + results + violations |
| **Licensing** | `AdvertisementRegistrationAppService`, `AdvertisementRegistrationExcelAppService`, `CfsCertificateAppService`, `CfsCertificateExcelAppService`, `EligibilityCertificateAppService`, `EligibilityCertificateExcelAppService`, `ExportFoodCertificateAppService`, `ExportFoodCertificateExcelAppService`, `ProductRegistrationAppService`, `ProductRegistrationExcelAppService`, `PublicAdRegistrationAppService`, `PublicCfsCertificateAppService`, `PublicEligibilityCertificateAppService`, `PublicExportFoodCertificateAppService`, `PublicProductRegistrationAppService` | 5 licensing types, full CRUD + Excel + public lookup |
| **Organizations** | `OrganizationAppService`, `OrganizationExcelAppService` | Org hierarchy (3 levels) CRUD + Excel |
| **Public** | `CertificatePdfAppService`, `CitizenAlertReportAppService`, `CitizenNewsReportAppService`, `PublicCertificateSearchAppService`, `PublicContentAppService`, `PublicDirectoryAppService` | Public portal API (anonymous) |
| **Reporting** | `ActionMonthReportAppService`, `ActionMonthReportExcelAppService`, `AtpWorkReportAppService`, `AtpWorkReportExcelAppService`, `NdtpReportAppService`, `NdtpReportExcelAppService`, `ReportCalculationAppService` | 3 report types, full workflow (Draft→Submit→Verify→Complete/Return) + error notifications |
| **Security** | `AccountSecurityAppService`, `CurrentUserContextAppService`, `UserProfileAppService` | Password change, captcha, profile |
| **Settings** | `PublicBrandingAppService`, `SystemSettingsAppService` | Logo/background + system settings |

**Total AppService files:** 85  
**Total public async Task methods (all AppServices):** ~398

### 2.3 Background Jobs

| Job | Trigger | Purpose |
|---|---|---|
| `AdvertisementRegistrationExpiryJob` | ABP background job | Mark expired ad registrations |
| `CfsCertificateExpiryJob` | ABP background job | Mark expired CFS certificates |
| `EligibilityCertificateExpiryJob` | ABP background job | Mark expired eligibility certs |
| `ExportFoodCertificateExpiryJob` | ABP background job | Mark expired export food certs |
| `ProductRegistrationExpiryJob` | ABP background job | Mark expired product registrations |

**Total background jobs:** 5 (all in `Licensing` module, expiry processing)

### 2.4 Permission Definitions

Source: `FoodSafe.Application.Contracts/Permissions/FoodSafePermissionDefinitionProvider.cs`

| Permission Group | Leaf Permissions |
|---|---|
| `Organizations` | View, Create, Edit, Delete |
| `GeographicCatalogs` | View, Manage |
| `Catalogs` | View, Create, Edit, Delete |
| `BusinessManagement.Businesses` | View, Create, Edit, Delete, Import |
| `BusinessManagement.Products` | View, Create, Edit, Delete, Import |
| `BusinessManagement.SelfDeclarations` | View, Create, Edit, Delete |
| `Licensing.ProductRegistrations` | View, Create, Edit, Delete |
| `Licensing.AdRegistrations` | View, Create, Edit, Delete |
| `Licensing.EligibilityCertificates` | View, Create, Edit, Delete |
| `Licensing.CfsCertificates` | View, Create, Edit, Delete |
| `Licensing.ExportCertificates` | View, Create, Edit, Delete |
| `Inspection.Plans` | View, Create, Edit, Delete, Approve |
| `Inspection.Results` | View, Create, Edit, Delete |
| `AlertsAndTesting.Alerts` | View, Create, Edit, Delete, Publish |
| `AlertsAndTesting.News` | View, Create, Edit, Delete, Publish |
| `AlertsAndTesting.RiskAnalyses` | View, Create, Edit, Delete, Publish |
| `AlertsAndTesting.TestingResults` | View, Create, Edit, Delete |
| `AlertsAndTesting.Documents` | View, Create, Edit, Delete |
| `FoodPoisoning.Cases` | View, Create, Edit, Delete, Verify |
| `FoodPoisoning.Incidents` | View, Create, Edit, Delete, Verify, Conclude |
| `Reporting.NdtpReports` | View, Create, Edit, Delete, Submit, Verify, Return, Complete |
| `Reporting.AtpWorkReports` | View, Create, Edit, Delete, Submit, Verify, Return, Complete |
| `Reporting.ActionMonthReports` | View, Create, Edit, Delete, Submit, Verify, Return, Complete |
| `SystemAdministration.Users` | Create, Edit, Delete, ManageRoles, ManageScope, Activate, Lock, ResetPassword, ViewActivity |
| `SystemAdministration.Roles` | Create, Edit, Delete, ManagePermissions |
| `SystemAdministration` | AuditLogs, Settings |
| `DataIntegration.ApiEndpoints` | View, Create, Edit, Delete |
| `DataIntegration.CallHistory` | View |
| `DataIntegration` | Share |
| `DataScope` | All |

**Total permission leaf nodes:** ~92

### 2.5 Export Services

| Service | Library | Output formats |
|---|---|---|
| Excel export (all entities) | `ClosedXML` + `MiniExcel` | `.xlsx` |
| Certificate PDF | `QuestPDF` | `.pdf` (CFS, Eligibility, Export-food) |
| Excel import | `MiniExcel` | `.xlsx` (businesses, products) |

### 2.6 Audit Logging Integration

- ABP built-in audit logging enabled: `AbpAuditLoggingEntityFrameworkCoreModule` registered
- `AbpAuditLogs` table created in initial migration
- `AbpSecurityLogs` table created in initial migration (login/logout events)
- `AuditLogAppService` + `AuditLogController` expose filtered audit log reads to frontend
- All ABP `ApplicationService` methods automatically generate audit log entries

---

## 3. Database (FoodSafe.EntityFrameworkCore)

### 3.1 EF Migrations

| # | Migration name | Date | Content added |
|---|---|---|---|
| 1 | `20260725082617_InitialFoodSafe` | 2026-07-25 | All ABP core tables (identity, audit, OpenIddict, etc.) |
| 2 | `20260725083203_AddGeographicCatalogs` | 2026-07-25 | Country, Region, Province, District, Commune |
| 3 | `20260725083655_AddDataScope` | 2026-07-25 | Organization + data scope tables |
| 4 | `20260725085617_AddPasswordHistory` | 2026-07-25 | PasswordHistory table |
| 5 | `20260725093801_UpgradeAbp937` | 2026-07-25 | ABP 9.3.7 schema changes |
| 6 | `20260725120605_AddMasterCatalogs` | 2026-07-25 | BusinessType, ProductGroup, AdvertisementType, DocumentType, TestingCenter, TestingService, BusinessClassification |
| 7 | `20260725124518_AddBusinessManagement` | 2026-07-25 | Business, BusinessProductGroup, BusinessHandler, Product |
| 8 | `20260725134744_AddFileAttachments` | 2026-07-25 | FileAttachment, DocumentOwner tables |
| 9 | `20260725141416_AddSelfDeclarations` | 2026-07-25 | SelfDeclaration table |
| 10 | `20260725144004_AddProductRegistrations` | 2026-07-25 | ProductRegistration table |
| 11 | `20260725150001_AddAdvertisementRegistrations` | 2026-07-25 | AdvertisementRegistration + products join |
| 12 | `20260725152441_AddEligibilityCertificates` | 2026-07-25 | EligibilityCertificate table |
| 13 | `20260725154114_AddCfsCertificates` | 2026-07-25 | CfsCertificate table |
| 14 | `20260726022948_AddExportFoodCertificates` | 2026-07-26 | ExportFoodCertificate table |
| 15 | `20260726024252_AddInspectionModule` | 2026-07-26 | InspectionPlan, InspectionPlanItem, InspectionResult, InspectionResultInspector, InspectionViolation |
| 16 | `20260726083732_AddRemainingModules` | 2026-07-26 | All AlertsAndTesting, FoodPoisoning, Reporting, DataIntegration tables |
| 17 | `20260727021916_AddNewsRecallAudit` | 2026-07-27 | News recall/audit columns |
| 18 | `20260727104254_AddMissingForeignKeys` | 2026-07-27 | FK constraints cleanup |
| 19 | `20260727125207_AddResultFinalizeAndCitizenNews` | 2026-07-27 | InspectionResult finalization columns + CitizenNews table |
| 20 | `20260727131218_AddApiCallLogDataType` | 2026-07-27 | ApiCallLog DataType column |

**Total migrations:** 20  
**Latest migration:** `20260727131218_AddApiCallLogDataType`

### 3.2 DbContext Entity Sets

Source: `FoodSafe.EntityFrameworkCore/EntityFrameworkCore/FoodSafeDbContext.cs`

**ABP Framework tables (via ABP modules):**
`IdentityUser`, `IdentityRole`, `IdentityClaimType`, `OrganizationUnit`, `IdentitySecurityLog`, `IdentityLinkUser`, `IdentityUserDelegation`, `IdentitySession`

**Application domain tables:**

| DbSet | Entity | Module |
|---|---|---|
| `FoodSafeOrganizations` | `Organization` | Organizations |
| `Countries` | `Country` | Catalogs/Geography |
| `Regions` | `Region` | Catalogs/Geography |
| `Provinces` | `Province` | Catalogs/Geography |
| `Districts` | `District` | Catalogs/Geography |
| `Communes` | `Commune` | Catalogs/Geography |
| `ProductGroups` | `ProductGroup` | Catalogs |
| `BusinessTypes` | `BusinessType` | Catalogs |
| `BusinessClassifications` | `BusinessClassification` | Catalogs |
| `AdvertisementTypes` | `AdvertisementType` | Catalogs |
| `DocumentTypes` | `DocumentType` | Catalogs |
| `TestingCenters` | `TestingCenter` | Catalogs |
| `TestingServices` | `TestingService` | Catalogs |
| `AppUserProfiles` | `AppUserProfile` | Security |
| `PasswordHistory` | `PasswordHistory` | Security |
| `ManagementScopeAssignments` | `ManagementScopeAssignment` | Security |
| `Businesses` | `Business` | BusinessManagement |
| `BusinessProductGroups` | `BusinessProductGroup` | BusinessManagement |
| `BusinessHandlers` | `BusinessHandler` | BusinessManagement |
| `Products` | `Product` | BusinessManagement |
| `SelfDeclarations` | `SelfDeclaration` | BusinessManagement |
| `ProductRegistrations` | `ProductRegistration` | Licensing |
| `CfsCertificates` | `CfsCertificate` | Licensing |
| `AdvertisementRegistrations` | `AdvertisementRegistration` | Licensing |
| `AdvertisementRegistrationProducts` | `AdvertisementRegistrationProduct` | Licensing |
| `EligibilityCertificates` | `EligibilityCertificate` | Licensing |
| `ExportFoodCertificates` | `ExportFoodCertificate` | Licensing |
| `InspectionPlans` | `InspectionPlan` | Inspection |
| `InspectionPlanItems` | `InspectionPlanItem` | Inspection |
| `InspectionResults` | `InspectionResult` | Inspection |
| `InspectionResultInspectors` | `InspectionResultInspector` | Inspection |
| `InspectionViolations` | `InspectionViolation` | Inspection |
| `AtpAlerts` | `AtpAlert` | AlertsAndTesting |
| `AtpNewsArticles` | `AtpNews` | AlertsAndTesting |
| `NewsLinkedAlerts` | `NewsLinkedAlert` | AlertsAndTesting |
| `RiskAnalyses` | `RiskAnalysis` | AlertsAndTesting |
| `TestingResults` | `TestingResult` | AlertsAndTesting |
| `AdministrativeDocuments` | `AdministrativeDocument` | AlertsAndTesting |
| `FoodPoisoningCases` | `FoodPoisoningCase` | FoodPoisoning |
| `FoodPoisoningIncidents` | `FoodPoisoningIncident` | FoodPoisoning |
| `PoisoningCaseErrorReports` | `PoisoningCaseErrorReport` | FoodPoisoning |
| `PoisoningIncidentErrorReports` | `PoisoningIncidentErrorReport` | FoodPoisoning |
| `DocumentOwners` | `DocumentOwner` | FileManagement |
| `FileAttachments` | `FileAttachment` | FileManagement |
| `NdtpReports` | `NdtpReport` | Reporting |
| `NdtpReportErrorNotifications` | `NdtpReportErrorNotification` | Reporting |
| `AtpWorkReports` | `AtpWorkReport` | Reporting |
| `AtpWorkReportErrorNotifications` | `AtpWorkReportErrorNotification` | Reporting |
| `ActionMonthReports` | `ActionMonthReport` | Reporting |
| `ActionMonthReportErrorNotifications` | `ActionMonthReportErrorNotification` | Reporting |
| `ApiEndpoints` | `ApiEndpoint` | DataIntegration |
| `ApiCallLogs` | `ApiCallLog` | DataIntegration |

**Total application DbSets:** 52 (+ 8 ABP framework sets)

### 3.3 Soft Delete / Concurrency

- Soft delete (`ISoftDelete`) applied to: `Country`, all `AdministrativeArea` subclasses (Region, Province, District, Commune), all `MasterCatalog` subclasses
- ABP `IHasExtraProperties` and `IHasConcurrencyStamp` used on ABP entities (Identity, OrganizationUnit) via framework
- Custom domain entities do not expose explicit `ConcurrencyToken` columns — rely on ABP's transaction isolation

### 3.4 Seed Data Contributors

| Contributor | What it seeds |
|---|---|
| `FoodSafePermissionDataSeedContributor` | Creates default admin role and grants all FoodSafe permissions |
| `MasterCatalogDataSeedContributor` | Seeds reference data: business types, product groups, ad types, document types, testing centers/services |
| `E2eTestDataSeedContributor` | Seeds deterministic test accounts and reference data for E2E tests (only active in Development environment) |

---

## 4. Infrastructure

### 4.1 Docker Compose Services

Source: `FoodSafe.BE/docker-compose.yml`

| Service | Image | Purpose | Ports (host) | Healthcheck |
|---|---|---|---|---|
| `postgres` | `postgres:15-alpine` | Primary database | `127.0.0.1:5433:5432` | `pg_isready` |
| `redis` | `redis:7-alpine` | Session cache / distributed lock | `127.0.0.1:6379:6379` | `redis-cli ping` |
| `minio` | `minio/minio:RELEASE.2025-04-22` | S3-compatible file storage | `127.0.0.1:9000-9001` | `curl /minio/health/live` |
| `mailpit` | `axllent/mailpit:v1.30.0` | SMTP catch-all (dev profile only) | `127.0.0.1:1025,8025` | `/mailpit readyz` |
| `clamav` | `clamav/clamav:1.4` | Malware scanning for uploads | Internal only | `clamdscan --ping` |
| `migrator` | Built from `Dockerfile` | Run EF migrations + seed (one-shot) | — | none (`restart: no`) |
| `api` | Built from `Dockerfile` | ASP.NET Core API | Not exposed directly | `curl /health` |
| `frontend` | Built from `FoodSafe.FE/Dockerfile` | Vite build served via nginx | `127.0.0.1:8080:8080` | nginx healthz (via compose health only in dev) |

**Total compose services:** 8 (7 always-on + 1 dev-profile)

**Network:** `foodsafe` bridge `172.28.0.0/24` — all services on static IPs

### 4.2 Production Compose Override

Source: `FoodSafe.BE/docker-compose.prod.yml`

Overrides `frontend` service only:
- Uses `Dockerfile.prod` variant (does NOT exist — see Gaps section)
- Maps ports `0.0.0.0:80:8080` and `0.0.0.0:443:8443`
- Mounts TLS cert/key as read-only volumes
- Sets `SSL_CERT_PATH` / `SSL_KEY_PATH` environment variables
- Adds healthcheck on `http://127.0.0.1:8080/healthz`

### 4.3 Dockerfiles

**Backend (`FoodSafe.BE/Dockerfile`):**
- Multi-stage: `dotnet/sdk:9.0` build → `dotnet/aspnet:9.0` runtime
- Publishes both `api` and `migrator` in the same image; entrypoint selects via compose
- Runs as `$APP_UID` (non-root)
- Installs `curl` for healthcheck
- Exposes port `8080`

**Frontend (`FoodSafe.FE/Dockerfile`):**
- Multi-stage: `node:20-alpine` build → `nginxinc/nginx-unprivileged:1.27-alpine`
- Runs as `nginx` user (non-root)
- Exposes port `8080`
- Healthcheck: `wget -q -O /dev/null http://127.0.0.1:8080/healthz`

**`Dockerfile.prod` (FoodSafe.FE):** Does not exist — referenced in `docker-compose.prod.yml` but not present in the repository (see Gaps section).

### 4.4 Nginx Configuration

**Dev (`FoodSafe.FE/docker/nginx.conf`):**
- Listens on 8080 (IPv4 + IPv6)
- Proxies `/api/` to `api:8080`
- Proxies `/health` to `api:8080/health`
- Serves `/healthz` locally (plain text `healthy`)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`
- CSP allows Cloudflare Turnstile CAPTCHA + OpenStreetMap tiles
- Static assets cached `1y` with `immutable`
- SPA fallback: `try_files $uri $uri/ /index.html`
- `proxy_read_timeout 120s`, `client_max_body_size 20m`

**Prod template (`FoodSafe.FE/docker/nginx.prod.conf.template`):**
- Listens on 8080 (HTTP) + 8443 (HTTPS), both IPv4 and IPv6
- HTTP block redirects all traffic to HTTPS (permanent) except `/healthz`
- HTTPS block: TLS 1.2+, HSTS, full security headers
- Uses `envsubst` for `${SSL_CERT_PATH}` and `${SSL_KEY_PATH}`

### 4.5 CI/CD — GitHub Actions

Source: `.github/workflows/ci.yml`

**Workflow:** `CI` — triggers on push to `main` / `codex/**` and all PRs

| Job | Runner | Timeout | Steps |
|---|---|---|---|
| `application` | `ubuntu-latest` | 30 min | dotnet restore, format check, build (Release, `--warnaserror`), test with XPlat coverage, publish deliverables, `ef migrations has-pending-model-changes`, npm ci, Prettier check, ESLint, TypeScript check, Vitest (`--run`), Vite build, upload coverage artifacts |
| `database` | `ubuntu-latest` + postgres:15-alpine service | 15 min | Apply all migrations to clean DB, `has-pending-model-changes` drift check |
| `supply-chain` | `ubuntu-latest` | 30 min | NuGet vulnerability audit (`Test-NuGetVulnerabilities.ps1`), npm vulnerability audit (`Test-NpmVulnerabilities.ps1`), Trivy secret+misconfig scan, `docker compose config`, build all images, Trivy vuln scan on `api`/`migrator`/`frontend` images |

**Total workflows:** 1 (`ci.yml`)  
**Total jobs:** 3 (`application`, `database`, `supply-chain`)  
**Dependabot:** Weekly updates for NuGet, npm, and GitHub Actions

No Playwright E2E job is present in CI (E2E tests are local-only).

### 4.6 Scripts

| Script | Purpose |
|---|---|
| `scripts/load-test.k6.js` | k6 load test: 30 VU ramp, NFR-01 (`avg < 10s`), NFR-02 (`max < 30s`), NFR-05 (30 concurrent), NFR-06 (5 active). Runs against Docker stack. |
| `scripts/Test-NuGetVulnerabilities.ps1` | PowerShell: runs `dotnet list package --vulnerable` and fails CI on HIGH/CRITICAL |
| `scripts/Test-NpmVulnerabilities.ps1` | PowerShell: runs `npm audit --audit-level=high` and fails CI on HIGH/CRITICAL |

### 4.7 Environment Variables

Source: `FoodSafe.BE/.env.example`

| Variable | Default / Example | Required in prod |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | `FoodSafe`, `foodsafe`, — | Yes |
| `POSTGRES_SSL_MODE` | `Disable` (dev) | Must be `Require`+ in prod |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | — | Yes |
| `STRING_ENCRYPTION_PASSPHRASE` | — (32+ chars) | Yes |
| `CAPTCHA_SITE_KEY`, `CAPTCHA_SECRET_KEY` | Cloudflare test keys | Must be real in prod |
| `CAPTCHA_EXPECTED_HOSTNAME` | `localhost` | Must match prod hostname |
| `SMTP_*` (7 vars) | Mailpit defaults | Must be real SMTP in prod |
| `DATA_PROTECTION_CERTIFICATE_PASSWORD` | empty | Must be set if PFX present |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | `admin@foodsafe.local` | Must change |
| `PUBLIC_BASE_URL` | `http://localhost:8080` | Must be HTTPS URL in prod |
| `REQUIRE_HTTPS_METADATA` | `false` | Must be `true` in prod |
| `ASPNETCORE_ENVIRONMENT` | `Development` | Must be `Production` in prod |

---

## 5. Gaps and Stubs Found

The following items are incomplete, placeholder, structurally inconsistent, or present a production readiness concern.

### 5.1 Missing Files

| Item | Location | Impact |
|---|---|---|
| `Dockerfile.prod` missing | `FoodSafe.FE/Dockerfile.prod` — referenced in `docker-compose.prod.yml` but does not exist | **BLOCKER**: production deployment with HTTPS fails; `docker compose build` in prod mode will error |

### 5.2 Missing API Coverage (no ABP interface/contract)

| AppService | Contract interface | Notes |
|---|---|---|
| `CertificatePdfAppService` | No `ICertificatePdfAppService.cs` found in Application.Contracts | PDF generation is exposed directly through `CertificatePdfController` in `PublicPortalControllers.cs`; no ABP dynamic proxy contract; this is intentional for a non-CRUD service but means no client proxy is generated |
| `CitizenAlertReportAppService` | No matching interface in `Application.Contracts/Public` | Same pattern — intentional manual controller |
| `CitizenNewsReportAppService` | No matching interface in `Application.Contracts/Public` | Same pattern |
| `PublicContentAppService`, `PublicDirectoryAppService`, `PublicCertificateSearchAppService` | No interfaces in Application.Contracts | All served through manual controllers; intentional for public/anonymous endpoints |

**Assessment:** These are intentional — public anonymous endpoints are better as manual controllers. Not a defect, but worth documenting.

### 5.3 Frontend Feature Without api/ Folder

| Feature | Gap | Impact |
|---|---|---|
| `geography` | No `api/` folder — uses shared `hooks/useGeography.ts` and `lib/geographyApi.ts` instead | Violates CLAUDE.md rule 4.2 (API calls only via feature `api/` folder); mutation calls use raw `@tanstack/react-query` directly in the page. Low severity — functionality works. |

### 5.4 Missing E2E Coverage for Some Routes

| Route | E2E spec |
|---|---|
| `/account/profile` | No dedicated E2E spec (ProfilePage has no test file at all) |
| `/statistics` | `statistics.spec.ts` + `statistics-verification.spec.ts` exist |
| `/account/change-password` | Covered under `password-management-verification.spec.ts` |

**ProfilePage** (`FoodSafe.FE/src/features/auth/pages/ProfilePage.tsx`) has no unit test and no dedicated E2E spec.

### 5.5 Missing Playwright E2E in CI Pipeline

| Gap | Detail |
|---|---|
| No E2E job in `.github/workflows/ci.yml` | All 55 E2E spec files are local-only; the CI pipeline runs only Vitest unit tests (`npm test -- --run`). No backend or full-stack integration is exercised in CI. |

### 5.6 No `Dockerfile.prod` and Production Build Gap

`docker-compose.prod.yml` line 4: `dockerfile: Dockerfile.prod` for the frontend service. This file does not exist. The prod compose file contains detailed documentation about what it must do (nginx template processing, dual-port HTTPS), but the Dockerfile itself is absent.

### 5.7 `/statistics` Route Has No Permission Guard

Route definition:
```tsx
{ path: "statistics", element: <Suspense ...><StatisticsPage /></Suspense> }
```
No `PermissionRoute` wrapper — any authenticated user can access the statistics page regardless of role.

### 5.8 InspectionAttachment — Three Classes in One File

`FoodSafe.HttpApi/FileManagement/InspectionAttachmentControllers.cs` contains three controller classes (`InspectionPlanAttachmentController`, `AdministrativeDocumentAttachmentController`, `InspectionResultAttachmentController`). The corresponding AppService file (`FileManagement/`) does not have an `InspectionAttachmentAppService` — inspection attachments are handled by separate files. No functional gap but naming/structure is inconsistent.

### 5.9 AppService Interfaces — Only 9 Explicitly Declared

Only 9 `I*AppService.cs` interface files exist in `Application.Contracts`. Most AppServices rely on ABP's dynamic proxy generation via `[RemoteService]`/`IApplicationService` convention rather than explicit contracts. This is valid ABP pattern but means typed client-side proxies are limited.

### 5.10 No Backup / Restore Scripts

`scripts/` directory contains only `load-test.k6.js`, `Test-NuGetVulnerabilities.ps1`, and `Test-NpmVulnerabilities.ps1`. No database backup, restore, or disaster recovery scripts are present. Backup procedures are documented in `docs/40-disaster-recovery-guide.md` but not automated.

### 5.11 No Monitoring / Observability Configuration

No `prometheus.yml`, `grafana/`, `otel-collector`, or other observability stack configuration exists. The `docker-compose.yml` does not include any monitoring service. Operations runbook (`docs/39-operations-runbook.md`) exists as documentation but no tooling is wired.

---

## Summary Counts

| Category | Count |
|---|---|
| Frontend routes (total) | 45 |
| Page components | 56 |
| Feature folders | 25 |
| Vitest unit/integration test files | 59 |
| Playwright E2E spec files | 55 |
| Backend manual controller files | 49 (HttpApi) + 1 (Host) = 50 |
| Backend controller classes (total) | ~58 |
| AppService files | 85 |
| AppService public async methods (approx.) | ~398 |
| Domain entity files | ~39 |
| Background jobs | 5 |
| EF migrations | 20 |
| Latest migration | `20260727131218_AddApiCallLogDataType` |
| DbSets (application) | 52 |
| Permission leaf nodes | ~92 |
| Docker compose services | 8 |
| CI workflow jobs | 3 |
| GitHub Actions workflows | 1 |
| Scripts | 3 |

**Critical gap:** `FoodSafe.FE/Dockerfile.prod` is referenced by `docker-compose.prod.yml` but does not exist — production HTTPS deployment is blocked.

**Functional stubs:** None found. All 56 page components contain real implementation (data tables, forms, API calls). No page renders only a heading, TODO message, or empty component.
