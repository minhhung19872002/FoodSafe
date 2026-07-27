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
