# Self-declaration management (STT 21)

Implementation completed and reviewed on 2026-07-25.

## Domain and persistence

`SelfDeclaration` is a full-audited aggregate owned by a business and its
organization. An optional product link must point to a product belonging to
that same business and organization.

- Declaration numbers are normalized to uppercase and unique per business
  across retained soft-deleted history.
- Declaration date cannot be after expiry date.
- Active and expired status is evaluated against the current date in every
  list/detail/export projection. This prevents stale display if a scheduled
  process is delayed.
- Revocation is terminal and requires reason, authenticated actor and
  timestamp. Revoked records and their files cannot be edited.
- `AddSelfDeclarations` adds the reviewed PostgreSQL checks, indexes, composite
  parent keys and the shared-primary-key relationship to `document_owners`.

## Authorization and API

The module defines independent View, Create, Edit and Delete permissions and
projects them to the authenticated SPA session. Every list, detail, mutation,
option, export and file operation applies operation-aware data scope.

The versioned API supports paged filtering by text, business, product, status
and expiry window; detail; create; update; delete; revoke; business/product
options; Excel export; and attachment list/upload/download/delete.

## Files and exports

The attachment implementation was refactored into one shared store used by
products and self-declarations. Authorization stays owner-specific while the
security pipeline remains centralized:

- private MinIO object keys are generated server-side;
- allowed size, extension, MIME, file signature and OpenXML expansion are
  checked before storage;
- ClamAV scanning is synchronous and fails closed;
- downloads require a clean scan and matching SHA-256 checksum;
- metadata uses soft deletion while object retention is preserved.

Excel export preserves all active filters, business scope and effective
status, limits output to 50,000 rows and emits a Vietnamese workbook.

## User interface

The permission-gated `/self-declarations` workspace provides Vietnamese
search, business/status filters, 30/60/90-day expiry views, paged results,
create/edit/delete, explicit revocation, Excel export and secure file
management. Expiring records show the remaining day count and revoked records
hide mutation controls except permitted deletion.

## Verification

- Backend Release build: zero warnings.
- Backend tests: 114 pass across domain, application, EF/PostgreSQL and host
  security suites.
- Frontend: formatting, Oxlint, strict TypeScript, 35 Vitest tests and
  production build pass.
- The migration applies successfully to PostgreSQL 15 through the Docker
  one-shot migrator.
- Authenticated Playwright validates create, Excel download, clean PDF
  upload/download/delete, revocation, post-revocation upload rejection,
  soft-delete and rejection of official-number reuse.
