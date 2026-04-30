## MODIFIED Requirements

### Requirement: Admin catalog management UI
The system SHALL provide form-based admin UI workflows for creating and updating areas, faculties, and majors, and SHALL localize user-visible labels, helper text, action buttons, and validation messaging for supported locales.

#### Scenario: Area/faculty/major create forms submit to admin APIs
- **WHEN** an admin submits valid form inputs
- **THEN** the UI calls corresponding admin API and refreshes list state with created resource

#### Scenario: Domain and validation errors are shown clearly
- **WHEN** the API returns field-level or domain-level errors
- **THEN** the UI presents actionable error messages in the active locale without losing entered form values

### Requirement: Massive upload admin workflow UI
The system SHALL provide a bulk upload UX for many result CSV files with batch progress visibility and SHALL localize upload guidance, status labels, and action text for supported locales.

#### Scenario: Admin creates batch with many files
- **WHEN** an admin selects multiple CSV files and submits import batch
- **THEN** UI creates one import batch and displays per-file status rows

#### Scenario: Batch default process with per-file override
- **WHEN** admin sets batch default `process_id` and optional file-specific overrides
- **THEN** request payload preserves override values and applies default to unoverridden files

#### Scenario: Admin can retry failed and cancel pending items
- **WHEN** batch status view includes failed or queued items
- **THEN** UI exposes retry/cancel actions backed by batch control APIs
