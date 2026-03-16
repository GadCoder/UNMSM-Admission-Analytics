## Context

The platform already supports core entities, process browsing, raw result search, and single-major analytics. The frontend now needs a comparative layer to rank majors within a selected process using consistent metrics, so users can identify most competitive or most demanded majors at a glance. Rankings are snapshot and process-scoped, so this change should remain separate from historical trend analysis.

## Goals / Non-Goals

**Goals:**
- Expose `GET /rankings/majors` for process-scoped major rankings.
- Require `process_id` and `metric`, with optional `sort_order`, `academic_area_id`, `faculty_id`, and `limit`.
- Return ranking rows containing rank, major/faculty/academic_area context, plus core metrics (`applicants`, `admitted`, `acceptance_rate`, `cutoff_score`).
- Keep handlers thin and move ranking/filter logic to repository/service layers.
- Compute ranking metrics in PostgreSQL.

**Non-Goals:**
- Historical trend endpoints or multi-process evolution analysis.
- Major-to-major comparison workflows beyond ordered leaderboard output.
- Caching, CSV workflows, or non-read mutations.

## Decisions

- Implement a dedicated rankings domain route (`/rankings/majors`).
Rationale: clear ownership and separation from single-major analytics behavior.
Alternative considered: extending `/majors` route family; rejected because rankings are cross-major aggregate queries.

- Enforce ranking metric allowlist (`cutoff_score`, `acceptance_rate`, `applicants`, `admitted`).
Rationale: keeps query mapping safe and explicit.
Alternative considered: dynamic metric field input; rejected due safety and maintainability risks.

- Require `process_id` for V1 rankings.
Rationale: rankings are defined as process-scoped snapshots and avoid mixed historical semantics.
Alternative considered: optional process scope; rejected because output meaning becomes ambiguous for dashboard leaderboard use.

- Compute all per-major metrics in PostgreSQL grouped queries and derive rank from sorted result ordering.
Rationale: efficient aggregation at source and deterministic output.
Alternative considered: in-memory aggregation/ranking; rejected for scalability reasons.

- Return full metric bundle in each ranking row even when sorting by one metric.
Rationale: frontend can render tables/cards without secondary API calls.
Alternative considered: return only chosen metric; rejected due extra frontend complexity.

## Risks / Trade-offs

- [Ties in ranking metric produce ambiguous rank positions] -> Mitigation: define deterministic secondary ordering (e.g., major name/id).
- [Null metrics for some majors affect sorting behavior] -> Mitigation: document null handling and use consistent DB order strategy.
- [Large process datasets could be expensive with multiple joins] -> Mitigation: rely on indexed joins and scoped filters (`process_id`, hierarchy ids, limit).
- [Different ranking metrics imply different optimal sort defaults] -> Mitigation: default to `desc` and allow explicit override.

## Migration Plan

- Add rankings schemas for query parameters and ranking row/response payloads.
- Add repository method for grouped per-major metric aggregates with process/hierarchy filters and sortable metric mapping.
- Add service method to orchestrate validation, rank assignment, and response shaping.
- Add rankings route module and register in API router.
- Add endpoint tests for metric sorting, filter scoping, rank ordering, and schema shape.
- Rollback by removing rankings route/service/repository/schema changes; no data migration required.

## Open Questions

- Confirm default `limit` and maximum `limit` allowed by frontend UX.
- Confirm tie strategy presentation (shared rank vs sequential rank) for equal metric values.
