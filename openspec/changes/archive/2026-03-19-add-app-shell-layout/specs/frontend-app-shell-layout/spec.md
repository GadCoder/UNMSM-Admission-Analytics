## ADDED Requirements

### Requirement: Reusable Global App Shell
The system SHALL provide a reusable application shell composed of sidebar, top bar, and a main content container that can host routed pages.

#### Scenario: Shell structure is rendered
- **WHEN** a user navigates to any shell-managed route
- **THEN** the sidebar, top bar, and main content container are rendered in a consistent layout structure

### Requirement: Sidebar Primary Navigation
The system SHALL render sidebar navigation entries for Dashboard, Explore, Compare, Rankings, Results, and Trends.

#### Scenario: Sidebar navigation options are available
- **WHEN** the shell is displayed
- **THEN** the sidebar shows all primary navigation sections with keyboard-accessible interactive elements

### Requirement: Route-Aware Active Navigation State
The system SHALL visually highlight the active sidebar navigation item based on the current route.

#### Scenario: Active route is highlighted
- **WHEN** the current route matches a navigation item path
- **THEN** that navigation item is styled with an active brand-tinted state distinct from inactive items

### Requirement: Top Bar Structural Contract
The system SHALL include a top bar with a non-functional search input placeholder and a placeholder region for future global controls, without user/profile UI.

#### Scenario: Top bar placeholders are rendered
- **WHEN** the shell top bar is displayed
- **THEN** it includes a search placeholder and future-controls placeholder and does not include user/profile elements

### Requirement: Shell Content Slot for Child Routes
The system SHALL expose a main content slot where child route views render inside the shell.

#### Scenario: Child page renders in shell container
- **WHEN** a shell-managed route is resolved
- **THEN** the route's page content renders inside the shell content area without replacing sidebar/top bar

### Requirement: Shell Route Readiness with Placeholders
The system SHALL provide placeholder page views for `/dashboard`, `/explore`, `/compare`, `/rankings`, `/results`, and `/trends` routed inside the shell.

#### Scenario: Placeholder routes resolve
- **WHEN** a user navigates to any initial shell route
- **THEN** the corresponding placeholder page renders within the shell layout

### Requirement: Design-System-Aligned Shell Styling
The system SHALL style shell surfaces, spacing, typography, and hierarchy in alignment with `openspec/design-system.md`.

#### Scenario: Shell visual alignment
- **WHEN** the shell is rendered
- **THEN** sidebar/top bar/content areas use warm background/white surfaces, Lexend typography, and clear visual hierarchy consistent with the design system

### Requirement: Shell Accessibility Baseline
The system SHALL provide keyboard-accessible navigation controls, visible focus states, and semantic layout landmarks where practical.

#### Scenario: Keyboard navigation feedback is visible
- **WHEN** a user navigates shell controls via keyboard
- **THEN** interactive elements are reachable and display visible focus indication
