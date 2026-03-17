## Why

The backend currently lacks a repeatable ingestion workflow for historical admission CSV files, which blocks sustainable data updates for analytics features. A first synchronous import workflow enables maintainable process-by-process loading without manual database inserts.

## What Changes

- Add an internal/admin read-write import endpoint `POST /imports/results` using multipart upload (`file`, `process_id`).
- Validate required CSV columns (`code`, `lastnames`, `names`, `major`, `score`, `merit`, `observation`, `modality`) before row processing.
- Parse and validate rows, map majors by deterministic trimmed exact-name matching, and reject rows with unknown majors.
- Derive `is_admitted` via centralized normalization logic where `ALCANZÓ VACANTE` maps to `true`, otherwise `false`.
- Insert valid rows into `admission_results` with transactional handling and row-level error collection for partial import reporting.
- Return import summary with totals and row-level failures (`row_number`, `reason`).

## Capabilities

### New Capabilities
- `admission-results-csv-import-api`: Defines endpoint contract, CSV validation/parsing behavior, row normalization, insert rules, and import summary response.

### Modified Capabilities
- None.

## Impact

- API surface: adds `POST /imports/results` endpoint grouped under imports business domain.
- Backend modules: new route/service/parser/validation utilities and repository insert/lookup helpers.
- Data behavior: uses existing uniqueness constraints to prevent duplicate result rows and maps to existing processes/majors only.
- Tests: adds endpoint/service coverage for file-level errors, row-level errors, duplicate handling, and admission normalization semantics.
