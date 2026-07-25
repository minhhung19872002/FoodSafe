# Implementation Progress — FoodSafe

Last updated: 2026-07-25

| Area | Status | Evidence / next gate |
|---|---|---|
| Repository and requirement audit | Implemented | PDF extracted (42 pages), docs/code/config inspected, 57-requirement gap matrix created |
| System/backend/frontend architecture | Implemented | `docs/17`–`docs/19`; implementation conformance remains ongoing |
| PostgreSQL design validation | Tested | Approved SQL executes cleanly and creates 60 tables on disposable PostgreSQL 15 |
| EF migration baseline | Tested | Initial runtime migration applies to a clean PostgreSQL 15 database and is idempotent on second update |
| Authentication | Implemented (foundation) | Cookie/CSRF session, lockout, expiry/history, forced change, server-verified Turnstile login, and full email recovery/reset lifecycle validated live |
| Authorization and data scope | Implemented (foundation) | Global permission plus organization-descendant and geographic assignment resolver implemented; organization API enforces operation-aware scope |
| Organizations | Implemented | Scoped list/tree/detail/create/edit/delete API and permission-gated create/edit/delete UI pass; hierarchy/geography validation, descendant-safe parent selection and root-promotion authorization are enforced |
| Master data | In progress | Administrative geography model, validated CRUD API and permission-gated province/district/commune UI implemented; broader business/product/inspection catalogs remain |
| Facilities/products/files | Not started | Milestone 2 |
| Regulatory modules | Not started | Milestone 3 |
| Inspection/warnings/news | Not started | Milestone 4 |
| Poisoning/reporting | Not started | Milestone 5 |
| Hazard/labs/dashboard/statistics | Not started | Milestone 6 |
| Public portal/integrations | Not started | Milestone 7 |
| Docker full stack/CI/operations | In progress | Six-service base stack plus development Mailpit profile, deployment/local guides and CI gates implemented; backup/restore rehearsal and production TLS deployment remain |
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

## Organization slice completion evidence added on 2026-07-25

- Edit and delete actions are shown only with their corresponding permissions; deletion requires explicit confirmation and reports dependency failures.
- The shared organization form now hydrates edit values, supports active/inactive state and uses the complete scoped tree for parent choices rather than the current result page.
- The parent selector excludes the organization and all descendants; domain cycle checks remain the authoritative server guard.
- A scoped administrator cannot detach a child organization into a new root; only global scope can perform that promotion.
- Backend build passes with 0 warnings and 24 tests; frontend lint/build and 6 tests pass, including the permission-gated edit interaction.

## Administrative geography UI evidence added on 2026-07-25

- Added permission-gated province, district and commune administration with cascading parent selectors, create/edit forms, activation state and confirmed deletion.
- Delete endpoints reject geographic records referenced by child geography or organizations before applying soft deletion.
- API request validation now enforces the domain's 10-character geography code limit; oversized input produces a validation response instead of a server exception.
- Generated OpenAPI was inspected to establish the authoritative ABP mutation routes; frontend route tests cover the `/{id}/{kind}` convention.
- Live authenticated cookie/CSRF create → update → delete completed against PostgreSQL and the test record was removed.
- Backend build passes with 0 warnings and 25 tests; frontend lint/build and 9 tests pass.

## Container deployment evidence added on 2026-07-25

- Added multi-stage .NET 9 and Node/Nginx image builds; the API and SPA runtime
  containers run as non-root users.
- Added a six-service Compose stack for PostgreSQL, Redis, MinIO, the one-shot
  migrator, API, and SPA with dependency-aware health gates and persistent named
  volumes.
- Infrastructure ports and the web entry point bind to loopback by default; the
  API remains private to the Compose network.
- Production secrets are mandatory environment values. The administrator
  bootstrap password is supplied only to the migrator, and the API does not
  migrate or seed on startup.
- Authentication data-protection keys persist across API replacement;
  Production fails fast unless the key ring is protected by a supplied PKCS#12
  certificate.
- SPA fallback, `/api` proxying, health endpoints, forwarded-protocol handling,
  cookie/CSRF authentication, and security headers were exercised through
  Nginx.
- A clean-volume rehearsal migrated and seeded PostgreSQL with a non-default
  bootstrap credential, authenticated the administrator with seven expected
  permissions, and retained that authenticated session after force-replacing
  the API container.
- `docs/42-container-deployment.md` documents local and production settings,
  secret handling, health checks, operations, and the remaining backup/restore
  release gate.

## CI and dependency-security evidence added on 2026-07-25

- Added GitHub Actions gates for .NET restore/build/tests with coverage,
  PostgreSQL Testcontainers, pending EF model changes, frontend lint/type/test/
  build, production dependency audits, Production Compose rendering, and all
  deployable image builds.
- Upgraded the supported framework line from ABP 9.0.0 to 9.3.7 and added the
  reviewed `UpgradeAbp937` migration; the migration applies successfully and EF
  reports no pending model changes.
- Raised vulnerable transitive Scriban, Newtonsoft.Json, and SQLitePCLRaw
  selections to unaffected versions. Narrow audit exceptions document the
  disabled ABP registration flow, AutoMapper 14 compatibility boundary, and
  client-only React Router RSC boundary.
- Live checks confirm self-registration resolves to `false`, both registration
  endpoints return `404`, administrator cookie/CSRF login succeeds, and an
  AutoMapper-backed organization request completes without runtime errors.
- Dependabot monitors NuGet, npm, and GitHub Actions weekly; any dependency
  advisory outside the documented exact package/advisory pairs fails CI.

## CAPTCHA and password-recovery evidence added on 2026-07-25

- Login now requires a bounded Turnstile token that is verified server-side;
  Production additionally binds the response to the configured action and
  hostname and fails closed on provider errors.
- Production startup refuses Cloudflare's published test keys, non-HTTPS
  verifier URLs, blank expected hostnames, and insecure or incomplete SMTP
  delivery configuration.
- Added forgot/reset-password SPA routes with generic request confirmation,
  pre-submit token verification, normal password-policy validation, and
  explicit loading/error/expired-link states.
- Added a pinned Mailpit development profile and corrected ABP 9.3 mail-setting
  names to `Abp.Mailing.*`; delivery uses the ABP MailKit integration.
- Resolved the ABP 9.3/Scriban 7 binary boundary with a locally compiled,
  sandboxed renderer; patched Scriban 7.2.5 remains selected and reset-email
  rendering now works at runtime.
- Live disposable-user validation completed account creation → reset request →
  captured email → token verification → password reset → login with the new
  password; the disposable account was deleted afterward.
- Backend builds with zero warnings and 36 tests pass. Frontend lint,
  11 tests, and the production bundle pass. Production rejection probes and
  the complete Compose development profile pass.
