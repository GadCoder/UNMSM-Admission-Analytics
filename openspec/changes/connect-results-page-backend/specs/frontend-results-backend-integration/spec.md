## ADDED Requirements

### Requirement: Results page SHALL load candidate rows from backend search data
The system SHALL populate `/results` table rows using backend `GET /results` responses instead of static in-memory sample rows.

#### Scenario: Results table renders backend rows
- **WHEN** a user opens `/results` with a valid process scope
- **THEN** table rows SHALL be rendered from backend result items

#### Scenario: Entity metadata reflects backend-scoped context
- **WHEN** backend results are loaded for a selected process and optional academic area
- **THEN** page-level context shown in the Results header SHALL reflect backend-scoped data and SHALL NOT rely on hardcoded placeholder entity labels

### Requirement: Results page SHALL connect search and pagination to backend query params
The system SHALL send results search and pagination inputs to `GET /results` and use backend pagination metadata for UI controls.

#### Scenario: Search input filters backend results
- **WHEN** a user updates the candidate search field
- **THEN** the next `GET /results` request SHALL include search criteria and return filtered rows

#### Scenario: Pagination control changes backend page
- **WHEN** a user navigates to a different Results page
- **THEN** the next `GET /results` request SHALL include the selected page and the UI SHALL render backend `page` and `total_pages` metadata

### Requirement: Results page SHALL honor shared global filter scope in data requests
The system SHALL include selected shared global filters (`process_id`, `academic_area_id`) in Results data requests.

#### Scenario: Process filter scopes Results query
- **WHEN** `process_id` is selected in global filters
- **THEN** Results requests SHALL include that `process_id`

#### Scenario: Academic area filter scopes Results query
- **WHEN** `academic_area_id` is selected in global filters
- **THEN** Results requests SHALL include that `academic_area_id`

### Requirement: Results page SHALL default to latest available process
The system SHALL resolve Results data using the latest available process when `process_id` is not provided.

#### Scenario: Latest process fallback applies on initial Results load
- **WHEN** `/results` loads without `process_id` in URL query params
- **THEN** Results SHALL select the newest available process as default scope before querying data

#### Scenario: Explicit process selection overrides fallback
- **WHEN** `/results` loads with `process_id` in URL query params
- **THEN** Results SHALL use the explicit process selection and SHALL NOT replace it with latest-process fallback

### Requirement: Results page SHALL provide resilient asynchronous states
The system SHALL render explicit loading, empty, and error states for results data and supporting filter dependencies.

#### Scenario: Loading state is visible while querying results
- **WHEN** required filter options or results queries are pending
- **THEN** Results page SHALL display loading feedback instead of static placeholder table content

#### Scenario: Empty state is visible for no matching results
- **WHEN** `GET /results` returns zero items for current scope/search
- **THEN** Results page SHALL display a clear no-results message

#### Scenario: Error state is visible on failed fetch
- **WHEN** results or required filter-option requests fail
- **THEN** Results page SHALL display actionable error feedback

### Requirement: Results page SHALL remove non-functional placeholder row actions in v1
The system SHALL avoid rendering row-level actions that are not wired to production behavior in this integration scope.

#### Scenario: Placeholder actions are not shown
- **WHEN** Results table rows are rendered in v1 backend-integrated mode
- **THEN** placeholder actions such as static `View` and `Compare` buttons SHALL NOT be displayed
