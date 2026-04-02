## Why

The project currently exposes read and analytics views, but there is no in-app admin workflow to maintain academic catalog data or run results imports from the frontend. Adding an admin interface now removes manual API-only operations and makes ongoing dataset maintenance safer and faster.

## What Changes

- Add a frontend admin area with pages/forms to manage academic areas and majors.
- Add frontend flow for uploading results CSV files and selecting target admission process.
- Add frontend bulk upload workflow to submit many CSV files in one operation and monitor processing status.
- Add backend admin management APIs for academic-structure write operations needed by the admin UI.
- Add backend bulk import orchestration APIs (batch creation, file item status, progress reporting, and retry/cancel semantics).
- Add minimal admin authentication/authorization (single admin role via JWT) to protect admin UI routes and admin APIs.
- Extend route/navigation contracts to include admin access entry points in the app shell.
- Add validation/error handling contracts so admin actions return actionable field-level and domain-level feedback.

## Capabilities

### New Capabilities
- `admin-academic-management-api`: create/update/list admin endpoints for academic areas and majors, including validation and safe update semantics.
- `frontend-admin-management-interface`: admin frontend pages for areas/majors management and results upload execution with status feedback.
- `bulk-results-import-orchestration`: asynchronous multi-file import workflow with batch tracking, per-file outcomes, and operator-safe recovery semantics.
- `admin-authentication-and-authorization`: login/token + admin-only guard behavior for admin frontend routes and backend write/import endpoints.

### Modified Capabilities
- `admission-results-csv-import-api`: clarify admin-facing import interaction contract (request/response semantics needed by UI workflows and error presentation).
- `frontend-app-shell-layout`: add admin route/navigation presence in shell while preserving existing layout and accessibility behavior.

## Impact

- Frontend: new admin pages, forms, table actions, route wiring, and API client methods.
- Backend: new admin route module(s), schemas, service/repository write paths, and tests for create/update validation.
- Existing import endpoint contracts: potentially refined response details for UI-friendly progress/error display.
- Import operations: support high-volume multi-file ingestion without blocking request/response cycles.
- Documentation/OpenSpec: new capability specs plus updates to affected existing specs and endpoint report.
