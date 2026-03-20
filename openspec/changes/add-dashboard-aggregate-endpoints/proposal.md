## Why

The dashboard home page currently depends on composing multiple process-, ranking-, and major-scoped endpoints, which creates extra round trips and forces frontend-only proxy logic for trends that are not true global aggregates. We need backend-supported dashboard aggregations now so the dashboard can present accurate, filter-aware analytics without brittle client-side stitching.

## What Changes

- Add a new dashboard API domain with aggregate endpoints designed for the `/dashboard` home page.
- Add `GET /dashboard/overview` to return KPI metrics for a selected process with optional hierarchy scope (`academic_area_id`, `faculty_id`).
- Add `GET /dashboard/rankings` to return both competitive and popular top-major lists for the selected process and optional hierarchy scope in one response.
- Add `GET /dashboard/trends/applicants` to return applicants-over-processes time series with optional hierarchy scope.
- Add `GET /dashboard/trends/cutoff` to return process-over-process average cutoff trend (aggregate, not single-major proxy) with optional hierarchy scope.
- Add explicit response schemas, repository aggregations, service orchestration, and read-through caching for new dashboard endpoints.
- Update backend endpoint documentation and project snapshot sections to include the new dashboard capabilities.

## Capabilities

### New Capabilities
- `dashboard-analytics-api`: Dashboard-specific aggregate endpoints for overview KPIs, top rankings, and trend series with process/hierarchy filters.

### Modified Capabilities
- `valkey-cache-foundation`: Extend cache key and TTL application policy to include dashboard aggregate endpoints.

## Impact

- API surface: new `/dashboard` route group and response contracts.
- Backend layers: new dashboard route module, service module, repository module, dashboard schemas, cache keys, and tests.
- Documentation: `backend/ENDPOINTS_REPORT.md` and aligned sections in `openspec/project.md`.
- Frontend integration impact: dashboard page can consume true aggregate endpoints instead of composing many calls and proxy trends.
