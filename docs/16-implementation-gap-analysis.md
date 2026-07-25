# Implementation Gap Analysis — FoodSafe

## Audit metadata

- Audit date: 2026-07-25
- Source priority: original 42-page technical-requirement PDF, accepted decisions, state machines/permission matrix, database documents, API contract, implementation
- Backend baseline: Release build has 0 warnings; 53 tests pass, including
  domain, application, PostgreSQL/EF, host-security, API-contract, and
  architecture checks.
- Frontend baseline: Prettier, Oxlint, strict TypeScript, 15 component/route
  tests, and the production build pass.
- Database baseline: five EF migrations apply cleanly to PostgreSQL 15 and EF
  reports no pending model changes.
- Runtime baseline: production-shaped Compose images and a complete
  development stack pass health, authentication, authorization, recovery, and
  versioned-OpenAPI probes.
- Overall conclusion: deployable foundation with three completed administrative
  slices; still not production-ready because most of the 57 functional
  requirements and the final security/recovery gates remain incomplete.

Status vocabulary: **Built-in** means ABP supplies a partial capability that still needs FoodSafe configuration and verification. **Partial** means working code exists but the requirement quality gate is not met. **Design only** means the reviewed SQL covers the requirement but executable EF persistence does not yet exist.

## Requirement coverage

| ID | Module | Backend | Frontend | Database | Tests | Security | Missing work | Priority |
|---|---|---|---|---|---|---|---|---|
| STT-01 | Roles | Implemented | Implemented | Migrated ABP | Domain/API/UI/live | Hardened | Remaining release-wide accessibility/E2E regression only | P0 |
| STT-02 | Users | Implemented | Implemented | Identity + password history | Domain/API/UI/live | Hardened and scoped | Remaining release-wide accessibility/E2E regression only | P0 |
| STT-03 | Audit log | Built-in | Missing | Migrated ABP | Indirect | Partial | Scoped query UI/API, retention, masking and export controls | P1 |
| STT-04 | Settings | Built-in | Missing | Migrated ABP | Indirect | Partial | Typed FoodSafe settings, permissions, UI and audit tests | P1 |
| STT-05 | Access management | Implemented | Implemented | Permission grants + scope assignments | Domain/API/UI/live | Scoped grant ceiling | Remaining release-wide negative-matrix regression only | P0 |
| STT-06 | Organizations | Implemented | Implemented | Migrated | Domain/application/EF/UI/live | Scoped | Remaining release-wide accessibility/E2E regression only | P0 |
| STT-07 | Organization accounts | Implemented | Implemented | Scope assignments migrated | Domain/API/UI/live | Operation-scoped | Remaining release-wide accessibility/E2E regression only | P0 |
| STT-08 | Countries | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P0 |
| STT-09 | Regions | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P0 |
| STT-10 | Provinces | Implemented | Implemented | Migrated | Domain/EF/UI/live | Scoped | Remaining release-wide accessibility/E2E regression only | P0 |
| STT-11 | Districts/communes | Implemented | Implemented | Migrated | Domain/EF/UI/live | Scoped hierarchy | Remaining release-wide accessibility/E2E regression only | P0 |
| STT-12 | Facility classifications | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P1 |
| STT-13 | Product groups | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P1 |
| STT-14 | Facility business types | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P1 |
| STT-15 | Advertising types | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P1 |
| STT-16 | Laboratories | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P1 |
| STT-17 | Laboratory services | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P1 |
| STT-18 | Document types | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P1 |
| STT-19 | Facilities | Missing | Missing | Design only | Missing | High gaps | CRUD, scope, history, map, import/export, attachments | P0 |
| STT-20 | Products | Missing | Missing | Design only | Missing | High gaps | CRUD, scope, history, import/export | P0 |
| STT-21 | Self-declarations | Missing | Missing | Design only | Missing | High gaps | Lifecycle, files, scope, exports | P0 |
| STT-22 | Product registrations | Missing | Missing | Design only | Missing | High gaps | Full lifecycle slice | P0 |
| STT-23 | Advertising registration | Missing | Missing | Design only | Missing | High gaps | Full lifecycle slice | P1 |
| STT-24 | Eligibility certificates | Missing | Missing | Design only | Missing | High gaps | Full lifecycle slice | P0 |
| STT-25 | CFS certificates | Missing | Missing | Design only | Missing | High gaps | Full lifecycle slice | P1 |
| STT-26 | Export certificates | Missing | Missing | Design only | Missing | High gaps | Full lifecycle slice | P1 |
| STT-27 | Inspection plans | Missing | Missing | Design only | Missing | High gaps | Explicit transitions, targets, files, export | P0 |
| STT-28 | Inspection results | Missing | Missing | Design only | Missing | High gaps | Results, violations, actions, history, export | P0 |
| STT-29 | Food-safety warnings | Missing | Missing | Design only | Missing | High gaps | Internal/public workflows, publication, files | P0 |
| STT-30 | News/activities | Missing | Missing | Design only | Missing | High gaps | Editorial workflow and public display | P1 |
| STT-31 | Small poisoning cases | Missing | Missing | Design only | Missing | High gaps | Workflow, scope, correction, history, export | P0 |
| STT-32 | Poisoning incidents | Missing | Missing | Design only | Missing | High gaps | Workflow, scope, closing report, export | P0 |
| STT-33 | Monthly poisoning reports | Missing | Missing | Design only | Missing | High gaps | Immutable versioned workflow and aggregation | P0 |
| STT-34 | Food-safety operational reports | Missing | Missing | Design only | Missing | High gaps | Semiannual/annual workflow and calculations | P0 |
| STT-35 | Action Month reports | Missing | Missing | Design only | Missing | High gaps | Annual versioned workflow | P0 |
| STT-36 | Hazard analysis | Missing | Missing | Design only | Missing | High gaps | Authoring, publication, public view, export | P1 |
| STT-37 | Laboratory results | Missing | Missing | Design only | Missing | High gaps | Structured results, lifecycle, services, export | P1 |
| STT-38 | Administrative documents | Missing | Missing | Design only | Missing | High gaps | Search, secure files, display, export | P1 |
| STT-39 | Dashboard | Placeholder | Placeholder | Design only | Missing | High gaps | Scoped metrics, charts, maps, filters, export | P1 |
| STT-40 | Statistics | Missing | Missing | Design only | Missing | High gaps | Scoped reports and Excel exports | P1 |
| STT-41 | Public facility lookup | Missing | Missing | Design only | Missing | Unreviewed | Public API/page, safe projection, rate limits | P1 |
| STT-42 | Public product lookup | Missing | Missing | Design only | Missing | Unreviewed | Public API/page, safe projection, rate limits | P1 |
| STT-43 | Public license lookup | Missing | Missing | Design only | Missing | Unreviewed | Public API/page and secure download | P1 |
| STT-44 | Public laboratory lookup | Missing | Missing | Design only | Missing | Unreviewed | Public API/page and safe projection | P1 |
| STT-45 | Public inspection lookup | Missing | Missing | Design only | Missing | Unreviewed | Published-result API/page | P1 |
| STT-46 | Public warning lookup | Missing | Missing | Design only | Missing | Unreviewed | Published-warning API/page | P1 |
| STT-47 | Public hazard lookup | Missing | Missing | Design only | Missing | Unreviewed | Published-analysis API/page | P1 |
| STT-48 | Public news | Missing | Missing | Design only | Missing | Unreviewed | Published-news API/page | P1 |
| STT-49 | Public warning submission | Missing | Missing | Design only | Missing | High gaps | CAPTCHA, validation, files, workflow, rate limits | P0 |
| STT-50 | API specifications | Missing | Missing | Design only | Missing | High gaps | Partner/client/config-version management | P1 |
| STT-51 | Warning integration history | Missing | Missing | Design only | Missing | High gaps | Auth, idempotency, retries, review | P1 |
| STT-52 | Inspection integration history | Missing | Missing | Design only | Missing | High gaps | Auth, idempotency, retries, review | P1 |
| STT-53 | Poisoning integration history | Missing | Missing | Design only | Missing | High gaps | Auth, idempotency, retries, review | P1 |
| STT-54 | License integration history | Missing | Missing | Design only | Missing | High gaps | Auth, idempotency, retries, review | P1 |
| STT-55 | Product integration history | Missing | Missing | Design only | Missing | High gaps | Auth, idempotency, retries, review | P1 |
| STT-56 | News integration history | Missing | Missing | Design only | Missing | High gaps | Auth, idempotency, retries, review | P1 |
| STT-57 | Facility integration history | Missing | Missing | Design only | Missing | High gaps | Auth, idempotency, retries, review | P1 |

## Cross-cutting gaps

| Area | Current status | Required remediation |
|---|---|---|
| Authentication | HttpOnly same-site cookie/CSRF session, post-login token refresh, lockout, expiry/history, CAPTCHA-protected first-login change, Turnstile login and transactional email recovery are implemented and live-tested | Complete release-wide security and browser E2E review |
| Authorization | Permission-aware SPA plus server-side organization/geography scope resolver; organization and geography operations are enforced | Apply the same mandatory list/detail/mutation/file/export scope pattern to every remaining module |
| Database | PostgreSQL 15 EF baseline plus organization, scope, geography, account-security and ABP-upgrade migrations; clean apply/model-drift checks pass | Implement and migrate the remaining approved aggregates and their PostgreSQL constraints/tests |
| Files | Missing | MinIO abstraction, metadata, validation, scanning state, authorized streaming |
| Error handling | ABP application errors and RFC Problem Details for version negotiation are documented, correlated and production-safe | Add automated API tests for every error class and stable FoodSafe codes per remaining slice |
| API versioning | `/api/v1/app` and `/api/v1/security` are emitted in OpenAPI; unsupported versions advertise `1.0` and legacy app routes are absent | Preserve the v1 compatibility contract and add examples/schemas as modules land |
| Rate limiting | Global partitions cover login, reset, public and normal API traffic; 429 behavior was live-tested | Add endpoint-specific integration/download limits and distributed-policy validation before scale-out |
| Frontend foundation | Cookie hydration, permission/private routes, shared API/cache setup, forms, loading/errors and three administration slices exist | Add URL table state, reusable files/exports, accessibility audit and full browser regression |
| Docker | Non-root API/migrator and SPA images plus PostgreSQL, Redis, MinIO and development Mailpit; health/migration gates and persistent key ring pass | Production TLS deployment and backup/restore rehearsal remain release blockers |
| CI/CD | Format, warnings-as-errors, tests/coverage, architecture, publish, clean PostgreSQL migration, drift, dependency, secret/config, Compose, image-build and image-vulnerability gates are defined | Enforce branch protection and validate the workflow on the remote runner |
| Operations | Local, CI/CD, deployment, operations and DR guides exist with RTO/RPO and restore criteria | Complete and record a production-like backup/restore rehearsal and operational handoff |
