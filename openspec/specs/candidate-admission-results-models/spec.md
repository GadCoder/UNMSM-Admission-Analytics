## ADDED Requirements

### Requirement: Candidate-level admission result fact model
The system SHALL store one result row per candidate, major, and admission process combination.

#### Scenario: Result links to process and major
- **WHEN** an admission result is persisted
- **THEN** it includes non-null foreign keys to `AdmissionProcess` and `Major`

#### Scenario: Result uniqueness per candidate-major-process
- **WHEN** results are persisted
- **THEN** `(admission_process_id, major_id, candidate_code)` is unique

### Requirement: Normalized admission outcome and traceability
The system MUST normalize admission outcome while preserving source traceability fields.

#### Scenario: Admission outcome is boolean
- **WHEN** result rows are stored
- **THEN** `is_admitted` is persisted as a boolean field

#### Scenario: Source traceability fields are preserved
- **WHEN** result rows are stored
- **THEN** `observation_raw` and `row_number` are stored to trace source CSV context

### Requirement: Result query support for common filters
The system SHALL support filtering results by academic hierarchy, process, candidate code, and score range through model structure and indexes.

#### Scenario: Results can be filtered by process and major
- **WHEN** querying results
- **THEN** filters by `admission_process_id`, `major_id`, or both are supported efficiently

#### Scenario: Results can be filtered by candidate and score range
- **WHEN** querying results
- **THEN** filters by `candidate_code`, `score` ranges, and `is_admitted` are supported efficiently

### Requirement: Result lifecycle fields
The system SHALL include timestamps on admission result records.

#### Scenario: Admission result table includes timestamps
- **WHEN** the result table is defined
- **THEN** it includes `created_at` and `updated_at`
