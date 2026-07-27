# 53 — FoodSafe UI/UX Redesign Plan

## Audit Summary

The FoodSafe frontend is functionally complete for implemented features but has significant visual and structural deficiencies:

### Critical Issues Found
1. **No design system** — only 3 Ant Design tokens set; all styling is inline hardcoded values
2. **Dead scaffold code** — `App.tsx`, `App.css`, and most of `index.css` are Vite starter template leftovers
3. **Empty shared components** — all 8 directories under `src/components/` are empty placeholders
4. **Empty utils** — `saveDownload` duplicated 6 times, `formatBytes` 3 times across features
5. **Dashboard is a stub** — shows only welcome text, no metrics or useful content
6. **Flat sidebar** — no navigation grouping, identical icons for 4 different licensing features
7. **Raw URL slugs in breadcrumb** — shows "self-declarations" instead of Vietnamese labels
8. **No error boundaries or query error states** — failed API calls show empty tables silently
9. **Inconsistent pagination** — ranges from 10 to 100 per page, some pages have no pagination
10. **Bugs** — `Space orientation="vertical"` (should be `direction`), CFS pages have wrong titles

### DRY Violations
- `saveDownload()` — 6 copies across pages
- `formatBytes()` — 3 copies in attachment modals
- `statusTag()` — 5 identical license status renderers
- `expiryText()` — 4 partial copies with inconsistent extraction
- Revoke Modal — 5 copies of identical confirmation dialog
- Attachment Modal — 3 near-identical file upload components

---

## Design Direction

Professional, modern, restrained, trustworthy. Appropriate for Vietnamese government food-safety staff who use the system daily.

### Color Palette
- **Primary:** `#00796B` (teal) — food safety association, professional, distinct from generic Ant Design blue
- **Success:** `#389E0D` | **Warning:** `#D48806` | **Error:** `#CF1322` | **Info:** `#0958D9`
- **Layout background:** `#F0F2F5` (light gray canvas)
- **Card/content background:** `#FFFFFF`
- **Sidebar:** `#001529` (dark navy, Ant Design standard)

### Typography
- **Font stack:** system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
- **Base size:** 14px (Ant Design default)
- **Heading weights:** 600 for page titles, 500 for section titles

### Spacing
- 4px grid: 4, 8, 12, 16, 20, 24, 32
- Page padding: 24px (desktop), 16px (mobile)
- Card padding: 20px
- Filter toolbar gap: 12px

---

## Implementation Plan

### Step 1: Design Tokens & Global Styles
- Create `src/theme/themeConfig.ts` with centralized Ant Design theme
- Replace `src/index.css` with proper reset (remove Vite scaffold)
- Update `src/main.tsx` to use new theme

### Step 2: Shared Utilities
- Create `src/utils/download.ts` (extract `saveDownload`)
- Create `src/utils/format.ts` (extract `formatBytes`)

### Step 3: Shared Components
- `PageHeader` — title, subtitle, actions
- `StatusBadge` — license/entity status tags
- `ExpiryTag` — expiry countdown display
- `EmptyState` — consistent empty data state
- `RevokeModal` — shared revocation dialog

### Step 4: Application Shell
- Redesign `AppLayout` with grouped sidebar navigation
- Vietnamese breadcrumb labels
- Compact header with border instead of shadow
- Content area without card wrapper (pages manage own cards)

### Step 5: Sidebar Navigation Groups
1. Tong quan — Bảng điều khiển
2. Quản trị hệ thống — Tài khoản, Đơn vị, Địa bàn, Danh mục
3. Cơ sở và sản phẩm — Cơ sở SXKD
4. Công bố và giấy phép — 5 licensing features

### Step 6: Dashboard
- Summary stat cards with real API hooks where available
- Meaningful empty states for missing integrations
- Layout ready for future data

### Step 7: List Pages
- Standardize all with PageHeader + page-card pattern
- Consistent filter toolbar styling
- Shared StatusBadge and ExpiryTag
- Shared RevokeModal
- Extract cross-feature attachment modal
- Fix CFS wrong page titles

### Step 8: Empty/Loading/Error States
- Add EmptyState component to all tables
- Error boundaries at route level
- Query error display

### Step 9: Responsive & Accessibility
- Mobile sidebar drawer
- Form column collapse
- Table horizontal scroll
- Focus states, semantic HTML, ARIA labels

### Step 10: Verification
- TypeScript type check
- ESLint/oxlint
- Production build
- Visual consistency review

---

## Files Changed

### New Files
- `src/theme/themeConfig.ts`
- `src/utils/download.ts`
- `src/utils/format.ts`
- `src/components/PageHeader.tsx`
- `src/components/StatusBadge.tsx`
- `src/components/ExpiryTag.tsx`
- `src/components/EmptyState.tsx`
- `src/components/RevokeModal.tsx`

### Modified Files
- `src/index.css` — replaced with proper reset
- `src/main.tsx` — new theme config
- `src/app/AppLayout.tsx` — redesigned shell
- `src/app/routeComponents.tsx` — consistent loading
- `src/features/dashboard/pages/DashboardPage.tsx` — redesigned
- All list pages — standardized with shared components
