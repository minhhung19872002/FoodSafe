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
