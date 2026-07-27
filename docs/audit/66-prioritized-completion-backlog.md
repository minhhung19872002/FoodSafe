# 66 — Prioritized Completion Backlog

**Generated**: 2026-07-27
**Based on**: doc 65 (final completion audit)
**Remaining items**: 42 NOT_IMPLEMENTED + 104 PARTIAL = 146 items

---

## Priority Tiers

### P0 — Production Blockers (fix before ANY deployment)

| # | Item | Effort | Impact |
|---|---|---|---|
| 1 | Gate Swagger UI to `IsDevelopment()` | 5 min | SEC — full API schema exposed |
| 2 | Add `SslMode=Require` to PostgreSQL connection | 30 min | DBS-09 — unencrypted DB traffic |
| 3 | Set `DataProtectionTokenProviderOptions.TokenLifespan = 8h` | 5 min | SEC-05 — password reset token valid too long |
| 4 | Add `listen [::]:8080;` to nginx.conf | 10 min | IPV-03 — IPv6 compliance |
| 5 | Add `Strict-Transport-Security` header to nginx | 5 min | IPV-06 — HSTS missing at reverse proxy |
| 6 | Fix 9 failing Vitest tests (stale selectors) | 30 min | CI health |
| 7 | Add 5 missing FK constraints (testing_results, food_poisoning, etc.) | 1 hour | DBS — referential integrity |

**Total P0 effort: ~2.5 hours**

---

### P1 — High Value / Low Effort (complete before customer demo)

| # | Item | STT | Effort | Impact |
|---|---|---|---|---|
| 8 | Excel export: user list | 2 | 2 hours | FR-02-13 |
| 9 | Excel export: audit log | 3 | 2 hours | FR-03-03 |
| 10 | Excel export: organizations | 6 | 2 hours | FR-06-06 |
| 11 | Excel export: testing services catalog | 17 | 1 hour | FR-17-05 |
| 12 | Excel export: 4 statistics reports | 40 | 4 hours | FR-40-02/04/06/08 |
| 13 | Audit log detail drawer | 3 | 3 hours | FR-03-02 (PARTIAL→COMPLETE) |
| 14 | User delete action in FE | 2 | 2 hours | FR-02-05, FR-07-03 (PARTIAL→COMPLETE) |
| 15 | Business advanced search filters (type/classification/area) | 19 | 3 hours | FR-19-02 (PARTIAL→COMPLETE) |
| 16 | Per-business tabs (licenses, inspection results) | 19 | 8 hours | FR-19-11..16 (6 PARTIAL→COMPLETE) |
| 17 | Document type catalog integration | 38 | 2 hours | FR-38-03/04 (PARTIAL→COMPLETE) |
| 18 | Dashboard time/unit selector | 39 | 3 hours | FR-39-02 (PARTIAL→COMPLETE) |
| 19 | Statistics region/area/unit breakdowns | 40 | 4 hours | FR-40-07 (PARTIAL→COMPLETE) |

**Total P1 effort: ~36 hours**

---

### P2 — Medium Value / Medium Effort (complete before acceptance)

| # | Item | STT | Effort | Impact |
|---|---|---|---|---|
| 20 | Public portal: certificate document view/print (10 items) | 42-47 | 8 hours | FR-42/43/44/46/47-03/04 — requires public file serving endpoint |
| 21 | Inspection plan/result attachments | 27-28 | 4 hours | FR-27-08/09, FR-28-05 |
| 22 | System settings: live backend API | 4 | 8 hours | FR-04-03/04/05 (3 PARTIAL→COMPLETE) |
| 23 | System settings: logo upload + login customization | 4 | 6 hours | FR-04-01/02 |
| 24 | System settings: homepage config | 4 | 4 hours | FR-04-06 |
| 25 | Report auto-aggregation from system data | 34 | 12 hours | FR-34-10 — complex cross-module calculation |
| 26 | Report formatted document view | 34-35 | 6 hours | FR-34-08, FR-35-08 (PARTIAL→COMPLETE) |
| 27 | Report roll-up aggregation (commune→city→province) | 33 | 12 hours | FR-33-02 (PARTIAL→COMPLETE) |
| 28 | Dashboard report compliance widgets | 39 | 6 hours | FR-39-03/04 |
| 29 | Dashboard/statistics chart download | 39 | 4 hours | FR-39-09 |
| 30 | User profile self-service editing | 5 | 4 hours | FR-05-04 (PARTIAL→COMPLETE) |
| 31 | User avatar feature | 5 | 4 hours | FR-05-05 |
| 32 | Random password generation UX | 2 | 2 hours | FR-02-07 (PARTIAL→COMPLETE) |
| 33 | User search by permission | 2 | 3 hours | FR-02-02 (PARTIAL→COMPLETE) |
| 34 | Citizen alert moderation queue | 29 | 6 hours | FR-29-06 (PARTIAL→COMPLETE) |
| 35 | Citizen news submission channel | 30 | 8 hours | FR-30-07 |
| 36 | Inspection result finalize/lock step | 28 | 3 hours | FR-28-03 (PARTIAL→COMPLETE) |

**Total P2 effort: ~100 hours**

---

### P3 — External Integration (requires partner APIs)

| # | Item | STT | Effort | Dependency |
|---|---|---|---|---|
| 37 | Data integration send engine (7 entity types) | 51-57 | 20 hours | Partner API specs needed |
| 38 | MoH connectivity | INT-01 | 16 hours | MoH API access |
| 39 | TT 31/2026 + NĐ 37/2026 protocol compliance | INT-02 | 24 hours | Regulation specs |
| 40 | Partner API authentication (Sở NN, Sở CT) | INT-03 | 16 hours | Partner agreements |
| 41 | Machine-readable API specification | INT-04 | 8 hours | OpenAPI/Swagger docs |
| 42 | Data share history per entity type (7 screens) | 51-57 | 16 hours | After send engine |

**Total P3 effort: ~100 hours** (blocked on external dependencies)

---

### P4 — Infrastructure & Compliance

| # | Item | Effort | Dependency |
|---|---|---|---|
| 43 | Load testing (NFR-01..06) | 8 hours | k6/Artillery setup |
| 44 | PostgreSQL pgaudit extension | 2 hours | DBS-07 |
| 45 | Database encryption at rest | 4 hours | DBS-09 |
| 46 | Database Activity Monitoring tool | days | DBS-10 — third-party procurement |
| 47 | Level-2 security dossier | 16 hours | L2-01 |
| 48 | End-user manual | 24 hours | ACC-01..06 |
| 49 | Admin manual | 16 hours | ACC-01..06 |
| 50 | QuestPDF certificate generation | 16 hours | FR-LIC-01 |
| 51 | DNS IPv6 + DNSSEC configuration | 2 hours | IPV-04/05 |

**Total P4 effort: ~88+ hours**

---

## Effort Summary

| Tier | Items | Est. Hours | Cumulative % |
|---|---|---|---|
| P0 — Blockers | 7 | 2.5 | Enables deployment |
| P1 — Quick wins | 12 | 36 | ~80% functional |
| P2 — Core gaps | 17 | 100 | ~90% functional |
| P3 — Integration | 6 | 100 | ~95% functional |
| P4 — Compliance | 9 | 88+ | 100% contractual |
| **Total** | **51 work items** | **~326 hours** | — |

---

## Recommended Completion Sequence

1. **Sprint 1 (3 days)**: P0 blockers + P1 Excel exports → removes all production blockers, adds 8 missing exports
2. **Sprint 2 (1 week)**: P1 remaining + P2 high-impact items (per-business tabs, report features) → demo-ready
3. **Sprint 3 (2 weeks)**: P2 remaining + P3 integration scaffold → acceptance-testing ready
4. **Sprint 4 (2 weeks)**: P3 integration + P4 compliance → production-ready

---

## Independent Review Corrections (doc 68, 2026-07-27)

The independent review found this backlog underestimates both scope and effort:

### Corrected Effort Summary

| Tier | Items | Optimistic | Most Likely | Pessimistic | Notes |
|---|---|---|---|---|---|
| P0 — Blockers | **10** (was 7) | 3h | 5h | 8h | +3 new blockers (CAPTCHA on pwd reset, Redis auth, MinIO SSL) |
| P1 — Quick wins | 12 | 30h | 40h | 55h | Unchanged scope |
| P2 — Core gaps | 17 | 80h | 110h | 150h | Report aggregation/roll-up more complex than estimated |
| P3 — Integration | 6 | 80h | 120h | 180h | Architecture needs `DataType` column on `ApiCallLog` + per-entity screens |
| P4 — Compliance | 9 | 70h | 100h | 140h | Level-2 dossier, manuals, load testing |
| **P5 — Testing gap (NEW)** | **4+** | **40h** | **60h** | **80h** | **HTTP integration test suite, run Playwright E2E, load testing** |
| **P6 — Non-SW deliverables (NEW)** | **6** | **40h** | **60h** | **80h** | **Training materials, handover package, acceptance records** |
| **Total** | **58+** | **343h** | **495h** | **693h** | Was 51 items / ~326h |

### Key Differences

1. **P5 Testing gap (+60h most likely)**: Zero HTTP integration tests exist. The project testing policy requires `WebApplicationFactory` + Testcontainers. All 481 passing tests are structural/annotation checks. Building a minimal integration test suite is essential before customer acceptance.

2. **P6 Non-software deliverables (+60h most likely)**: 14 of 17 "non-software" items have software components (backup automation, training materials, user manual, admin manual, acceptance test records, data export). These were excluded from the original backlog.

3. **P3 Integration underestimated**: `ApiCallLog` entity lacks `DataType`, `Direction` columns. Need 7 per-entity-type screens (currently one generic screen). Need outbound sender engine. Architecture changes required before UI work.

4. **P2 Report roll-up**: FR-33-02 (commune→city→province aggregation) and FR-34-10 (auto-calculate from system data) are cross-module calculations typically requiring more than the 12h estimated per item.

**Corrected total: 340–693 hours (most likely 495h)** vs original 326h.
