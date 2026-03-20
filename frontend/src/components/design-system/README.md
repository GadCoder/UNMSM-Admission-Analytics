# Admission Explorer Design System Components

This module provides reusable UI components for analytics pages.

## Composition Boundaries

- Components in this module do not include business/domain logic.
- Data loading, routing decisions, and page-specific workflows belong to feature/page containers.
- Components expose behavior through props and callbacks.
- Styling is design-system aligned and shared to prevent page-level duplication.

## Layering

- `foundation`: utilities, tokens, shared helpers.
- `primitives` and `inputs`: low-level reusable controls.
- `filters`, `headers`, `layout`: composable sections.
- `cards`, `charts`, `lists`, `tables`: analytics display patterns.

## Canonical Integration Mapping

- Dashboard: layout/navigation, global filters, KPI/highlight cards, insight panels.
- Explore: hierarchical sidebar, breadcrumbs, explore headers.
- Rankings: ranking lists and progress bar comparisons.
- Compare: multi-select search, chips/tags, comparison tables.
- Trends: analytics filter bar, multi-series chart framing, legends, annotations, trend summary cards.
- Entity detail: entity header and detail table structures.

## Internal Showcase

Use `/showcase` route as a visual and behavioral reference for component variants.
