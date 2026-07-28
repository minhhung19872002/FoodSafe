# F-019h — Inbound Submission Disposition (Duyệt/từ chối dữ liệu đối tác gửi đến)

## Status: VERIFIED

- **Feature ID**: F-019h · **Verified Git commit**: working tree on top of `b31cc11` (re-stamp at the feature commit) · **Date**: 2026-07-28
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `noperm@foodsafe.local`, plus a real partner API key (cookie-less client)
- **Frontend route**: `/data-integration` → tab "Dữ liệu nhận về"
- **Requirement**: YCKT STT 51–57 ("Hiển thị lịch sử **nhận**/chia sẻ dữ liệu"), INT-03 · gap `G-04` / backlog `FUNC-INT-001`
- **State machine**: `docs/04-state-machines.md` §10 — `Received → Processed | Rejected`, both terminal
- **Endpoints**:
  - `POST /api/v1/partner/submissions/{type}` (partner, `X-Api-Key`, no cookies)
  - `GET /api/v1/app/partner-account/submissions` · `GET .../submissions/{id}`
  - `POST /api/v1/app/partner-account/submissions/{id}/process`
  - `POST /api/v1/app/partner-account/submissions/{id}/reject`
- **Permission**: `FoodSafe.DataIntegration.Partners.Moderate` (new; also registered in
  `CurrentUserContextAppService.FoodSafePermissionNames` so the UI can gate on it)

## Evidence

`e2e/inbound-submission-disposition.spec.ts` — 2 tests, 2/2 passing, no interception:

1. **Officer approves and rejects through the real UI** — a partner and API key are created via
   the real admin API; a cookie-less client delivers two real submissions; the officer approves
   one (Popconfirm) and rejects the other (mandatory-reason modal) in the browser; both statuses
   are re-asserted after a full page reload; the API confirms `processedById`, `processedAt` and
   the exact `rejectReason` persisted; the settled rows no longer offer any action; a second
   disposition on either row is refused with `403` + `FoodSafe:DataIntegration:0009` and the
   original decision is unchanged.
2. **Permission denial** — `noperm@foodsafe.local` posting `/process` is refused (403/302) and the
   submission remains `Received`.

Backend: `FoodSafe.Domain.Tests/DataIntegration/InboundSubmissionTests.cs` (7 tests) covers the
initial state, both transitions, the mandatory reason, and all three re-disposition refusals.
`DataIntegrationApplicationContractTests` asserts both new methods carry `Partners.Moderate`;
`DataIntegrationMappingTests` asserts the new columns.

## Checklist

| Check | Result |
|---|---|
| Route loads, tab renders | PASS |
| Approve (Received → Processed) | PASS |
| Reject with reason (Received → Rejected) | PASS |
| Validation — empty reason refused in the UI | PASS |
| Persistence after browser reload | PASS |
| Audit fields (`processed_by_id`, `processed_at`, `reject_reason`) persisted | PASS |
| Idempotency — second disposition refused (403, `…:0009`) | PASS |
| Rejection cannot overturn an approval and vice versa | PASS |
| Permission denial (`noperm`) | PASS — 403, record untouched |
| Organization scope | PASS structurally — `GetScopedSubmissionAsync` at `DataScopeOperation.Edit`, same pattern as the rest of the module |
| Loading / empty / error states | PASS — existing tab states unchanged; errors surface through the global interceptor |

## Notes

- Both outcomes are terminal by design: the domain refuses any second disposition so a
  double-clicked button or a retried request cannot rewrite who decided what and when.
- `chk_di_is_disposition` enforces at the database level that a disposed row always carries the
  deciding user and timestamp; `chk_di_is_reject_reason` that a rejection always carries a reason.
- Approving is a **receipt** decision, not ingestion into business tables — mapping the payload
  into domain records stays blocked on the official TT 31/2026 field map (`InboundSubmission.cs`).
- The tab's row-action column is shared with F-019f; its spec was updated to select the detail
  button explicitly now that more than one button exists per row.

## Paths & dependencies

- BE `Domain/DataIntegration/InboundSubmission.cs`,
  `Application/DataIntegration/PartnerAccountAppService.cs`,
  `Application.Contracts/DataIntegration/PartnerAccountDtos.cs`,
  `HttpApi/DataIntegration/PartnerAccountController.cs`,
  `Domain.Shared/Permissions/FoodSafePermissions.cs`,
  `Application/Security/CurrentUserContextAppService.cs`,
  migration `20260728144116_AddWorkflowDispositionFields`
- FE `src/features/data-integration/{api,types,components/InboundSubmissionsTab.tsx}`
- Depends on auth/scope/axios (Level 3), partner surface F-019f (Level 2)

---
