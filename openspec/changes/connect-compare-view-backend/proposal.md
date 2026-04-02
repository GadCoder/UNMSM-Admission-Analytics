## Why

The `/compare` page is still powered by hardcoded entity options and synthetic metric rows, so users cannot compare real admission outcomes. We now have stable backend APIs and shared filter patterns used in other analytics views, making this the right time to convert Compare into a data-backed workflow.

## What Changes

- Replace static compare options with backend-driven entity loading (majors in v1) scoped by shared filters.
- Populate comparison rows with real metrics from existing analytics/trend APIs instead of placeholder values.
- Add comparison-ready states for loading, empty selections, and API errors so users can recover quickly.
- Reuse global filter context (`process_id`, `academic_area_id`) so Compare stays consistent with dashboard and explore behavior.
- Improve compare UX with clear default metric set and side-by-side trend/summary presentation for selected entities.

## Capabilities

### New Capabilities

- `frontend-compare-backend-integration`: Data-backed compare experience that loads selectable entities and renders real comparison metrics from existing backend contracts.

### Modified Capabilities

- `frontend-global-filter-system`: Extend shared filter usage requirements so Compare consumes the same URL-synced filter model and reset behavior as other analytics pages.

## Impact

- Affected code: `frontend/src/pages/compare-page.tsx`, new compare feature hooks under `frontend/src/features/compare/`, and related UI state handling.
- APIs consumed: existing read endpoints for process-scoped and area-scoped major analytics/trends (no new backend endpoint in v1).
- Systems: improves cross-page analytical consistency, especially around shared filter scope and process selection.
