## 1. API Contracts and Route Setup

- [x] 1.1 Add import response schemas (`process_id`, `total_rows`, `imported_rows`, `failed_rows`, `errors`) and error item schema
- [x] 1.2 Add imports route module with `POST /imports/results` multipart contract (`file`, `process_id`)
- [x] 1.3 Register imports router in the main API router while keeping route handler thin

## 2. CSV Parsing and Validation Utilities

- [x] 2.1 Implement CSV parser utility to read uploaded file rows with stable row-number tracking
- [x] 2.2 Implement required-column validation for `code`, `lastnames`, `names`, `major`, `score`, `merit`, `observation`, `modality`
- [x] 2.3 Implement field parsing helpers for numeric `score` and optional integer `merit`
- [x] 2.4 Implement centralized normalization helper deriving `is_admitted` from `observation` (`ALCANZÓ VACANTE` => true, else false)

## 3. Repository and Service Workflow

- [x] 3.1 Add repository method to validate target admission process existence by `process_id`
- [x] 3.2 Add repository method(s) to map majors by trimmed exact-name matching and return `major_id`
- [x] 3.3 Add repository insert method for `admission_results` row payloads with duplicate-safe handling
- [x] 3.4 Implement import service orchestration for file-level checks, row processing, inserts, and summary aggregation
- [x] 3.5 Ensure row-level failures (unknown major, invalid score/merit, duplicates, missing required values) are collected without aborting valid rows

## 4. Failure Semantics and Transaction Handling

- [x] 4.1 Return file-level failures for invalid CSV shape, missing required columns, and unknown `process_id` before row import
- [x] 4.2 Ensure duplicate-row failures are reported deterministically when uniqueness constraints are hit
- [x] 4.3 Keep import behavior transactional where reasonable while preserving partial-success summary semantics

## 5. Test Coverage

- [x] 5.1 Add endpoint test for successful import summary counts and payload shape
- [x] 5.2 Add endpoint tests for file-level failures (missing columns, unknown process)
- [x] 5.3 Add endpoint tests for row-level failures (unknown major, invalid score, invalid merit, duplicate row)
- [x] 5.4 Add endpoint tests validating admission normalization (`ALCANZÓ VACANTE` true, empty observation false)
- [x] 5.5 Add endpoint test confirming empty `merit` is accepted and stored as null
