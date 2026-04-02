## Why

The `/rankings` page still uses hardcoded filter options and placeholder ranking data, so it does not reflect real admission outcomes or the selected filter context. We already have stable backend ranking APIs and shared global filter patterns in other analytics views, so this change closes a major consistency gap with low backend risk.

## What Changes

- Replace static process/year/area options in Rankings with backend-driven filter options from existing shared filter hooks.
- Connect ranking panels to real backend responses (competitive and popularity rankings) instead of mock list items.
- Apply the same global filter contract used across analytics pages (`process_id`, `academic_area_id`) so Rankings stays URL-synced and predictable.
- Add robust loading, empty, and error states for ranking data and filter dependencies.
- Default Rankings to the latest available process when no explicit process is selected, matching dashboard behavior.

## Capabilities

### New Capabilities

- `frontend-rankings-backend-integration`: Data-backed Rankings experience that renders real major rankings and filter-scoped insights using existing backend read endpoints.

### Modified Capabilities

- `frontend-global-filter-system`: Extend shared filter usage requirements so Rankings consumes the URL-synced filter model and default process behavior consistently with Dashboard/Compare/Explore.

## Impact

- Affected code: `frontend/src/pages/rankings-page.tsx`, rankings data hooks under `frontend/src/features/`, and shared filter composition for the page.
- APIs consumed: existing read endpoints for process options, academic area options, and rankings aggregates (no new backend endpoint required in v1).
- Systems: improves cross-page analytics consistency and reduces placeholder UI debt on a primary navigation page.
