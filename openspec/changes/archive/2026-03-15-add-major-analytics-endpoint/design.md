## Context

The backend currently provides read APIs for academic structure, admission processes, and raw candidate result search, but it does not yet expose major-level analytics. Frontend major detail views need a single endpoint that combines major hierarchy context with process-scoped metrics derived directly from admission results. This change introduces the first analytics endpoint and must keep existing architecture constraints: thin route handlers, explicit schemas, and repository/service separation.

## Goals / Non-Goals

**Goals:**
- Expose `GET /majors/{major_id}/analytics` under the majors business domain.
- Support optional `process_id` filter (single process scope when provided; all-process scope when omitted).
- Return explicit response schemas for `major`, `filters`, and `metrics`.
- Compute metrics in PostgreSQL: applicants, admitted, acceptance_rate, max/min/avg/median/cutoff scores.
- Return `404` for missing majors and empty-but-valid analytics for majors with no matching rows.

**Non-Goals:**
- Add faculty/area analytics, rankings, trends, or comparison endpoints.
- Add caching or cross-process trend aggregation.
- Add import/export or mutation behavior.

## Decisions

- Extend majors route module with a dedicated analytics endpoint.
Rationale: keeps analytics for a major colocated with existing major domain routes.
Alternative considered: separate analytics router; rejected to avoid fragmented major API ownership.

- Reuse major hierarchy context contract (major + faculty + academic area) in analytics response.
Rationale: response consistency with existing major endpoints and frontend reuse.
Alternative considered: flat IDs-only response; rejected because frontend needs display-ready context.

- Compute all metrics in PostgreSQL aggregate queries, including median via percentile/ordered-set function.
Rationale: correctness and efficiency at scale; avoids materializing rows in Python.
Alternative considered: in-memory median/aggregates; rejected for performance and memory overhead.

- Model empty analytics as successful response with zero/null metrics when no rows match filters.
Rationale: consumer-friendly behavior for existing majors without scoped data.
Alternative considered: returning 404 or 204; rejected because major exists and endpoint should be stable.

- Define acceptance rate as nullable numeric (`null` when applicants=0).
Rationale: avoids misleading zero-rate semantics and matches explicit metric definition.
Alternative considered: return `0.0`; rejected due ambiguity between zero acceptance and no data.

## Risks / Trade-offs

- [Median function portability differs by database dialect] -> Mitigation: implement PostgreSQL-first query and isolate SQL in repository.
- [Aggregate queries may be expensive without process/major indexes] -> Mitigation: rely on existing indexes and validate query plans in integration tests.
- [Floating-point precision drift in numeric metrics] -> Mitigation: keep DB numeric aggregation and return consistent typed schema values.
- [Null-heavy metric outputs may confuse consumers] -> Mitigation: document empty-response semantics in schema and tests.

## Migration Plan

- Add analytics schemas under majors/results domain schemas.
- Add repository methods to fetch major context and compute analytics aggregates with optional process filter.
- Add service method to orchestrate major existence check and analytics response assembly.
- Add `GET /majors/{major_id}/analytics` route and register/update majors route module as needed.
- Add tests for success, filtered scope, empty-data response, 404 major, and metric semantics (median/cutoff).
- Rollback by removing route and associated service/repository/schema additions; no data migration required.

## Open Questions

- Confirm rounding/precision policy for decimal metrics in API serialization (raw numeric vs fixed precision).
- Confirm whether optional future filters (e.g., candidate state) should remain out-of-contract for this endpoint.
