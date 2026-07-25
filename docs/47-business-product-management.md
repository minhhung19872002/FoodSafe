# Business and product management (STT 19–20)

Implementation completed and reviewed on 2026-07-25.

## Backend foundation

The executable model now covers businesses, their product-group assignments,
food handlers, and products. It follows the reviewed schema rather than
treating the SQL document as runtime persistence.

- Business identity keeps code and tax code unique across retained,
  non-deleted history.
- Product code is unique within its owning business.
- A composite foreign key requires every product to share the
  `organization_id` of its parent business.
- Address hierarchy, GPS ranges, suspended-business reason, non-negative
  employee/expiry values, and handler certificate ordering are enforced in
  both domain logic and PostgreSQL constraints.
- The previously declared `Business`, `BusinessType`, and `ProductGroup`
  management-scope assignments now participate in the current-user scope
  union alongside organization and geography.
- Business and product application services enforce independent
  view/create/edit/delete permissions before applying row scope.

## Verification

The `AddBusinessManagement` migration applied all migrations to a clean,
disposable PostgreSQL 15 database and created the four expected tables. The
database was dropped after verification. Domain, application-contract,
mapping, architecture, and existing regression tests pass.

The Vietnamese SPA now provides permission-aware facility and product tabs,
search/status filters, paged CRUD, map selection, catalog-backed fields, and
responsible-person lifecycle management. All Ant Design form controls are
bound through React Hook Form controllers and validated by Zod; ABP sequential
GUID values are accepted without weakening the 36-character GUID shape check.
The authenticated current-user projection includes every business/product
permission used by navigation and route guards. Product-only sessions use a
separately scoped business-option endpoint and never depend on the facility
view permission.

Authenticated Playwright validation completes create/edit/delete for a
facility, creates its responsible person, and creates/deletes its product
against the Docker stack.

Both tabs provide permission-aware Excel template download, full-workbook
preview, error reporting, one-use confirmation tokens, transactional import
and scope-preserving export. Uploads accept only `.xlsx`, enforce compressed
and expanded size limits, validate workbook structure and references, and
never commit a partially valid file.

Products use the shared-primary-key `document_owners` attachment model.
Metadata and SHA-256 checksums remain in PostgreSQL while server-generated
object keys address private MinIO objects. Upload validates file size,
extension, MIME and content signature, rejects traversal/control-character
names, scans synchronously through ClamAV, and fails closed. List, download
and delete re-check product permission and data scope; download also verifies
the stored checksum. An infected OpenXML EICAR fixture is rejected in Docker
E2E while a clean PDF completes upload, download and deletion.

Frontend type checking, lint, 32 Vitest tests, production build and both
Playwright suites pass. The backend builds with zero warnings and all 110
tests pass. The attachment migration applied through the real PostgreSQL
migrator and backfilled typed owners for existing products.
