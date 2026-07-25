# Business and product management (STT 19–20)

Implementation started on 2026-07-25.

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

## Remaining in this slice

Frontend list/detail/forms, map selection, handler editing, product screens,
Excel import/export, attachments, MSW integration tests, authenticated
Playwright coverage, and rebuilt full-stack validation remain in progress.
