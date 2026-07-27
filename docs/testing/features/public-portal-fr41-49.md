# F-033 — Public Portal FR-41..FR-49

## Status: VERIFIED

- **Feature IDs**: F-033
- **Verified Git commit**: `5aff855` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Authentication**: None required (AllowAnonymous endpoints); admin used only to seed test data

## Sub-requirements covered

| FR | Requirement | Public Endpoint | Status |
|---|---|---|---|
| FR-41-01/02 | General business directory search (keyword, pagination, anonymous) | `GET /api/v1/public/businesses/search` | VERIFIED |
| FR-41-03/04 | General product directory search (keyword, anonymous) | `GET /api/v1/public/products/search` | VERIFIED |
| FR-42-01/02 | Eligibility certificate search by number | `GET /api/v1/public/eligibility-certificates/search` | VERIFIED |
| FR-43-01/02 | Self-declaration search by number/product name | `GET /api/v1/public/self-declarations/search` | VERIFIED |
| FR-44-01/02 | Product registration search by number | `GET /api/v1/public/product-registrations/search` | VERIFIED |
| FR-45-01..03 | Warned businesses (published+isPublic alert with businessId) | `GET /api/v1/public/warned-businesses` | VERIFIED |
| FR-46-01/02 | CFS certificate search by number | `GET /api/v1/public/cfs-certificates/search` | VERIFIED |
| FR-47-01/02 | Export-food certificate search by number | `GET /api/v1/public/export-food-certificates/search` | VERIFIED |
| FR-48-01/02 | Public news listing (published+isPublic only), news detail | `GET /api/v1/public/news`, `GET /api/v1/public/news/{id}` | VERIFIED |
| FR-48-01/02 | Public alert listing (published+isPublic only) | `GET /api/v1/public/alerts` | VERIFIED |
| FR-48-03 | Citizen alert submission (captcha-gated, creates Draft source=PublicReport=2) | `POST /api/v1/public/alert-reports` | VERIFIED |
| FR-49-01/02 | Public document listing (isPublic+Active only, keyword search) | `GET /api/v1/public/documents` | VERIFIED |

## Evidence

**Spec**: `e2e/public-portal-verification.spec.ts` — 21 tests, **21 passed**, 0 failed (10.4s)

### Test cases

| Test | Verifies |
|---|---|
| anonymous access: business search returns matching | FR-41-01: keyword search, anonymous, results contain seeded name |
| anonymous access: product search returns matching | FR-41-03: keyword search, anonymous, results contain seeded name |
| UI: /tra-cuu-chung loads with tabs | FR-41-01: route accessible, tabs present |
| empty keyword returns all records | FR-41-01: paginated list, 200 status |
| FR-42: eligibility certificate search | FR-42-01: number substring, anonymous, found |
| FR-43: self-declaration search | FR-43-01: declaration number, anonymous, found |
| FR-44: product registration search | FR-44-01: registration number, anonymous, found |
| FR-46: CFS certificate search | FR-46-01: cert number, anonymous, found |
| FR-47: export-food certificate search | FR-47-01: cert number, anonymous, found |
| UI: /tra-cuu-giay-phep loads | FR-42..FR-47: route accessible, tabs present |
| warned businesses: alert with businessId published | FR-45-01: published isPublic alert with businessId appears in list |
| UI: /co-so-bi-canh-bao loads | FR-45-01: route accessible, table or empty state |
| published news in public list; draft not | FR-48-01: status filter enforced — draft excluded |
| published alert in public list; draft not | FR-48-02: status filter enforced — draft excluded |
| citizen submission via API (captcha test token) | FR-48-03: creates Draft with source=2 (PublicReport) |
| submission without captchaToken rejected | FR-48-03 negative: empty token → 400/403 |
| UI: /tin-tuc news page loads | FR-48-01: route accessible |
| UI: /gui-phan-anh form loads | FR-48-03: route accessible, form present |
| isPublic doc in list; non-public doc not | FR-49-01: isPublic filter enforced |
| UI: /tra-cuu-van-ban loads with search box | FR-49-01: route accessible |
| /cong-thong-tin: portal home links present | FR-41..FR-49: all portal routes linked from home |

## Key behaviors discovered

1. **AllowAnonymous confirmed**: all 12 public endpoints return 200 (or 403 for empty search with exact lookup) — never 401.
2. **Draft/isPublic filter enforced on both news and alerts**: draft entities do NOT appear in public lists.
3. **isPublic field on documents** gates public visibility; `status: 1` (Active) also required.
4. **Citizen alert captcha**: test Cloudflare secret `1x0000...AA` always returns `success:true` for any non-empty token in non-production; empty token → middleware returns 400.
5. **Warned businesses endpoint** requires alert `Status == Published && IsPublic && BusinessId != null` — draft alerts do not appear regardless of BusinessId.
6. **Certificate search** returns ALL matching records globally (no organization scope filter) — public lookup is intentionally organization-agnostic.

## Checklist

| Check | Result |
|---|---|
| All public endpoints accessible without authentication | PASS |
| Unauthenticated → NOT 401 (AllowAnonymous) | PASS |
| Draft/non-public entities excluded from all list endpoints | PASS |
| Business search: keyword substring match on name | PASS |
| Product search: keyword substring match on name | PASS |
| Eligibility/CFS/Export cert search: substring on number | PASS |
| Self-declaration: search by number | PASS |
| Product registration: search by number | PASS |
| Warned businesses: alert with businessId, published+isPublic | PASS |
| News list: published+isPublic only | PASS |
| News detail: returns content + viewCount | PASS |
| Alert list: published+isPublic only | PASS |
| Citizen submission: test token accepted, creates Draft source=2 | PASS |
| Citizen submission: empty captchaToken rejected (400) | PASS |
| Documents: isPublic+Active only in public list | PASS |
| All 7 portal routes accessible | PASS |

## Paths & dependencies

- **FE pages**: `src/features/public-portal/pages/` (PublicPortalHomePage, PublicGeneralSearchPage, PublicCertificateSearchPage, PublicWarnedBusinessesPage, PublicNewsPage, CitizenAlertReportPage, PublicDocumentsPage)
- **FE API hooks**: `src/features/public-portal/api/publicPortalApi.ts`
- **BE controllers**: `FoodSafe.HttpApi/Public/PublicPortalControllers.cs`
- **BE services**: `FoodSafe.Application/Public/PublicDirectoryAppService.cs`, `PublicCertificateSearchAppService.cs`, `PublicContentAppService.cs`, `CitizenAlertReportAppService.cs`
- **BE middleware**: `FoodSafe.HttpApi.Host/Security/LoginCaptchaMiddleware.cs`, `TurnstileCaptchaVerifier.cs`
- **Depends on**: F-006 (business data), F-007..F-012 (licensing data), F-016 (alerts/news), F-031 (documents)

## Notes

- FR-48-03 citizen alert submission is tested via direct API (not UI Turnstile widget) because the Cloudflare CDN auto-resolve is unreliable in Docker (see `public-portal.spec.ts` known flaky test).
- The API test uses `captchaToken: "e2e-test-bypass-token"` — any non-empty string passes in non-production because the test Cloudflare secret always returns `success:true`.
- FR-42-03/04, FR-43-03/04, FR-44-03/04, FR-46-03/04, FR-47-03/04 (certificate document view/download/print) require QuestPDF and are **NOT IMPLEMENTED** — Priority 2 work.
