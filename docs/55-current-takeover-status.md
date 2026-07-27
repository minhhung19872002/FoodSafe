# Takeover Status — FoodSafe

Last updated: 2026-07-26 — **superseded 2026-07-27**

> **Superseded.** This snapshot was written mid-takeover, when STT 25 was in progress and
> STT 26–57 were unimplemented. All of them have since been built and verified; the
> "Missing Modules" table below is historical, not a backlog. The "Recommended Execution
> Order" at the end has been fully worked through except for the infrastructure items
> (production TLS, backup/restore rehearsal) and the final security review.
>
> Current state: 34/34 features VERIFIED at merge `fe3dbd2` —
> see `docs/testing/01-feature-verification-registry.md`.

## Build Status

| Gate | Result |
|---|---|
| Backend build | Pass, 0 warnings |
| Backend tests | Pass, 129 tests (50 domain + 46 application + 18 EF + 15 host) |
| Frontend TypeScript | Pass |
| Frontend lint (Oxlint) | Pass |
| Frontend tests | Pass, 47 Vitest tests |
| Frontend production build | Pass |
| EF pending model changes | Not checked (requires PostgreSQL) |
| Docker full stack | Not rebuilt with CFS migration |

## Completed Modules

| STT | Module | Backend | Frontend | Tests | Docker E2E |
|---|---|---|---|---|---|
| 01 | Roles | Done | Done | Done | Done |
| 02 | Users | Done | Done | Done | Done |
| 03 | Audit log | Built-in ABP | Missing UI | Indirect | - |
| 04 | Settings | Built-in ABP | Missing UI | Indirect | - |
| 05 | Access management | Done | Done | Done | Done |
| 06 | Organizations | Done | Done | Done | Done |
| 07 | Organization accounts | Done | Done | Done | Done |
| 08-18 | Master catalogs | Done | Done | Done | Done |
| 19 | Facilities | Done | Done | Done | Done |
| 20 | Products | Done | Done | Done | Done |
| 21 | Self-declarations | Done | Done | Done | Done |
| 22 | Product registrations | Done | Done | Done | Done |
| 23 | Advertisement registrations | Done | Done | Done | Done |
| 24 | Eligibility certificates | Done | Done | Done | Done |

## Partial Modules (STT 25 — CFS Certificates)

Status: **Code complete, pending Docker E2E and commit**

Fixes applied during takeover:
- Document-owner insert ordering (`autoSave: true`)
- Removed legacy cloned UI fields (receipt, manufacturer, productName)
- Updated all labels to CFS-specific terminology
- Fixed public lookup page (removed manufacturer, added destination country)
- Updated frontend tests with correct CFS fixtures
- Added CFS permission contract test assertions (4 permissions)
- Added CFS EF mapping test assertion
- Added 6 CFS error code localizations (vi + en)
- Fixed 2 pre-existing test failures (business Import label, self-declaration attachment label)

Remaining for STT 25:
- Docker rebuild with CFS migration
- Authenticated Docker E2E test
- PostgreSQL constraint/index/FK verification
- Hangfire job verification
- Playwright E2E spec
- Documentation update and commit

## Missing Modules

| STT | Module | Priority |
|---|---|---|
| 26 | Export certificates | P1 |
| 27 | Inspection plans | P0 |
| 28 | Inspection results | P0 |
| 29 | Food-safety warnings | P0 |
| 30 | News/activities | P1 |
| 31 | Small poisoning cases | P0 |
| 32 | Poisoning incidents | P0 |
| 33 | Monthly poisoning reports | P0 |
| 34 | Food-safety operational reports | P0 |
| 35 | Action Month reports | P0 |
| 36 | Hazard analysis | P1 |
| 37 | Laboratory results | P1 |
| 38 | Administrative documents | P1 |
| 39 | Dashboard | P1 (stub exists) |
| 40 | Statistics | P1 |
| 41-48 | Public portal lookups | P1 |
| 49 | Public warning submission | P0 |
| 50-57 | Integration history | P1 |

## UI/UX Status

Previous agent started UI redesign:
- Design system created (theme config, CSS variables)
- Shared components extracted (PageHeader, StatusBadge, ExpiryTag, EmptyState, RevokeModal)
- Shared utilities extracted (saveDownload, formatBytes)
- Application shell partially redesigned (sidebar grouping, header)
- Dashboard still a stub
- List pages partially standardized but need consistency pass
- Forms/detail pages need standardization
- Responsive/accessibility not audited

## Database Status

- 12+ EF migrations through STT 24 committed
- CFS migration (`AddCfsCertificates`) generated but uncommitted
- All approved SQL tables covered through STT 24
- STT 25 CFS table with constraints, FKs, and indexes in migration

## Docker Status

- Production-shaped 7-service Compose stack exists
- Not rebuilt with CFS migration
- Backup/restore rehearsal not completed
- Production TLS deployment not configured

## Security Risks

- Cookie/CSRF session hardened
- Lockout, password history, expiry, CAPTCHA implemented
- Data scope foundation implemented for all completed modules
- No final security review performed
- Rate limiting exists but no per-endpoint limits
- File upload scanning via ClamAV implemented

## Recommended Execution Order

1. Complete STT 25 Docker E2E and commit
2. Implement STT 26 (Export certificates) — similar pattern to CFS
3. Implement STT 27-28 (Inspection plans and results) — new aggregate pattern
4. Continue through milestones per docs/20-implementation-roadmap.md
5. UI/UX consistency pass after core modules complete
6. Dashboard implementation with real APIs
7. Public portal
8. Infrastructure hardening
9. Final security review
