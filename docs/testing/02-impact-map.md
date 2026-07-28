# Impact Map

When a shared dependency changes, the features listed must be retested at the
specified level.

## Shared dependencies → affected features

### Authentication & Authorization

| Dependency | Path | Retest | Affected Features |
|---|---|---|---|
| Auth store | `FE/src/features/auth/store/authStore.ts` | Level 3 | All authenticated features (F-003 through F-032) |
| Auth API | `FE/src/features/auth/api/` | Level 3 | F-001, F-002 |
| Login middleware | `BE/Security/LoginCaptchaMiddleware.cs` | Level 3 | F-001 |
| Identity config | `BE/FoodSafeHttpApiHostModule.cs` (ConfigureIdentity) | Level 3 | F-001, F-002, F-020 |
| CSRF / anti-forgery | `BE/FoodSafeHttpApiHostModule.cs` (ConfigureAntiForgery) | Level 3 | All mutation features |
| Permission definitions | `BE/Permissions/FoodSafePermissions.cs` | Level 3 | All features using permissions |
| Permission seeder | `BE/Data/FoodSafePermissionDataSeedContributor.cs` | Level 3 | All features using permissions |

### Data Scoping

| Dependency | Path | Retest | Affected Features |
|---|---|---|---|
| CurrentDataScopeProvider | `BE/Security/CurrentDataScopeProvider.cs` | Level 3 | All org-scoped features (F-003 through F-019) |
| DataScopeChecker base | `BE/Application/*DataScopeChecker.cs` | Level 3 | Features using that checker |
| Organization tree API | `FE/src/features/organizations/api/` | Level 3 | F-003, F-005, F-006, F-020 |

### Shared UI Components

| Dependency | Path | Retest | Affected Features |
|---|---|---|---|
| PageHeader | `FE/src/components/PageHeader.tsx` | Level 1 | All features using PageHeader |
| StatusBadge | `FE/src/components/StatusBadge.tsx` | Level 1 | F-007 through F-012, F-024 through F-030 |
| FileUploader | `FE/src/components/` (file-related) | Level 2 | F-006, F-007, F-008, F-009, F-010, F-011, F-012 |
| ExcelImportModal | `FE/src/components/ExcelImportModal.tsx` | Level 2 | F-006, F-007, F-008, F-009, F-010, F-011, F-012 |

### Database & EF Core

| Dependency | Path | Retest | Affected Features |
|---|---|---|---|
| DbContext | `BE/EntityFrameworkCore/FoodSafeDbContext.cs` | Level 3 | All features |
| Model creating | `BE/EntityFrameworkCore/FoodSafeDbContextModelCreatingExtensions.cs` | Level 3 | Features with affected entities |
| Migrations | `BE/Migrations/` | Level 3 | All features |

### Data Integration (outbound share engine)

| Dependency | Path | Retest | Affected Features |
|---|---|---|---|
| Share/retry engine | `BE/Application/DataIntegration/DataSharingAppService.cs` | Level 2 | F-019, F-019c, F-019d, F-019e |
| Payload builders | `BE/Application/DataIntegration/SharedDataPayloadBuilders.cs` | Level 2 | F-019e (payload content of every share; readers of the shared entities are unaffected — builders are read-only) |
| Call-log entity/mapping | `BE/Domain/DataIntegration/ApiCallLog.cs` + its model-creating block | Level 2 | F-019, F-019c, F-019d, F-019e (+ F-019f — inbound attempts log here) |
| Guarded outbound HttpClient (SSRF/redirect/size) | `BE/Application/Security/OutboundUrlValidator.cs` | Level 2 | F-019c, F-019d, F-019e (every outbound share/test-connection) |

### Data Integration (inbound partner surface, INT-03)

| Dependency | Path | Retest | Affected Features |
|---|---|---|---|
| Partner aggregates + key material | `BE/Domain/DataIntegration/{PartnerAccount,PartnerApiKey,InboundSubmission}.cs`, `BE/Application/DataIntegration/PartnerKeyMaterial.cs` | Level 2 | F-019f |
| Partner admin + inbound receive services | `BE/Application/DataIntegration/{PartnerAccountAppService,PartnerInboundAppService}.cs`, `BE/HttpApi/DataIntegration/*` | Level 2 | F-019f (+ re-run `e2e/partner-openapi-contract.spec.ts` and re-align `docs/integration/partner-openapi.yaml` — FR-50-05 published contract) |
| Partner FE tabs | `FE/src/features/data-integration/components/{PartnersTab,InboundSubmissionsTab}.tsx` | Level 2 | F-019f |

### API Infrastructure

| Dependency | Path | Retest | Affected Features |
|---|---|---|---|
| Axios instance | `FE/src/lib/axios.ts` | Level 3 | All features |
| API versioning | `BE/FoodSafeHttpApiHostModule.cs` (ConfigureApiVersioning) | Level 3 | All features |
| Rate limiting | `BE/FoodSafeHttpApiHostModule.cs` (ConfigureRateLimiting) | Level 3 | F-001, F-002, public lookups |
| CORS config | `BE/FoodSafeHttpApiHostModule.cs` (ConfigureCors) | Level 3 | All features |

### Routing

| Dependency | Path | Retest | Affected Features |
|---|---|---|---|
| Router config | `FE/src/app/router.tsx` | Level 2 | Features with changed routes |
| Route components | `FE/src/app/routeComponents.tsx` | Level 1 | Features with changed lazy imports |
| App layout | `FE/src/app/AppLayout.tsx` | Level 1 | All authenticated features |

### File & Blob Storage

| Dependency | Path | Retest | Affected Features |
|---|---|---|---|
| Blob storage config | `BE/FoodSafeHttpApiHostModule.cs` (ConfigureBlobStorage) | Level 3 | All attachment features |
| Attachment base service | `BE/Application/FileManagement/` | Level 3 | F-006 through F-012 |
| ClamAV integration | Docker ClamAV service | Level 3 | All file upload features |

### Background Jobs

| Dependency | Path | Retest | Affected Features |
|---|---|---|---|
| Hangfire config | `BE/FoodSafeHttpApiHostModule.cs` (ConfigureHangfire) | Level 2 | Features with expiry jobs |
| Expiry jobs | `BE/Application/Licensing/*ExpiryJob.cs` | Level 2 | F-008, F-009, F-010, F-011, F-012 |
