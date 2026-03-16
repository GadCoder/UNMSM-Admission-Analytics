## 1. API Contracts

- [x] 1.1 Add explicit Pydantic schemas for result item payload, nested process/major/faculty/academic_area context, and paginated response metadata
- [x] 1.2 Add validated query-parameter schema/types for filters, pagination defaults (`page=1`, `page_size=50`), and sorting allowlist (`score`, `merit_rank`, `candidate_lastnames`, `candidate_names`)

## 2. Repository Query Layer

- [x] 2.1 Implement repository filter builder for `process_id`, `major_id`, `faculty_id`, `academic_area_id`, `candidate_code`, `candidate_name`, `score_min`, `score_max`, and `is_admitted`
- [x] 2.2 Implement paginated list query joining admission results with process, major, faculty, and academic area context
- [x] 2.3 Implement total-count query reusing the same filter semantics for accurate pagination
- [x] 2.4 Implement safe sorting mapper for supported fields and sort order, with deterministic defaults

## 3. Service Layer

- [x] 3.1 Add service method to orchestrate validated filters/sorting/pagination and call repository list+count methods
- [x] 3.2 Map query results into explicit response schemas, including nested hierarchy/process objects and pagination metadata
- [x] 3.3 Ensure candidate-name filtering uses normalized concatenation matching (case-insensitive partial search)

## 4. Route Module

- [x] 4.1 Create or update domain-grouped `results` router with `GET /results`
- [x] 4.2 Keep route handler thin by delegating filtering/sorting/pagination logic to service/repository
- [x] 4.3 Register `results` router in the main API router

## 5. Verification

- [x] 5.1 Add/update endpoint tests for filter behavior: process, major, faculty, academic area, candidate code, candidate name, score range, and `is_admitted`
- [x] 5.2 Add/update endpoint tests for pagination metadata (`total`, `page`, `page_size`, `total_pages`) and page slicing
- [x] 5.3 Add/update endpoint tests for sorting allowlist/default behavior and invalid sort handling
- [x] 5.4 Add/update endpoint tests confirming each item includes process, major, faculty, and academic area context
