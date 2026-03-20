## Why

Analytics pages in the Admission Explorer need a shared filter foundation so users can switch between views without relearning filter behavior or losing state. Implementing this now unblocks dashboard and future analytics pages with consistent, URL-driven filtering.

## What Changes

- Add a reusable global filter state model for `process_id` and `academic_area_id`.
- Build a reusable `GlobalFilterBar` UI with process selector, academic area selector, and reset action.
- Add URL query synchronization so filters initialize from URL, update URL on change, and persist on refresh.
- Add reusable hooks/helpers for reading, updating, and resetting shared filters from pages.
- Add data hooks to load process options (`GET /processes`) and academic area options (`GET /areas`).
- Ensure implementation aligns with `openspec/design-system.md` global filter bar visual and interaction standards.

## Capabilities

### New Capabilities

- `frontend-global-filter-system`: Shared analytics filter infrastructure for reusable UI controls, URL-synced filter state, and backend-backed filter options.

### Modified Capabilities

- None.

## Impact

- Affected code: frontend analytics shared components, filter hooks/utilities, and analytics page integration points.
- APIs consumed: backend `GET /processes` and `GET /areas`.
- Navigation/state: URL query parameter handling for `process_id` and `academic_area_id`.
- Future systems enabled: dashboard, rankings, trends, and explore pages can adopt the same filter system without page-specific reimplementation.
