# frontend-admin-management-interface Specification

## Purpose
Define the frontend admin experience for catalog management and bulk results import operations.

## Requirements
### Requirement: Admin management route group
The system SHALL provide an admin route group with dedicated pages for catalog and import operations.

#### Scenario: Admin route pages are available
- **WHEN** an authenticated admin navigates under `/admin`
- **THEN** pages for areas, faculties, majors, and imports are available

### Requirement: Admin catalog management UI
The system SHALL provide form-based admin UI workflows for creating and updating areas, faculties, and majors.

#### Scenario: Area/faculty/major create forms submit to admin APIs
- **WHEN** an admin submits valid form inputs
- **THEN** the UI calls corresponding admin API and refreshes list state with created resource

#### Scenario: Domain and validation errors are shown clearly
- **WHEN** the API returns field-level or domain-level errors
- **THEN** the UI presents actionable error messages without losing entered form values

### Requirement: Massive upload admin workflow UI
The system SHALL provide a bulk upload UX for many result CSV files with batch progress visibility.

#### Scenario: Admin creates batch with many files
- **WHEN** an admin selects multiple CSV files and submits import batch
- **THEN** UI creates one import batch and displays per-file status rows

#### Scenario: Batch default process with per-file override
- **WHEN** admin sets batch default `process_id` and optional file-specific overrides
- **THEN** request payload preserves override values and applies default to unoverridden files

#### Scenario: Admin can retry failed and cancel pending items
- **WHEN** batch status view includes failed or queued items
- **THEN** UI exposes retry/cancel actions backed by batch control APIs

### Requirement: Batch status polling behavior
The system MUST refresh import batch status with polling and progressive backoff.

#### Scenario: Polling updates status until terminal state
- **WHEN** a batch is in non-terminal status
- **THEN** UI polls status endpoint and updates counts/items until all items are terminal
