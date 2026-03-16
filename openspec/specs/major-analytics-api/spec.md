## Purpose

Define read-only major-level analytics behavior for retrieving competitiveness metrics with optional process scoping.

## ADDED Requirements

### Requirement: Major analytics endpoint
The system SHALL expose `GET /majors/{major_id}/analytics` to return analytics for a selected major.

#### Scenario: Existing major returns analytics response
- **WHEN** a client requests `GET /majors/{major_id}/analytics` for an existing major
- **THEN** the API returns `200 OK` with `major`, `filters`, and `metrics` objects

#### Scenario: Missing major returns not found
- **WHEN** a client requests `GET /majors/{major_id}/analytics` for a non-existent major
- **THEN** the API returns `404 Not Found`

### Requirement: Process filter semantics
The system SHALL support optional `process_id` filter for major analytics scope.

#### Scenario: Process filter limits analytics scope
- **WHEN** `process_id` is provided in the request
- **THEN** analytics are computed only from rows matching the selected major and process

#### Scenario: Omitted process filter uses all processes
- **WHEN** `process_id` is omitted
- **THEN** analytics are computed across all admission processes for the selected major

### Requirement: Empty analytics behavior for existing majors
The system MUST return a valid empty analytics payload when a major exists but no rows match the filter scope.

#### Scenario: Existing major with no scoped rows returns empty metrics
- **WHEN** the selected major exists and filtered result set is empty
- **THEN** response metrics include `applicants=0`, `admitted=0`, and nullable rate/score metrics as `null`

### Requirement: Explicit analytics response contract
The system MUST use explicit response schemas for major analytics payloads.

#### Scenario: Response includes hierarchy context and metric fields
- **WHEN** analytics response is returned
- **THEN** `major` includes nested `faculty` and `academic_area`, `filters` includes `process_id`, and `metrics` includes `applicants`, `admitted`, `acceptance_rate`, `max_score`, `min_score`, `avg_score`, `median_score`, and `cutoff_score`

### Requirement: Thin route handlers and delegated query logic
The system MUST keep route handlers thin and delegate analytics queries to services/repositories.

#### Scenario: Route delegates analytics computation
- **WHEN** `GET /majors/{major_id}/analytics` executes
- **THEN** aggregation and major lookup logic are executed in repository/service layers
