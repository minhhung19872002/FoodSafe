# F-016b — Citizen Moderation Refusal (Từ chối phản ánh của người dân kèm lý do)

## Status: VERIFIED

- **Feature ID**: F-016b · **Verified Git commit**: working tree on top of `b31cc11` (re-stamp at the feature commit) · **Date**: 2026-07-28
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`; citizen submissions arrive through a genuinely anonymous, cookie-less context
- **Frontend route**: `/alerts-news` → tabs "Cảnh báo VSATTP" and "Tin tức ATTP", source filter "Từ dân"
- **Requirement**: YCKT **STT 29** "Duyệt cảnh báo về vệ sinh ATTP do người dân gửi lên" and
  **STT 30** "Duyệt tin tức cảnh báo … do người dân gửi lên" (FR-29-06 / FR-30-07) · gap `G-09` /
  backlog `FUNC-CIT-001`
- **State machine**: `docs/04-state-machines.md` §4–§5 — `Draft → Rejected(reason)`, terminal
- **Endpoints**:
  - `POST /api/v1/public/alert-reports` · `POST /api/v1/public/news-reports` (anonymous, captcha-gated)
  - `POST /api/v1/app/atp-alert/{id}/reject` · `POST /api/v1/app/atp-news/{id}/reject`
  - `GET /api/v1/app/atp-alert/{id}` · `GET /api/v1/app/atp-news/{id}`
- **Permission**: existing `AlertsAndTesting.{Alerts,News}.Publish` — refusing is the other half of
  the same moderation decision, so it does not warrant a separate grant

## Why this exists

Before this flow, an officer's only way to say "no" to a citizen submission was a hard delete,
which destroyed the evidence trail. Rejection now keeps the record with its reason, the deciding
officer and the timestamp, and forces `is_public = false` permanently. Hard delete remains
available for spam.

## Evidence

`e2e/citizen-moderation-reject.spec.ts` — 2 tests, 2/2 passing, no interception:

1. **Alert** — an anonymous context submits through the real captcha-gated public endpoint; the
   officer rejects it from the real moderation queue via the reason modal; the API confirms
   `status = Rejected(4)`, the exact `rejectedReason`, `rejectedAt`, `rejectedById` and
   `isPublic = false`; the status survives a full reload; re-publishing is refused with `403` +
   `FoodSafe:Alert:0002`; the title never appears in the anonymous public alert feed.
2. **News** — same chain for `AtpNews`, including the reason-required guard in the modal.

Backend: `AtpAlertTests` / `AtpNewsTests` each gained 4 tests (rejection sets status + trimmed
reason + actor + `IsPublic=false`; empty reason refused; non-Draft refused; a rejected draft can
no longer be published). `AlertsAndTestingApplicationContractTests` asserts both `RejectAsync`
methods sit behind the `Publish` permission.

## Checklist

| Check | Result |
|---|---|
| Citizen submission lands as Draft in the moderation queue | PASS |
| Reject with reason (Draft → Rejected) | PASS |
| Validation — confirm disabled until a reason is typed | PASS |
| Record kept, not deleted | PASS |
| Audit fields (`rejected_by_id`, `rejected_at`, `rejected_reason`) persisted | PASS |
| Persistence after browser reload | PASS |
| Terminal — publishing a rejected draft refused (`FoodSafe:Alert:0002`) | PASS |
| Never public — absent from the anonymous portal, `isPublic = false` | PASS |
| Approve path unaffected | PASS — `e2e/citizen-moderation.spec.ts` still green |
| Organization scope | PASS structurally — `GetScopedAsync(DataScopeOperation.Edit)`, same as publish/recall |

## Notes

- `chk_alerts_reject` / `chk_news_reject` enforce at the database level that a rejected row always
  carries actor, timestamp and reason; the `chk_*_status` constraints were widened to admit `4`
  and the publish constraints relaxed to `status IN (1, 4)` (a rejected row never has a publisher).
- The reason modal reuses the shared `RevokeModal`, which gained optional `okText`, `description`
  and `placeholder` props; its revoke defaults are unchanged, so existing callers are unaffected.
- Rejected records stay out of every public surface because the public services already select
  only `Published`.

## Paths & dependencies

- BE `Domain.Shared/AlertsAndTesting/AlertsAndTestingEnums.cs`,
  `Domain/AlertsAndTesting/{AtpAlert,AtpNews}.cs`,
  `Application/AlertsAndTesting/{AtpAlertAppService,AtpNewsAppService}.cs`,
  `Application.Contracts/AlertsAndTesting/{AtpAlertDtos,AtpNewsDtos}.cs`,
  `EntityFrameworkCore/FoodSafeDbContextModelCreatingExtensions.cs`,
  migration `20260728144116_AddWorkflowDispositionFields`
- FE `src/features/alerts-news/{api,types,pages/AlertsNewsPage.tsx}`, `src/components/RevokeModal.tsx`
- Depends on auth/scope/axios (Level 3); shares `RevokeModal` with F-007..F-012 (Level 1)

---
