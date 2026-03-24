# bulk-results-import-orchestration Specification

## Purpose
Define asynchronous batch orchestration, storage provenance, and monitoring controls for large result imports.

## Requirements
### Requirement: Bulk import batch orchestration
The system SHALL support asynchronous bulk import batches for admission-results CSV files.

#### Scenario: Create import batch with multiple files
- **WHEN** an authenticated admin submits a bulk import request containing many CSV files
- **THEN** the API creates one batch with one item per file and returns batch identifier plus initial status summary

#### Scenario: Batch creation enforces hard limits
- **WHEN** submitted file count, any file size, or total payload size exceed configured limits
- **THEN** the API rejects the request with validation error response

### Requirement: S3-backed file staging and metadata persistence
The system MUST stage uploaded files in S3 and persist canonical source-file metadata for future retrieval.

#### Scenario: Uploaded file is persisted as canonical source file
- **WHEN** a batch item is accepted
- **THEN** the system stores file object in S3 and records canonical metadata (`s3_bucket`, `s3_object_key`, filename, size, checksum, `admission_process_id`, `major_id`)

#### Scenario: Batch item links to canonical source file
- **WHEN** item metadata is stored
- **THEN** `ImportBatchItem` stores reference to `ImportSourceFile` for provenance and later download/export workflows

### Requirement: Domain mapping for source files
The system SHALL treat each source CSV as scoped to one major and one admission process.

#### Scenario: Source metadata preserves major/process scope
- **WHEN** file metadata is persisted
- **THEN** source-file record includes both `major_id` and `admission_process_id`

### Requirement: Batch item lifecycle and control operations
The system MUST track per-item lifecycle status and support retry/cancel controls.

#### Scenario: Item status transitions are observable
- **WHEN** background processing executes
- **THEN** each item transitions across `queued`, `processing`, `completed`, `failed`, or `cancelled` with timestamps

#### Scenario: Retry requeues failed items
- **WHEN** admin triggers retry for failed items
- **THEN** selected failed items are requeued without creating duplicate batch rows

#### Scenario: Cancel stops pending items
- **WHEN** admin triggers cancel for queued items
- **THEN** pending items are marked cancelled and are not processed further

### Requirement: Batch status and item listing APIs
The system SHALL expose aggregate and itemized status APIs for admin monitoring.

#### Scenario: Aggregate status endpoint returns progress totals
- **WHEN** client requests batch status
- **THEN** response includes total items and per-status counts

#### Scenario: Item listing endpoint returns per-file outcomes
- **WHEN** client requests batch item list
- **THEN** response includes file identity, processing status, and failure summary per item

### Requirement: Retention policy for staged data and logs
The system MUST enforce retention rules for staging artifacts while preserving canonical source files for export workflows.

#### Scenario: Temporary staging objects expire
- **WHEN** retention windows elapse for temporary staging artifacts
- **THEN** temporary objects are cleaned according to configured success/failure retention windows

#### Scenario: Canonical source files remain retained
- **WHEN** source files are marked canonical for export provenance
- **THEN** objects remain long-lived with lifecycle tiering allowed and are not removed by temporary staging cleanup
