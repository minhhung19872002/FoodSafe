# Phase 0 — Dirty/Untracked File Inventory

Captured at task start (2026-07-28 16:26 +07, HEAD `6b6ff6a`) and updated after Phase-0 edits.
Safety snapshot: `pre-phase0-tracked.patch` (316 B — only the `.gitignore` +1 line), `pre-phase0-staged.patch` (empty).

**Context**: the bulk of the originally-planned BASE-001 payload (ApiSpecification feature, route-permission refactor, UI polish, FoodPoisoning test fix) was **already committed by a concurrent session before this task started**, as `5bc0d86` (feature, atomic incl. migration+snapshot), `83ec103` (routePermissions + UI + test fix + ui-audit suite), and `6b6ff6a` (F-019g registry docs). This inventory covers what remained dirty at task start plus files this Phase-0 session touched.

| File / group | Tracked? | Category | Intended commit? | Reason |
|---|---|---|---|---|
| `.gitignore` (pre-existing `+screenshots` line) | tracked, modified | Local environment → refined | **Yes (refined)** | Bare `screenshots` was overly broad (matches any dir at any depth) and redundant — `testing/ui-audit/.gitignore` already scopes `screenshots/`; replaced with precise artifact entries (`test-results/`, `FoodSafe.FE/.results/`) |
| `FoodSafe.FE/src/app/routePermissions.ts` (this session: +1 permission) | tracked, modified | Required Phase-0 fix (BASE-002) | **Yes** | Adds `FoodSafe.DataIntegration.ApiSpecs.View` to the `/data-integration` route list — closes gap G-02 |
| `FoodSafe.FE/e2e/api-specification-management.spec.ts` (this session: +1 test) | tracked, modified | Required test (BASE-002) | **Yes** | New real-stack scenario: ApiSpecs-only user admitted with exactly one tab; sibling APIs still 403; noperm user gets the 403 page |
| `docs/audit/CURRENT_REQUIREMENT_GAP_ANALYSIS.md`, `CURRENT_REQUIREMENT_TRACEABILITY_MATRIX.md` | untracked | Documentation (audit deliverables) | **Yes** | Planning source for Phases 0–5; referenced by the backlog |
| `docs/planning/` (4 files) | untracked | Documentation (planning deliverables) | **Yes** | Implementation plan, backlog, gates, JSON summary |
| `docs/audit/PROJECT_IMPLEMENTATION_INVENTORY.md` | untracked | Documentation (input evidence, concurrent session) | **Yes** | 440 KB inventory referenced as evidence by the gap analysis; no secrets (scanned) |
| `testing/production-review/` (10 .md) | untracked | Documentation (concurrent-session production review of `6b6ff6a`) | **Yes** | Complete review deliverable; scanned — discusses secrets policy but contains no secret values; committing prevents loss |
| `docs/audit/phase-0/` (this session) | untracked | Documentation (Phase-0 evidence) | **Yes** | Initial state, snapshot patches, inventory, execution report |
| `FoodSafe.BE/test-results/.last-run.json` | untracked | Generated artifact | **No — ignored** | Playwright bookkeeping; now matched by `test-results/` ignore |
| `test-results/.last-run.json` (root) | untracked | Generated artifact | **No — ignored** | Same |
| `FoodSafe.FE/.results/probe-mobile-after-click.png` | untracked | Generated artifact | **No — ignored** | Visual-probe output; matched by `FoodSafe.FE/.results/` ignore |
| `testing/ui-audit/screenshots/` | untracked contents | Generated artifact | **No — already ignored** | Scoped by `testing/ui-audit/.gitignore` (committed in `83ec103`) |
| `cookies.txt` (repo root, if present) | untracked | Local environment (live dev session cookie) | **No — pre-existing ignore** | Already in `.gitignore`; flagged by the production review for local deletion (left untouched — user file) |
| `prompt.txt` | untracked/ignored | Local environment | **No — pre-existing ignore** | Task prompt file, already ignored |
