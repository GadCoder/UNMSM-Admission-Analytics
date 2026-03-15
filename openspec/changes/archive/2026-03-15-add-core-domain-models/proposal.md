## Why

The backend now needs a normalized relational core before endpoints, analytics services, and ingestion workflows can be implemented reliably. Defining the core academic hierarchy and admission-result schema now establishes consistent data contracts for all downstream features.

## What Changes

- Add ORM models for `AcademicArea`, `Faculty`, `Major`, `AdmissionProcess`, and `AdmissionResult`.
- Add relational constraints for hierarchy integrity (`academic_area -> faculty -> major`) and candidate-level admission result uniqueness.
- Add timestamp fields (`created_at`, `updated_at`) where appropriate for auditability and historical tracking.
- Add PostgreSQL-friendly indexes for read-heavy query paths (process, major, score range, candidate code, admission status).
- Create Alembic migration(s) to represent the full core domain schema in the database.
- Keep schema scope focused on core domain entities and explicitly exclude analytics/caching/import/export tracking concerns.

## Capabilities

### New Capabilities

- `core-academic-hierarchy-models`: Defines relational models and constraints for academic areas, faculties, and majors.
- `admission-process-models`: Defines historical admission process representation and uniqueness rules per cycle.
- `candidate-admission-results-models`: Defines candidate-level admission results, admission outcome normalization, and common filtering/index patterns.
- `core-domain-migrations`: Defines Alembic migration requirements for creating and evolving the initial core domain schema.

### Modified Capabilities

- None.

## Impact

- Affected code: backend ORM model modules, SQLAlchemy metadata wiring, and Alembic migration files.
- Affected data layer: introduces core relational tables, foreign keys, uniqueness constraints, and query indexes.
- APIs/systems: no new API endpoints in this change, but the schema enables future domain endpoints and analytics computations.
- Dependencies/tooling: relies on existing SQLAlchemy + Alembic foundation; migration workflow becomes required for schema bootstrap.
