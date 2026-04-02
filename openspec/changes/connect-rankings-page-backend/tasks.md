## 1. Rankings Data Integration

- [x] 1.1 Replace static ranking list data in `frontend/src/pages/rankings-page.tsx` with backend-driven ranking query results.
- [x] 1.2 Add/compose rankings data adapter logic so "Most Competitive" and "Largest Intake" panels map backend fields to design-system ranking components.
- [x] 1.3 Remove placeholder ranking fallback constants and ensure page behavior depends on real query state.

## 2. Shared Filter Wiring and Default Process Scope

- [x] 2.1 Integrate Rankings with shared global filter model (`process_id`, `academic_area_id`) and URL synchronization.
- [x] 2.2 Replace hardcoded process and area options with shared backend option hooks.
- [x] 2.3 Implement latest-process fallback resolution for Rankings when `process_id` is absent while preserving explicit URL-provided process values.

## 3. Async UX and Error Resilience

- [x] 3.1 Implement explicit loading states for ranking panels and filter dependencies.
- [x] 3.2 Implement explicit empty states when backend returns no ranking items for selected scope.
- [x] 3.3 Implement explicit error messaging for ranking and filter option query failures.

## 4. Verification and Regression Safety

- [x] 4.1 Add/update focused frontend tests for rankings filter scope behavior and latest-process fallback logic.
- [x] 4.2 Add/update page-level tests for Rankings loading, empty, and error states.
- [x] 4.3 Run frontend verification (`pnpm build` and relevant test suites) and document any follow-up gaps.

Follow-up gaps: no blocking gaps identified in this implementation pass.
