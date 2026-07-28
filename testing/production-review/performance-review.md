# Production Readiness Review — Performance

**Date:** 2026-07-28 · **HEAD:** `6b6ff6a` · NFR targets (CLAUDE.md §6 / YCKT): avg <10s, worst <30s, ≥30 concurrent users, server CPU ≤75% avg.

## 1. Measured evidence (not estimates)

| Measurement | Result | Source |
|---|---|---|
| k6 load: 30 VUs, 2 min steady, 6 main-flow endpoints, real cookie login | **0.00% failures, avg 31ms, p95 42ms, max 418ms** — NFR-01/02/05/06 pass with ~300× headroom | `docs/testing/05-load-test-results.md` |
| Server CPU under that load | API avg ~54%, PostgreSQL avg ~20% (≤75% target) — NFR-03/04 pass on dev hardware | same (docker stats sampling) |
| Route navigation, warm stack (46 routes) | 1.2–2.6s settle incl. data fetch; zero routes near the 10s bound | UI-audit runs (this date) |
| Full E2E suite duration | 286 tests / ~5min (workers=1) — indirect evidence request path stays fast under sustained sequential load | gate G7 |

**Caveat (owed, tracked):** all figures are developer-hardware; the k6 re-run + CPU capture on production hardware is an at-deploy gate item (I-3/G-33).

## 2. Frontend

- **Bundle:** 3.5MB dist with route-level code splitting; largest chunks vendor 432K, StatisticsPage 408K (recharts), table 172K, Leaflet 152K, entry 116K (~⅓ gzipped). Healthy for an admin SPA; fonts self-hosted (no third-party fetch); public portal pages are light.
- **Rendering:** AntD tables paginated (15–20 rows) everywhere — no unvirtualized large lists; statistics fetches capped at 500 rows for the map datasets; charts render <300ms observed. No heavy re-render hotspots surfaced by the audit's interaction flows.
- **P-1 (Low):** StatisticsPage chunk is the single heaviest route; if it matters later, split recharts per-tab.

## 3. Backend / database

- Indexed exactly where list filters and uniqueness live (see backend-quality §1); zero raw SQL; no classic N+1 in request paths.
- **Scale-sensitive items (all bounded, none currently violating NFRs):**
  - P-2 dashboard ≈15 sequential COUNTs per load (B-5) — linear with data volume; batch or use the existing `cached_dashboard_stats` design.
  - P-3 Excel import row-by-row inserts (B-4) — 500-row import ≈ seconds today; batch with `autoSave:false` + single save.
  - P-4 expiry jobs load all expired rows unbatched (B-7) — page the query.
  - P-5 no `MaxResultCount` server ceiling (B-2) — an availability guard, listed under backend quality; a hostile/buggy client can force a full-table query.
  - P-6 statistics endpoints query live per request (no output caching); Redis sits provisioned-but-unused (G-23) — either wire ABP distributed cache to it (dashboard/statistics are the natural first users) or drop the container dependency.

## 4. Verdict

**Performance is a strength today**: measured 31ms average against a 10,000ms requirement, with CPU inside bounds at the required concurrency. Nothing observed threatens the NFRs at go-live data volumes. The listed items are growth-proofing (counts, imports, jobs, caching) plus one guard (P-5) — schedule them as normal engineering work; re-run k6 on production hardware at deploy time to convert the NFR evidence from "dev-hardware pass" to "contractual pass".
