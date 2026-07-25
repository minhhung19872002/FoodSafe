# Implementation Gap Analysis — FoodSafe

## Audit metadata

- Audit date: 2026-07-25
- Source priority: original 42-page technical-requirement PDF, accepted decisions, state machines/permission matrix, database documents, API contract, implementation
- Backend baseline: builds with 0 warnings; 6 discovered tests pass
- Frontend baseline: strict TypeScript production build passes; 1 component test passes
- Database baseline: PostgreSQL 15 is approved, but no EF Core migration exists
- Overall conclusion: early implementation scaffold; not deployable and not production-ready

Status vocabulary: **Built-in** means ABP supplies a partial capability that still needs FoodSafe configuration and verification. **Partial** means working code exists but the requirement quality gate is not met. **Design only** means the reviewed SQL covers the requirement but executable EF persistence does not yet exist.

## Requirement coverage

| ID | Module | Backend | Frontend | Database | Tests | Security | Missing work | Priority |
|---|---|---|---|---|---|---|---|---|
| STT-01 | Roles | Built-in | Missing | Design only | Missing | Unreviewed | Scoped role administration, UI, negative tests | P0 |
| STT-02 | Users | Built-in | Auth pages only | Design only | Missing | High gaps | User lifecycle, assignments, lock/unlock, audit, UI | P0 |
| STT-03 | Audit log | Built-in | Missing | Design only | Missing | Unreviewed | Query UI, retention, masking, export controls | P1 |
| STT-04 | Settings | Built-in | Missing | Design only | Missing | Unreviewed | Typed settings, permissions, UI, audit | P1 |
| STT-05 | Access management | Built-in | Missing | Design only | Missing | High gaps | Permission UI and org/area-scoped enforcement | P0 |
| STT-06 | Organizations | Partial | Partial | Mapping only | 6 narrow | High gaps | Geography catalogs, scope resolver, edit/delete UI, DB tests/migration | P0 |
| STT-07 | Organization accounts | Missing | Missing | Design only | Missing | High gaps | Account-to-organization/area assignment lifecycle | P0 |
| STT-08 | Countries | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P0 |
| STT-09 | Regions | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P0 |
| STT-10 | Provinces | Missing | Missing | Design only | Missing | Unreviewed | Full vertical slice | P0 |
| STT-11 | Districts/communes | Missing | Missing | Design only | Missing | High gaps | Hierarchy, scope resolver, full vertical slice | P0 |
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
| Authentication | ABP/OpenIddict host plus custom SPA token storage | Use short-lived access tokens and secure refresh/session handling; remove persistent bearer token exposure; verify lockout/revocation |
| Authorization | Permission attributes only on organization service | Add current-user organization/area context and mandatory query/resource scope checks |
| Database | Reviewed PostgreSQL SQL, no executable EF migration | Map approved structures, create migrations, clean-database and constraint tests |
| Files | Missing | MinIO abstraction, metadata, validation, scanning state, authorized streaming |
| Error handling | ABP defaults only | Document and test stable RFC 7807-compatible contract |
| API versioning | Missing | Establish `/api/v1` convention without arbitrary status patching |
| Rate limiting | Missing | Login, reset, public submission/download, integration endpoints |
| Frontend foundation | Minimal shell | Permission routes/nav, URL table state, shared states/forms/files/accessibility |
| Docker | PostgreSQL/Redis/MinIO only | Backend/frontend/mail service, health dependencies, env examples, migrations |
| CI/CD | Missing | Restore/build/lint/test/migration/security/container gates |
| Operations | Missing | Local, deployment, operations, backup/restore, disaster recovery guides |

