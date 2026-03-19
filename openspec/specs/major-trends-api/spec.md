## Purpose

Define read-only major-level historical trends behavior across admission processes.

## ADDED Requirements

### Requirement: Major trends endpoint
The system SHALL expose `GET /majors/{major_id}/trends` to return historical process-level trends for a selected major.

#### Scenario: Existing major returns trends response
- **WHEN** a client requests `GET /majors/{major_id}/trends` for an existing major
- **THEN** the API returns `200 OK` with `major`, `metrics`, and `history` objects

#### Scenario: Missing major returns not found
- **WHEN** a client requests `GET /majors/{major_id}/trends` for a non-existent major
- **THEN** the API returns `404 Not Found`

### Requirement: Chronological historical snapshots
The system MUST return one history row per admission process with available rows for the selected major and order rows chronologically.

#### Scenario: History rows are ordered by process chronology
- **WHEN** trends history is returned for a major with data in multiple processes
- **THEN** history items are sorted by process chronology (`year`, `cycle`) with stable ordering

#### Scenario: Only processes with available data are included
- **WHEN** some processes contain no rows for the selected major
- **THEN** those processes are excluded from `history`

### Requirement: Metric filter semantics
The system SHALL support optional `metrics` filtering using a comma-separated allowlist.

#### Scenario: Omitted metrics filter returns all supported metrics
- **WHEN** `metrics` query parameter is omitted
- **THEN** response `metrics` contains the full supported list and each history item includes all supported metric keys

#### Scenario: Metrics filter returns only requested metric keys
- **WHEN** `metrics=applicants,acceptance_rate,cutoff_score` is provided
- **THEN** response `metrics` lists those metrics and each history item includes only those metric keys

#### Scenario: Invalid metric name is rejected
- **WHEN** the request includes a metric not in the supported set
- **THEN** the API returns a validation error response

### Requirement: Explicit trends response contract
The system MUST use explicit response schemas for major trends payloads.

#### Scenario: Response includes hierarchy context and process snapshots
- **WHEN** trends response is returned
- **THEN** `major` includes nested `faculty` and `academic_area`, each history item includes `process` summary fields (`id`, `year`, `cycle`, `label`), and `metrics` object fields follow the selected metric set

### Requirement: Thin route handlers and delegated query logic
The system MUST keep trends route handlers thin and delegate aggregation/query logic to services/repositories.

#### Scenario: Route delegates trends computation
- **WHEN** `GET /majors/{major_id}/trends` executes
- **THEN** major lookup and trend aggregation are executed in repository/service layers

### Requirement: Major trends metric definitions
The system SHALL compute trends metrics from PostgreSQL with definitions consistent with major analytics.

#### Scenario: Applicants and admitted metrics
- **WHEN** a process-level trends row is computed
- **THEN** `applicants` equals total rows for the selected major and process, and `admitted` equals rows with `is_admitted = true`

#### Scenario: Acceptance rate null semantics
- **WHEN** `applicants` is zero for a process snapshot
- **THEN** `acceptance_rate` is `null`

#### Scenario: Cutoff score null semantics
- **WHEN** no admitted rows exist for a process snapshot
- **THEN** `cutoff_score` is `null`

#### Scenario: Score aggregations use selected major and process scope
- **WHEN** `max_score`, `min_score`, `avg_score`, and `median_score` are computed
- **THEN** each metric is aggregated from rows matching the selected major and process

### Requirement: Cached major trends behavior
The system SHALL apply read-through caching to `GET /majors/{major_id}/trends` with metrics-sensitive keying.

#### Scenario: Trends key encodes selected metrics signature
- **WHEN** trends endpoint is requested
- **THEN** cache key follows `major_trends:{major_id}:metrics:{metrics_signature}` where omitted metrics use `all`

#### Scenario: Cache hit preserves trends response schema
- **WHEN** cached trends payload exists
- **THEN** returned payload matches uncached trends schema including `major`, `metrics`, and `history`

#### Scenario: Cache miss stores computed trends payload
- **WHEN** trends cache entry is missing
- **THEN** service computes trends from PostgreSQL, stores payload with configured TTL, and returns it
