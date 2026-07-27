# Regression Log

Record every verification invalidation and retest result here.

## Format

```
### YYYY-MM-DD — <summary>

- **Cause**: <what changed>
- **Commit**: <SHA>
- **Affected features**: <list>
- **Retest level**: <0–4>
- **Result**: PASSED | FAILED
- **Details**: <brief notes>
```

## Entries

### 2026-07-27 — Functional-gap completion batch (STT 2-5, 19, 27-35, 39-40, 48, 51-57) + merge with parallel main batch

- **Cause**: Feature branch `feature/complete-remaining-functions` implemented the audit-65/66 backlog (Excel exports, audit-log detail, user delete/random password/permission search, full Settings module, business filters + per-business tabs, dashboard filters + report-compliance widgets + chart download, profile/avatar, inspection attachments + finalize, citizen alert/news moderation + citizen news channel, report auto-calc/roll-up/document view, typed data-sharing engine) and merged `origin/main`'s parallel batch, keeping the feature-branch implementations and de-duplicating merge artifacts. Fresh-database seeding gaps fixed (region/role ordering, document-type catalog seed).
- **Commit**: merge `bdfff4c` + spec fixes (this commit)
- **Affected features**: All (Level 3-4 — shared FE pages, permissions, EF model, seeding)
- **Retest level**: 4 (full regression)
- **Result**: PASSED — BE 519/519 xUnit, FE 112/112 Vitest, FE production build + oxlint clean, Playwright full suite 232+ tests against the rebuilt Docker stack (fresh volume, real login, no API interception)
- **Details**: Three spec-level defects found and fixed during certification: (1) documents E2E blocked on empty document-type catalog → seeded 8 standard types; (2) citizen alert form required danh mục while the backend defaults it → made optional; (3) system-settings spec was written for the removed static stub → rewritten for the live editable page; reporting month-picker made robust against antd virtualized dropdown on slow machines. E2eTestDataSeedContributor now self-seeds its region/role dependencies so a fresh `docker compose up` migrates cleanly.

### 2026-07-27 — Infrastructure blockers cleared; F-013 verified; full suite green

- **Cause**: Fixes for inspection plan items editor (unconnected antd form), PoisoningMap null-coordinate crash, Development rate limits, cookie-auth 302→401/403 on `/api/*`, and E2E hardening (stale-data self-healing cleanup, Popconfirm scoping, unique test data)
- **Commit**: `c8f9537`
- **Affected features**: All (authentication response contract and rate limiting are Level 3 shared dependencies)
- **Retest level**: 3 (full suite executed — 41/41 specs pass against the real Docker stack)
- **Result**: PASSED
- **Details**: F-013 (Inspection) verified with the full checklist including unauthenticated access (401), permission denial (403 for `noperm@foodsafe.local`), cross-organization isolation (`district.staff@foodsafe.local` cannot see or fetch province plans), invalid workflow transitions rejected, server- and client-side validation, duplicate prevention, Excel export, empty state, and persistence after reload. Evidence: `docs/testing/features/inspection.md`. Remaining features stay READY_FOR_TEST until each runs the same checklist.

### 2026-07-27 — F-015 DIRTY cleared; F-002 unblocked with password-history defect fix; F-007..F-012 verified

- **Cause**: (a) shared `FoodSafeHttpApiHostModule` change from security pass `06656c8` dirtied F-015; (b) F-002 verification found a product defect — password history stored the NEW hash after each change, so the replaced password never entered history and could be reused immediately
- **Commit**: `b2f13fb` (fix + F-002 spec); verification specs `232c814`/`9af99ba`/`df7823c`
- **Affected features**: F-015 (retested); F-002 (fixed + verified); all features re-run due to auth-helper hardening (signIn now asserts ABP login result=1 — HTTP 200 alone does not prove login success)
- **Retest level**: 3 — full suite (90 tests) rebuilt-image run: 90/90 PASSED; F-002 spec 2/2 PASSED after API rebuild; backend Application.Tests 251/251
- **Result**: PASSED
- **Details**: F-007..F-012 verified via per-feature verification specs (unauthenticated 401, noperm 403, cross-org hidden+blocked, revoke/double-revoke, duplicate numbers, server validation, persistence after reload, empty states). F-009 exposed a server rule requiring `productIds` min 1 on advertisement registrations (fixture adjusted, rule verified). Evidence: `features/*.md`.

### 2026-07-27 — Security pass: secrets, integration toggle URL, news recall audit

- **Cause**: Tracked appsettings credentials blanked (moved to gitignored appsettings.secrets.json + fail-fast startup validation); data-integration `toggleEndpointStatus` URL fixed (`/api/api/app/...` doubling); `AtpNews.Recall` now records `RecalledById`/`RecalledAt` (migration `AddNewsRecallAudit` with backfill + CHECK)
- **Commit**: `06656c8`
- **Affected features**: F-016 (Alerts & News — BE contract extended, additive), F-019 (Data Integration — toggle endpoint now reachable). Both were READY_FOR_TEST, not VERIFIED — no invalidation needed. No VERIFIED feature touched.
- **Retest level**: 2 planned at verification sweep (frontend Docker image not yet rebuilt with the FE fix; toggle must be runtime-verified when F-019 runs its checklist)
- **Result**: PASSED (backend 480/480 unit+contract tests; FE data-integration Vitest 5/5; migration applied cleanly to dev DB)
- **Details**: Stale MSW contract tests that pinned the old buggy `/api/app/...` paths were repaired to pin the real `/v1/app/...` routes and now also cover toggle-status.

### 2026-07-27 — Report error notifications implemented (FR-33/34/35-05); inspection FE route fixes

- **Cause**: (a) New error-notification endpoints + UI for all 3 report types (get/add/acknowledge/respond; domain guard relaxed to Submitted-or-Verified per YCKT "sau khi gửi"); (b) discovered via ABP api-definition that FE inspection `markViolationRemedied` and `setFollowUpResult` called nonexistent routes (`/{id}/violations/{vid}/remedied`, `/{id}/follow-up-result`) — fixed to the real conventional routes (`/mark-violation-remedied?resultId&violationId`, `/{id}/set-follow-up-result`)
- **Commit**: see this commit
- **Affected features**: F-015 (Reporting) → DIRTY (new surface must be verified); F-013 (Inspection) → DIRTY (two actions were broken in FE and are not covered by inspection-verification.spec.ts — false-positive portion of prior verification)
- **Retest level**: 2 per feature after stack rebuild — specs: `reporting-verification`, new `reporting-error-notifications`, `inspection-verification` (+ manual/API check of the two fixed inspection actions)
- **Result**: PENDING (stack rebuild required; unit/contract suites green: BE 481, FE reporting+inspection 11/11)

### 2026-07-27 — F-013/F-015 re-verified after error-notification feature (retest level 2)

- **Cause**: Error-notification endpoints/UI added to reporting; inspection FE route fixes
- **Commit**: `07476e3`
- **Affected features**: F-015, F-013
- **Retest level**: 2 (rebuilt stack: `reporting-error-notifications` 2/2, `reporting-verification` 7/7, `reporting` 2/2, `inspection` 5/5, `inspection-verification` 7/7 — the last one flaked once inter-spec, passed 7/7 in isolation)
- **Result**: PASSED
- **Details**: Error-notification lifecycle runtime-verified: draft-rejection, submit→add (Pending), server validation 400, acknowledge (Acknowledged), respond (Corrected), persistence via separate GET, permission denial for noperm user, UI modal display. NOTE: FE `markViolationRemedied`/`setFollowUpResult` api methods are correct now but are **dead code — no UI calls them**; recorded in doc 66 M15.
