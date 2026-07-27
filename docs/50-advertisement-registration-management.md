# Advertisement-registration management (STT 23)

Implementation completed and reviewed on 2026-07-25.

## Domain and persistence

`AdvertisementRegistration` is a full-audited licensing aggregate owned by a
business and organization. It links one or more advertised products through
the many-to-many model accepted in OQ-008; every linked product must belong to
the same business and organization.

- Registration numbers are normalized to uppercase and unique globally,
  including retained soft-deleted history.
- Registration date cannot be after expiry date.
- Revocation is terminal and records the required reason, actor and time.
- Effective status is derived on every projection, while a Hangfire recurring
  job persists newly expired active registrations daily in `Asia/Bangkok`.
- `AddAdvertisementRegistrations` creates the reviewed checks, partial
  operational indexes, composite ownership foreign keys and shared-primary-key
  `document_owners` relationship.

## Authorization and scope

The Licensing permission tree provides independent View, Create, Edit and
Delete permissions. Province and district roles can maintain registrations;
commune roles are read-only.

All list, detail, option, mutation, export and attachment operations apply
operation-aware organization, geography, business type, business and
product-group scope. Product choices are restricted independently, preventing
a product-group-scoped user from selecting other products belonging to the
same business. This internal STT 23 slice deliberately exposes no anonymous
projection; consolidated public license lookup belongs to STT 43.

## Files, export and interface

The module reuses the private MinIO attachment store and its size,
extension/MIME/signature/OpenXML checks, synchronous fail-closed ClamAV scan,
checksum verification and retained soft deletion. Revoked registrations
cannot receive or delete files.

The permission-gated `/advertisement-registrations` workspace supports
Vietnamese search, business, advertising-type and effective-status filters,
30/60/90-day expiry windows, multi-product CRUD, terminal revocation, secure
files and scoped Excel export up to 50,000 rows.

## Verification

- Backend Release build passes with zero warnings; 122 tests pass.
- Frontend Prettier, Oxlint, strict TypeScript, 41 Vitest tests and production
  build pass.
- EF reports no pending model changes and the Docker one-shot migrator applies
  the eleventh migration to PostgreSQL 15.
- PostgreSQL inspection verifies the business/organization/product ownership
  keys, three checks, unfiltered global unique number and operational indexes.
- Hangfire stores the daily `0 0 * * *` schedule with `Asia/Bangkok`.
- Authenticated Playwright validates Excel, multi-product create and
  relationship replacement, clean PDF upload/download/delete, terminal
  revocation, rejected post-revocation upload, soft deletion and rejection of
  retained-number reuse.
- Runtime E2E additionally verified that the typed document owner is flushed
  before the registration insert, satisfying the non-deferrable database key.
