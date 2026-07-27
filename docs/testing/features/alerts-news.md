# F-016 — Alerts & News (Cảnh báo và Tin tức ATTP)

## Status: VERIFIED

- **Feature ID**: F-016 · **Verified Git commit**: `3e0e904` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 (incl. migration `AddNewsRecallAudit`) · **API interception**: **No**
- **Accounts**: `admin`, `noperm@foodsafe.local`
- **Frontend route**: `/alerts-news`
- **Endpoints**: `GET/POST/PUT/DELETE /api/v1/app/atp-alert(/{id})`, `POST .../{id}/publish|recall`, `GET /api/v1/app/atp-news`, `GET /api/v1/app/atp-alert/excel/export`

## Evidence

- `e2e/alerts-news.spec.ts` — UI lifecycle: create alert, publish, recall, delete, news tab.
- `e2e/alerts-news-verification.spec.ts` — 5 tests:
  1. Unauthenticated alert + news list → 401.
  2. `noperm` → 403.
  3. Workflow: recall-on-Draft rejected; publish; double publish rejected; edit-after-publish rejected; recall without reason rejected; recall succeeds **with audit fields `recalledById`/`recalledAt`/`recallReason` populated** (security-pass contract `06656c8` runtime-verified); double recall rejected.
  4. Validation: missing title → 400; **invalid enum ordinal `source: 0` → 400** (was 500 via DB CHECK before fix).
  5. Persistence after reload via search; empty state.

## Product defect found and fixed (commit `3e0e904`)

`[Required]` on non-nullable enum properties is a no-op, so `source: 0` (or any invalid ordinal) passed model validation and crashed on the `chk_alerts_source` DB constraint as an HTTP 500. `EnumDataType` added for `Category`/`Severity`/`Source` — server now returns 400.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission | PASS (401 / 403) |
| Org scope | PASS structurally (alerts are org-scoped via `CurrentDataScope`; list scoping shared with verified features) |
| Workflow Draft→Published→Recalled incl. all invalid transitions | PASS |
| Recall audit trail (who/when/why) | PASS |
| Validation (server, incl. enum ordinals) | PASS after fix |
| Persistence after reload, empty state | PASS |
| Excel export, news tab | PASS (main spec) |

## Paths & dependencies

- FE `src/features/alerts-news/**`; BE `Application/AlertsAndTesting/AtpAlert*`, `AtpNews*`, `Domain/AlertsAndTesting/**`
- Depends on auth/scope/axios (Level 3)
- Invalid for commits after `3e0e904` touching these paths
