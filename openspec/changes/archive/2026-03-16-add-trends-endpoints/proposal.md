## Why

The frontend needs historical major-level trend data to analyze how competitiveness changes across admission processes. After delivering major analytics and ranking views, trends provide the next high-value read capability for longitudinal analysis.

## What Changes

- Add a read-only endpoint `GET /majors/{major_id}/trends` for one-major historical metrics across all processes with available data.
- Return chronological process snapshots and include major hierarchy context (faculty and academic area) in the response.
- Support optional `metrics` filtering with a validated allowlist of trend metrics.
- Enforce thin route handlers with query/computation logic in repository and service layers.
- Return 404 for missing majors and compute trend metrics from PostgreSQL using definitions aligned with major analytics.

## Capabilities

### New Capabilities
- `major-trends-api`: Defines endpoint contract, filtering behavior, chronological ordering, and response schema for major-level historical trends.

### Modified Capabilities
- `major-analytics-api`: Clarify cross-capability metric definition consistency between major analytics and trends responses.

## Impact

- API surface: new `GET /majors/{major_id}/trends` endpoint in the majors domain.
- Backend layers: majors route updates, trends service orchestration, repository aggregate queries, and metric filter validation.
- Schemas: new explicit response models for trend payloads (major context, process summary, selected metrics, history entries).
- Tests: endpoint coverage for happy path, metric filtering, chronological ordering, and missing-major behavior.
