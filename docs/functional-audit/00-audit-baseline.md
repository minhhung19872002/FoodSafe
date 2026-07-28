# Functional Audit — Baseline (Step 1)

**Audit role**: Customer Acceptance Functional Auditor / Business Implementation Lead
**Date**: 2026-07-28
**Scope**: Functional + application-level non-functional acceptance only. Infrastructure (TLS, DNS, hosting, DR, Docker hardening) explicitly out of scope — already covered by the separate production-readiness audit (verdict: GO WITH CONDITIONS).

## 1. Git baseline

| Item | Value |
|---|---|
| Branch | `fix/production-blockers` |
| HEAD commit (audit baseline) | `78322f2efc0e6eec4c88e54ad202c8cd24fafe47` |
| HEAD subject | `docs(FR-39-09): record statistics chart PNG download browser evidence (de06374)` |
| Main branch | `main` |
| Working tree | DIRTY — 6 modified tracked files, 3 untracked paths (see §2) |

**Audit baseline = HEAD `78322f2` + the dirty working tree described below.** All evidence in this audit series is pinned to this state; any later commit invalidates per the impact map.

## 2. Uncommitted / untracked file disposition

### 2.1 Modified tracked files — VERDICT: VALID PARALLEL-AGENT WORK (keep, do not revert)

| File | Change | Classification |
|---|---|---|
| `FoodSafe.FE/e2e/advertisement-registrations.spec.ts` | +1 line: `page.keyboard.type(businessName)` before combobox option pick | Valid — test-stability fix (filters AntD combobox so the intended option is unambiguous) |
| `FoodSafe.FE/e2e/product-registrations.spec.ts` | same +1 line pattern | Valid — same stability fix |
| `FoodSafe.FE/e2e/export-food-certificates.spec.ts` | same +1 line pattern | Valid — same stability fix |
| `FoodSafe.FE/e2e/self-declarations.spec.ts` | same +1 line pattern | Valid — same stability fix |
| `FoodSafe.FE/e2e/certificate-pdf-verification.spec.ts` | Rewrite (433 lines changed): adds cookie-less anonymous-context download proof for all 5 public certificate PDF types (FR-42/43/44/46/47-03/04) | Valid — strengthens F-034 from authenticated-only proof to the citizen/anonymous path the YCKT requires |
| `docs/testing/01-feature-verification-registry.md` | Adds F-019c, F-019d rows; updates F-034 to `c1b2c85`+wt; adds 2026-07-28 test-run notes (SEC-04 password-expiry gate, F-034 anonymous download) | Valid — registry bookkeeping for the above |

Evidence the changes are genuine and current (not stale):
- Every commit the registry references (`3fe7325`, `9cfcf11`, `6dab46e`, `c1b2c85`) **exists and is an ancestor of HEAD** (`git merge-base --is-ancestor` verified).
- The spec files they describe (`data-integration-credentials.spec.ts`, `data-integration-share.spec.ts`, `password-expiry-enforcement.spec.ts`) exist in `FoodSafe.FE/e2e/`.
- Dates in the registry notes are today (2026-07-28), matching the working-tree state.

These files are the working papers of the browser-acceptance session that produced `docs/testing/75-final-browser-acceptance-report.md`. They are **kept as-is** and will not be modified, deleted, or bundled into functional-audit commits.

### 2.2 Untracked paths

| Path | Classification |
|---|---|
| `docs/testing/75-final-browser-acceptance-report.md` | Valid parallel-agent deliverable — the final browser acceptance report; used as audit input, left uncommitted by this audit |
| `FoodSafe.BE/test-results/` | Test-run output artifacts — should never be committed (gitignore candidate); ignored by this audit |
| `test-results/` | Playwright output artifacts — same disposition |

## 3. Baseline commands executed

```
git status                      # branch, dirty files
git log --oneline -5            # recent history
git rev-parse HEAD              # 78322f2efc0e6eec4c88e54ad202c8cd24fafe47
git diff --stat                 # 6 files, 246 insertions, 209 deletions
git diff <each modified spec>   # content inspection
git merge-base --is-ancestor 3fe7325|9cfcf11|6dab46e|c1b2c85 HEAD   # all ancestors
```

## 4. Source of truth for the audit

- Customer requirement PDF: `docs/Mẫu số 03. YCKT (1).pdf` (only source of truth)
- Requirement decomposition: `docs/01-functional-requirements.md`
- Prior audit docs (input, NOT trusted automatically): `docs/audit/60,61,65,68,69,70`, `docs/testing/71–75`
