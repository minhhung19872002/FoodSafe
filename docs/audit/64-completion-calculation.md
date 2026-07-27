# 64 — Completion Calculation

Scores per sub-item are taken from doc 63 (one score per row). Scoring scale follows the mandated method: CNRV = 0.85; PART = stated 0.25–0.75; BACKEND_ONLY ≤ 0.50; SHALLOW ≤ 0.20; NOT_IMPLEMENTED = 0. **No item scores 1.00** — the verification registry records zero VERIFIED features and no green run of the real e2e suite at any commit, so nothing qualifies as COMPLETE_RUNTIME_VERIFIED.

## 1. Functional score by STT (points / items)

| STT | Score | Items | % | STT | Score | Items | % |
|---|---|---|---|---|---|---|---|
| 1 | 5.10 | 6 | 85% | 27 | 7.65 | 11 | 70% |
| 2 | 9.25 | 13 | 71% | 28 | 5.35 | 7 | 76% |
| 3 | 1.45 | 3 | 48% | 29 | 6.80 | 9 | 76% |
| 4 | 0.30 | 6 | 5% | 30 | 6.35 | 9 | 71% |
| 5 | 2.80 | 5 | 56% | 31 | 9.35 | 11 | 85% |
| 6 | 4.25 | 6 | 71% | 32 | 8.50 | 10 | 85% |
| 7 | 4.75 | 6 | 79% | 33 | 9.10 | 11 | 83% |
| 8–16 | 30.60 | 36 | 85% | 34 | 8.15 | 11 | 74% |
| 17 | 3.40 | 5 | 68% | 35 | 8.15 | 10 | 82% |
| 18 | 3.40 | 4 | 85% | 36 | 6.10 | 8 | 76% |
| 19 | 14.35 | 18 | 80% | 37 | 5.10 | 6 | 85% |
| 20 | 6.80 | 8 | 85% | 38 | 5.40 | 7 | 77% |
| 21 | 7.65 | 9 | 85% | 39 | 4.55 | 9 | 51% |
| 22 | 7.65 | 9 | 85% | 40 | 3.05 | 8 | 38% |
| 23 | 9.35 | 11 | 85% | 41 | 1.10 | 4 | 28% |
| 24 | 8.50 | 10 | 85% | 42 | 1.15 | 4 | 29% |
| 25 | 9.35 | 11 | 85% | 43 | 1.15 | 4 | 29% |
| 26 | 9.35 | 11 | 85% | 44 | 1.15 | 4 | 29% |
| LIC | 1.15 | 2 | 58% | 45 | 0.00 | 3 | 0% |
| — | — | — | — | 46 | 1.15 | 4 | 29% |
| — | — | — | — | 47 | 1.15 | 4 | 29% |
| — | — | — | — | 48 | 0.00 | 3 | 0% |
| — | — | — | — | 49 | 0.00 | 2 | 0% |
| — | — | — | — | 50 | 4.75 | 6 | 79% |
| — | — | — | — | 51–57 | 4.20 | 28 | 15% |

Group sums: A = 18.90/33 (57.3%) · B = 46.40/57 (81.4%) · C = 167.75/216 (77.7%) · E = 6.85/32 (21.4%) · F = 8.95/34 (26.3%).

**Functional implementation = 248.85 / 372 = 66.90%.**
**Functional runtime-verified = 0 / 372 = 0.00%.**

## 2. Non-functional category scores

| Category | Score | Items | % |
|---|---|---|---|
| INT (integration NFRs) | 0.50 | 5 | 10.0% |
| NFR (performance) | 2.50 | 6 | 41.7% |
| IPV (IPv6/TLS) | 1.25 | 6 | 20.8% |
| SEC (app security) | 18.55 | 25 | 74.2% |
| DBS (DB security) | 2.30 | 10 | 23.0% |
| UI | 6.50 | 10 | 65.0% |
| DT (data tolerance) | 7.85 | 12 | 65.4% |
| TECH | 3.95 | 5 | 79.0% |
| L2 | 0.40 | 1 | 40.0% |

Software unweighted total: **292.65 / 452 = 64.75%**.

## 3. Weighted-category calculations

- **Security & data scope** = (SEC 18.55 + DBS 2.30 + L2 0.40) / 36 = **59.03%** (data-scope FR sub-items stay in the functional bucket to avoid double counting).
- **Workflow correctness** = PDF workflow sub-items only (FR-33-04..07, 34-04..06, 35-04..06, 31-06/08, 32-05/07, 29-06/07, 30-07/08/09, 36-07, 28-03 = 21 items) = 15.10/21 = **71.90%**.
- **Frontend completeness** = FE-side attainment weighted by group size: A 0.68, B 0.85, C 0.82, E 0.25, F 0.55 → (0.68·33 + 0.85·57 + 0.82·216 + 0.25·32 + 0.55·34)/372 = **73.85%**.
- **Backend completeness** = A 0.75, B 0.85, C 0.85, E 0.30, F 0.30 → (24.75 + 48.45 + 183.60 + 9.60 + 10.20)/372 = **74.35%**.
- **Database integrity** = **90%** (full schema for all 8 modules incl. integration tables, FK/CHECK/unique-partial/evidence-column coverage; deductions: Address not a value object per architecture doc, Hangfire tables unmanaged, no history tables beyond error-notification/ABP audit).
- **Runtime testing & acceptance** = **15%** (real-full-stack e2e suite of 25 specs exists and is correctly designed (no interception) = partial credit; but 0/32 VERIFIED, last run 25 failures, no BE API integration tests, e2e absent from CI, several specs assert headings only).
- **Infrastructure & operations** = **55%** (compose stack with health checks + migrator + ClamAV + MinIO + CI with security scanning = strong; missing: backup/restore scripts, deploy pipeline, monitoring, IPv6, TLS provisioning, committed dev secrets).
- **Documentation** = **60%** (extensive design/ops docs 00–55 + testing policy; deductions: stale/contradictory progress claims (docs 41/55 vs code), group-E mapping deviation from PDF, **no end-user manual or admin manual** required for acceptance).

## 4. Overall weighted software completion

| Category | Weight | % | Contribution |
|---|---|---|---|
| Functional implementation | 40% | 66.90 | 26.76 |
| Security & data scope | 15% | 59.03 | 8.85 |
| Workflow correctness | 10% | 71.90 | 7.19 |
| Frontend completeness | 10% | 73.85 | 7.39 |
| Backend completeness | 10% | 74.35 | 7.44 |
| Database integrity | 5% | 90.00 | 4.50 |
| Runtime testing & acceptance | 5% | 15.00 | 0.75 |
| Infrastructure & operations | 3% | 55.00 | 1.65 |
| Documentation | 2% | 60.00 | 1.20 |
| **Overall** | 100% | — | **65.72%** |

## 5. Status distribution (software items, n = 452)

| Status | Count |
|---|---|
| COMPLETE_RUNTIME_VERIFIED | 0 |
| COMPLETE_NOT_RUNTIME_VERIFIED | 287 (FR 268 + NFR-side 19) |
| PARTIALLY_IMPLEMENTED | 85 (FR 33 + NFR-side 52) |
| BACKEND_ONLY | 1 (FR-02-05 user delete) |
| FRONTEND_ONLY | 0 |
| PLACEHOLDER_OR_SHALLOW | 26 (settings ×3, share-history ×21, INT-04, DBS-06) |
| MOCK_OR_HARDCODED | 0 (hard-coded items classified under SHALLOW/PART with noted defects) |
| NOT_IMPLEMENTED | 53 |
| BLOCKED | 0 |
| REQUIREMENT_AMBIGUITY (excluded) | 0 — ambiguities resolved via documented assumptions (doc 61 §Ambiguities) |

Non-software deliverables (n = 17): SUP 4, TRN 1, OWN 4, HND 2, ACC 6. Evidence in repo ≈ ACC-05 partial (0.30) only → **non-software deliverable completion ≈ 1.8%** (these are largely contract-time obligations outside the codebase).

## 6. Assumptions used in the calculation

1. CNRV capped at 0.85 because no feature has green runtime acceptance at the audited commit (registry evidence).
2. Requirements fulfilled by an equivalent dedicated module (e.g., per-business licenses managed in the licensing modules instead of inside the business screen) score 0.70, not 0.85, because the PDF asks for them in the facility context.
3. Public "danh sách" lookups implemented as exact-number single-result lookups score 0.30 for the list requirement and 0.85 for the view-info requirement.
4. Share-history viewers over never-populated tables score 0.20 (SHALLOW) — structure without behavior.
5. Deployment-environment obligations (DBS, IPV, NFR) are scored for what the delivered software/config prepares, not for the un-provisioned production environment.
6. Weights are the default weights mandated by the audit instructions; the PDF does not imply an alternative weighting.
