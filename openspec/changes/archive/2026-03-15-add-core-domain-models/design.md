## Context

The backend foundation is already in place (FastAPI app bootstrap, centralized settings, centralized SQLAlchemy setup, and Alembic wiring), but the domain persistence layer is still missing. This change introduces the first production domain schema for admission analytics, covering academic hierarchy, admission cycles, and candidate-level outcomes.

The schema must be relational, normalized, PostgreSQL-friendly, and migration-driven. It must support historical comparisons across admission processes and common filtering paths used by future API and analytics layers.

## Goals / Non-Goals

**Goals:**
- Model the academic hierarchy with strict foreign-key ownership: `academic_area -> faculty -> major`.
- Represent admission cycles historically via `AdmissionProcess` with unique cycle identity.
- Represent candidate-level admission outcomes with a single fact table linked to process and major.
- Enforce integrity using primary keys, foreign keys, and explicit unique constraints.
- Add useful indexes for read-heavy paths (process, major, score, candidate lookup, admitted status).
- Deliver the schema through Alembic migrations aligned with ORM metadata.

**Non-Goals:**
- Analytics materialization, precomputed tables, or reporting-specific denormalization.
- CSV parsing/import pipelines and import/export tracking entities.
- Worker/Redis/caching behavior.
- Endpoint/service implementation beyond the data model and migration scope.

## Decisions

1. Use integer surrogate primary keys for all core entities.
- Decision: `id` as integer PK on all tables.
- Rationale: Stable, compact joins and straightforward ORM identity handling.
- Alternative considered: Natural keys (e.g., process label, candidate code) as PKs.
  - Rejected because natural keys change more often and complicate foreign key evolution.

2. Enforce hierarchy via non-null foreign keys and scoped uniqueness.
- Decision:
  - `Faculty.academic_area_id` non-null FK.
  - `Major.faculty_id` non-null FK.
  - Unique `(academic_area_id, name)` for faculty.
  - Unique `(faculty_id, name)` for major.
- Rationale: Preserves hierarchical ownership while allowing duplicate names across parents.
- Alternative considered: Global unique names only.
  - Rejected due to realistic naming collisions across different areas/faculties.

3. Model admission process as `(year, cycle)` + normalized label.
- Decision: keep both `year` and `cycle` fields with unique `(year, cycle)` plus unique `label`.
- Rationale: Supports reliable ordering/filtering and human-readable identity.
- Alternative considered: Store only a string label.
  - Rejected because querying/sorting historical ranges is less robust with string-only semantics.

4. Use `AdmissionResult` as fact table with uniqueness per candidate-major-process.
- Decision: unique `(admission_process_id, major_id, candidate_code)`.
- Rationale: Prevents duplicate candidate rows for same process-major while still supporting same candidate across different cycles or majors.
- Alternative considered: unique by `(process, candidate_code)` only.
  - Rejected because one candidate can legitimately appear under different majors.

5. Normalize admission outcome with `is_admitted` boolean while preserving raw observation text.
- Decision: keep `is_admitted` and `observation_raw` together in result row.
- Rationale: Enables fast boolean filtering while retaining source traceability.
- Alternative considered: derive admitted status from raw observation only at query time.
  - Rejected for poor query ergonomics and inconsistent downstream interpretation.

6. Add explicit btree indexes for anticipated high-frequency predicates.
- Decision:
  - FK path indexes on `faculties.academic_area_id`, `majors.faculty_id`, `admission_results.admission_process_id`, `admission_results.major_id`.
  - Filter indexes on `admission_results.score`, `admission_results.candidate_code`, `admission_results.is_admitted`.
  - Composite index on `admission_results(admission_process_id, major_id)`.
- Rationale: Matches expected process/major slicing, score range scans, and candidate lookup.
- Alternative considered: rely only on implicit indexes from PK/unique constraints.
  - Rejected because non-unique filter paths would remain slow under growth.

7. Use timezone-aware server-default timestamps for auditable entities.
- Decision: include `created_at` and `updated_at` on core tables and set DB/server defaults.
- Rationale: Consistent audit fields across entities, compatible with PostgreSQL usage.
- Alternative considered: application-only timestamp assignment.
  - Rejected because database-level defaults are safer for bulk operations and migrations.

## Risks / Trade-offs

- [Risk] Candidate code format variability may lead to near-duplicate identities.  
  → Mitigation: keep code as stored value for now; defer normalization/canonicalization rules to ingestion layer.

- [Risk] Future analytics may require additional dimensional tables and denormalized structures.  
  → Mitigation: keep current schema focused and normalized; add derived tables in later changes.

- [Risk] `updated_at` auto-update behavior can drift between ORM-managed and SQL-only writes.  
  → Mitigation: enforce a consistent ORM update pattern now; consider DB trigger-based updates in later hardening.

- [Trade-off] More indexes improve reads but increase write overhead during imports.  
  → Mitigation: only include indexes aligned with known query paths and revisit after real workload metrics.

## Migration Plan

1. Add ORM models for all five entities and register them in model metadata imports.
2. Encode foreign keys, uniqueness constraints, nullable strategy, defaults, and indexes in models.
3. Generate Alembic revision for initial core domain schema.
4. Review generated migration and adjust for naming consistency and PostgreSQL-friendly types/defaults.
5. Apply migration locally and validate table/index/constraint creation.
6. Run downgrade/upgrade cycle to verify reversibility.

Rollback strategy:
- If issues are found before release, run Alembic downgrade for this revision and iterate on models/migration.
- Keep migration isolated to core tables so rollback scope remains contained.

## Open Questions

- Should `cycle` be constrained to a known set (e.g., `I`, `II`) now, or remain free text until official source constraints are finalized?
- Should candidate names be persisted exactly as source text, or minimally normalized (trimming/casing) at ingestion time?
- Do we want soft-delete semantics on hierarchy tables in later phases, or keep hard-delete only for now?
