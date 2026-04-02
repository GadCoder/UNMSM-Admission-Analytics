## Context

The Rankings page currently renders hardcoded filter options and static ranking lists, so it does not use the real process/area scope or backend ranking contracts. Other analytics pages (Dashboard, Compare, Explore) already use shared filter hooks, URL-synced global filter behavior, and backend query hooks, which gives us a stable integration pattern to reuse.

This change is cross-cutting across page composition, shared filter behavior, and data fetching, but does not require new backend endpoints.

## Goals / Non-Goals

**Goals:**
- Render Rankings using backend data instead of placeholder lists.
- Reuse shared filter behavior (`process_id`, `academic_area_id`) so Rankings behaves consistently with other analytics pages.
- Default to the latest available process when no explicit process is selected.
- Provide clear loading, empty, and error states for rankings and filter dependencies.

**Non-Goals:**
- Adding new backend ranking endpoints or changing backend ranking algorithms.
- Redesigning dashboard/compare/explore pages as part of this change.
- Adding advanced client-side ranking customization (multi-sort, custom weighting, exports).

## Decisions

1. **Reuse existing dashboard rankings endpoint and types for v1**
   - Decision: Use the same backend rankings contract already consumed by dashboard aggregates (competitive/popular major rankings) instead of introducing a rankings-specific API client contract first.
   - Rationale: Lowest risk and fastest path to production, with known stable payload shape and error handling patterns.
   - Alternative considered: Build a separate Rankings API module and response contract immediately. Rejected for v1 to avoid duplicate network and model logic before behavior is validated.

2. **Adopt shared global filter model for URL-synced scope**
   - Decision: Rankings reads and writes `process_id` and `academic_area_id` using the shared global filter utilities/hooks.
   - Rationale: Keeps mental model consistent across analytics pages and supports deep-linking/bookmarking with predictable query params.
   - Alternative considered: Keep page-local state in Rankings only. Rejected because it fragments behavior and breaks cross-page filter expectations.

3. **Derive year/process selection from process labels with latest-first fallback**
   - Decision: Parse process labels (`YYYY-I|II`) to derive year options and default to the latest process when not selected.
   - Rationale: Preserves current Year + Process UX while ensuring meaningful default data without user input.
   - Alternative considered: Drop year selector and keep process only. Rejected for now to minimize UI churn and keep compatibility with existing filter bar structure.

4. **Normalize ranking panel states (loading/empty/error) per data readiness**
   - Decision: Rankings panels render explicit states independent of static placeholders.
   - Rationale: Prevents confusing partially-rendered UI and aligns with resilience patterns used in Compare and Explore.
   - Alternative considered: Silent fallback to empty arrays. Rejected because users cannot distinguish no-data from fetch failures.

## Risks / Trade-offs

- [Process label parsing can fail for non-standard labels] -> Mitigate with defensive parsing and stable fallback ordering by label when parsing fails.
- [Shared dashboard ranking contract may not perfectly match future Rankings-specific UX needs] -> Mitigate by isolating adapter logic in Rankings so a dedicated endpoint can be swapped later without page rewrite.
- [Global filter synchronization can override local defaults unexpectedly] -> Mitigate by giving URL params precedence and applying latest-process defaults only when params are absent.
- [Perceived loading latency from multiple filter and ranking queries] -> Mitigate with compact loading states and query-key reuse/caching through React Query.

## Migration Plan

1. Add Rankings data integration hooks/adapters and replace placeholder ranking data rendering.
2. Wire Rankings page filter state to shared global filters and backend option hooks.
3. Add latest-process default selection logic and robust panel states.
4. Validate with frontend tests/build and manual checks for URL sync, reset behavior, and no-data/error handling.

Rollback strategy:
- Revert Rankings page to static placeholder rendering and page-local filter state if integration causes blocking regressions. No data migration is required.

## Open Questions

- Should Rankings use the shared modern global filter bar component (used by Compare/Explore) in a follow-up for full visual consistency, or keep the current Year+Process filter composition for now?
- Do we want a Rankings-specific endpoint (or server-side sorting controls) after v1 if product asks for additional ranking modes beyond competitive/popular?
