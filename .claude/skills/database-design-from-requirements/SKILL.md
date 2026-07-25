# Skill: database-design-from-requirements

Runs the full FoodSafe database design pipeline — from raw requirements through to a red-team-verified PostgreSQL schema with Critical=0, High=0.

Invoke with: `/database-design-from-requirements`

---

## What this skill does

It coordinates six specialized agents in sequence, passing the output of each step as the input to the next. The pipeline is designed to be resumable — each step checks whether its output already exists before doing work, so you can re-invoke the skill after a partial run and it will continue from where it stopped.

The pipeline ends only when the schema-red-team agent confirms Critical=0, High=0. If it finds issues, it fixes them and runs again.

---

## Before you start

Read these to understand current state:

```
docs/00-index.md               — which docs exist and at what version
docs/03-database-schema.sql    — current schema (if it exists)
docs/14-database-review-report.md — current readiness state (if it exists)
```

Then determine the starting step using the decision table below.

---

## Pipeline Steps

### STEP 0 — Determine starting point

| Condition | Start at step |
|-----------|--------------|
| `docs/01-functional-requirements.md` is missing or contains `[CẦN XÁC NHẬN]` items that need resolution | Step 1 |
| `docs/02-domain-model.md` or `docs/04-state-machines.md` is missing | Step 2 |
| `docs/03-database-schema.sql` is missing or is a stub | Step 3 |
| Schema exists but `docs/11` or `docs/12` are missing | Step 4 (parallel) |
| Everything exists but no red-team pass has run | Step 5 |
| Red-team ran but Critical > 0 or High > 0 | Step 5 (re-run) |
| Red-team confirmed Critical=0, High=0 | Step 6 |

---

### STEP 1 — Requirements Analyst

**When to run:** `docs/01-functional-requirements.md` is missing, incomplete, or the source documents have changed.

**Spawn:** `requirements-analyst` agent

**Input:** All source documents in the workspace (ask user to provide them if none exist)

**Output:** `docs/01-functional-requirements.md`

**Gate to proceed:** The document exists, has a summary table, every STT has a ràng buộc section, and there are no unresolved `[CẦN XÁC NHẬN]` items that would affect database design. If there are unresolved items, stop and ask the user to confirm them before continuing.

---

### STEP 2 — Domain Modeler

**When to run:** `docs/02-domain-model.md` or `docs/04-state-machines.md` is missing or does not cover all STTs in docs/01.

**Spawn:** `domain-modeler` agent

**Input:** `docs/01-functional-requirements.md`

**Output:** `docs/02-domain-model.md`, `docs/04-state-machines.md`

**Gate to proceed:** Both documents exist. Every bounded context in CLAUDE.md §3.2 appears in docs/02. Every entity with a status field in docs/01 has a state machine in docs/04. Every state machine has numeric enum values assigned.

---

### STEP 3 — Database Architect

**When to run:** `docs/03-database-schema.sql` is missing or is a stub (fewer than 30 CREATE TABLE statements).

**Spawn:** `database-architect` agent

**Input:** `docs/01-functional-requirements.md`, `docs/02-domain-model.md`, `docs/04-state-machines.md`, `docs/05-permission-matrix.md`, `docs/07-non-functional-requirements.md`

**Output:** `docs/03-database-schema.sql`, `docs/09-database-data-dictionary.md`, `docs/10-database-index-strategy.md`, `docs/15-database-assumptions-and-open-questions.md`

**Gate to proceed:** The schema file exists, has a revision log header, and covers all bounded contexts. The data dictionary exists. The assumptions document lists at least the known design decisions that required judgment calls.

---

### STEP 4 — Authorization Reviewer + Workflow Reviewer (parallel)

**When to run:** `docs/11-database-security-and-data-scope.md` or `docs/12-database-history-and-audit-strategy.md` is missing, OR the schema has changed since these docs were last written.

**Spawn both agents in parallel** (they do not conflict — each writes a different output file):

**Agent A:** `authorization-reviewer`
- Input: `docs/03-database-schema.sql`, `docs/05-permission-matrix.md`, `docs/01-functional-requirements.md`
- Output: `docs/11-database-security-and-data-scope.md`

**Agent B:** `workflow-reviewer`
- Input: `docs/04-state-machines.md`, `docs/03-database-schema.sql`, `docs/01-functional-requirements.md`
- Output: `docs/12-database-history-and-audit-strategy.md`

**Gate to proceed:** Both output documents exist. If either reviewer found Critical or High findings, address them before proceeding to Step 5. You can ask the user whether to fix them now or let the red-team handle them in Step 5 (the red-team will find them independently anyway).

---

### STEP 5 — Schema Red Team (repeat until Critical=0, High=0)

**When to run:** Always run this step. Never skip it, even if all previous steps produced clean output. The red-team's independence is the point.

**Spawn:** `schema-red-team` agent

**Critical instruction to the agent:**  
> Do NOT read Section 10 "Final Readiness Assessment" of `docs/14-database-review-report.md` before completing your independent analysis. Form your own findings first across all twelve attack vectors, apply fixes, then check docs/14.

**Input:** `docs/03-database-schema.sql` (full file), `docs/04-state-machines.md`, `docs/01-functional-requirements.md`, `docs/02-domain-model.md`

**Output:**
- Fixes applied directly to `docs/03-database-schema.sql`
- Findings written to `docs/14-database-review-report.md` Section 11 (create the section if it does not exist)

**Repeat logic:**
```
repeat:
  run schema-red-team
  read its reported Critical=N, High=N from docs/14
  if Critical > 0 or High > 0:
    run schema-red-team again (fixes may expose new issues)
  else:
    break
```

**Gate to proceed:** The red-team agent's final report shows Critical=0, High=0.

---

### STEP 6 — Finalize and commit

**When to run:** All previous steps complete, red-team confirmed Critical=0, High=0.

**Actions to take directly** (not via a spawned agent):

1. Update `docs/00-index.md`:
   - Increment version number (v2.0 → v2.1 or v3.0 for a full rebuild)
   - Update the schema line to show current table count and version label
   - Add a red-team summary table if one is not already present

2. Update `docs/14-database-review-report.md` Section 10 (Final Readiness Assessment):
   - Change the assessment to `READY — Critical=0, High=0` (or `READY WITH DOCUMENTED ASSUMPTIONS` if docs/15 has open items)
   - Update the schema statistics table (table count, constraint count, index count)
   - List remaining open assumptions from docs/15

3. Produce `docs/08-database-requirement-traceability.md` if it does not exist:
   - One row per STT from docs/01
   - Column: STT, requirement title, primary table(s), coverage status (✅ Covered / ⚠️ Partial / ❌ Gap)
   - Total coverage percentage

4. Produce `docs/13-database-integration-strategy.md` if it does not exist:
   - Data contracts for each external system (Bộ YT, Sở NN, Sở CT)
   - Which tables feed outbound data
   - Idempotency and retry design from `data_sharing_histories`

5. Git commit:
   ```
   git add docs/
   git commit -m "docs: database schema vX.Y — [summary of what changed]"
   ```

---

## Artifact tracking

Update `docs/00-index.md` after every step that produces a new document. The index is the canonical record of what exists and at what version.

---

## Failure modes to watch for

| Symptom | Likely cause | Action |
|---------|-------------|--------|
| Red-team finds the same issue twice | Fix was applied incorrectly (comment added, constraint not) | Re-read the schema at the relevant table; verify the constraint actually exists in the DDL |
| Edit tool fails silently on schema file | CRLF+Unicode in file causes string match failure | Use PowerShell `Get-Content -Raw` + `.Replace()` + `Set-Content` instead of Edit tool |
| Red-team reports Critical=0 but issues remain | Red-team read docs/14 before forming findings | Re-run with explicit instruction to skip docs/14 until independent analysis is complete |
| domain-modeler misses a bounded context | CLAUDE.md §3.2 lists 8 but docs/02 has fewer | Re-run domain-modeler and explicitly list the missing bounded contexts in the prompt |

---

## Completion criteria for the full skill

The skill is complete when:
- [ ] `docs/01` through `docs/15` all exist (15 documents)
- [ ] `docs/03` has a revision log with the current version
- [ ] `docs/14` Section 10 reads: "READY — Critical=0, High=0"
- [ ] `docs/00-index.md` version number reflects the current schema version
- [ ] A git commit captures all documentation changes
