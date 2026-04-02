## Context

The current Results page (`frontend/src/pages/results-page.tsx`) is still a static scaffold: applicant rows, entity header metadata, and pagination behavior are mocked in-memory. Users can interact with controls, but results do not represent real admission outcomes and cannot be trusted for analysis.

The project already has the required backend and shared frontend building blocks: `GET /results` for candidate search with pagination/sorting/filtering, `GET /processes` and `GET /areas` for filter options, and the URL-synced global filter model (`process_id`, `academic_area_id`) used by other analytics pages. This change focuses on integrating those contracts into Results without expanding backend APIs.

## Goals / Non-Goals

**Goals:**

- Replace static Results table rows with backend-backed candidate result data.
- Connect Results search and pagination controls to `GET /results` query parameters.
- Reuse shared global filters (`process_id`, `academic_area_id`) and keep URL synchronization behavior consistent with other analytics pages.
- Apply latest-process default behavior when `process_id` is not explicitly set.
- Provide explicit loading, empty, and error states for both filters and table data.

**Non-Goals:**

- Creating new backend endpoints or changing existing `/results` response schema.
- Rebuilding design-system table primitives (`DataTable`, `TableToolbar`, `Pagination`) beyond page composition.
- Adding advanced results workflows in v1 (bulk actions, export redesign, saved searches).
- Introducing candidate-level detail endpoints in this change.

## Decisions

### Decision 1: Introduce a Results feature data layer under `frontend/src/features/results/`

- **Choice:** Create dedicated hooks/adapters for results query params, API request mapping, and table row mapping instead of embedding fetch/transform logic directly in `results-page.tsx`.
- **Rationale:** Keeps page component focused on composition and UI state while isolating data-contract logic for easier testing and reuse.
- **Alternatives considered:**
  - Handle fetch and mapping directly in page component.
  - **Rejected:** increases coupling and makes future results-page enhancements harder to maintain.

### Decision 2: Use global filters as scope inputs and local controls for result-specific query params

- **Choice:** Keep `process_id` and `academic_area_id` sourced from shared global filters, while results-specific params (`candidate_name`, `page`, optional sort fields) remain page-local but synchronized into request state.
- **Rationale:** Preserves cross-page filter consistency while avoiding overloading global state with page-specific concerns.
- **Alternatives considered:**
  - Store results-specific query params in the global filter system.
  - **Rejected:** global model should remain minimal and reusable across analytics pages.

### Decision 3: Apply latest-process fallback only when URL lacks explicit process scope

- **Choice:** On initial load, if `process_id` is absent, select the newest process from `GET /processes`; if present in URL, preserve it even if not newest.
- **Rationale:** Matches existing analytics behavior and respects deep links/bookmarks.
- **Alternatives considered:**
  - Always force newest process regardless of URL.
  - **Rejected:** breaks user-intended deep links and creates surprising state overrides.

### Decision 4: Keep server-side pagination and sorting authoritative

- **Choice:** Forward pagination/sorting inputs to `GET /results` and render backend `total`, `page`, and `total_pages` metadata directly in UI.
- **Rationale:** Prevents client-side drift for large result sets and aligns with backend filtering/sorting contracts.
- **Alternatives considered:**
  - Fetch larger datasets and paginate client-side.
  - **Rejected:** higher payload cost and inconsistent behavior versus backend query semantics.

### Decision 5: Implement independent UI states for filters and table data

- **Choice:** Handle filter option loading and results table loading/error/empty states independently so partial functionality remains usable.
- **Rationale:** Better resilience and user clarity; failed table fetch should not break filter controls and vice versa.
- **Alternatives considered:**
  - Single page-level loading/error gate.
  - **Rejected:** blocks too much UI and obscures which data source failed.

### Decision 6: Keep advanced results filters out of v1

- **Choice:** Do not expose `candidate_code` and `is_admitted` controls in the initial Results UI; keep only the current search + pagination experience for this integration pass.
- **Rationale:** Prioritizes stable backend wiring and avoids expanding UI surface during the first production connection.
- **Alternatives considered:**
  - Include full filter controls in v1.
  - **Deferred:** useful for power users but better handled in a follow-up after core integration is validated.

### Decision 7: URL-sync only shared global filters in v1

- **Choice:** Keep URL synchronization limited to `process_id` and `academic_area_id`; do not persist `candidate_name`, `page`, or `sort_by` in the URL in this change.
- **Rationale:** Preserves the existing global-filter contract and avoids introducing page-specific URL reconciliation complexity.
- **Alternatives considered:**
  - Sync all results query params into URL.
  - **Deferred:** can be added in a dedicated deep-link enhancement once base behavior is stable.

### Decision 8: Remove placeholder row actions from Results table in v1

- **Choice:** Remove current placeholder table actions (`View`, `Compare`) and keep the page focused on read/search/paginate behavior.
- **Rationale:** Prevents non-functional controls in production-facing UI and reduces confusion.
- **Alternatives considered:**
  - Keep placeholder actions until wired.
  - **Rejected:** interactive affordances should map to real behavior.

## Risks / Trade-offs

- [Risk] Results queries can be chatty during fast search input changes. -> Mitigation: debounce search input before requesting `GET /results` and rely on query caching.
- [Risk] Stale URL filter IDs may not exist in current filter options. -> Mitigation: keep IDs in state, show fallback labels/empty guidance, and avoid hard failures.
- [Risk] Candidate-level row mapping may diverge from backend schema evolution. -> Mitigation: centralize mapping/types in the Results feature layer and add focused tests for adapters.
- [Trade-off] v1 prioritizes integration speed over richer Results interactions (advanced sorting/filter chips/export controls). -> Mitigation: preserve extension points in hooks and table toolbar for follow-up increments.

## Migration Plan

1. Create Results feature API/types/hooks for `GET /results` query + response mapping.
2. Refactor `frontend/src/pages/results-page.tsx` to consume shared global filters and Results hooks instead of static rows.
3. Wire toolbar search and pagination to backend query params and response metadata.
4. Add loading/empty/error rendering paths for filter dependencies and table data.
5. Validate latest-process default behavior, URL synchronization, and refresh persistence.
6. Run frontend tests/build and perform a manual Results page smoke check.

Rollback strategy: revert Results page and feature hook integration to the current static scaffold. No backend rollback or data migration is required.
