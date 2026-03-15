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
