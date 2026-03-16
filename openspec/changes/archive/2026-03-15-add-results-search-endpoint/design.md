## Context

The backend already stores candidate-level admission results with links to admission process and academic hierarchy entities. Frontend workflows now require direct exploration of raw records with simple filters, deterministic sorting, and pagination so users can inspect source rows behind analytics and verify import quality. The endpoint must remain read-only, keep route handlers thin, and perform filtering/counting in PostgreSQL to handle large datasets.

## Goals / Non-Goals

**Goals:**

- Expose a business-domain `GET /results` endpoint for candidate-level result search.
- Support optional filters for process/hierarchy, candidate identity text, score range, and admission status.
- Support validated pagination and restricted sorting with safe defaults.
- Return explicit response schemas including nested process, major, faculty, and academic area context.
- Keep query logic in repository/service layers with efficient joins and count/query separation.

**Non-Goals:**

- Add ranking/trend analytics or aggregate reporting endpoints.
- Add write/mutation endpoints, import workflows, or export workflows.
- Introduce full-text search infrastructure beyond simple case-insensitive partial matching.

## Decisions

- Implement a dedicated `results` route module under the existing API domain structure.
  Rationale: maintains domain grouping and keeps admission-result concerns isolated.
  Alternative considered: append to existing routers; rejected to avoid oversized mixed-purpose modules.

- Introduce explicit Pydantic schemas for search filters, result item payload, nested context objects, and paginated response metadata.
  Rationale: stable API contract and centralized validation/serialization behavior.
  Alternative considered: return ORM rows directly; rejected because contracts become implicit and brittle.

- Restrict sorting to an allowlist (`score`, `merit_rank`, `candidate_lastnames`, `candidate_names`) and map safely to SQL expressions.
  Rationale: prevents arbitrary sort injection and preserves predictable query plans.
  Alternative considered: free-form sort fields; rejected for safety and maintainability.

- Execute filtered list query and total-count query in repository layer with shared filter-building logic.
  Rationale: keeps route handlers thin and ensures pagination metadata is accurate.
  Alternative considered: single window-function query; rejected for now to keep implementation straightforward and testable.

- Implement `candidate_name` matching using normalized concatenation of lastnames + names with case-insensitive partial matching.
  Rationale: improves frontend search usability without external search dependencies.
  Alternative considered: separate filters for names/lastnames only; rejected because users usually search full names naturally.

## Risks / Trade-offs

- [High-offset pagination degrades on very large datasets] -> Mitigation: constrain page size and consider keyset pagination in future iteration.
- [Name normalization may miss edge cases with diacritics/spacing] -> Mitigation: normalize whitespace/casing in SQL expression and document current behavior.
- [Join-heavy queries can regress if indexes are missing/misaligned] -> Mitigation: rely on existing FK/index coverage and validate query plans in integration testing.
- [Nullable related data could break nested response mapping] -> Mitigation: use outer joins where needed and defensive mapping that keeps response stable.

## Migration Plan

- Add schemas for filters/sort/pagination and paginated result responses.
- Add repository methods for filtered result retrieval and total count computation.
- Add service method to orchestrate validation, repository calls, and response mapping.
- Add `GET /results` route and register it in the API router.
- Add endpoint tests for filter semantics, sorting constraints, pagination metadata, and nested context presence.
- Rollback: remove route registration and new result-search modules; no data migration required.

## Open Questions

- Confirm exact max `page_size` limit expected by frontend (e.g., 100 vs 200).: 100
- Confirm whether accent-insensitive matching is required now or can be deferred.; required
