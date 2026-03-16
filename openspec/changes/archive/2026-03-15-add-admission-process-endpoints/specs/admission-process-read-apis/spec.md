## ADDED Requirements

### Requirement: List admission processes endpoint
The system SHALL expose `GET /processes` to return all admission processes ordered from newest to oldest.

#### Scenario: List endpoint returns all processes in newest-first order
- **WHEN** a client requests `GET /processes`
- **THEN** the API returns `200 OK` with all processes including `id`, `year`, `cycle`, and `label` sorted newest to oldest

### Requirement: Admission process detail endpoint
The system SHALL expose `GET /processes/{process_id}` to return the selected admission process by identifier.

#### Scenario: Detail endpoint returns selected process
- **WHEN** a client requests `GET /processes/{process_id}` for an existing process
- **THEN** the API returns `200 OK` with `id`, `year`, `cycle`, and `label` for that process

#### Scenario: Detail endpoint returns not found for missing process
- **WHEN** a client requests `GET /processes/{process_id}` for a non-existent process
- **THEN** the API returns `404 Not Found`

### Requirement: Process overview endpoint
The system SHALL expose `GET /processes/{process_id}/overview` to return high-level metrics for the selected process.

#### Scenario: Overview endpoint returns process and aggregate metrics
- **WHEN** a client requests `GET /processes/{process_id}/overview` for an existing process
- **THEN** the API returns `200 OK` with `process`, `total_applicants`, `total_admitted`, `acceptance_rate`, and `total_majors`

#### Scenario: Overview endpoint returns not found for missing process
- **WHEN** a client requests `GET /processes/{process_id}/overview` for a non-existent process
- **THEN** the API returns `404 Not Found`

### Requirement: Explicit schemas and thin handlers
The system MUST use explicit Pydantic response schemas for process read endpoints and keep route handlers free of heavy query logic.

#### Scenario: Response contracts are schema-backed
- **WHEN** process read routes are implemented
- **THEN** each route declares and returns an explicit response schema rather than raw ORM entities

#### Scenario: Query logic remains outside route handlers
- **WHEN** process list, detail, and overview routes execute
- **THEN** data retrieval and aggregation are delegated to service/repository methods
