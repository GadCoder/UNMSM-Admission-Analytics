## ADDED Requirements

### Requirement: Thin route handlers
Route handlers for academic structure endpoints MUST remain thin and delegate data retrieval and filtering logic to repository/service layers.

#### Scenario: Route delegates list query logic
- **WHEN** a list endpoint is called
- **THEN** the route invokes repository/service methods instead of composing database queries inline

#### Scenario: Route delegates detail query logic
- **WHEN** a detail endpoint is called
- **THEN** the route resolves resource lookup through repository/service methods and handles not-found translation

### Requirement: Frontend-friendly filter interfaces
Repository/service query interfaces SHALL accept simple optional filter inputs aligned with endpoint query params.

#### Scenario: Faculty query interface accepts academic area filter
- **WHEN** faculty list logic is invoked
- **THEN** the query path accepts optional `academic_area_id`

#### Scenario: Major query interface accepts faculty and area filters
- **WHEN** major list logic is invoked
- **THEN** the query path accepts optional `faculty_id` and `academic_area_id`
