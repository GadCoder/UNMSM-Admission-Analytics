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
The system SHALL support filtering results by academic hierarchy, process, candidate code, candidate name, score range, and admission status through model structure and indexes.

#### Scenario: Results can be filtered by process and major
- **WHEN** querying results
- **THEN** filters by `admission_process_id`, `major_id`, or both are supported efficiently

#### Scenario: Results can be filtered by candidate and score range
- **WHEN** querying results
- **THEN** filters by `candidate_code`, `score` ranges, and `is_admitted` are supported efficiently

#### Scenario: Results can be filtered by faculty and academic area
- **WHEN** querying results
- **THEN** filters by faculty and academic area through major hierarchy relationships are supported efficiently

#### Scenario: Results can be filtered by candidate name text
- **WHEN** querying results with a candidate name string
- **THEN** case-insensitive partial matching over normalized candidate lastnames and names is supported

### Requirement: Result search supports paginated retrieval
The system SHALL support paginated retrieval of admission results for raw exploration workloads.

#### Scenario: Query returns total and page slice
- **WHEN** result search executes with `page` and `page_size`
- **THEN** the system returns a total row count and the corresponding paginated slice

### Requirement: Result search supports constrained sorting
The system MUST support deterministic sorting only for approved result fields.

#### Scenario: Sorting allowlist is enforced
- **WHEN** a sort field is requested
- **THEN** sorting is applied only if the field is in the supported allowlist

### Requirement: Result lifecycle fields
The system SHALL include timestamps on admission result records.

#### Scenario: Admission result table includes timestamps
- **WHEN** the result table is defined
- **THEN** it includes `created_at` and `updated_at`

### Requirement: Major analytics metric definitions
The system SHALL compute major analytics metrics from admission results using explicit and consistent definitions.

#### Scenario: Applicants and admitted metrics
- **WHEN** major analytics are computed
- **THEN** `applicants` equals total rows and `admitted` equals rows where `is_admitted = true` for the selected major and filter scope

#### Scenario: Acceptance rate metric
- **WHEN** major analytics are computed
- **THEN** `acceptance_rate` equals `admitted / applicants` and is `null` when `applicants = 0`

#### Scenario: Score aggregate metrics
- **WHEN** major analytics are computed
- **THEN** `max_score`, `min_score`, and `avg_score` are computed from all candidate scores in the filtered set

#### Scenario: Median score metric
- **WHEN** major analytics are computed
- **THEN** `median_score` is computed as the statistical median of filtered candidate scores

#### Scenario: Cutoff score metric
- **WHEN** major analytics are computed
- **THEN** `cutoff_score` equals the minimum admitted score in the filtered set and is `null` when no admitted rows exist

### Requirement: PostgreSQL-backed major analytics aggregation
The system MUST compute major analytics in PostgreSQL.

#### Scenario: Repository executes aggregate/statistical SQL
- **WHEN** major analytics endpoint requests metrics
- **THEN** repository logic executes PostgreSQL aggregate queries for counts, score stats, median, and cutoff values
