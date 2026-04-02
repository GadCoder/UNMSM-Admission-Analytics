## MODIFIED Requirements

### Requirement: CSV results import endpoint
The system SHALL expose `POST /imports/results` to import admission result rows from CSV for a target admission process as an admin-protected operation.

#### Scenario: Multipart request accepted for authenticated admin
- **WHEN** an authenticated admin uploads multipart form data containing `file` and `process_id`
- **THEN** the endpoint processes the CSV import workflow and returns an import summary

#### Scenario: Unauthenticated request is rejected
- **WHEN** a request to `POST /imports/results` is made without valid admin authentication
- **THEN** the API returns `401 Unauthorized`

### Requirement: Import summary response contract
The system MUST return a summary containing import counts and row-level error details suitable for admin UI rendering.

#### Scenario: Summary includes totals and error items
- **WHEN** import processing completes
- **THEN** response includes `process_id`, `total_rows`, `imported_rows`, `failed_rows`, and `errors[]` with `row_number` and `reason`

#### Scenario: Summary supports deterministic admin display
- **WHEN** row-level failures occur
- **THEN** each error item includes stable row reference and machine-readable reason code or normalized reason text for UI grouping
