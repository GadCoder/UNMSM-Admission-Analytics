## Context

The backend already exposes read endpoints for academic structure, admission processes, raw results search, major analytics, and major rankings. Frontend workflows now need historical major trends to visualize changes in competitiveness across processes without introducing write workflows or cross-major comparisons. Existing architectural constraints must be preserved: route handlers stay thin, explicit Pydantic contracts define payloads, and PostgreSQL performs metric aggregation.

## Goals / Non-Goals

**Goals:**
- Add `GET /majors/{major_id}/trends` as a read-only majors-domain endpoint.
- Return one chronological history row per process where selected-major data exists.
- Reuse metric definitions aligned with major analytics (`applicants`, `admitted`, `acceptance_rate`, score metrics, `cutoff_score`).
- Support optional `metrics` filtering with strict allowlist validation.
- Include major hierarchy context (`faculty`, `academic_area`) in response payload.

**Non-Goals:**
- Faculty-level or academic-area trend endpoints.
- Cross-major comparisons or ranking behavior changes.
- Caching, export workflows, or ingestion pipeline changes.
- New persistence models or schema migrations.

## Decisions

1. Endpoint placement in majors route module
- Decision: implement trends under the majors domain at `GET /majors/{major_id}/trends`.
- Rationale: keeps API grouped by business capability and consistent with existing `majors/{id}/analytics` endpoint organization.
- Alternative considered: separate trends router; rejected due to added routing fragmentation with no domain benefit.

2. Repository-level grouped aggregation by process
- Decision: compute historical snapshots using a PostgreSQL grouped query keyed by process (`process_id`, `year`, `cycle`) and ordered chronologically.
- Rationale: aggregation in SQL is efficient, deterministic, and keeps route/service layers thin.
- Alternative considered: fetching raw rows and aggregating in Python; rejected due to avoidable memory and CPU overhead.

3. Dynamic metric projection after validated allowlist parsing
- Decision: accept optional `metrics` query parameter as comma-separated names, validate against supported set, and project only requested metric keys in each history item.
- Rationale: clients can request compact payloads while preserving one stable endpoint contract.
- Alternative considered: always returning all metrics; rejected because frontend explicitly needs selective metric rendering.

4. Missing major semantics and empty history behavior
- Decision: return `404` when major does not exist; return `200` with empty `history` for existing majors with no rows.
- Rationale: aligns with current major endpoint behavior and preserves a stable consumer contract.
- Alternative considered: `404` when no rows found; rejected because resource existence and data availability are different concerns.

5. Metric-definition consistency with major analytics
- Decision: maintain equivalent definitions for shared metrics between analytics and trends (including null semantics for zero applicants and no-admitted cutoff).
- Rationale: prevents contradictory values across frontend views.
- Alternative considered: trends-specific formulas; rejected due to cross-view inconsistency risk.

## Risks / Trade-offs

- [Risk] Inconsistent formulas between analytics and trends paths over time.
  → Mitigation: enforce consistency requirement in specs and add endpoint tests validating expected metric semantics.

- [Risk] Chronological ordering ambiguity if process metadata is incomplete.
  → Mitigation: order by `year` then `cycle` (and stable `process_id` fallback) in repository query.

- [Risk] Optional metric filtering can create dynamic response shape complexity.
  → Mitigation: validate filter names centrally and use explicit schema modeling for metrics object fields.

## Migration Plan

1. Add new response schemas and metric allowlist validation for trends payloads.
2. Implement repository query methods for major lookup and process-grouped trend metrics.
3. Implement service orchestration for missing-major handling, metric filtering, and response assembly.
4. Add majors route handler delegating to service layer.
5. Add tests for success, missing major, ordering, metric filtering, and metric semantics.
6. Rollback strategy: remove trends route wiring and related service/repository/schemas; existing endpoints remain unaffected.

## Open Questions

- Should `cycle` ordering be explicitly normalized (e.g., `I`, `II`, `III`) in this change or deferred to process model constraints?
- Should metric filter validation reject duplicates or normalize them to unique values in request order?
