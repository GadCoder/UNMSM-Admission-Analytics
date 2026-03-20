## ADDED Requirements

### Requirement: Dashboard overview endpoint
The system SHALL expose `GET /dashboard/overview` to return process-scoped KPI aggregates for dashboard summary cards.

#### Scenario: Overview returns process KPI metrics
- **WHEN** a client requests `GET /dashboard/overview` with valid `process_id`
- **THEN** the API returns `200 OK` with `total_applicants`, `total_admitted`, `acceptance_rate`, and `total_majors`

#### Scenario: Overview supports optional hierarchy scope
- **WHEN** `academic_area_id` and/or `faculty_id` are provided with `process_id`
- **THEN** metrics are computed only from majors within the requested hierarchy scope

#### Scenario: Missing process scope is rejected
- **WHEN** a request omits `process_id`
- **THEN** the API returns validation error response

### Requirement: Dashboard rankings endpoint
The system SHALL expose `GET /dashboard/rankings` to return both competitive and popular major ranking lists for one process scope.

#### Scenario: Rankings endpoint returns dual lists
- **WHEN** a client requests `GET /dashboard/rankings` with valid `process_id`
- **THEN** the response includes `most_competitive` and `most_popular` lists in a single payload

#### Scenario: Rankings endpoint applies optional hierarchy filters
- **WHEN** `academic_area_id` and/or `faculty_id` are provided
- **THEN** each ranking list contains only majors within the filtered hierarchy scope

#### Scenario: Rankings endpoint applies limit control
- **WHEN** `limit` is provided
- **THEN** each returned ranking list includes no more than `limit` items

### Requirement: Dashboard applicants trend endpoint
The system SHALL expose `GET /dashboard/trends/applicants` to return applicants-over-processes aggregate trend series.

#### Scenario: Applicants trend returns chronological series
- **WHEN** a client requests `GET /dashboard/trends/applicants`
- **THEN** the API returns `200 OK` with one ordered trend item per process including process context and applicants aggregate

#### Scenario: Applicants trend supports optional hierarchy scope
- **WHEN** `academic_area_id` and/or `faculty_id` are provided
- **THEN** applicants aggregates are calculated within the requested hierarchy scope for each process row

### Requirement: Dashboard cutoff trend endpoint
The system SHALL expose `GET /dashboard/trends/cutoff` to return process-over-process aggregate cutoff trend values.

#### Scenario: Cutoff trend returns aggregate series
- **WHEN** a client requests `GET /dashboard/trends/cutoff`
- **THEN** the API returns chronological trend rows with process context and aggregate cutoff values computed from admitted results in scope

#### Scenario: Cutoff trend is not labeled as single-major trend
- **WHEN** cutoff trend payload is returned
- **THEN** response semantics represent aggregate process-level values rather than a single-major proxy

#### Scenario: Cutoff trend supports optional hierarchy scope
- **WHEN** `academic_area_id` and/or `faculty_id` are provided
- **THEN** cutoff aggregates are computed within the requested hierarchy scope for each process row

### Requirement: Dashboard filter validation behavior
The system MUST validate hierarchy filter combinations for dashboard endpoints.

#### Scenario: Unknown hierarchy identifiers are rejected
- **WHEN** `academic_area_id` or `faculty_id` does not exist
- **THEN** the API returns `404 Not Found`

#### Scenario: Inconsistent faculty-area combination is rejected
- **WHEN** both `academic_area_id` and `faculty_id` are provided and the faculty does not belong to the area
- **THEN** the API returns validation error response

### Requirement: Dashboard response contracts and layering
The system MUST use explicit schemas for dashboard responses and keep route handlers thin with delegated service/repository logic.

#### Scenario: Dashboard responses are schema-backed
- **WHEN** dashboard endpoints return data
- **THEN** payloads conform to explicit Pydantic response schemas with typed process and metric fields

#### Scenario: Route handlers delegate analytics computation
- **WHEN** dashboard endpoints execute
- **THEN** filtering, aggregation, and composition logic are handled outside the route layer
