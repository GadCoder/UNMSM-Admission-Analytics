## Why

The frontend needs a stable analytics endpoint to evaluate competitiveness for a selected major and process. Delivering this now adds the first major-focused analytical layer while keeping the API contract explicit and reusable for future ranking/trend features.

## What Changes

- Add a read-only `GET /majors/{major_id}/analytics` endpoint grouped by domain.
- Support optional `process_id` filtering; compute across all processes when omitted.
- Return explicit response schemas for major context, applied filters, and analytics metrics.
- Compute analytics in PostgreSQL (counts, score aggregates, median, cutoff, acceptance rate).
- Return `404 Not Found` for missing majors.
- Return valid empty analytics for existing majors with no rows in the selected filter scope.

## Capabilities

### New Capabilities
- `major-analytics-api`: Provide major-level analytics endpoint behavior, filter semantics, and response contract.

### Modified Capabilities
- `candidate-admission-results-models`: Extend result-query requirements to define consistent major analytics metric semantics (including median and cutoff score behavior).

## Impact

- Route update in majors domain to expose major analytics endpoint.
- New/updated repository and service methods for major lookup and analytics aggregation.
- Explicit Pydantic schemas for major analytics payloads and nested hierarchy context.
- PostgreSQL aggregate/statistical query logic for applicants, admitted, acceptance rate, score aggregates, median, and cutoff score.
