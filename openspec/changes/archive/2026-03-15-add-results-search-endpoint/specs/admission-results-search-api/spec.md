## ADDED Requirements

### Requirement: Results search endpoint
The system SHALL expose `GET /results` to return candidate-level admission result rows from PostgreSQL.

#### Scenario: Endpoint returns candidate-level rows
- **WHEN** a client requests `GET /results`
- **THEN** the API returns `200 OK` with candidate-level result items

### Requirement: Results endpoint supports frontend filters
The system SHALL support optional filters `process_id`, `major_id`, `faculty_id`, `academic_area_id`, `candidate_code`, `candidate_name`, `score_min`, `score_max`, and `is_admitted`.

#### Scenario: Hierarchy and process filters narrow results
- **WHEN** any combination of `process_id`, `major_id`, `faculty_id`, and `academic_area_id` is provided
- **THEN** only rows matching those hierarchy/process constraints are returned

#### Scenario: Candidate code filter matches exact code
- **WHEN** `candidate_code` is provided
- **THEN** only rows with the exact candidate code are returned

#### Scenario: Candidate name filter uses partial case-insensitive matching
- **WHEN** `candidate_name` is provided
- **THEN** rows are matched by case-insensitive partial search over normalized candidate lastnames and names

#### Scenario: Score and admission filters narrow results
- **WHEN** `score_min`, `score_max`, and/or `is_admitted` are provided
- **THEN** only rows satisfying those filter values are returned

### Requirement: Results endpoint supports pagination and constrained sorting
The system MUST support pagination and sorting for results search.

#### Scenario: Pagination metadata is returned
- **WHEN** `page` and `page_size` are provided or defaulted
- **THEN** the response includes `total`, `page`, `page_size`, and `total_pages` with paginated `items`

#### Scenario: Only supported sort fields are applied
- **WHEN** `sort_by` is provided
- **THEN** sorting is applied only for supported fields `score`, `merit_rank`, `candidate_lastnames`, or `candidate_names`

#### Scenario: Safe defaults are applied for pagination and sorting
- **WHEN** pagination or sorting parameters are omitted
- **THEN** defaults are applied as `page=1`, `page_size=50`, `sort_by=score`, and `sort_order=desc`

### Requirement: Results response includes hierarchy context
The system SHALL return process, major, faculty, and academic area context in each result item.

#### Scenario: Result item includes nested context objects
- **WHEN** the endpoint returns a result item
- **THEN** each item includes nested `process`, `major`, `faculty`, and `academic_area` objects

### Requirement: Thin route handlers with explicit response schemas
The system MUST keep route handlers thin and delegate query logic to repository/service layers.

#### Scenario: Route delegates query construction
- **WHEN** `GET /results` is executed
- **THEN** filtering, sorting, and pagination query logic is executed by repository/service methods

#### Scenario: Route uses explicit schema contracts
- **WHEN** `GET /results` is defined
- **THEN** it declares explicit Pydantic response schemas for result items and paginated response metadata
