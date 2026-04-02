## ADDED Requirements

### Requirement: Historical admission process representation
The system SHALL represent each admission process as a distinct historical cycle with year and cycle attributes.

#### Scenario: Process record stores historical identity
- **WHEN** an admission process is created
- **THEN** it stores `year`, `cycle`, and a human-readable `label`

### Requirement: Admission process uniqueness
The system MUST prevent duplicate process definitions for the same cycle.

#### Scenario: Year and cycle combination is unique
- **WHEN** admission processes are persisted
- **THEN** `(year, cycle)` is unique

#### Scenario: Label is unique
- **WHEN** admission processes are persisted
- **THEN** `label` is unique

### Requirement: Admission process lifecycle and publication state
The system SHALL track publication and timing metadata for admission processes.

#### Scenario: Process contains publication and exam metadata
- **WHEN** an admission process record is stored
- **THEN** it includes `exam_date` and `is_published`

#### Scenario: Process contains timestamps
- **WHEN** the process table is defined
- **THEN** it includes `created_at` and `updated_at`

### Requirement: Process overview aggregate definitions
The system SHALL define process overview metrics based on admission results associated with the selected admission process.

#### Scenario: Total applicants metric
- **WHEN** the overview is computed for a process
- **THEN** `total_applicants` equals the total count of admission result rows for that process

#### Scenario: Total admitted metric
- **WHEN** the overview is computed for a process
- **THEN** `total_admitted` equals the count of admission result rows where `is_admitted = true` for that process

#### Scenario: Acceptance rate metric
- **WHEN** the overview is computed for a process
- **THEN** `acceptance_rate` equals `total_admitted / total_applicants` as a numeric value

#### Scenario: Total majors metric
- **WHEN** the overview is computed for a process
- **THEN** `total_majors` equals the count of distinct majors present in admission results for that process

### Requirement: PostgreSQL-backed metric computation
The system MUST compute process overview metrics in PostgreSQL rather than in-memory aggregation.

#### Scenario: Aggregation executes in repository query layer
- **WHEN** process overview data is requested
- **THEN** repository/service logic executes PostgreSQL aggregate queries to produce overview metrics
