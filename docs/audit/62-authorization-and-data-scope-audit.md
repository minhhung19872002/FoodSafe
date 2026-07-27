# 62 — Authorization and Data Scope Audit

**Audit date**: 2026-07-27
**Branch**: `codex/production-readiness`

---

## 1. Permission System

### 1.1 Permission Definition
**IMPLEMENTED** — `FoodSafePermissionDefinitionProvider.cs` defines 80+ named permissions across 14+ resource types with granular CRUD + workflow operations (View, Create, Edit, Delete, Submit, Verify, Return, Complete, Approve, Publish, Lock, ResetPassword, etc.).

### 1.2 Permission Enforcement
**IMPLEMENTED** — Every non-public AppService method is decorated with `[Authorize(FoodSafePermissions.X.Y)]`. ABP's built-in authorization pipeline checks permissions server-side on every request.

### 1.3 UI Permission Integration
**IMPLEMENTED** — Frontend uses `usePermissions()` hook to show/hide UI elements based on real server-returned permissions. No CSS/JS hiding — elements are not rendered at all if permission is absent.

---

## 2. Organization Scoping (Data Isolation)

### 2.1 Architecture
- **Pattern**: Organization Unit — every entity has `OrganizationId`
- **NOT using**: ABP Multi-tenancy (per CLAUDE.md requirement)
- **Provider**: `CurrentDataScopeProvider.cs` computes scope server-side from authenticated user's `AppUserProfile.OrganizationId`

### 2.2 Enforcement Points

| Layer | Mechanism | Status |
|---|---|---|
| Domain entity | `OrganizationId` on every aggregate | IMPLEMENTED — confirmed across all 52 tables |
| Database | FK + index on `organization_id` | IMPLEMENTED — every business table |
| AppService query | `_dataScopeProvider.GetAsync()` before filtering | IMPLEMENTED — every list query |
| AppService mutation | `EnsureOrganizationAccessAsync()` on individual access | IMPLEMENTED — on Get/Update/Delete |
| Database constraint | Composite FK `(business_id, organization_id)` | IMPLEMENTED — on child entities |

### 2.3 Cross-Organization Protection
**IMPLEMENTED** — `AbpAuthorizationException` thrown for any cross-org access attempt. Verified in E2E specs via `inspection-verification.spec.ts` which tests cross-org mutation rejection.

### 2.4 Management Scope Assignments
**IMPLEMENTED** — `management_scope_assignments` table + `ManagementScopeAssignment` entity enables fine-grained area-level scoping within an organization. Used by `CurrentDataScopeProvider` to compute administrative area scope.

---

## 3. Public Portal Authorization

### 3.1 Anonymous Access
**CORRECTLY IMPLEMENTED** — All public portal controllers/AppServices use `[AllowAnonymous]`:
- `PublicDirectoryController` — business/product search
- `PublicCertificateSearchController` — 6 certificate type searches
- `PublicContentController` — news/alerts/warned businesses/documents/risk analyses
- `CitizenAlertReportController` — citizen alert submission
- 7 `Public*LookupController` instances — per-certificate-type lookups

### 3.2 Public Data Filtering
**IMPLEMENTED** — Public queries filter on `Status == Published && IsPublic == true` (news, alerts, risk analyses) or `Status == Active` (certificates, businesses). No internal/draft data is exposed.

### 3.3 Rate Limiting on Public Endpoints
**IMPLEMENTED** — `ConfigureRateLimiting`:
- Public APIs: 60 requests/minute
- Citizen alert submissions: 5 per 15 minutes
- Login: 10 per 5 minutes

---

## 4. Role-Based Access Control

### 4.1 Role Management
**IMPLEMENTED** — `IdentityAdministrationAppService` (927+ lines) provides full role CRUD, permission assignment, and role-to-user assignment.

### 4.2 Permission Ceiling
**IMPLEMENTED** — When assigning permissions to users in child organizations, the system enforces that a child cannot have permissions exceeding its parent organization's ceiling. `IdentityAdministrationRules` enforces this.

### 4.3 Self-Registration
**DISABLED** — `Abp.Account.IsSelfRegistrationEnabled: "false"` + middleware returns 404 for `/Account/Register` and `/api/account/register`.

---

## 5. Session Security

| Control | Status | Detail |
|---|---|---|
| Access token lifetime | IMPLEMENTED | 15 minutes |
| Session cookie sliding expiry | IMPLEMENTED | 30 minutes |
| Refresh token lifetime | IMPLEMENTED | 14 days |
| SecurityStamp validation | IMPLEMENTED | `ValidationInterval = TimeSpan.Zero` — every request |
| HttpOnly cookie | IMPLEMENTED | `options.Cookie.HttpOnly = true` |
| Secure cookie | IMPLEMENTED | `CookieSecurePolicy.Always` in production |
| SameSite | IMPLEMENTED | `SameSiteMode.Strict` |
| `__Host-` prefix | IMPLEMENTED | Production only |
| Session destroy on logout | IMPLEMENTED | OpenIddict token revocation |

---

## 6. Audit Defects Found

### 6.1 MEDIUM — Swagger UI Exposed in Production
`app.UseSwagger()` and `app.UseAbpSwaggerUI()` are called unconditionally (not gated to Development environment). This exposes the full API schema to unauthenticated users in production.

### 6.2 LOW — Hangfire Dashboard Access
`LocalRequestsOnlyAuthorizationFilter` blocks external access, but within the Docker network, `/hangfire` is accessible without authentication. Mitigated by nginx not proxying `/hangfire`, but fragile.

### 6.3 INFO — CitizenAlertReportPage CSRF Bypass
`CitizenAlertReportPage.tsx` imports raw `axios` instead of the shared axios instance with CSRF interceptor. However, the backend's `LoginCaptchaMiddleware` validates CAPTCHA on this endpoint, and the page pre-fetches `/abp/application-configuration` to prime the XSRF cookie. Functionally working but architecturally inconsistent.

---

## 7. Summary

| Dimension | Score | Notes |
|---|---|---|
| Permission definition | 95% | Comprehensive; some workflow permissions could be more granular |
| Permission enforcement (server) | 98% | Every AppService method protected; public endpoints correctly anonymous |
| Organization scoping | 100% | Every table, every query, every mutation scoped |
| Administrative area scoping | 90% | ManagementScopeAssignment exists; not all modules verified |
| Session security | 95% | All controls implemented; SecurityStamp validation on every request |
| Public portal access control | 95% | Correctly anonymous with proper data filtering |
| Audit trail | 90% | ABP AuditLogging comprehensive; no custom audit for business events beyond ABP |

**Overall authorization score: 95%**
