## 1. API Contracts

- [x] 1.1 Add explicit Pydantic schemas for major ranking items including `rank`, nested major/faculty/academic_area context, and metrics (`applicants`, `admitted`, `acceptance_rate`, `cutoff_score`)
- [x] 1.2 Add validated query parameter schema/types for required `process_id` and `metric`, and optional `sort_order`, `academic_area_id`, `faculty_id`, and `limit`

## 2. Repository Layer

- [x] 2.1 Implement repository query for process-scoped grouped major metrics used by rankings
- [x] 2.2 Implement optional hierarchy filters (`academic_area_id`, `faculty_id`) in ranking query
- [x] 2.3 Implement metric allowlist mapping for sorting by `cutoff_score`, `acceptance_rate`, `applicants`, or `admitted`
- [x] 2.4 Implement deterministic ordering and limit handling for ranking response size

## 3. Service Layer

- [x] 3.1 Add service method to orchestrate rankings retrieval with validated inputs
- [x] 3.2 Assign rank values in response order and map query rows to explicit response schemas
- [x] 3.3 Ensure ranking metric definitions align with major analytics semantics for shared metrics

## 4. Route Module

- [x] 4.1 Create or update rankings route module with `GET /rankings/majors`
- [x] 4.2 Keep route handler thin by delegating filtering/aggregation/ranking logic to service/repository
- [x] 4.3 Register rankings router in the main API router

## 5. Verification

- [x] 5.1 Add/update endpoint tests for required parameter validation (`process_id`, `metric`) and metric allowlist validation
- [x] 5.2 Add/update endpoint tests for sort order behavior and ranking position correctness
- [x] 5.3 Add/update endpoint tests for hierarchy filters (`academic_area_id`, `faculty_id`) and `limit` behavior
- [x] 5.4 Add/update endpoint tests confirming each ranking item includes full context and core metric fields
