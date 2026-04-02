## Context

The current Explore page (`frontend/src/pages/explore-page.tsx`) is still a static scaffold: hierarchy nodes are hardcoded, selected entity context is derived from mock IDs, and the detail panel shows placeholder copy. In parallel, the project already has production read APIs for hierarchy and major analytics/trends (`GET /areas`, `GET /faculties`, `GET /majors`, `GET /majors/{major_id}/analytics`, `GET /majors/{major_id}/trends`) and a shared URL-synced global filter model (`process_id`, `academic_area_id`) used by analytics pages.

This change is an integration step: make Explore consume existing backend contracts and shared frontend state so users can navigate real hierarchy data and inspect major-level signals without leaving the page. The main constraints are preserving thin page composition boundaries, keeping UI aligned with existing design-system components, and avoiding backend contract changes for v1.

## Goals / Non-Goals

**Goals:**

- Replace hardcoded Explore hierarchy data with backend-backed area/faculty/major loading.
- Build a deterministic hierarchy tree that maps selected nodes to real backend entity IDs.
- Connect selected major context to existing major analytics and trends endpoints.
- Reuse global filter state (`process_id`, `academic_area_id`) and URL behavior consistent with other analytics views.
- Add explicit loading, empty, and error states for both hierarchy and detail panels.

**Non-Goals:**

- Creating new backend endpoints or changing existing API response schemas.
- Implementing new metrics definitions beyond what `/majors/{major_id}/analytics` and `/majors/{major_id}/trends` already expose.
- Full Explore feature parity with future workflows (export, advanced search, compare actions).
- Redesigning core design-system components.

## Decisions

### Decision 1: Use a dedicated Explore data adapter layer in frontend features

- **Choice:** Add Explore-specific API hooks/utilities under `frontend/src/features/explore/` that compose existing HTTP endpoints into UI-ready hierarchy/detail structures.
- **Rationale:** Keeps page components focused on composition/state wiring while isolating API transformation logic in a reusable boundary.
- **Alternatives considered:**
  - Fetch/transform directly inside `explore-page.tsx`.
  - **Rejected:** duplicates transformation concerns and makes future Explore expansion harder to test and maintain.

### Decision 2: Build hierarchy from majors and derive grouped area/faculty tree client-side

- **Choice:** Fetch scoped `majors` (optionally by `academic_area_id`) and normalize into `area -> faculty -> major` groups for `HierarchicalSidebar`.
- **Rationale:** A single major dataset already carries nested faculty and area context, so grouping client-side minimizes request coordination and avoids N+1 faculty requests.
- **Alternatives considered:**
  - Parallel fetch `areas` + `faculties` + `majors` and merge three lists.
  - **Rejected:** higher orchestration complexity and more transient mismatch states with little v1 benefit.

### Decision 3: Support a major-first detail panel with graceful non-major selection behavior

- **Choice:** Treat major selection as the detail driver; area/faculty selections show structural context and prompt for major selection when needed.
- **Rationale:** Analytics endpoints are major-scoped, so major-first detail avoids ambiguous aggregate behavior and accidental contract creep.
- **Alternatives considered:**
  - Add synthetic area/faculty aggregates in frontend.
  - **Rejected:** risks misleading metrics and conflicts with backend-owned aggregation semantics.

### Decision 4: Reuse global filters as source of truth for scope and process

- **Choice:** Consume `useGlobalFilters` in Explore; apply `academic_area_id` to hierarchy query scope and `process_id` to major analytics query params.
- **Rationale:** Preserves URL-deep-link semantics and consistency with dashboard/rankings/trends behavior.
- **Alternatives considered:**
  - Keep Explore-local filter state separate from global filters.
  - **Rejected:** creates divergent behavior across analytics pages and breaks expectation that shared filters carry across views.

### Decision 5: Keep trends request lean via explicit metric allowlist

- **Choice:** Request only metrics displayed in Explore detail cards/charts using `metrics` query parameter for `/majors/{major_id}/trends`.
- **Rationale:** Reduces payload size and unnecessary client processing while preserving endpoint flexibility.
- **Alternatives considered:**
  - Request all available trend metrics always.
  - **Rejected:** simpler initially but inefficient and harder to reason about UI-to-data coupling.

### Decision 6: Implement resilient asynchronous UI states per panel

- **Choice:** Treat hierarchy and detail as independent query states, each with loading/empty/error rendering paths.
- **Rationale:** Improves perceived reliability; hierarchy can remain usable even if analytics call fails, and vice versa.
- **Alternatives considered:**
  - Single page-level loading/error gate for all data.
  - **Rejected:** makes partial failures opaque and unnecessarily blocks navigation.

## Risks / Trade-offs

- [Risk] Large major datasets can increase initial Explore load and client-side grouping cost. → Mitigation: scope by `academic_area_id` when present, memoize grouping, and evaluate pagination/virtualization in follow-up if needed.
- [Risk] URL contains stale `process_id`/`academic_area_id` values not present in current options. → Mitigation: preserve IDs for consistency, show fallback labels, and surface empty-state guidance instead of hard-failing.
- [Risk] Selection can become invalid after filter changes (selected major not in new scope). → Mitigation: auto-reconcile selection to first available major in scope or clear selection with explicit prompt.
- [Trade-off] Client-side grouping prioritizes integration speed over server-optimized tree payloads. → Mitigation: keep adapter boundary explicit so backend tree endpoint can be introduced later without page rewrites.

## Migration Plan

1. Add Explore feature API hooks/types to fetch majors, major analytics, and major trends from existing endpoints.
2. Implement hierarchy adapter that maps backend entities into `HierarchicalSidebar` groups with stable IDs.
3. Refactor `explore-page.tsx` to consume shared filters and Explore hooks, replacing static `hierarchyData` and placeholder selection logic.
4. Add detail-panel rendering for selected major using existing design-system sections/cards with loading/empty/error states.
5. Validate URL-driven behavior (initial load from query params, filter changes, refresh persistence).
6. Add focused frontend tests for hierarchy mapping and selection reconciliation.

Rollback strategy: revert Explore page integration and adapter hooks, returning to current static scaffold without impacting backend APIs or other pages.

## Open Questions

- Should Explore auto-select the first available major when filters change, or require explicit user click after each scope change?
- Which exact subset of trend metrics should be in v1 Explore detail to balance signal and visual complexity?
- Do we want node-level deep linking in URL (e.g., `major_id` / `faculty_id`) in this change, or defer to a follow-up navigation enhancement?
