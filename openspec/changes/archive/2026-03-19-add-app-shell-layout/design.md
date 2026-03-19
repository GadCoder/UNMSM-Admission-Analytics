## Context

The frontend foundation has already established tooling, providers, routing primitives, and centralized API boundaries under `/frontend`, but it lacks a reusable shell to host multi-page analytics experiences. The next phase requires a consistent layout contract so all future pages (dashboard, rankings, trends, results, explorer) can render within a stable navigation and content frame. The visual direction is governed by `openspec/design-system.md` and must preserve a calm, premium academic analytics style.

## Goals / Non-Goals

**Goals:**
- Implement a reusable `AppLayout` that composes sidebar, top bar, and content region.
- Establish route-aware navigation with active-state styling for core sections.
- Integrate shell layout with route tree and placeholder pages for target routes.
- Ensure desktop-first structure with accessible navigation and visible focus states.
- Align shell styling with design-system colors, surfaces, spacing, and Lexend typography.

**Non-Goals:**
- Implement dashboard widgets or any page-specific data visualizations.
- Implement functional global search behavior or advanced top-bar controls.
- Add user/profile/authentication UI or auth-dependent interactions.
- Implement backend-driven content loading for shell placeholders.

## Decisions

### Decision: Use a layout-wrapped route architecture for shell pages
- Rationale: A shared wrapper route ensures consistent sidebar/topbar rendering while child routes swap only page content.
- Alternative considered: Duplicating shell structure in each page. Rejected due to duplication and higher drift risk.

### Decision: Define navigation as centralized config/constants
- Rationale: One source of truth simplifies route-label-icon mapping and active-state rendering logic.
- Alternative considered: Hardcoding nav links inside component markup. Rejected because it complicates maintenance and feature expansion.

### Decision: Sidebar active state based on current route path
- Rationale: Route-derived active styling guarantees consistent feedback with router state and avoids local UI state mismatch.
- Alternative considered: Local component state for active item. Rejected because it can desynchronize from URL-driven navigation.

### Decision: Keep top bar intentionally minimal with non-functional search placeholder
- Rationale: Meets shell contract without expanding into out-of-scope behavior.
- Alternative considered: Implementing full search interactions now. Rejected as premature and outside this change scope.

### Decision: Preserve design-system-driven shell styling tokens
- Rationale: The shell is the most reused visual frame, so token consistency is critical for scanability and visual coherence.
- Alternative considered: Temporary ad-hoc styles. Rejected due to future refactor overhead and inconsistent UI baseline.

## Risks / Trade-offs

- [Risk] Placeholder pages may be mistaken for completed features -> Mitigation: use clear placeholder copy and keep route scaffolding lightweight.
- [Risk] Desktop-first shell may need structural adjustments for mobile later -> Mitigation: build composable layout primitives and avoid rigid coupling.
- [Risk] Overly dense sidebar harms scanability -> Mitigation: use spacing hierarchy and muted inactive states with tinted active highlights.
- [Risk] Future global controls may require top-bar restructuring -> Mitigation: reserve control region in top bar layout from the start.

## Migration Plan

1. Add shell component set (`AppLayout`, `Sidebar`, `Topbar`) and navigation config.
2. Update router composition so shell wraps core application routes.
3. Add placeholder views for dashboard/explore/compare/rankings/results/trends.
4. Apply design-system styling and accessibility states for nav/controls.
5. Verify route-aware active navigation and placeholder rendering across routes.

Rollback strategy: revert shell route wrapper and shell component additions; retain existing frontend foundation unchanged.

## Open Questions

- None for this scope. Search behavior, breadcrumbs, and global filter UX remain intentionally deferred to later changes.
