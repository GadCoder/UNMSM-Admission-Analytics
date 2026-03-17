## Context

The backend already supports read APIs and analytics over `admission_results`, but ingestion still depends on manual database inserts. Real source CSV files include practical nuances (`observation` may be empty, `modality` exists, `merit` may be empty for non-admitted rows), so V1 import must reflect the actual shape while keeping route handlers thin and logic centralized in service/util layers.

## Goals / Non-Goals

**Goals:**
- Add a synchronous internal/admin import workflow at `POST /imports/results` accepting multipart `file` and `process_id`.
- Validate required CSV columns before row processing.
- Parse and validate row fields (`score`, `merit`, required text fields).
- Map `major` to existing records via deterministic trimmed exact-name matching.
- Derive `is_admitted` from centralized observation normalization (`ALCANZÓ VACANTE` => `true`, else `false`).
- Insert valid rows into `admission_results` and return summary with row-level errors.

**Non-Goals:**
- Async job processing, object storage, or import history tables.
- Automatic creation of majors/processes.
- Extended normalization heuristics (accent-insensitive major matching) in V1.

## Decisions

1. Domain-oriented imports route with thin handler
- Decision: expose endpoint in dedicated imports route module and delegate all CSV logic to service layer.
- Rationale: aligns with existing domain routing and keeps controllers thin.
- Alternative considered: monolithic route parsing; rejected due to maintainability.

2. File-level vs row-level error split
- Decision: fail request on file-level errors (missing columns, invalid CSV shape, unknown process) and continue partial import for row-level errors.
- Rationale: protects correctness of the overall import context while still loading valid rows.
- Alternative considered: all-or-nothing row validation; rejected because one bad row should not block large imports.

3. Centralized normalization helpers
- Decision: create helper for admission outcome normalization from `observation` and keep major matching/field parsing in reusable utility methods.
- Rationale: avoids duplicated behavior and supports future rule upgrades.
- Alternative considered: inline parsing/normalization in loop; rejected due to drift risk.

4. Transactional insert behavior with duplicate handling
- Decision: process rows in a single import workflow with controlled per-row insert attempts; treat unique-constraint conflicts as row failures.
- Rationale: preserves data integrity and gives actionable summary without aborting whole import.
- Alternative considered: pre-checking duplicates in memory only; rejected because DB constraint is source of truth.

## Risks / Trade-offs

- [Risk] Exact major-name matching may reject rows with accent/format differences.
  → Mitigation: keep deterministic V1 behavior and track normalization enhancement in future change.

- [Risk] Partial import can leave mixed success/failure in a single run.
  → Mitigation: return explicit counts and row-level reasons for reconciliation.

- [Risk] CSV variation between historical files could break strict column checks.
  → Mitigation: enforce required columns explicitly and fail early with clear missing-column message.

## Migration Plan

1. Add imports API contract and response schema.
2. Implement parser/validation/normalization utilities.
3. Implement repository helpers for process lookup, major lookup, and result inserts.
4. Implement import service orchestration and summary generation.
5. Add endpoint tests for file-level and row-level outcomes.
6. Rollback by removing imports route wiring and import modules; existing read APIs unaffected.

## Open Questions

- Should duplicate detection report a standardized reason independent of DB backend error text?
- Should future major matching include accent-insensitive normalization and alias mapping?
