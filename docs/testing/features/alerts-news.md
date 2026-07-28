# F-016 — Alerts & News (Cảnh báo và Tin tức ATTP)

## Status: VERIFIED

- **Feature ID**: F-016 · **Verified Git commit**: `4fa40d5` · **Date**: 2026-07-28
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `noperm@foodsafe.local`
- **Frontend route**: `/alerts-news` (tabs sync to `?tab=alerts|news`)
- **Endpoints**: `GET/POST/PUT/DELETE /api/v1/app/atp-alert(/{id})`, `POST .../{id}/publish|recall`, same set for `/api/v1/app/atp-news` (news recall takes no body), `GET /api/v1/app/atp-news/alert-options`, `GET .../excel/export` on both

## Evidence (all real API + real browser, commit `4fa40d5`)

- `e2e/alerts-news.spec.ts` — UI lifecycle: create alert, publish (Đồng ý/OK confirm), inline recall with reason, recalled tag, news tab. 1/1.
- `e2e/alerts-news-verification.spec.ts` — 7 tests:
  1. Unauthenticated alert + news list → 401.
  2. `noperm` → 403.
  3. Workflow: recall-on-Draft rejected; publish; double publish rejected; edit-after-publish rejected; recall without reason rejected; recall succeeds with audit fields `recalledById`/`recalledAt`/`recallReason`; double recall rejected.
  4. Validation: missing title → 400; invalid enum ordinal `source: 0` → 400.
  5. **Linked references & lengths** (new): bogus `businessId` → 403 `FoodSafe:Alert:0005`; bogus `linkedAlertIds` → 403 `FoodSafe:News:0007`; 1500-char summary → 400; 30-char reporterPhone → 400 (all were 500s before this pass).
  6. **Source round-trip** (new): PUT with `source: 2` on a Draft returns `source: 2` (was silently dropped).
  7. Persistence after reload via search; filter-aware empty state ("Không tìm thấy kết quả phù hợp").
- BE: Domain.Tests `AtpAlertTests` 10/10 (Update now carries Source); Application.Tests `AlertsAndTesting` contract tests 37/37.
- FE: Vitest alerts-news suites 6/6 (page test wraps `MemoryRouter` + antd `App`).

## Defects found and fixed in this pass (commit `4fa40d5`)

1. **Org-scope leak via linked references (nghiêm trọng)** — `LinkedAlertIds` (news) and `BusinessId` (alerts) were linked unvalidated: nonexistent IDs crashed as FK-violation 500s; cross-org IDs were accepted and the unscoped name/title lookups in `ToDtosAsync` exposed other organizations' alert titles / business names. Both AppServices now validate against the caller's data scope and scope-filter the lookups.
2. **500 instead of 400 on over-length input** — missing `[StringLength]` on alert reporter fields (name/phone/email) and news summary/category/tags/thumbnail.
3. **Silent drop of Source on edit** — `AtpAlert.Update` did not accept `source`; the editor offered the field but the server ignored it.
4. **Silent data loss on edit** — editor modals did not send `businessId` (alerts) / `thumbnailStoragePath` (news), nulling them on every update; now passed through from the record.
5. **Swallowed mutation failures** — publish/delete/recall through `RowActions` confirm surfaced no error on failure (antd `modal.confirm` swallows the rejection); all mutations now toast `extractApiError`.
6. **Spec drift** — confirm buttons say "Đồng ý" under vi_VN and a published row has an inline recall button (no overflow menu) since the RowActions consolidation.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission | PASS (401 / 403) |
| Org scope | PASS (list scoping + linked-reference scope validation + scoped lookups) |
| Workflow Draft→Published→Recalled incl. all invalid transitions | PASS |
| Recall audit trail (who/when/why) | PASS (news recall records who/when; no reason by design) |
| Validation (server: enums, lengths, linked refs) | PASS |
| Persistence after reload, filter-aware empty state | PASS |
| Loading (isFetching + keepPreviousData), error toasts (extractApiError) | PASS |
| Sorting (server-side title/severity/viewCount/creationTime), filters, `?tab=` sync | PASS |
| Excel export (carries filter + sorting), news tab | PASS |

## Paths & dependencies

- FE `src/features/alerts-news/**`; BE `Application/AlertsAndTesting/AtpAlert*`, `AtpNews*`, `Domain/AlertsAndTesting/**`, DTOs in `Application.Contracts/AlertsAndTesting/`
- Shared components used (not modified): `RowActions`, `RevokeModal`, `RecordDetailDrawer`, `EmptyState`, `useTablePagination`, `extractApiError`
- Depends on auth/scope/axios (Level 3)
- Known rest-debt (ghi nhận, chưa fix — cần quyết định nghiệp vụ): news recall has no reason field (khác alerts); alert-options cho phép liên kết cảnh báo mọi trạng thái; chưa có widget chọn cơ sở / upload thumbnail trên form (giá trị được bảo toàn khi sửa).
- Invalid for commits after `4fa40d5` touching these paths
