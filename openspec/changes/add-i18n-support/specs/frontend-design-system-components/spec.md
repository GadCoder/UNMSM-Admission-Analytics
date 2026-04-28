## MODIFIED Requirements

### Requirement: Section and entity headers SHALL expose consistent context patterns
The system SHALL provide reusable `SectionHeader`, `EntityHeader`, and `ExploreHeader` components with optional subtitle and actions while preserving common information hierarchy, and SHALL source default user-visible text through translation keys.

#### Scenario: Header components support optional actions and metadata
- **WHEN** a page renders one of the header components with title, optional subtitle, metadata, and optional actions
- **THEN** the header renders a consistent title-first hierarchy with optional content slots and no page-specific branching inside the component

### Requirement: Component contracts SHALL enforce composability and separation of concerns
Reusable UI components SHALL be generic, composable, and free from embedded business logic, SHALL expose behavior through props/callback contracts, and SHALL support i18n through translation keys or translated content props instead of hard-coded UI copy.

#### Scenario: Component library is reused without business coupling
- **WHEN** multiple pages integrate shared components with different datasets and workflows
- **THEN** components remain reusable through prop-driven configuration and do not require page-specific forks or duplicated styles
