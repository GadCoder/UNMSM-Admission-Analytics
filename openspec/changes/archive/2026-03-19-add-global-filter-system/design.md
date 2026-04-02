## Context

Admission Explorer analytics pages require the same core filters (`process_id`, `academic_area_id`) but currently lack a shared frontend contract for state, URL synchronization, and UI composition. Without a shared system, each page would duplicate filter controls and query param logic, increasing inconsistency and maintenance overhead.

The change introduces a reusable filter foundation for dashboard and future analytics pages, while remaining aligned with `openspec/design-system.md` (global filter bar pattern, spacing, hierarchy, and calm analytical visual tone). Backend APIs for filter options already exist (`GET /processes`, `GET /areas`), so this design focuses on frontend state + UI composition and URL-driven navigation behavior.

## Goals / Non-Goals

**Goals:**

- Provide a single reusable filter state model covering `process_id` and `academic_area_id`.
- Synchronize filter state with URL query parameters for deep links and refresh persistence.
- Provide reusable hooks/helpers for reading, updating, and resetting filters from pages.
- Provide a reusable `GlobalFilterBar` component composed of process selector, academic area selector, and reset action.
- Load selector options from backend-backed data hooks and expose integration-ready APIs for future analytics pages.
- Align filter UI styling and information hierarchy with `openspec/design-system.md`.

**Non-Goals:**

- Dashboard-specific metrics, charts, or business logic.
- Additional filters (year, faculty, table-level filters, search).
- Backend API/model changes.
- Breadcrumbs or page-specific rendering concerns.

## Decisions

### Decision 1: URL query parameters are the source of truth for shared filter state

- Choice: Represent selected filters in URL params (`process_id`, `academic_area_id`) and derive initial state from URL on page load.
- Rationale: Guarantees direct navigation, refresh persistence, and sharable links without custom persistence storage.
- Alternative considered: Local component state with optional localStorage.
  - Rejected because local-only state breaks deep-link behavior and can desynchronize across pages.

### Decision 2: Introduce a dedicated global filter hook/utility boundary

- Choice: Create reusable filter utilities/hook(s) that encapsulate parse/serialize/update/reset logic for query params.
- Rationale: Centralizes normalization rules (e.g., empty values removed from URL), avoids per-page duplicated router logic, and creates stable integration for future pages.
- Alternative considered: Handle query param logic inline in each page.
  - Rejected because it duplicates behavior and increases drift risk.

### Decision 3: Compose filter UI as a reusable `GlobalFilterBar`

- Choice: Implement one composable filter bar with three controls: process select, academic area select, reset button.
- Rationale: Guarantees consistent UX and styling across analytics pages and matches the design system’s global filter bar pattern.
- Alternative considered: Keep selectors independent and let each page arrange them.
  - Rejected because page-level composition leads to inconsistent spacing/hierarchy and weaker reuse.

### Decision 4: Load option datasets via dedicated data hooks per resource

- Choice: Use dedicated hooks for processes and areas, each reading from backend endpoints and returning options suitable for selectors.
- Rationale: Keeps data loading concerns separate from presentation/state-sync concerns and enables reuse across pages.
- Alternative considered: Fetch option datasets inside `GlobalFilterBar` directly.
  - Rejected because it tightly couples rendering and data concerns, reducing testability and reuse.

### Decision 5: Reset behavior clears managed query params cleanly

- Choice: Reset removes `process_id` and `academic_area_id` from URL (or sets to canonical empty defaults) in a single action.
- Rationale: Ensures predictable “unfiltered” state and avoids stale query params after reset.
- Alternative considered: Reset to first available option.
  - Rejected because defaulting to a concrete option can be misleading and is harder to generalize for future filters.

## Risks / Trade-offs

- [Risk] Query param parsing inconsistencies (string/number handling) could produce invalid selections. → Mitigation: centralize parse/serialize logic with strict normalization and selector-safe outputs.
- [Risk] Filter option data may load after URL state is initialized, causing temporary unmatched values. → Mitigation: preserve raw selected IDs from URL and resolve labels once options arrive; avoid dropping valid pending IDs.
- [Risk] Shared component styling may drift from design system over time. → Mitigation: codify layout tokens/classes in `GlobalFilterBar` and reference `openspec/design-system.md` during review.
- [Trade-off] URL-driven state adds router coupling compared with purely local state. → Mitigation: keep routing logic isolated in dedicated filter utilities/hook API.

## Migration Plan

1. Add shared filter query model and URL sync helpers.
2. Add backend-backed hooks for process and area options.
3. Build `GlobalFilterBar` using shared hooks/utilities and design-system-aligned styling.
4. Integrate the filter system into one analytics entry page as baseline consumption path.
5. Verify deep-linking, browser refresh persistence, and reset behavior.
6. Expand adoption to additional analytics pages in follow-up changes.

Rollback strategy: remove page-level integration and revert to prior page behavior; shared filter module can remain isolated if not referenced.

## Open Questions

- Should invalid query param values (IDs not found in loaded options) be preserved in URL until user interaction, or cleaned immediately after options resolve?
- Should reset preserve unrelated query params from the page (recommended) while only removing managed filter params?
- Should data hooks include caching/stale-time defaults now, or follow existing project query conventions in implementation?
