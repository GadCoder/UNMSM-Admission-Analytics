## ADDED Requirements

### Requirement: Explore hierarchy SHALL be loaded from backend academic structure APIs
The system SHALL populate the Explore hierarchy sidebar using backend academic structure data instead of hardcoded mock nodes.

#### Scenario: Explore loads hierarchy tree from backend
- **WHEN** a user opens `/explore`
- **THEN** the sidebar hierarchy is built from backend-provided academic area, faculty, and major entities

#### Scenario: Explore applies academic area scope to hierarchy query
- **WHEN** `academic_area_id` is selected in shared filters
- **THEN** the Explore hierarchy request is scoped so only matching entities are shown

### Requirement: Explore detail panel SHALL use selected major backend analytics
The system SHALL render selected major details using existing major analytics and trends endpoints.

#### Scenario: Major selection loads analytics context
- **WHEN** a user selects a major node in Explore
- **THEN** the page requests `/majors/{major_id}/analytics` and renders returned metrics/context in the detail panel

#### Scenario: Major selection loads trend data
- **WHEN** a user selects a major node in Explore
- **THEN** the page requests `/majors/{major_id}/trends` and renders returned trend series in Explore detail content

### Requirement: Explore detail requests SHALL respect global process scope
The system SHALL apply shared `process_id` filter state to major analytics requests in Explore.

#### Scenario: Process filter scopes major analytics
- **WHEN** `process_id` is selected and a major is active in Explore
- **THEN** the analytics request for that major includes the selected `process_id`

### Requirement: Explore SHALL provide resilient async states
The system SHALL expose loading, empty, and error states for hierarchy and detail data independently.

#### Scenario: Hierarchy loading state is visible
- **WHEN** hierarchy data is being fetched
- **THEN** Explore shows a loading state for the hierarchy panel without blocking the full page shell

#### Scenario: No major selected state is explicit
- **WHEN** no major is selected in the hierarchy
- **THEN** Explore shows a clear prompt in the detail panel to select a major

#### Scenario: Detail fetch errors are isolated
- **WHEN** major analytics or trends requests fail
- **THEN** Explore shows an error state in the detail panel while keeping hierarchy navigation interactive
