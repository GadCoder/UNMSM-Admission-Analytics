## Why

The frontend needs stable, read-only endpoints to browse admission processes and select one process as a filter for analytics views. Delivering these endpoints now unblocks process-scoped analysis flows and standardizes how process metadata and baseline metrics are retrieved.

## What Changes

- Add read-only API endpoints for listing admission processes, retrieving process detail, and retrieving process overview metrics.
- Define explicit Pydantic response schemas for process list items, process detail, and process overview responses.
- Add repository query methods for process list/detail reads and PostgreSQL-backed overview aggregation.
- Add service-layer methods to orchestrate process reads while keeping route handlers thin.
- Return `404 Not Found` for missing admission processes.

## Capabilities

### New Capabilities
- `admission-process-read-apis`: Expose domain-grouped read endpoints for admission process listing, detail retrieval, and basic process overview metrics.

### Modified Capabilities
- `admission-process-models`: Extend existing admission process behavior contract to include API-facing read schemas and process-level overview aggregation semantics.

## Impact

- Affected backend API routing and domain organization for admission process endpoints.
- New/updated repository and service logic for process reads and overview aggregates.
- API contract additions for frontend consumption of process filter options and selected process summary metrics.
- PostgreSQL aggregate queries introduced for overview metrics (`total_applicants`, `total_admitted`, `acceptance_rate`, `total_majors`).
