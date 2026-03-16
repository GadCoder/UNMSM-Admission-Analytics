## 1. API Contracts

- [x] 1.1 Add explicit Pydantic schemas for major analytics response (`major`, `filters`, `metrics`) including nested faculty and academic area objects
- [x] 1.2 Add query parameter validation/schema for optional `process_id` filter and metric field typing (nullable when no data)

## 2. Repository Layer

- [x] 2.1 Implement repository method to retrieve major by `major_id` with faculty and academic area context
- [x] 2.2 Implement PostgreSQL analytics query for selected major with optional `process_id` filter
- [x] 2.3 Ensure repository computes applicants, admitted, acceptance_rate, max/min/avg/median/cutoff metrics with explicit empty-result behavior

## 3. Service Layer

- [x] 3.1 Add service method to orchestrate major lookup, optional process filtering, and analytics retrieval
- [x] 3.2 Return domain-level not-found handling for missing majors and valid empty analytics for existing majors with no scoped data
- [x] 3.3 Map repository results to explicit response schemas consistently

## 4. Route Module

- [x] 4.1 Update majors route module with `GET /majors/{major_id}/analytics`
- [x] 4.2 Keep analytics route handler thin by delegating query logic to service/repository
- [x] 4.3 Return proper `404` response for missing majors

## 5. Verification

- [x] 5.1 Add/update endpoint tests for existing-major analytics response and process filter scoping
- [x] 5.2 Add/update endpoint tests for missing-major `404` behavior
- [x] 5.3 Add/update endpoint tests for existing-major empty analytics response (zero/null metrics)
- [x] 5.4 Add/update endpoint tests validating median and cutoff metric semantics
