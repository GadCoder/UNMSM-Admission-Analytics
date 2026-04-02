## 1. Dashboard Domain Contracts

- [x] 1.1 Add dashboard response schemas for overview KPIs, dual rankings payload, applicants trend series, cutoff trend series, and applied-filter metadata
- [x] 1.2 Add dashboard query parameter schemas/validation helpers for `process_id`, optional hierarchy filters, and optional ranking `limit`
- [x] 1.3 Add validation behavior for unknown hierarchy IDs and inconsistent `academic_area_id` + `faculty_id` combinations

## 2. Repository and Service Implementation

- [x] 2.1 Add dashboard repository module with SQL aggregations for process-scoped overview metrics and hierarchy-scoped variants
- [x] 2.2 Add repository queries for dual rankings composition (`cutoff_score` and `applicants`) with shared filter inputs
- [x] 2.3 Add repository trend queries for applicants-over-processes and aggregate cutoff-over-processes with deterministic ordering
- [x] 2.4 Add dashboard service orchestration that composes repository outputs into endpoint response schemas

## 3. API Routes and Wiring

- [x] 3.1 Add dashboard routes: `GET /dashboard/overview`, `GET /dashboard/rankings`, `GET /dashboard/trends/applicants`, and `GET /dashboard/trends/cutoff`
- [x] 3.2 Keep route handlers thin by delegating validation, aggregation, and composition to service/repository layers
- [x] 3.3 Register dashboard router in `backend/app/api/router.py`

## 4. Caching and Reliability

- [x] 4.1 Add dashboard cache-key helpers with full parameter-sensitive signatures per endpoint
- [x] 4.2 Apply read-through cache integration in dashboard services with configured TTL
- [x] 4.3 Preserve cache failure fallback behavior so endpoint responses still compute from PostgreSQL when cache operations fail

## 5. Testing and Documentation

- [x] 5.1 Add endpoint tests for successful responses, query validation, and hierarchy filter behavior across all dashboard endpoints
- [x] 5.2 Add tests covering trend semantics (aggregate, process-ordered series) and dual-list rankings response shape
- [x] 5.3 Add tests for cache hit/miss behavior and cache-failure fallback paths for dashboard endpoints
- [x] 5.4 Update `backend/ENDPOINTS_REPORT.md` and aligned `openspec/project.md` snapshot sections for new dashboard domain
