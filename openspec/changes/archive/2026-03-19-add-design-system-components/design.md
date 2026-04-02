## Context

Admission Explorer currently has foundational app shell structure and route placeholders, but analytics pages still require a broad reusable component layer before feature teams can implement high-density product views efficiently. The requested scope spans navigation/layout, headers, filter systems, data cards, chart framing, ranking/list patterns, table patterns, and micro-components.

The implementation must align with `openspec/design-system.md` (Lexend typography, `#8f5658` primary, `#faf8f7` background, `#ffffff` surfaces, 12px radius, soft shadows, 4px/8px spacing rhythm, scanability-first hierarchy). The design must keep components generic and composable, avoid embedding business logic, and minimize style duplication.

Stakeholders are frontend feature teams building dashboard, exploration, rankings, compare, trends, and entity detail pages. This change establishes their shared component contracts and visual behavior baseline.

## Goals / Non-Goals

**Goals:**
- Define a reusable component architecture that supports all target analytics page types.
- Centralize visual and interaction patterns into shared UI primitives and composed components.
- Standardize props-based contracts so page-level workflows can compose components without forking.
- Ensure accessibility and scanability baseline across reusable controls and display components.
- Provide implementation-ready module boundaries to accelerate follow-up page development.

**Non-Goals:**
- Implementing dashboard/trends/rankings business calculations.
- Introducing backend API contract changes.
- Building page-specific one-off UI variants outside reusable component contracts.
- Finalizing every chart rendering engine detail (this change focuses on shared framing/components).

## Decisions

### Decision 1: Use layered component architecture (primitives -> composites -> page composition)
- **Choice:** Organize components into layered levels:
  - primitives (buttons, badges, select, skeleton, pills/chips, micro-indicators)
  - composites (filter bars, table toolbars, chart cards, headers)
  - page composition patterns (scanability order and section structures)
- **Rationale:** Prevents duplication, supports strict reusability, and keeps business logic at page/container level.
- **Alternatives considered:**
  - Build page-first components and refactor later.
  - **Rejected:** Produces drift and expensive rework when multiple analytics pages evolve.

### Decision 2: Keep design tokens and shared styles centralized
- **Choice:** Encode core design-system values (color hierarchy, typography, radius, shadows, spacing rhythm) through shared theme tokens and reusable class patterns.
- **Rationale:** Enforces visual consistency and reduces ad-hoc styling divergence.
- **Alternatives considered:**
  - Let each component define local styling values.
  - **Rejected:** Encourages inconsistent UX and repetitive style maintenance.

### Decision 3: Keep components stateless or minimally stateful with prop-driven behavior
- **Choice:** Components expose state and behavior through props/callbacks; only local interaction state (for example expandable disclosure state) is kept internally when generic and reusable.
- **Rationale:** Keeps components reusable across different workflows and integration contexts.
- **Alternatives considered:**
  - Embed domain-level behavior directly in components.
  - **Rejected:** Violates no-business-logic constraint and limits composability.

### Decision 4: Standardize filter system with reusable selector contracts
- **Choice:** Build `GlobalFilterBar` and `AnalyticsFilterBar` from shared selector primitives (`Select`, `MetricSelector`, `DateRangeSelector`, `EntityTypeSelector`, `MultiSelectSearch`) and filter visualization components (`FilterPill`, chips/tags).
- **Rationale:** Produces consistent filtering UX while allowing different pages to plug in different data sources.
- **Alternatives considered:**
  - Separate filter bars per page with independent controls.
  - **Rejected:** Duplicates UI logic and weakens future consistency.

### Decision 5: Establish table and chart contracts around structure, not data source
- **Choice:** Reusable tables and chart wrappers accept declarative configuration (columns, renderers, row actions, legends, annotations) while data fetching/transformation remains external.
- **Rationale:** Supports multiple analytical pages with heterogeneous datasets while preserving one UI system.
- **Alternatives considered:**
  - Couple display components to specific endpoint shapes.
  - **Rejected:** Prevents broad reuse and complicates testing.

### Decision 6: Implement scanability-first composition guidance as reusable section contracts
- **Choice:** Reusable section components and layout patterns follow consistent top-to-bottom structure: header -> filters -> KPI/highlights -> charts/insights -> tables.
- **Rationale:** Aligns with intended analytical reading flow and reduces cognitive load.
- **Alternatives considered:**
  - Leave section ordering to each page team.
  - **Rejected:** Risks inconsistent and lower-usability analytics pages.

## Risks / Trade-offs

- [Risk] Scope breadth may cause large initial component surface and review complexity. -> Mitigation: implement in well-scoped slices (layout/navigation, filters, cards/charts, tables/micro-components) with clear contracts.
- [Risk] Over-generalization can make components harder to use. -> Mitigation: provide pragmatic defaults and limited, well-documented variants.
- [Risk] Inconsistent accessibility if each component handles states differently. -> Mitigation: enforce reusable accessibility patterns (labels, keyboard states, focus styles, semantics) across primitives.
- [Risk] Visual drift over time from design system guidance. -> Mitigation: centralize tokens and require component usage instead of ad-hoc page styling.
- [Trade-off] Building shared foundations first delays immediate page-specific polish. -> Mitigation: unlocks faster and more consistent delivery for all downstream analytics pages.

## Migration Plan

1. Introduce shared component directories and baseline primitives (button, badge, select, skeleton, trend indicator, chips/pills).
2. Implement navigation/layout and context headers (`Container`, `Grid`, `Topbar`, `Sidebar`, `HierarchicalSidebar`, `Breadcrumbs`, `SectionHeader`, `EntityHeader`, `ExploreHeader`).
3. Implement reusable filtering composites and selector controls (`GlobalFilterBar`, `AnalyticsFilterBar`, related selectors).
4. Implement display components for cards, charts, lists, and table ecosystem.
5. Integrate components into target pages incrementally (dashboard, explore, rankings, compare, trends, entity detail) while keeping page logic outside components.
6. Add verification for styling consistency, accessibility baseline, and composability across page types.

Rollback strategy: keep existing page placeholders or prior page-level UI in place and remove new component imports incrementally; component modules can be rolled back independently if regressions appear.

## Open Questions

- Resolved: Use a hybrid chart strategy. Adopt a default chart library now for delivery speed while keeping chart-container adapter boundaries so chart internals can be swapped later.
- Resolved: Implement full `MultiSelectSearch` in the first iteration with async search, request debouncing, and virtualization.
- Resolved: Implement a lightweight token bridge now (for example CSS custom properties derived from the current theme) while keeping full token-platform export as a future evolution.
- Resolved: Use canonical integration references per component family, plus a dedicated internal showcase route for rapid visual QA and adoption guidance.

Reference page mapping for canonical integrations:
- Dashboard: layout/navigation basics, global filters, KPI cards, highlight cards, insight panels.
- Explore: hierarchical sidebar, breadcrumbs, and exploration headers.
- Rankings: ranking lists and progress-bar comparison lists.
- Compare: multi-select search, chips/tags, and comparison table patterns.
- Trends: analytics filter bar, multi-series chart framing, legends, annotations, and trend summary cards.
- Entity detail: entity header, metadata/action patterns, and detail table structures.
