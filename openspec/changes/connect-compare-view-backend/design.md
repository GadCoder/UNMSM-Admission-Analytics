## Context

The current Compare page (`frontend/src/pages/compare-page.tsx`) is a UI prototype with mocked entity options and synthetic metric rows. Users can interact with selection controls, but the table does not represent real admission outcomes and cannot be trusted for decision-making.

The codebase already includes backend contracts for major analytics, major trends, process lists, and academic area scope, plus a reusable global filter system used in dashboard/explore. This change focuses on wiring Compare to those existing contracts while preserving existing design-system primitives (`MultiSelectSearch`, `ComparisonTable`, badges, and trend indicators).

Constraints:

- Keep v1 backend scope minimal (prefer existing endpoints over new APIs).
- Preserve shared URL-driven filter behavior (`process_id`, `academic_area_id`).
- Maintain responsive compare UX with clear loading/empty/error states.

## Goals / Non-Goals

**Goals:**

- Replace static compare options with backend-loaded major options aligned to filter scope.
- Render comparison metrics from real backend analytics/trends for selected majors.
- Keep comparison output scannable (core metrics first, trend indicator rows, minimal noise).
- Ensure Compare follows shared global-filter behavior and URL synchronization.

**Non-Goals:**

- Introducing a new compare aggregation endpoint in backend for v1.
- Supporting non-major entity comparison (faculties/areas/processes) in this change.
- Building advanced compare features (saved sets, exports, custom formulas).
- Reworking design-system table primitives beyond minor page-level composition.

## Decisions

### Decision 1: Use majors as the v1 compare entity type

- **Choice:** Limit entity selection to majors loaded from `GET /majors` (scoped by `academic_area_id`).
- **Rationale:** Major-level analytics/trends APIs already exist and map directly to compare use cases.
- **Alternatives considered:**
  - Multi-entity type compare in v1 (major/faculty/area).
  - **Rejected:** requires additional endpoint contracts and adds complexity before validating major-compare workflow.

### Decision 2: Build comparison rows from parallel per-major queries

- **Choice:** For each selected major, fetch analytics (`/majors/{id}/analytics`) and compact trends (`/majors/{id}/trends`) then compose rows client-side.
- **Rationale:** Avoids backend API expansion and keeps implementation incremental.
- **Alternatives considered:**
  - Add dedicated backend compare endpoint.
  - **Rejected (for now):** faster to ship with existing contracts; can add server-side batching later if needed.

### Decision 3: Enforce bounded selection for UX and performance

- **Choice:** Keep a max selected entity count (e.g., 5) in UI and show clear guidance when limit is reached.
- **Rationale:** Preserves table readability and controls network/query fan-out.
- **Alternatives considered:**
  - Unlimited selection.
  - **Rejected:** degrades usability and can produce excessive request concurrency.

### Decision 4: Keep global filters as primary scope; Compare adds local entity set only

- **Choice:** Compare consumes `useGlobalFilters` for process/area and keeps selected majors as page-local state.
- **Rationale:** Matches existing cross-page model while avoiding URL bloat from large entity sets.
- **Alternatives considered:**
  - Persist selected major IDs in URL.
  - **Deferred:** useful for deep links but increases URL/state complexity and reconciliation rules.

### Decision 5: Use progressive rendering and partial error tolerance

- **Choice:** Render the comparison table as soon as enough data exists and mark unavailable cells per entity when individual requests fail.
- **Rationale:** Better UX than page-level failure for one broken entity query.
- **Alternatives considered:**
  - Block full table on any failed entity.
  - **Rejected:** unnecessary disruption; partial data is still useful.

## Risks / Trade-offs

- [Risk] N selected majors produce 2N API calls (analytics + trends). → Mitigation: cap selection count, reuse React Query caching, and keep trend metric requests lean.
- [Risk] Data snapshots may be slightly inconsistent across parallel queries. → Mitigation: display process/filter context clearly and refresh all queries together on scope change.
- [Risk] Filters can invalidate selected majors after scope updates. → Mitigation: reconcile selection against current option set and remove stale entities with user-visible feedback.
- [Trade-off] Client-side table composition is simpler now but duplicates some aggregation logic in frontend. → Mitigation: isolate mapping logic in `features/compare` so server-side compare endpoint can replace it later.

## Migration Plan

1. Add compare feature hooks/types for major option loading and per-major analytics/trend retrieval.
2. Refactor compare page to consume global filters and backend major options in `MultiSelectSearch`.
3. Replace synthetic `ComparisonRow` generation with real metric mapping from query results.
4. Add page states: empty selection guidance, loading skeleton/copy, partial error indicators.
5. Add tests for mapping/reconciliation logic and key UX states.
6. Validate with `pnpm test` and `pnpm build`.

Rollback strategy: revert compare page and compare feature hooks to static prototype; no backend contract rollback needed.

## Open Questions

- Should selected major IDs be URL-synced for shareable compare links in v1 or follow-up?
- What is the final max compare selection count (4 vs 5) balancing readability and analyst needs?
- Should trend rows show directional badges only, or include compact numeric deltas by default?
