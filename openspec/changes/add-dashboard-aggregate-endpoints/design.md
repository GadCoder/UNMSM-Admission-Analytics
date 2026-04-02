## Context

The frontend dashboard currently composes multiple backend endpoints (`/processes`, `/processes/{id}/overview`, `/rankings/majors`, `/majors/{id}/trends`) to render one page. This creates avoidable latency, repeated network requests, and semantics drift where UI labels imply global aggregates but data is actually per-major proxy data. The project roadmap in `openspec/project.md` already identifies dashboard-oriented aggregations as the next backend priority, and the architecture requires thin FastAPI routes with service/repository delegation, explicit Pydantic response schemas, and selective Valkey caching.

## Goals / Non-Goals

**Goals:**
- Add a dedicated `/dashboard` API domain for analytics needed by the dashboard home page.
- Provide server-side aggregate responses for KPI overview, top rankings, and trend charts.
- Support required dashboard filters (`process_id`) plus optional hierarchy scope (`academic_area_id`, `faculty_id`) where mathematically valid.
- Remove frontend need to compose many requests for core dashboard sections.
- Preserve route thinness, explicit contracts, and cache-failure-tolerant behavior.

**Non-Goals:**
- Authentication, user profile, notifications, or admin features.
- Replacing existing analytics endpoints (`/rankings/majors`, `/majors/{id}/trends`, `/processes/{id}/overview`).
- Write workflows, ETL changes, new persistence models, or precomputed materialized tables.
- Full BI-style cube dimensions beyond process and academic hierarchy scope.

## Decisions

1. New dashboard route group instead of extending existing endpoints
- Decision: add `backend/app/api/routes/dashboard.py` with routes under `/dashboard/*`.
- Rationale: dashboard aggregates are cross-domain compositions and fit a page-oriented analytics boundary better than overloading processes/rankings/majors contracts.
- Alternatives considered:
  - Add optional flags to existing endpoints; rejected due to contract bloat and unclear ownership.
  - Keep frontend composition; rejected due to latency, duplication, and semantics drift.

2. Endpoint split by dashboard section, not one monolithic payload
- Decision: provide focused endpoints (`/dashboard/overview`, `/dashboard/rankings`, `/dashboard/trends/applicants`, `/dashboard/trends/cutoff`).
- Rationale: section-level independent loading/error behavior matches frontend architecture and avoids one endpoint becoming a large failure domain.
- Alternatives considered:
  - Single `GET /dashboard` aggregate payload; rejected for reduced failure isolation and difficult cache invalidation granularity.

3. Scope model and validation rules
- Decision: require `process_id` for section data that represents a process snapshot (`overview`, `rankings`), and allow optional `academic_area_id`/`faculty_id` with validation that faculty belongs to selected area when both are present.
- Rationale: preserves existing process-driven semantics while enabling hierarchy-scoped dashboard views.
- Alternatives considered:
  - Make `process_id` optional everywhere with "latest" default; rejected because hidden defaulting can create surprising results and unstable URLs.

4. Aggregate trend semantics for cutoff
- Decision: define cutoff trend as process-level aggregate average of admitted cutoff scores across majors in scope.
- Rationale: this is a true aggregate trend and resolves the current top-major proxy limitation.
- Alternatives considered:
  - Median of major cutoffs; rejected for v1 to keep SQL and communication simpler.
  - Weighted average by applicants; deferred for future if product requires.

5. SQL-first aggregation and deterministic ordering
- Decision: perform aggregations in repository SQL queries grouped by process and ordered by `year`, `cycle`, then `process_id` for deterministic time series.
- Rationale: minimizes Python-side computation and keeps performance predictable for read-heavy analytics.
- Alternatives considered:
  - In-memory composition in service layer; rejected due to avoidable overhead.

6. Read-through caching for dashboard endpoints
- Decision: add dashboard-specific cache keys that encode all response-affecting parameters and cache each endpoint independently.
- Rationale: dashboard is read-heavy and repeatedly queried with common filter combinations.
- Alternatives considered:
  - No caching initially; rejected because dashboard endpoints are aggregation-heavy and likely hot paths.

## Risks / Trade-offs

- [Risk] Dashboard aggregates may be interpreted as exact business KPIs even when scope filters are partial.  
  → Mitigation: explicit response metadata with applied filters and aggregate definitions.

- [Risk] Time-series queries across many processes can become expensive as data grows.  
  → Mitigation: SQL aggregation + endpoint-level caching + future indexing review if query plans degrade.

- [Risk] `cycle` lexical ordering can differ from business ordering (e.g., `I`, `II`, `Extraordinario`).  
  → Mitigation: keep current deterministic ordering now and document follow-up normalization if needed.

- [Risk] Added endpoint surface increases maintenance burden.  
  → Mitigation: isolate domain module (`dashboard`) with strong schema/tests and no coupling changes to existing routes.

## Migration Plan

1. Add dashboard schemas for overview, rankings, trends, shared filter metadata, and error contracts.
2. Add repository queries for scoped process overview, dual rankings composition, applicants trend, and cutoff trend aggregations.
3. Add dashboard service orchestration with input validation, response assembly, and cache integration.
4. Add `/dashboard` router and wire it in `backend/app/api/router.py`.
5. Add cache-key helpers and TTL usage for all dashboard endpoints.
6. Add endpoint tests for successful responses, filter behavior, validation errors, and caching/fallback behavior.
7. Update `backend/ENDPOINTS_REPORT.md` and aligned sections in `openspec/project.md`.
8. Rollback strategy: remove dashboard route wiring and module files; existing endpoint contracts remain unchanged.

## Open Questions

- Should cutoff aggregate trend use simple average or applicant-weighted average as product default?
- Should dashboard endpoints expose optional `limit` controls for rankings or keep fixed defaults for UI consistency?
- Do we want a strict enum for `cycle` ordering in analytics queries, or keep string order until process taxonomy is finalized?
