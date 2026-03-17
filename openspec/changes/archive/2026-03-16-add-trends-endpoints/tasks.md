## 1. Trends Contracts and Validation

- [x] 1.1 Add trends response schemas (major context, process summary, history item, metrics container) in backend schema modules
- [x] 1.2 Define supported trend metric allowlist and parse/validate optional `metrics` query parameter
- [x] 1.3 Ensure metric-filtered responses can include only requested metric keys while preserving explicit schema contracts

## 2. Repository and Service Implementation

- [x] 2.1 Add repository method to retrieve major with faculty and academic area context for trends responses
- [x] 2.2 Add repository aggregation query to compute process-grouped trend metrics from PostgreSQL with chronological ordering
- [x] 2.3 Implement trends service method that handles missing-major `404`, metric filtering, and response assembly
- [x] 2.4 Ensure trends metric formulas and null semantics match major analytics definitions

## 3. API Route Wiring

- [x] 3.1 Add `GET /majors/{major_id}/trends` route in the majors domain module with thin handler delegation
- [x] 3.2 Wire validated `metrics` query handling into the endpoint contract
- [x] 3.3 Verify endpoint returns one history row per process with available data and excludes empty-process rows

## 4. Test Coverage

- [x] 4.1 Add endpoint test for successful trends response including hierarchy context and history payload shape
- [x] 4.2 Add endpoint test for missing-major `404` behavior
- [x] 4.3 Add endpoint test verifying chronological ordering of history items
- [x] 4.4 Add endpoint tests for metrics filter behavior (all metrics by default, selected metrics when provided, invalid metric rejection)
- [x] 4.5 Add endpoint tests validating metric semantics consistency with major analytics (including acceptance-rate and cutoff null semantics)
