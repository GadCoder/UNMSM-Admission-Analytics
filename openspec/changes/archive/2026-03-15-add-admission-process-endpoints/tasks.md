## 1. API Contracts

- [x] 1.1 Add explicit Pydantic response schemas for process list item, process detail, and process overview payloads
- [x] 1.2 Define schema mapping rules for `process`, `total_applicants`, `total_admitted`, `acceptance_rate`, and `total_majors`

## 2. Repository Queries

- [x] 2.1 Implement repository method to list all admission processes ordered newest to oldest
- [x] 2.2 Implement repository method to fetch a single admission process by `process_id`
- [x] 2.3 Implement PostgreSQL aggregate query for process overview metrics (`total_applicants`, `total_admitted`, `acceptance_rate`, `total_majors`)

## 3. Service Layer

- [x] 3.1 Add service method to return full process list using repository data and response schemas
- [x] 3.2 Add service method to return process detail or domain-level not-found error
- [x] 3.3 Add service method to return process overview and handle zero-applicant acceptance-rate edge case

## 4. Route Module

- [x] 4.1 Create or update domain-grouped `processes` router with `GET /processes`
- [x] 4.2 Add `GET /processes/{process_id}` route with explicit response schema and 404 translation
- [x] 4.3 Add `GET /processes/{process_id}/overview` route with explicit response schema and 404 translation
- [x] 4.4 Register process routes in the main API router

## 5. Verification

- [x] 5.1 Add/update tests for process list ordering and response fields
- [x] 5.2 Add/update tests for process detail success and 404 behavior
- [x] 5.3 Add/update tests for overview aggregates, acceptance-rate calculation, and missing process 404 behavior
