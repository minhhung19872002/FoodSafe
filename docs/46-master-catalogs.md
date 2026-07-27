# Master catalogs (STT 08–18)

Implemented on 2026-07-25.

## Coverage

The authenticated `/catalogs` workspace provides search, paging, activation
state, and permission-gated create/edit/delete for countries, eight
socio-economic regions, facility classifications, two-level product groups,
facility/advertisement/document types, testing centers, and testing services.

The idempotent seed installs Việt Nam and the eight required regions without
overwriting user-created catalog data.

## Authorization and integrity

`FoodSafe.Catalogs.View`, `.Create`, `.Edit`, and `.Delete` are independent.
System and province administrators receive all operations. Province staff
receive catalog CRUD as specified by the approved matrix. District and commune
roles receive read-only access.

- Codes are normalized and unique.
- Product groups allow only a level-1 root or level-2 child of a level-1 group.
- Risk levels use `1=High`, `2=Medium`, `3=Low`.
- Testing-center geography is checked in the application and enforced by
  composite database foreign keys.
- Testing-service codes are center-scoped; negative commercial values fail.
- Referenced centers, product groups, business types, regions, and hierarchy
  parents cannot be deleted.

## Verification

`AddMasterCatalogs` applied with its seed on a clean disposable PostgreSQL 15
database, producing seven approved `cat_*` tables, two data-scope foreign keys,
Việt Nam, and eight regions. The database was removed after validation.

The development stack is healthy. Authenticated cookie/fresh-CSRF lifecycle
checks covered create, update, dependency rejection (`403`), delete, and
cleanup. OpenAPI exposes 27 versioned master-catalog paths.

## Frontend architecture and regression coverage

The catalog feature was aligned with the repository `CLAUDE.md` conventions
before starting STT 19–20:

- transport DTOs are normalized by adapters, including nullable API fields;
- TanStack Query queries and mutations are isolated under the feature `api/`;
- the page is a stateful container and the table is a pure presenter;
- modal input uses React Hook Form with one Zod schema for common and
  catalog-specific rules;
- Vitest integration tests use MSW v2 instead of mocking the Axios client; and
- Playwright exercises authenticated document-type create, edit, delete, and
  deterministic cleanup against the rebuilt Docker stack.

The application contract suite also verifies all 36 catalog operations are
implemented and that view/create/edit/delete methods retain least-privilege
permission boundaries.
