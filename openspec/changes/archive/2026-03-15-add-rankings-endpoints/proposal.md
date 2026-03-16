## Why

After delivering single-major analytics, the frontend now needs comparative analytics to show leaderboard views across majors for a selected admission process. Ranking endpoints unlock top-major widgets and cross-major competitiveness views without introducing trend or historical complexity yet.

## What Changes

- Add read-only ranking endpoint `GET /rankings/majors` grouped under rankings business domain.
- Require `process_id` and `metric`, with optional `sort_order`, `academic_area_id`, `faculty_id`, and `limit`.
- Compute and return ranked major rows with consistent analytics fields: `applicants`, `admitted`, `acceptance_rate`, and `cutoff_score`.
- Return ranking context fields (`rank`, `major`, `faculty`, `academic_area`) for each row.
- Keep route handlers thin and move filtering/ranking query logic to service/repository layers.
- Restrict ranking metric to V1 allowlist: `cutoff_score`, `acceptance_rate`, `applicants`, `admitted`.

## Capabilities

### New Capabilities
- `major-rankings-api`: Expose process-scoped cross-major rankings endpoint with metric allowlist, optional hierarchy filters, and explicit response schemas.

### Modified Capabilities
- `major-analytics-api`: Extend analytics contract to include comparative ranking semantics for major metrics used in leaderboard views.

## Impact

- New rankings route module and router registration.
- New/updated repository and service methods for major metric aggregation and rank ordering.
- Explicit Pydantic schemas for ranking query parameters and ranking result payloads.
- PostgreSQL aggregate query logic for per-major metric computation and sorted ranking output under process scope.
