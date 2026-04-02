## Why

The `/results` page is still powered by static sample rows and hardcoded entity metadata, so users cannot browse real candidate outcomes or trust pagination/search behavior. Backend search endpoints and shared filter infrastructure are already available, making this the right moment to close a high-visibility analytics gap with limited backend risk.

## What Changes

- Replace placeholder candidate rows and static entity header content with backend-backed results data.
- Connect page-level search and pagination controls to real `GET /results` query parameters so table interactions reflect live data.
- Reuse the shared global filter contract (`process_id`, `academic_area_id`) so Results stays URL-synced and consistent with other analytics pages.
- Add resilient loading, empty, and error states for filter dependencies and results retrieval.
- Default Results to the latest available admission process when no explicit process is selected, matching existing analytics behavior.

## Capabilities

### New Capabilities

- `frontend-results-backend-integration`: Data-backed Results experience that renders candidate-level admission outcomes from existing backend search endpoints.

### Modified Capabilities

- `frontend-global-filter-system`: Extend shared filter usage requirements so Results adopts the same URL-synced filter model and default process behavior as Dashboard, Explore, Compare, and Rankings.

## Impact

- Affected code: `frontend/src/pages/results-page.tsx`, results feature hooks/services under `frontend/src/features/`, and shared filter composition used by analytics pages.
- APIs consumed: existing read endpoints for process options (`GET /processes`), academic area options (`GET /areas`), and candidate search (`GET /results`).
- Systems: no new backend endpoint required in v1; this change primarily integrates frontend UI flows with already-implemented backend contracts.
