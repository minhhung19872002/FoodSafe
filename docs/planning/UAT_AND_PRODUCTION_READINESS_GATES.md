# UAT and Production Readiness Gates

**Baseline assessed**: `feat/integration-completion` @ `aad87c1` + dirty working tree · 2026-07-28
Statuses below are **current-state** (before Phase 0 freeze). Task IDs from [REMAINING_TASK_BACKLOG.md](REMAINING_TASK_BACKLOG.md).

| Gate | Required evidence | Pass criteria | Current status | Blocking tasks |
|---|---|---|---|---|
| **Gate 1 — Functional completeness** | Traceability matrix all-FR rows FULLY/MOSTLY with accepted residuals; registry all-VERIFIED at one freeze commit; demos of the four P1 features | 372/372 FR at FULLY, or MOSTLY with written customer acceptance of residuals; zero PARTIAL | **AMBER** — 349 FULLY / 21 MOSTLY / 2 PARTIAL; registry stamps stale vs dirty tree | BASE-001..004, FUNC-INT-001, FUNC-COMMIT-001, FUNC-CIT-001, FUNC-STAT-001, then FUNC-PUB-001/EVID-001 |
| **Gate 2 — Permission & organization-scope correctness** | Executed 401/403/IDOR/CSRF/org+area probes at freeze commit; route↔sidebar↔BE permission consistency check; role matrix run (SystemAdmin, Province/District/Commune admin+staff, unauthenticated, partner key) | All probes pass at F0; zero route/permission mismatch; aggregate-openness decision recorded | **AMBER** — doc-74 probes passed at older commit; route map consistent in working tree but uncommitted; ApiSpecs route gap (G-02); G-22 policy undecided | BASE-001/002/004, SEC-006, TEST-002 (re-executable probes) |
| **Gate 3 — Data integrity & migrations** | CI migration job (clean migrate + drift check + non-destructive check + restore rehearsal) green at F0; EF mapping tests all modules; concurrency spec | All green at F0; snapshot drift zero | **AMBER** — CI green at HEAD but the drift gate would fail on partial commit of the dirty tree; mapping tests missing ×5 modules; no concurrency spec | BASE-001, TEST-003, TEST-004 |
| **Gate 4 — Full automated regression** | Playwright full suite + BE suite + real-HTTP BE suite in CI at F0; flake budget | 0 failed / 0 flaky in CI (not just local); suite runs reproducibly | **RED** — last clean 286/286 was manual at `6326af4`; **E2E absent from CI**; real-HTTP BE suite absent; 1 known load flake | TEST-001, TEST-002, TEST-005, BASE-004 |
| **Gate 5 — Performance & concurrency** | k6 report ≥30 VUs with CPU capture on **production hardware**; NFR-01..06 thresholds | avg <10 s, max <30 s, ≥30 VU, CPU ≤75% avg on both servers | **AMBER** — local run passes all thresholds (doc `docs/testing/05`); prod hardware run outstanding | OPS-003 (needs environment via EXT-001) |
| **Gate 6 — Security & ATTT readiness** | SEC-01..25 evidence pack; CAPTCHA real-key probe; TLS config; DB hardening (DBS-01..10); **ATTT level-2 dossier accepted**; credential rotation | All SEC items pass on staging/prod; dossier submitted & accepted; no known credential valid | **RED** — application-layer SEC strong (22/25 FULLY); but dossier absent (M-8), CAPTCHA probe pending keys, TLS/DB hardening unstarted (no environment), E2E password rotation owed | DOC-001, SEC-001, SEC-004, OPS-001, OPS-004, OPS-005, SEC-002/003/005 |
| **Gate 7 — Operational readiness** | Monitoring + alerting live; backup/restore drill on prod; IPv6/AAAA/DNSSEC verified; SMTP live; support process (24×7, ≥2 channels, 48 h SLA) signed | Drill evidence + green checks on the production stack | **RED** — no production environment exists; CI-level restore rehearsal is the only current evidence | OPS-002, OPS-006, OPS-007, OPS-008, OPS-009 |
| **Gate 8 — Training & handover** | User + admin manuals accepted; training class delivered (120 attendees, 1 day) with records; data ownership/handover/export procedure dry-run | Customer sign-off on each | **RED** — none prepared | DOC-002, DOC-003, DOC-005, DOC-006 |

## UAT entry criteria (subset needed to *start* UAT — not full production)

1. Phase 0 freeze complete (Gates 1–3 items BASE-001..004). 
2. P1 functional tasks closed (FUNC-INT-001, FUNC-COMMIT-001, FUNC-CIT-001, FUNC-STAT-001).
3. TEST-001 (CI E2E) green ≥3 consecutive runs.
4. DOC-004 scenario book agreed with customer.
5. Staging environment with real CAPTCHA keys (SEC-001) — recommended, waivable for on-LAN UAT.

Current UAT readiness: **≈85–90%** — blocked only by items 1–4 above, all internal and ≈2 sprints of work.

## NO-GO for production — explicit current blocker list

Production deployment is **NO-GO** today. Every one of the following must be closed or formally waived in writing:

| # | Blocker | Class | Owner of resolution | Closing task |
|---|---|---|---|---|
| 1 | Dirty, partially-uncommitted baseline (complete feature + migration uncommitted; registry stale) | Process/code | Engineering | BASE-001..004 |
| 2 | Inbound submissions cannot be dispositioned (approve/reject dead code) — partner data enters and is never processed | Functional | Engineering | FUNC-INT-001 |
| 3 | INT-02: no official TT 31/2026 partner field map/signing — ingestion into domain tables impossible; needs customer written disposition (deliver-to-schema or phased deferral) | External | Customer + BA | EXT-001 (+FUNC-INT-003 when unblocked) |
| 4 | INT-01: real Bộ Y tế endpoint/credentials unavailable | External | Customer/ministry | EXT-001 |
| 5 | M-8: ATTT level-2 dossier + user/admin manuals absent (acceptance deliverable, NĐ 85/2016 legal requirement for a level-2 system) | Documentation | SecEng/DocOwner | DOC-001..003 |
| 6 | No production environment: TLS, IPv6/AAAA/DNSSEC, DB hardening, monitoring, backup drill, SMTP, secrets all unverified/unstarted | Infrastructure | DevOps + customer provisioning | OPS-001..008 |
| 7 | Performance unproven on production hardware (local k6 pass only) | Infrastructure | DevOps/QA | OPS-003 |
| 8 | CAPTCHA never exercised with real Turnstile keys | Config | SecEng | SEC-001 |
| 9 | Known credentials in git history usable if e2e seeding ever enabled outside dev | Security ops | DevOps | SEC-004 |
| 10 | E2E regression not in CI — no automated guard between freeze and deploy | Quality gate | QA | TEST-001 |
| 11 | 24×7 support process, training, handover procedure not established (contractual YCKT §§3.3, 3.6, 3.9) | Operations/contract | BA/DocOwner | OPS-009, DOC-005, DOC-006 |

Items 3 and 4 are the only blockers engineering cannot close alone; the audit recommends requesting the phased-delivery deferral in Sprint 1 (EXT-001) so they convert into scheduled Phase-2 work instead of open-ended blocks.
