## Why

The `/explore` page is still wired to hardcoded hierarchy data and placeholder entity content, so it does not reflect real admission data or stay consistent with selected filters. We already implemented the backend read APIs and frontend filter foundation in prior archived changes, so connecting Explore now closes a major product gap with minimal backend risk.

## What Changes

- Replace static hierarchy mocks in the Explore page with backend-backed data loading.
- Load and render academic hierarchy context (area/faculty/major) from existing APIs so sidebar selections map to real entities.
- Connect selected major context to existing analytics endpoints so the details panel shows real metrics/trends instead of placeholder copy.
- Reuse shared global filter state (`process_id`, `academic_area_id`) so Explore behavior matches dashboard/rankings/trends navigation expectations.
- Add loading, empty, and error states for hierarchy and detail data to keep Explore resilient when API responses are delayed or incomplete.

## Capabilities

### New Capabilities

- `frontend-explore-backend-integration`: Data-driven Explore experience that consumes existing backend hierarchy and analytics APIs for real navigation and entity insight rendering.

### Modified Capabilities

- `frontend-global-filter-system`: Extend usage requirements so Explore consumes the shared filter model and URL synchronization contract rather than maintaining page-local filter state.

## Impact

- Affected code: `frontend/src/pages/explore-page.tsx`, new/updated Explore data hooks under `frontend/src/features/`, and related UI state handling.
- APIs consumed: `GET /areas`, `GET /faculties`, `GET /majors`, `GET /majors/{major_id}/analytics`, and `GET /majors/{major_id}/trends`.
- System impact: no new backend endpoints required for v1; this change focuses on frontend integration with already-available contracts.
