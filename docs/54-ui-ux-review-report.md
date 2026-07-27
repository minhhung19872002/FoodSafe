# UI/UX Redesign — Review Report

## 1. Design System

### Theme Configuration (`src/theme/themeConfig.ts`)
| Token | Value | Rationale |
|---|---|---|
| `colorPrimary` | `#00796B` (teal) | Food safety / health association |
| `colorInfo` | `#0958D9` | Links and informational elements |
| `colorSuccess` | `#389E0D` | Active status, valid licenses |
| `colorWarning` | `#D48806` | Expiring items |
| `colorError` | `#CF1322` | Revoked, overdue, danger actions |
| `borderRadius` | `6` | Balanced modern look |
| `colorBgLayout` | `#F0F2F5` | Light gray page background |
| Sidebar | `#001529` (dark) | Standard admin sidebar |
| Header | `#FFFFFF` | Clean white top bar |
| Table header | `#FAFAFA` | Subtle differentiation |

### Layout Constants
- Sidebar width: 240px (collapsed: 64px)
- Header height: 56px

### Global CSS (`src/index.css`)
Replaced Vite scaffold CSS entirely. New classes:
- `.page-container` — page-level wrapper with max-width and padding
- `.page-card` — white card with shadow for content sections
- `.filter-toolbar` — flexbox row for search/filter/action controls
- `.page-header` — title + subtitle + actions layout
- `.stat-card` — dashboard summary card styling
- `.empty-state` — centered empty data placeholder
- `.sidebar-logo`, `.app-header` — shell-level layout
- Responsive breakpoints at 768px and 576px
- `@media (prefers-reduced-motion)` — disabled transitions
- `@media print` — hide sidebar, header, and actions

---

## 2. Shared Components Created

| Component | File | Replaces |
|---|---|---|
| `PageHeader` | `src/components/PageHeader.tsx` | Inconsistent `Typography.Title` + `Typography.Paragraph` pairs |
| `StatusBadge` | `src/components/StatusBadge.tsx` | 5+ inline Tag + status color mappings |
| `ExpiryTag` | `src/components/ExpiryTag.tsx` | 5+ inline expiry calculation + display blocks |
| `EmptyState` | `src/components/EmptyState.tsx` | Ad-hoc empty state rendering |
| `RevokeModal` | `src/components/RevokeModal.tsx` | 5 duplicate revoke dialogs with internal reason state |

### Shared Utilities Created

| Utility | File | Replaces |
|---|---|---|
| `saveDownload` | `src/utils/download.ts` | 6 duplicate blob-to-download functions |
| `formatBytes` | `src/utils/format.ts` | 3 duplicate byte formatting functions |

---

## 3. Pages Redesigned

### Application Shell (`src/app/AppLayout.tsx`)
- Declarative `NAV_CONFIG` array with permission-gated menu items
- Menu uses `type: "group"` for section labels (8 groups)
- Vietnamese breadcrumb label map for URL segments
- Mobile drawer sidebar with hamburger toggle
- User dropdown shows organization name
- Avatar uses primary color (`#00796B`)
- Content area delegates card management to individual pages
- Sticky sidebar with overflow scroll

### Dashboard (`src/features/dashboard/pages/DashboardPage.tsx`)
- 4 stat summary cards (Businesses, Declarations, Certificates, Expiring)
- Activity and statistics placeholder sections with `EmptyState`
- Uses `page-container` / `page-card` / `stat-card` classes

### List Pages (standardized pattern applied to all)

Every list page now follows this template:
1. `<div className="page-container">` wrapper
2. `<PageHeader>` with title, subtitle, optional actions
3. `<div className="page-card">` wrapping content
4. `<div className="filter-toolbar">` for search/filter/action row
5. `<Table size="middle">` with `scroll={{ x }}`, `showTotal`, `ellipsis` on text columns
6. Action buttons use `size="small"` and `fixed="right"`

Pages standardized:
- `SelfDeclarationPage` — template page, uses all shared components
- `ProductRegistrationPage` — PageHeader, StatusBadge, ExpiryTag, RevokeModal
- `AdvertisementRegistrationPage` — same pattern
- `EligibilityCertificatePage` — same pattern
- `CfsCertificatePage` — title corrected to "Chứng nhận lưu hành tự do (CFS)"
- `BusinessManagementPage` / `BusinessManagementView` — page-card, filter-toolbar, proper tables
- `OrganizationListPage` / `OrganizationListView` — PageHeader, filter-toolbar, fixed Space bug
- `MasterCatalogPage` / `MasterCatalogView` — PageHeader, page-card, standardized table
- `GeographicCatalogPage` — fixed 3 `orientation` → `direction` bugs, PageHeader
- `IdentityAdministrationPage` — PageHeader, page-container/page-card, filter-toolbar, App.useApp()

### Public Lookup Pages
- `PublicProductRegistrationLookupPage` — uses `StatusBadge`
- `PublicCfsCertificateLookupPage` — title fixed, uses `StatusBadge`
- `PublicEligibilityCertificateLookupPage` — uses `StatusBadge`

---

## 4. Bug Fixes

| Bug | Location | Fix |
|---|---|---|
| `Space orientation="vertical"` (invalid prop) | GeographicCatalogPage (3 instances), OrganizationListView | Changed to `direction="vertical"` |
| CFS pages had wrong titles (copy-pasted from ProductRegistration) | PublicCfsCertificateLookupPage, CfsCertificatePage | Corrected to CFS-specific titles |
| ReactQueryDevtools loaded in production | `main.tsx` | Wrapped in `import.meta.env.DEV` conditional |
| `message` imported directly from antd (outside ConfigProvider context) | IdentityAdministrationPage | Switched to `App.useApp()` hook |
| `PAGE_SIZE` prop name mismatch | BusinessManagementPage → BusinessManagementView | Changed to `pageSize` |
| Smart quotes (Unicode `"` `"`) in JSX | IdentityAdministrationPage, OrganizationListView, GeographicCatalogPage | Replaced with ASCII `"` |
| Unused `LICENSE_STATUS` imports | 3 public lookup pages | Removed |

---

## 5. Build Verification Results

| Check | Result |
|---|---|
| `npx tsc -b --noEmit` | **Pass** — 0 errors |
| `npx oxlint src` | **Pass** — 0 warnings |
| `npm run build` | **Pass** — built in 931ms |

---

## 6. What Was NOT Modified

- **FoodSafe.BE** — no backend changes
- **Database schema** — unchanged
- **API contracts** — all DTOs and endpoints preserved
- **Authentication / authorization** — no changes to auth flow or permission checks
- **Existing routes** — all routes preserved in `router.tsx`
- **Business logic** — no functional behavior changes
- **Form validation schemas** — all Zod schemas unchanged
- **TanStack Query hooks** — all API hooks unchanged

---

## 7. Remaining Limitations

1. **Form pages not redesigned** — Editor modals (e.g., `UserEditorModal`, `RoleEditorModal`, `BusinessEditorModal`) were not touched; they work but don't follow the new layout classes
2. **Dark mode not supported** — the design uses a fixed light theme; `prefers-color-scheme` is not wired to Ant Design's `algorithm`
3. **No real data on dashboard** — stat cards show placeholder zeroes; actual API integration pending
4. **Table column widths** — some pages may need fine-tuning based on real data lengths
5. **Print stylesheet** — basic (hides chrome); specific pages like certificates may need dedicated print templates
6. **Accessibility** — `aria-label` added to action buttons; full keyboard navigation and screen reader audit not performed
7. **Map views** — Leaflet map components unchanged (out of scope for this redesign)

---

## 8. Files Changed Summary

### New Files (7)
- `src/theme/themeConfig.ts`
- `src/components/PageHeader.tsx`
- `src/components/StatusBadge.tsx`
- `src/components/ExpiryTag.tsx`
- `src/components/EmptyState.tsx`
- `src/components/RevokeModal.tsx`
- `src/utils/download.ts`
- `src/utils/format.ts`

### Modified Files (21)
- `src/index.css` (complete rewrite)
- `src/main.tsx`
- `src/app/AppLayout.tsx` (complete rewrite)
- `src/app/routeComponents.tsx`
- `src/app/router.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx` (complete rewrite)
- `src/features/self-declarations/pages/SelfDeclarationPage.tsx`
- `src/features/product-registrations/pages/ProductRegistrationPage.tsx`
- `src/features/product-registrations/pages/PublicProductRegistrationLookupPage.tsx`
- `src/features/advertisement-registrations/pages/AdvertisementRegistrationPage.tsx`
- `src/features/eligibility-certificates/pages/EligibilityCertificatePage.tsx`
- `src/features/eligibility-certificates/pages/PublicEligibilityCertificateLookupPage.tsx`
- `src/features/cfs-certificates/pages/CfsCertificatePage.tsx`
- `src/features/cfs-certificates/pages/PublicCfsCertificateLookupPage.tsx`
- `src/features/businesses/pages/BusinessManagementPage.tsx`
- `src/features/businesses/components/BusinessManagementView.tsx`
- `src/features/organizations/pages/OrganizationListPage.tsx`
- `src/features/organizations/components/OrganizationListView.tsx`
- `src/features/catalogs/pages/MasterCatalogPage.tsx`
- `src/features/catalogs/components/MasterCatalogView.tsx`
- `src/features/geography/pages/GeographicCatalogPage.tsx`
- `src/features/identity/pages/IdentityAdministrationPage.tsx`
- `vite.config.ts`
