# 78 — Workflow (Luồng) Completion Plan

**Baseline**: branch `main`, HEAD `b31cc11`, clean tree · 2026-07-28
**Trigger**: audit of `docs/` for outstanding approval workflows ("luồng phê duyệt") and other
state-machine flows that are specified but not implemented.

---

## 1. Audit result — which flows are specified vs. implemented

Source of truth for flows: [`docs/04-state-machines.md`](../04-state-machines.md) (9 state machines) +
[`docs/01-functional-requirements.md`](../01-functional-requirements.md) + the gap register in
[`docs/audit/CURRENT_REQUIREMENT_GAP_ANALYSIS.md`](../audit/CURRENT_REQUIREMENT_GAP_ANALYSIS.md).

| # | Flow (state machine doc) | Implementation evidence | Verdict |
|---|---|---|---|
| 1 | Reporting `Draft→Submitted→Verified→Completed / Returned` (NĐTP, ATTP, Tháng hành động) | `BaseReport.Submit/Verify/Return/Complete/ReturnToDraft` + app services + FE buttons | **Implemented** |
| 2 | Food-poisoning case `Draft→Reported→Verified` + error report `Pending→Acknowledged→Corrected` | `FoodPoisoningCase.Submit/Verify`, `PoisoningCaseErrorReport.Acknowledge/MarkCorrected` | **Implemented** |
| 3 | Food-poisoning incident `Draft→Reported→Verified→Concluded` | `FoodPoisoningIncident.Submit/Verify/Conclude` | **Implemented** |
| 4 | Alert `Draft→Published→Recalled` | `AtpAlert.Publish/Recall` | **Implemented** (reject branch missing — see §2 flow B) |
| 5 | News `Draft→Published→Recalled` | `AtpNews.Publish/Recall` | **Implemented** (reject branch missing — see §2 flow B) |
| 6 | Inspection plan `Draft→Submitted→Approved→InProgress→Completed / Cancelled` | `InspectionPlan.Submit/Approve/Reject/MarkInProgress/Complete/Cancel`, auto `MarkInProgress` from `InspectionResultAppService` | **Implemented** |
| 7 | Public/citizen submission moderation (STT 49) | Citizen submissions land as `AtpAlert` Draft + `Source=PublicReport`; officers can publish or hard-delete | **Partial — no auditable reject** |
| 8 | License expiry lifecycle (background job) | 5 Hangfire recurring expiry jobs registered in `FoodSafeHttpApiHostModule` | **Implemented** |
| 9 | Report error-notification `Pending→Acknowledged→Corrected` | `*ReportErrorNotification.Acknowledge/MarkCorrected` | **Implemented** |
| — | Inbound partner submission disposition `Received→Processed / Rejected` (INT-03) | `InboundSubmission.MarkProcessed()/Reject()` exist with **zero call sites**; app service exposes read-only `GetSubmissionsAsync/GetSubmissionAsync`; FE tab is read-only | **Not implemented** |

**Conclusion**: two flows remain — both are approval/disposition flows.

- **Flow A** — `FUNC-INT-001` / gap `G-04`: inbound partner submission disposition (duyệt / từ chối).
- **Flow B** — `FUNC-CIT-001` / gap `G-09`: citizen submission moderation reject-with-reason
  (today the only "no" answer is a hard delete, which destroys the evidence trail).

Everything else in the state-machine document is already built and browser-verified per
`docs/testing/01-feature-verification-registry.md`.

---

## 2. Implementation plan

### Flow A — Duyệt/từ chối dữ liệu đối tác gửi đến (INT-03)

`Received → Processed` (duyệt) · `Received → Rejected(reason)` (từ chối). Terminal on both sides;
re-disposition is refused so a double-click cannot rewrite history.

| Layer | Change |
|---|---|
| Domain | `InboundSubmission`: add `ProcessedById`, `ProcessedAt`; `MarkProcessed(actorId, at)` / `Reject(actorId, at, reason)` guarded to `Received` only; new error code `SubmissionAlreadyDisposed` |
| Permissions | New `FoodSafe.DataIntegration.Partners.Moderate` (child of Partners group) |
| Contracts | `RejectInboundSubmissionDto { Reason }`; `InboundSubmissionDto` gains `ProcessedById`/`ProcessedAt`; two new interface methods |
| Application | `ProcessSubmissionAsync(id)` / `RejectSubmissionAsync(id, input)` — org-data-scoped at `Edit` level |
| HttpApi | `POST submissions/{id}/process`, `POST submissions/{id}/reject` |
| EF Core | Column mapping + migration `AddInboundSubmissionDisposition` |
| Localization | vi/en message for the new error code + permission display name |
| Frontend | Mutations, action buttons "Duyệt"/"Từ chối" with reason modal, disposition fields in the detail drawer, permission gating |

### Flow B — Kiểm duyệt phản ánh công dân: từ chối kèm lý do

`Draft → Rejected(reason)` for both `AtpAlert` and `AtpNews`, alongside the existing
`Draft → Published`. Rejected records stay in the database (auditable) and never reach the public
portal; hard delete remains available for spam.

| Layer | Change |
|---|---|
| Domain.Shared | `AlertStatus.Rejected = 4`, `NewsStatus.Rejected = 4` |
| Domain | `AtpAlert.Reject(actorId, at, reason)` / `AtpNews.Reject(actorId, at, reason)` from `Draft` only; `RejectedById`, `RejectedAt`, `RejectedReason` |
| Application | `AtpAlertAppService.RejectAsync` / `AtpNewsAppService.RejectAsync` under the existing `Publish` (moderation) permission |
| EF Core | New columns, relaxed `chk_*_status` check constraints, migration `AddAlertNewsRejection` |
| Public portal | Rejected records excluded (already excluded — only `Published` is public); assert in test |
| Frontend | Status config + reject action + reason column/drawer |

### Test plan (project policy: real API + real browser, no interception)

1. Backend unit/contract: domain transition guards, permission contract, EF mapping.
2. Full backend suite must stay green.
3. Real-stack Playwright specs:
   - `inbound-submission-disposition.spec.ts` — partner pushes a real submission through the
     API-key endpoint → officer approves → reload persists → second disposition refused → reject
     path with reason → 403 for a user without `Partners.Moderate`.
   - `citizen-moderation-reject.spec.ts` — anonymous citizen submits → officer rejects with a
     comment → record keeps status + reason after reload → does not appear on the public portal.
4. TypeScript + lint + FE build gates.
5. Update `docs/testing/01-feature-verification-registry.md`, `02-impact-map.md`, and this document
   with results.

---

## 3. Requirement grounding (checked against the source PDF, not only derived docs)

`docs/Mẫu số 03. YCKT (1).pdf` was re-extracted in this session (42 pages, pypdf) and read
directly. It names both flows explicitly:

| YCKT | Wording | Flow |
|---|---|---|
| STT 29 | "Duyệt cảnh báo về vệ sinh ATTP **do người dân gửi lên**" | Flow B (alerts) |
| STT 30 | "Duyệt tin tức cảnh báo về vệ sinh ATTP **do người dân gửi lên**" | Flow B (news) |
| STT 51–57 | "Hiển thị lịch sử **nhận**/chia sẻ dữ liệu …" (per data type) | Flow A |

The approve half of STT 29/30 already existed (`Publish`); only the refusal half was missing.

## 4. Results — both flows delivered and verified

**Status: DONE.** All 10 project flows are now implemented.

### Delivered

| Flow | Backend | Frontend | Migration |
|---|---|---|---|
| A — inbound disposition | `InboundSubmission.MarkProcessed/Reject` (guarded, terminal), `Partners.Moderate` permission, `ProcessSubmissionAsync`/`RejectSubmissionAsync` (org-scoped), 2 controller endpoints, vi/en localization | Approve/reject actions + required-reason modal + disposition fields in the detail drawer, permission-gated | `20260728144116_AddWorkflowDispositionFields` |
| B — citizen moderation refusal | `AlertStatus.Rejected`/`NewsStatus.Rejected`, `AtpAlert.Reject`/`AtpNews.Reject` (Draft-only, reason required, forces `is_public = false`), `RejectAsync` on both app services under the existing `Publish` permission | "Từ chối" row action + reason modal (shared `RevokeModal`, now parameterised), rejection fields in both detail drawers, new status tag | same migration |

Database integrity added with the flows: `chk_di_is_disposition`, `chk_di_is_reject_reason`,
`chk_di_is_status`, `chk_alerts_reject`, `chk_news_reject`, and the `chk_*_status` constraints
widened to admit the new status.

One cross-cutting fix worth noting: `Partners.Moderate` had to be added to
`CurrentUserContextAppService.FoodSafePermissionNames` — that server-side array is what the
frontend permission store reads, so a permission missing from it is invisible to the UI even
when granted.

### Verification (real stack, no interception)

| Gate | Result |
|---|---|
| Backend build | 0 errors, 0 warnings |
| Backend tests | **690/690** (Domain 238, Application 361, HttpApi.Host 71, EFCore 20) — +19 new |
| EF migration drift | `No changes have been made to the model since the last migration.` |
| Frontend `tsc --noEmit` | clean |
| Frontend `oxlint` | clean |
| Playwright full suite | **304/304 passed, 0 failed, 0 flaky** (7.0 min, workers=1) |

New specs, both run against the real Docker stack (real PostgreSQL, real API, real login,
no `page.route`/interception):

- `e2e/inbound-submission-disposition.spec.ts` (2/2) — cookie-less partner delivery by API key →
  officer approves one and rejects the other through the UI → reload persistence → DB records
  who/when/why → disposed rows offer no further action → second disposition refused (403,
  `FoodSafe:DataIntegration:0009`) → user without `Partners.Moderate` refused, record untouched.
- `e2e/citizen-moderation-reject.spec.ts` (2/2) — anonymous citizen submission through the real
  captcha-gated public endpoint → officer rejects with a reason → record kept with status +
  reason + actor → reload persistence → re-publish refused (`FoodSafe:Alert:0002`) → absent from
  the anonymous public portal. Same for news.

### Defects found and fixed while testing

Rebuilding the frontend image surfaced that the running container had been built from older
source, which had been masking six stale-spec failures at `b31cc11`. All are fixed:

1. **8 specs** clicked a confirm button named `"OK"`, but the app sets the AntD Vietnamese locale
   (`main.tsx` → `viVN`), so the button reads "Đồng ý". Switched to the locale-tolerant
   `/^(Đồng ý|OK)$/` the rest of the suite already used.
2. `api-specification-management.spec.ts` still targeted `.ant-popconfirm-buttons`; `RowActions`
   now confirms with `modal.confirm`, and its delete action moved into the overflow menu.
3. `identity-user-lifecycle.spec.ts` asserted on `.ant-modal-confirm-title` while the confirm
   modal was still fading out and the result modal was already attached (strict-mode violation) —
   now filtered to the expected title.
4. `statistics-chart-download.spec.ts` posted a poisoning case with `location`; the DTO requires
   `locationDescription`.
5. `ndtp-rollup-aggregation.spec.ts` signed the seeded `district.staff` fixture in with the
   **admin** password instead of the test-user password.
6. `pagination-page-size.spec.ts` depended on ambient data volume (needed >20 businesses; the
   environment has exactly 20) — it now seeds its own cohort and cleans up.
7. `data-integration-partners.spec.ts` used a bare `row.getByRole("button")` that became
   ambiguous once the disposition buttons were added — this one *was* caused by this work.

### Known environment issue (not a repo defect, not fixed here)

`npm test` (Vitest) cannot boot on this machine: `jsdom@29.1.1` pulls
`html-encoding-sniffer@6.0.0`, which `require()`s the ESM-only `@exodus/bytes`. `require(ESM)` is
only supported from **Node 22.12**; the local runtime is **22.11.0**. CI pins `node-version: 22`
(latest 22.x), so the gate passes there. Fix locally by upgrading Node to ≥22.12. `package.json`
and `package-lock.json` were not touched by this work. Vitest is not acceptance evidence under the
project testing policy in any case.

Separately, `npm ci` on Windows leaves the optional native bindings uninstalled (the known npm
optional-dependency bug); `npm i --no-save @oxlint/binding-win32-x64-msvc@1.75.0
@rolldown/binding-win32-x64-msvc@1.1.5` restores `oxlint`.
