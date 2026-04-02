## MODIFIED Requirements

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

## ADDED Requirements

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
