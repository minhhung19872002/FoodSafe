# Product-registration management (STT 22)

Implementation completed and reviewed on 2026-07-25.

## Domain and persistence

`ProductRegistration` is a full-audited licensing aggregate owned by a
business and organization. Its optional product must belong to that same
business and organization.

- Registration numbers are normalized to uppercase and unique globally,
  including retained soft-deleted history.
- Registration date cannot be after expiry date.
- Revocation is terminal and records the required reason, actor and time.
- Effective status is derived on every projection, while a Hangfire recurring
  job persists newly expired active registrations daily in `Asia/Bangkok`.
- `AddProductRegistrations` creates the reviewed checks, indexes, composite
  parent foreign keys and shared-primary-key `document_owners` relationship.

## Authorization, scope and public lookup

The Licensing permission tree provides independent View, Create, Edit and
Delete permissions. Province and district roles can maintain registrations;
commune roles are read-only as specified by the permission matrix.

All authenticated list, detail, option, mutation, export and attachment
operations apply operation-aware organization, geography, business type,
business and product-group scope. The anonymous lookup endpoint accepts an
exact registration number and returns only a safe regulatory projection; it
does not expose internal notes, audit actors, identifiers or files.

## Files, export and interface

The module reuses the private MinIO attachment store and its size,
extension/MIME/signature/OpenXML checks, synchronous fail-closed ClamAV scan,
checksum verification and retained soft deletion. Revoked registrations
cannot receive or delete files.

The permission-gated `/product-registrations` workspace supports Vietnamese
search, business/status filters, 30/60/90-day expiry windows, CRUD, terminal
revocation, secure files and scoped Excel export up to 50,000 rows. The public
route `/tra-cuu-dang-ky-cong-bo` supports exact-number verification, including
official numbers containing `/`.

## Verification

- Backend Release build passes with zero warnings; 118 tests pass.
- Frontend Prettier, Oxlint, strict TypeScript, 38 Vitest tests and production
  build pass.
- EF reports no pending model changes and the Docker one-shot migrator applies
  the migration to PostgreSQL 15.
- PostgreSQL inspection verifies all four ownership keys, three checks,
  unfiltered global unique number and operational indexes.
- Hangfire stores the daily `0 0 * * *` schedule with `Asia/Bangkok`.
- Authenticated Playwright validates create, Excel, clean PDF upload, public
  lookup, revocation, rejected post-revocation upload, soft deletion and
  rejection of retained-number reuse.
