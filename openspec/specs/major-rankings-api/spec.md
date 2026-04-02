## Purpose

Define read-only, process-scoped comparative rankings for majors using core analytics metrics.

## ADDED Requirements

### Requirement: Major rankings endpoint
The system SHALL expose `GET /rankings/majors` to return ranked major analytics rows for a selected admission process.

#### Scenario: Rankings endpoint returns ranked major rows
- **WHEN** a client requests `GET /rankings/majors` with valid required parameters
- **THEN** the API returns `200 OK` with ordered ranking items

### Requirement: Required ranking scope and metric parameters
The system MUST require `process_id` and `metric` for major rankings requests.

#### Scenario: Missing required process scope is rejected
- **WHEN** a rankings request omits `process_id`
- **THEN** the API returns validation error response

#### Scenario: Missing required metric is rejected
- **WHEN** a rankings request omits `metric`
- **THEN** the API returns validation error response

### Requirement: Ranking metric allowlist
The system MUST support only `cutoff_score`, `acceptance_rate`, `applicants`, and `admitted` as ranking metrics.

#### Scenario: Supported metric applies ranking order
- **WHEN** a valid metric is provided
- **THEN** ranking order is computed using that metric

#### Scenario: Unsupported metric is rejected
- **WHEN** a metric outside the allowlist is provided
- **THEN** the API returns validation error response

### Requirement: Optional ranking filters and controls
The system SHALL support optional `sort_order`, `academic_area_id`, `faculty_id`, and `limit` query parameters.

#### Scenario: Hierarchy filters scope ranking rows
- **WHEN** `academic_area_id` and/or `faculty_id` are provided
- **THEN** only majors in the filtered hierarchy scope are included

#### Scenario: Sort direction is configurable
- **WHEN** `sort_order` is provided
- **THEN** ranking rows are ordered by the selected metric in the requested direction

#### Scenario: Limit restricts response size
- **WHEN** `limit` is provided
- **THEN** the response includes no more than `limit` ranking items

### Requirement: Ranking response shape includes context and metrics
The system MUST return rank context and full core metrics for each ranking item.

#### Scenario: Ranking item contains required fields
- **WHEN** rankings response is returned
- **THEN** each item includes `rank`, `major`, `faculty`, `academic_area`, `applicants`, `admitted`, `acceptance_rate`, and `cutoff_score`

### Requirement: Thin handlers and delegated query logic
The system MUST keep route handlers thin and execute ranking logic in services/repositories.

#### Scenario: Route delegates ranking computation
- **WHEN** rankings endpoint executes
- **THEN** filtering, aggregation, sorting, and rank assignment are handled outside the route layer

### Requirement: Cached major rankings behavior
The system SHALL apply read-through caching to `GET /rankings/majors` using full parameter-sensitive keying.

#### Scenario: Rankings key encodes all response-affecting parameters
- **WHEN** rankings endpoint is requested
- **THEN** cache key follows `rankings:majors:process:{process_id}:metric:{metric}:sort:{sort_order}:area:{academic_area_id_or_all}:faculty:{faculty_id_or_all}:limit:{limit_or_all}`

#### Scenario: Cache hit returns rankings payload with same contract
- **WHEN** cached rankings payload exists
- **THEN** returned payload matches uncached rankings response schema and ordering contract

#### Scenario: Cache miss stores rankings payload with TTL
- **WHEN** rankings cache entry is missing
- **THEN** rankings are computed from PostgreSQL, stored with configured TTL, and returned
