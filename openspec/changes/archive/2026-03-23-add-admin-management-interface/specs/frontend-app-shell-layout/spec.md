## MODIFIED Requirements

### Requirement: Sidebar Primary Navigation
The system SHALL render sidebar navigation entries for Dashboard, Explore, Compare, Rankings, Results, Trends, and Admin.

#### Scenario: Sidebar navigation options are available
- **WHEN** the shell is displayed
- **THEN** the sidebar shows all primary navigation sections with keyboard-accessible interactive elements

#### Scenario: Admin navigation visibility follows auth state
- **WHEN** the current user is not authenticated as admin
- **THEN** the Admin navigation entry is hidden or disabled according to auth policy

### Requirement: Shell Route Readiness with Placeholders
The system SHALL provide route readiness for `/dashboard`, `/explore`, `/compare`, `/rankings`, `/results`, `/trends`, and `/admin/*` routed inside the shell.

#### Scenario: Admin shell routes resolve for authenticated admin
- **WHEN** an authenticated admin navigates to an admin route
- **THEN** the corresponding admin page renders within the shell layout
