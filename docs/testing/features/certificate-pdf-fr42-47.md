# F-034: Certificate PDF Download

**Feature ID:** F-034
**Status:** VERIFIED
**Verified Git commit:** (pending — commit after this document)
**Verification date:** 2026-07-27
**Environment:** Docker Compose — PostgreSQL 15, Redis 7, MinIO, ASP.NET Core API, nginx+React frontend

---

## Feature description

Provides PDF download for 5 certificate types through anonymous public endpoints:

| Certificate type | PDF endpoint |
|---|---|
| Eligibility certificate | `GET /api/v1/public/eligibility-certificates/{id}/pdf` |
| Self declaration | `GET /api/v1/public/self-declarations/{id}/pdf` |
| Product registration | `GET /api/v1/public/product-registrations/{id}/pdf` |
| CFS certificate | `GET /api/v1/public/cfs-certificates/{id}/pdf` |
| Export food certificate | `GET /api/v1/public/export-food-certificates/{id}/pdf` |

Advertisement registrations intentionally have no PDF endpoint.

The public certificate search page (`/tra-cuu-giay-phep`) shows a "Tải PDF" download button in each of the 5 certificate tabs.

---

## Verification spec

`e2e/certificate-pdf-verification.spec.ts` — 8 tests, all pass

---

## Test account

`admin` (PROVINCE_ORG_ID: `e2e00000-0000-4000-8010-000000000001`)

---

## API interception used

**No** — all requests hit the real backend

---

## Frontend route

`/tra-cuu-giay-phep` (public, anonymous)

---

## Backend endpoints verified

- `GET /api/v1/public/eligibility-certificates/{id}/pdf`
- `GET /api/v1/public/self-declarations/{id}/pdf`
- `GET /api/v1/public/product-registrations/{id}/pdf`
- `GET /api/v1/public/cfs-certificates/{id}/pdf`
- `GET /api/v1/public/export-food-certificates/{id}/pdf`
- `GET /api/v1/public/eligibility-certificates/search` (returns `id` field)

---

## Successful flows tested

- All 5 PDF endpoints return HTTP 200 with `Content-Type: application/pdf`
- PDF response body starts with `%PDF` (valid PDF magic bytes)
- Response body is > 1000 bytes (real PDF content with Vietnamese certificate data)
- Public search endpoint returns `id` in each result for constructing the PDF download URL
- "Tải PDF" link appears in the eligibility cert tab on the UI page
- "Tải PDF" links are NOT present in the ad-registrations tab (correctly no PDF endpoint)

---

## Negative flows tested

- Unknown certificate ID → returns non-200 response, Content-Type is not `application/pdf`

---

## Validation result

N/A (no input validation — PDF endpoint takes only a GUID route parameter)

---

## Permission result

Endpoint is `[AllowAnonymous]` — accessible without authentication, verified by using anonymous requests without credentials

---

## Organization-isolation result

Public endpoint — no org isolation; all published certificates are accessible by any anonymous caller

---

## Workflow result

N/A (read-only PDF generation)

---

## Persistence-after-reload result

PDF content is generated on-demand from database data — no persistence needed

---

## Loading-state result

N/A (PDF download via direct link `href`)

---

## Empty-state result

Unknown ID returns non-200 error (not a PDF)

---

## Error-state result

Unknown certificate ID returns an error response (500 in development mode due to developer exception page; 403 in production with ABP exception handler)

---

## Related frontend source paths

- `FoodSafe.FE/src/features/public-portal/pages/PublicCertificateSearchPage.tsx`
- `FoodSafe.FE/src/features/public-portal/types/publicPortal.types.ts`

---

## Related backend source paths

- `FoodSafe.BE/src/FoodSafe.Application.Contracts/Public/PublicPortalDtos.cs` — `CertificatePdfDto`, `ICertificatePdfAppService`
- `FoodSafe.BE/src/FoodSafe.Application/Public/CertificatePdfAppService.cs` — QuestPDF implementation
- `FoodSafe.BE/src/FoodSafe.HttpApi/Public/PublicPortalControllers.cs` — `CertificatePdfController`
- `FoodSafe.BE/src/FoodSafe.Application/Public/PublicCertificateSearchAppService.cs` — returns `Id` in search results

---

## Shared dependencies

- QuestPDF 2024.10.2 (`LicenseType.Community`)
- `PublicCertificateSummaryDto.Id` — required for FE to construct PDF URL
- All certificate domain entities: `EligibilityCertificate`, `SelfDeclaration`, `ProductRegistration`, `CfsCertificate`, `ExportFoodCertificate`

---

## Conditions requiring retest

- Changes to any of the 5 certificate domain entities
- Changes to `CertificatePdfAppService.cs`
- Changes to QuestPDF package version
- Changes to `PublicCertificateSearchPage.tsx`
