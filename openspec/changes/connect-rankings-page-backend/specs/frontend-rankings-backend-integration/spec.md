## ADDED Requirements

### Requirement: Rankings page SHALL load ranking content from backend data
The system SHALL populate Rankings views from backend ranking responses instead of hardcoded placeholder rows.

#### Scenario: Competitive rankings render from backend
- **WHEN** a user opens `/rankings` with a valid process scope
- **THEN** the "Most Competitive" panel SHALL render items from backend ranking data

#### Scenario: Popular rankings render from backend
- **WHEN** a user opens `/rankings` with a valid process scope
- **THEN** the "Largest Intake" panel SHALL render items from backend ranking data

### Requirement: Rankings page SHALL use backend filter option sources
The system SHALL load process and academic area filter options from shared backend-driven filter hooks.

#### Scenario: Process options are backend-driven
- **WHEN** Rankings filter controls are rendered
- **THEN** process choices SHALL be sourced from backend process options and not static page constants

#### Scenario: Academic area options are backend-driven
- **WHEN** Rankings filter controls are rendered
- **THEN** academic area choices SHALL be sourced from backend area options and not static page constants

### Requirement: Rankings data requests SHALL honor shared global filter scope
The system SHALL use selected `process_id` and `academic_area_id` values from shared global filters when querying ranking data.

#### Scenario: Process scope is applied to rankings query
- **WHEN** a user selects a process in Rankings global filters
- **THEN** Rankings data requests SHALL include the selected `process_id`

#### Scenario: Academic area scope is applied to rankings query
- **WHEN** a user selects an academic area in Rankings global filters
- **THEN** Rankings data requests SHALL include the selected `academic_area_id`

### Requirement: Rankings page SHALL default to latest available process
The system SHALL resolve Rankings data using the latest available admission process when `process_id` is not provided.

#### Scenario: Latest process fallback is used
- **WHEN** a user loads `/rankings` without `process_id` in the URL
- **THEN** Rankings SHALL select the most recent available process as the default data scope

### Requirement: Rankings page SHALL provide resilient async states
The system SHALL show explicit loading, empty, and error states for ranking panels and filter dependencies.

#### Scenario: Rankings loading state is visible
- **WHEN** ranking data queries are pending
- **THEN** Rankings panels SHALL show loading feedback instead of placeholder rankings

#### Scenario: Rankings empty state is visible
- **WHEN** backend ranking responses return no items for current filters
- **THEN** Rankings panels SHALL show a clear no-data message

#### Scenario: Rankings error state is visible
- **WHEN** rankings or required filter option queries fail
- **THEN** Rankings page SHALL show actionable error feedback for the user
