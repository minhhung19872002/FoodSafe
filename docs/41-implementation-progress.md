# Implementation Progress — FoodSafe

Last updated: 2026-07-25

| Area | Status | Evidence / next gate |
|---|---|---|
| Repository and requirement audit | Implemented | PDF extracted (42 pages), docs/code/config inspected, 57-requirement gap matrix created |
| System/backend/frontend architecture | Implemented | `docs/17`–`docs/19`; implementation conformance remains ongoing |
| PostgreSQL design validation | Tested | Approved SQL executes cleanly and creates 60 tables on disposable PostgreSQL 15 |
| EF migration baseline | Tested | Initial runtime migration applies to a clean PostgreSQL 15 database and is idempotent on second update |
| Authentication | In progress | Cookie/CSRF session validated live; SPA token persistence removed; five-attempt/30-minute lockout, 30-minute sliding session, password complexity, 90-day expiry, five-password history and forced-change routing implemented. Login CAPTCHA and recovery delivery remain |
| Authorization and data scope | Implemented (foundation) | Global permission plus organization-descendant and geographic assignment resolver implemented; organization API enforces operation-aware scope |
| Organizations | In progress | Scoped CRUD API, geographic validation, create UI, dependent geographic selectors and tests pass; edit/delete UI remains |
| Master data | In progress | Country/region/province/district/commune model and scoped catalog API implemented with exact hierarchy constraints; broader catalogs remain |
| Facilities/products/files | Not started | Milestone 2 |
| Regulatory modules | Not started | Milestone 3 |
| Inspection/warnings/news | Not started | Milestone 4 |
| Poisoning/reporting | Not started | Milestone 5 |
| Hazard/labs/dashboard/statistics | Not started | Milestone 6 |
| Public portal/integrations | Not started | Milestone 7 |
| Docker full stack/CI/operations | Not started | Infrastructure-only Compose exists |
| Final security/readiness review | Not started | Current overall readiness: NOT READY |

“Complete” is intentionally unused until every module quality gate passes.

## Milestone 1 evidence added on 2026-07-25

- Added `AddGeographicCatalogs` and `AddDataScope` EF migrations; EF reports no pending model changes.
- Clean and repeated migration execution passed against PostgreSQL 15.
- Real PostgreSQL integration tests reject cross-province district relationships.
- Backend build passes with 0 warnings; 18 tests pass (11 domain, 1 application, 6 EF/integration).
- Frontend lint and strict production build pass; 5 tests pass, including server-backed private-route hydration, unauthenticated redirect and permission denial.
- Live host checks passed for health, OpenAPI (44 paths), login, CSRF, current-user context, organization and geographic endpoints.
- Development administrator access is seeded only for local validation; production credentials and secrets must remain external.

## Account and API hardening evidence added on 2026-07-25

- Identity lockout is configured for 5 failed attempts and 30 minutes; authenticated cookies are HTTP-only, same-site, secure in production and expire after 30 idle minutes.
- Password changes use an authenticated FoodSafe endpoint, reject the current and five retained hashes, persist only hashes, set a 90-day expiry and clear forced-change state.
- The SPA cannot enter protected routes while a password is expired or marked for first-login change.
- Global API partitions throttle login (10 per 5 minutes), password recovery (5 per 15 minutes), public APIs (60 per minute) and normal API traffic (300 per minute).
- Live probing returned a structured `429` with `Retry-After: 300` and correlation ID on the 11th login request.
- Live cookie + fresh-CSRF probing reached the password service and returned localized `FoodSafe:Account:0001` for a wrong current password without changing the credential.
- Forwarded headers now trust only framework defaults plus explicitly configured proxy IPs; production enables HSTS and HTTPS redirection.
- Backend build passes with 0 warnings and 22 tests; frontend lint/build and 6 tests pass; `AddPasswordHistory` applies to PostgreSQL and EF reports no pending model changes.
