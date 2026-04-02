## 1. Compare data layer

- [x] 1.1 Create `frontend/src/features/compare/` API hooks/types for loading scoped majors and per-major analytics/trend data from existing backend endpoints.
- [x] 1.2 Implement compare data mappers that transform backend responses into `ComparisonTable` entity columns and metric rows.
- [x] 1.3 Add bounded selection support (max entity count) and stale-selection reconciliation when filter scope changes.

## 2. Compare page integration

- [x] 2.1 Refactor `frontend/src/pages/compare-page.tsx` to consume `useGlobalFilters` and replace static entity options with backend-loaded majors.
- [x] 2.2 Wire selected entities to real comparison metrics (applicants, admitted, acceptance rate, trend context) in the comparison table.
- [x] 2.3 Ensure compare analytics requests include selected `process_id` and `academic_area_id` scope where applicable.

## 3. UX resilience and interaction states

- [x] 3.1 Add empty-selection guidance state before entities are chosen.
- [x] 3.2 Add loading and error presentation for compare queries, including per-entity partial failure handling.
- [x] 3.3 Add explicit UI feedback when users hit the compare selection limit.

## 4. Verification and quality

- [x] 4.1 Add focused tests for compare row mapping, selection reconciliation, and selection limit behavior.
- [x] 4.2 Add/adjust page-level tests for empty/loading/error/partial-success compare states.
- [x] 4.3 Run frontend verification (`pnpm test` and `pnpm build`) and document any follow-up gaps.
