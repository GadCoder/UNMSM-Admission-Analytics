## 1. Results Feature Data Layer

- [x] 1.1 Create `frontend/src/features/results/` API types and request helpers for `GET /results` query/response mapping.
- [x] 1.2 Implement Results query hook(s) that accept shared filter scope plus page-local search/pagination inputs.
- [x] 1.3 Add adapter/mapping utilities to transform backend result items into `results-page.tsx` table row and header context models.

## 2. Results Page Integration

- [x] 2.1 Refactor `frontend/src/pages/results-page.tsx` to consume backend Results hooks instead of static `baseRows` and hardcoded metadata.
- [x] 2.2 Wire search and pagination controls to backend query params and render backend `page`/`total_pages` metadata.
- [x] 2.3 Remove placeholder row actions (`View`, `Compare`) from v1 Results table rendering.

## 3. Global Filter and Default Scope Behavior

- [x] 3.1 Integrate shared global filters (`process_id`, `academic_area_id`) into Results request scope and page composition.
- [x] 3.2 Implement latest-process fallback for `/results` when `process_id` is absent, while preserving explicit URL-provided `process_id`.
- [x] 3.3 Ensure URL behavior remains global-filter-only in v1 (do not sync `candidate_name`, `page`, `sort_by` into URL contract).

## 4. Async UX, Validation, and Verification

- [x] 4.1 Implement explicit loading, empty, and error states for Results data and filter dependencies.
- [x] 4.2 Add/update focused frontend tests for scope propagation, latest-process fallback, and global-filter-only URL behavior.
- [x] 4.3 Run frontend verification (`pnpm test` and `pnpm build`) and capture any follow-up gaps.

Follow-up gaps: Vite build reports a non-blocking bundle-size warning for the main JS chunk (>500 kB); no functional regressions found in this pass.
