## MODIFIED Requirements

### Requirement: Global filter bar SHALL be reusable across analytics pages

The system SHALL provide a reusable `GlobalFilterBar` component that can be embedded in dashboard, rankings, trends, and explore pages without page-specific filter logic changes.

#### Scenario: Filter bar exposes required controls

- **WHEN** `GlobalFilterBar` is rendered
- **THEN** it SHALL render a process selector, an academic area selector, and a reset action

#### Scenario: Page consumes shared filter outputs

- **WHEN** an analytics page integrates the shared filter system
- **THEN** the page SHALL be able to read selected filter values and invoke update/reset methods through reusable hooks/helpers

### Requirement: Global filter UI SHALL follow system design standards

The `GlobalFilterBar` UI SHALL align with `openspec/design-system.md` for container treatment, spacing, readable labels, and consistent analytical control styling.

#### Scenario: Visual structure follows design system

- **WHEN** the filter bar is rendered on an analytics page
- **THEN** it SHALL use the design-system-aligned container style, spacing rhythm, and control hierarchy defined for global filters

#### Scenario: Reusable styling consistency across pages

- **WHEN** the same filter bar is used in dashboard, rankings, trends, and explore pages
- **THEN** the filter UI SHALL preserve consistent visual behavior and styling without page-specific divergence
