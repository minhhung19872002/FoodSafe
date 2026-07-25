# Eligibility-certificate management (STT 24)

Implementation completed and reviewed on 2026-07-25.

## Domain and persistence

`EligibilityCertificate` is a full-audited licensing aggregate owned by one
business and organization.

- Certificate numbers are normalized to uppercase and unique globally,
  including retained soft-deleted history.
- Issue date cannot be after expiry date.
- Revocation is terminal and records the required reason, actor and time.
- Effective status is derived on every projection, while a Hangfire recurring
  job persists newly expired active certificates daily in `Asia/Bangkok`.
- `AddEligibilityCertificates` creates the reviewed status/date/revocation
  checks, operational indexes, composite business ownership and
  shared-primary-key `document_owners` relationship.
- `Business.HasEligibilityCertificate` is synchronized from active,
  non-revoked certificates after create, update, revoke, delete and automatic
  expiry; the certificate table is the authoritative source.

## Authorization, scope and public lookup

The Licensing permission tree provides independent View, Create, Edit and
Delete permissions. Province staff and district administrators can issue and
maintain certificates; district staff and commune roles are read-only.
Deletion remains limited to system and province administrators.

All internal list, detail, option, mutation, export and attachment operations
apply operation-aware organization, geography, business type, business and
product-group scope. The same review also removed product-group-derived
business broadening from product/declaration/registration queries and their
file scope checkers for STT 20–23.

The anonymous exact-number lookup returns only certificate number, dates,
authority, certification scope, business name and effective status. It does
not expose internal notes, identifiers, audit actors or private files.

## Files, export and interface

The module reuses the private MinIO attachment store and its size,
extension/MIME/signature/OpenXML checks, synchronous fail-closed ClamAV scan,
checksum verification and retained soft deletion. Revoked certificates cannot
receive or delete files.

The permission-gated `/eligibility-certificates` workspace supports Vietnamese
search, business/effective-status filters, 30/60/90-day expiry windows, CRUD,
terminal revocation, secure files and scoped Excel export up to 50,000 rows.
The anonymous `/tra-cuu-giay-du-dieu-kien` route provides exact-number lookup.

## Verification

- Backend Release build passes with zero warnings; 126 tests pass.
- Frontend Prettier, Oxlint, strict TypeScript, 44 Vitest tests and production
  build pass.
- EF reports no pending model changes and the Docker one-shot migrator applies
  the twelfth migration to PostgreSQL 15.
- PostgreSQL inspection verifies composite business/document ownership, three
  checks, unfiltered global unique number and operational indexes.
- Hangfire stores the daily `0 0 * * *` schedule with `Asia/Bangkok`.
- Authenticated Playwright validates create, cache activation, Excel, clean
  PDF upload/download/delete, public lookup, terminal revocation, cache
  deactivation, rejected post-revocation upload, soft deletion and rejection
  of retained-number reuse.
