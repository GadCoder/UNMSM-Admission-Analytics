## Why

The frontend needs a stable read API to inspect raw candidate-level admission rows behind analytics and troubleshoot data quality. Introducing a paginated, filterable results search endpoint now enables exploration, verification, and future export workflows without coupling to aggregate analytics endpoints.

## What Changes

- Add a read-only `GET /results` endpoint grouped by business domain for candidate-level admission result search.
- Support frontend-friendly filtering by process, hierarchy context, candidate identifiers/text, score range, and admission status.
- Support pagination (`page`, `page_size`) and constrained sorting (`sort_by`, `sort_order`) with safe defaults.
- Return explicit Pydantic response schemas for paginated results and nested process/major/faculty/academic area context.
- Implement repository/service query flow with thin route handlers and PostgreSQL-backed filtering/count queries.
- Include case-insensitive partial candidate name search against normalized lastname+name fields.

## Capabilities

### New Capabilities
- `admission-results-search-api`: Expose a paginated and filterable candidate-level results search endpoint with explicit response contracts.

### Modified Capabilities
- `candidate-admission-results-models`: Extend result-query behavior requirements to cover candidate name matching, constrained sorting, and paginated retrieval semantics.

## Impact

- New API route module for results search and registration in the main router.
- New/updated schemas, repository query methods, and service orchestration for list+count retrieval.
- PostgreSQL joins across admission results, processes, majors, faculties, and academic areas for enriched row context.
- Test coverage updates for filter semantics, pagination, sorting constraints, and response structure stability.
