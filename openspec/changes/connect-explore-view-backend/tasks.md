## 1. Explore data foundations

- [x] 1.1 Create `frontend/src/features/explore/` API types and query hooks for majors, major analytics, and major trends using existing backend endpoints.
- [x] 1.2 Implement an Explore hierarchy adapter that groups backend major payloads into `area -> faculty -> major` sidebar nodes with stable IDs.
- [x] 1.3 Add query parameter wiring so hierarchy requests honor `academic_area_id` and analytics requests honor `process_id`.

## 2. Explore page integration

- [x] 2.1 Refactor `frontend/src/pages/explore-page.tsx` to remove static mock hierarchy data and consume Explore feature hooks.
- [x] 2.2 Implement major-driven detail rendering with backend analytics/trends data and explicit no-major-selected fallback state.
- [x] 2.3 Add independent loading, empty, and error UI states for hierarchy and detail panels while preserving interactive navigation.

## 3. Shared filter and URL behavior

- [x] 3.1 Integrate `useGlobalFilters` into Explore so `process_id` and `academic_area_id` remain URL-synced and consistent with other analytics pages.
- [x] 3.2 Update Explore filter bar composition to use shared global filter controls without page-specific divergence from design-system behavior.
- [x] 3.3 Reconcile selection on filter scope changes (auto-select valid major or clear selection with prompt) to prevent stale node references.

## 4. Verification and quality checks

- [x] 4.1 Add focused frontend tests for hierarchy transformation and selection reconciliation logic under Explore feature modules.
- [x] 4.2 Add/adjust integration tests for Explore page async states (loading, empty, error, and successful major detail rendering).
- [x] 4.3 Run frontend verification (`pnpm build` and relevant test suites) and document any known follow-up gaps.
