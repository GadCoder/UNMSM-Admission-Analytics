## Context

The backend already has core domain models for admission processes and admission results, while frontend analytics views need process-scoped filtering and a lightweight process summary. Current gaps are API-level read contracts and an aggregated overview query path that is computed in PostgreSQL. The change must keep handlers thin and place query logic in repositories/services to preserve domain layering.

## Goals / Non-Goals

**Goals:**
- Expose read-only process endpoints under a process business-domain route module.
- Return explicit, stable Pydantic response schemas for list, detail, and overview responses.
- Compute overview metrics (`total_applicants`, `total_admitted`, `acceptance_rate`, `total_majors`) through PostgreSQL aggregation.
- Guarantee consistent 404 behavior for missing process IDs.

**Non-Goals:**
- Add major/area/faculty analytics, rankings, or trends.
- Add candidate search, imports/exports, or write/mutation endpoints.
- Introduce broad analytics refactors beyond process list/detail/overview.

## Decisions

- Organize routes by business domain under a dedicated `processes` route module.
Rationale: keeps API discoverable and aligned with existing domain-driven route organization.
Alternative considered: adding endpoints to a generic analytics router; rejected because it blurs ownership and increases coupling.

- Introduce explicit response schemas for process list items, process detail, and process overview.
Rationale: stable contracts reduce frontend breakage and keep serialization concerns out of repositories.
Alternative considered: returning raw ORM models/dicts; rejected because contracts become implicit and brittle.

- Keep handlers orchestration-only and move data access to repository/service methods.
Rationale: testability and separation of concerns; aggregate SQL can be unit/integration tested outside routing.
Alternative considered: building SQL in handlers; rejected because it violates layering and makes reuse harder.

- Compute overview metrics in PostgreSQL with aggregate functions and distinct counting.
Rationale: database-level aggregation is accurate, efficient, and avoids loading large result sets into Python.
Alternative considered: in-memory aggregation in service layer; rejected for performance and memory overhead.

- Sort process list from newest to oldest using deterministic order (`year DESC`, cycle precedence, then id DESC fallback).
Rationale: satisfies UX expectation and acceptance criteria.
Alternative considered: default DB order; rejected because ordering would be non-deterministic.

## Risks / Trade-offs

- [Cycle ordering ambiguity for non-standard cycle labels] -> Mitigation: document expected cycle values and implement deterministic fallback ordering.
- [Division by zero in acceptance rate when no applicants exist] -> Mitigation: guard in SQL/service and return `0.0`.
- [Aggregate query regressions with large result tables] -> Mitigation: ensure query uses indexed process filters and validate with integration tests.
- [Schema drift between ORM fields and API contract] -> Mitigation: centralize mapping in service layer and cover with response-schema tests.

## Migration Plan

- Add/extend repository methods for process list/detail and overview aggregates.
- Add/extend service methods to map repository results to response schemas.
- Add `processes` route module with three GET endpoints and 404 translation.
- Register routes in API router and run automated tests.
- Rollback: remove new routes and service/repository methods; no destructive data migration required.

## Open Questions

- Confirm canonical cycle ordering if additional cycle labels beyond `I`/`II` are present historically.
- Confirm desired numeric precision/rounding for `acceptance_rate` in API responses.
