## Purpose

Define synchronous CSV import behavior for admission results ingestion into PostgreSQL.

## ADDED Requirements

### Requirement: CSV results import endpoint
The system SHALL expose `POST /imports/results` to import admission result rows from CSV for a target admission process.

#### Scenario: Multipart request accepted
- **WHEN** a client uploads multipart form data containing `file` and `process_id`
- **THEN** the endpoint processes the CSV import workflow and returns an import summary

### Requirement: Required CSV column validation
The system MUST validate required CSV columns before processing rows.

#### Scenario: Missing required columns fails request
- **WHEN** the CSV file is missing one or more required columns (`code`, `lastnames`, `names`, `major`, `score`, `merit`, `observation`, `modality`)
- **THEN** the endpoint returns a file-level error response and does not process rows

### Requirement: Target process validation
The system MUST fail safely when `process_id` does not reference an existing admission process.

#### Scenario: Unknown process fails request
- **WHEN** `process_id` does not match an existing admission process
- **THEN** the endpoint returns a file-level error response and inserts no rows

### Requirement: Major mapping for row validation
The system SHALL map CSV `major` values to existing majors using deterministic trimmed exact-name matching.

#### Scenario: Unknown major marks row as failed
- **WHEN** a row references a `major` that does not map to an existing major
- **THEN** the row is counted as failed with an `Unknown major` reason and import continues for other rows

### Requirement: Admission outcome normalization
The system MUST derive `is_admitted` using centralized normalization logic based on `observation`.

#### Scenario: ALCANZÓ VACANTE maps to admitted
- **WHEN** `observation` normalizes to `ALCANZÓ VACANTE`
- **THEN** the imported row sets `is_admitted=true`

#### Scenario: Empty observation maps to not admitted
- **WHEN** `observation` is empty or does not match admitted marker
- **THEN** the imported row sets `is_admitted=false`

### Requirement: Numeric field parsing
The system SHALL parse `score` and `merit` with explicit validation rules.

#### Scenario: Invalid score marks row failed
- **WHEN** `score` cannot be parsed as numeric
- **THEN** the row is counted as failed with an invalid score reason

#### Scenario: Empty merit is accepted
- **WHEN** `merit` is empty
- **THEN** `merit_rank` is stored as null

#### Scenario: Invalid non-empty merit marks row failed
- **WHEN** `merit` is non-empty and cannot be parsed as integer
- **THEN** the row is counted as failed with an invalid merit reason

### Requirement: Row insertion and duplicate prevention
The system MUST insert valid rows into `admission_results` and prevent duplicates using existing uniqueness constraints.

#### Scenario: Valid row inserts with mapped fields
- **WHEN** a row passes validation
- **THEN** one `admission_results` record is inserted with mapped fields including `observation_raw`, `is_admitted`, and `row_number`

#### Scenario: Duplicate row is reported as failed
- **WHEN** insert violates uniqueness on (`admission_process_id`, `major_id`, `candidate_code`)
- **THEN** that row is counted as failed with duplicate-row reason and import continues

### Requirement: File-level and row-level failure handling
The system SHALL distinguish file-level failures from row-level failures.

#### Scenario: File-level failure aborts import
- **WHEN** file-level validation fails
- **THEN** no rows are imported and the request returns an error response

#### Scenario: Row-level failures allow partial import
- **WHEN** one or more rows fail validation or insertion but file-level checks pass
- **THEN** valid rows are imported and failed rows are reported in summary

### Requirement: Import summary response contract
The system MUST return a summary containing import counts and row-level error details.

#### Scenario: Summary includes totals and error items
- **WHEN** import processing completes
- **THEN** response includes `process_id`, `total_rows`, `imported_rows`, `failed_rows`, and `errors[]` with `row_number` and `reason`

### Requirement: Thin route handlers and delegated import logic
The system MUST keep import route handlers thin and delegate CSV parsing/validation logic to service or utility modules.

#### Scenario: Route delegates parsing and normalization
- **WHEN** `POST /imports/results` executes
- **THEN** parsing, row validation, major mapping, and admission normalization are executed outside the route handler
