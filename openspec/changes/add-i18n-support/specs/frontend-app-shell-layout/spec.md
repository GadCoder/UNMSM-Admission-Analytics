## MODIFIED Requirements

### Requirement: Sidebar Primary Navigation
The system SHALL render sidebar navigation entries for Dashboard, Explore, Compare, Rankings, Results, Trends, and Admin, and SHALL localize navigation labels using the active locale.

#### Scenario: Sidebar navigation options are available
- **WHEN** the shell is displayed
- **THEN** the sidebar shows all primary navigation sections with keyboard-accessible interactive elements and locale-appropriate labels

#### Scenario: Admin navigation visibility follows auth state
- **WHEN** the current user is not authenticated as admin
- **THEN** the Admin navigation entry is hidden or disabled according to auth policy

### Requirement: Top Bar Structural Contract
The system SHALL include a top bar with a non-functional search input placeholder, a language selector for `es` and `en`, and a placeholder region for future global controls, without user/profile UI.

#### Scenario: Top bar placeholders are rendered
- **WHEN** the shell top bar is displayed
- **THEN** it includes a search placeholder, language selector, and future-controls placeholder and does not include user/profile elements
