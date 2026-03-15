## 1. API Contract and Schema Setup

- [ ] 1.1 Create Pydantic response schemas for area list/detail (`id`, `name`, `slug`)
- [ ] 1.2 Create Pydantic response schemas for faculty list/detail including `academic_area_id` and `academic_area_name`
- [ ] 1.3 Create Pydantic response schemas for major list/detail including nested `faculty` and `academic_area` objects plus base major fields

## 2. Repository and Service Query Layer

- [ ] 2.1 Implement repository/service methods for listing and retrieving academic areas
- [ ] 2.2 Implement repository/service methods for listing and retrieving faculties with optional `academic_area_id` filter
- [ ] 2.3 Implement repository/service methods for listing and retrieving majors with optional `faculty_id` and `academic_area_id` filters
- [ ] 2.4 Ensure major query paths load faculty and academic area context in a single read path to avoid N+1 lookups

## 3. Route Layer and Domain Grouping

- [ ] 3.1 Add read-only route handlers for `GET /areas` and `GET /areas/{area_id}` under academic-structure domain routing
- [ ] 3.2 Add read-only route handlers for `GET /faculties` and `GET /faculties/{faculty_id}` with query parameter support
- [ ] 3.3 Add read-only route handlers for `GET /majors` and `GET /majors/{major_id}` with filter support and enriched hierarchy response shape
- [ ] 3.4 Keep handlers thin by delegating business/query logic to service or repository layers and update router registration

## 4. Error Handling and Validation

- [ ] 4.1 Implement standardized 404 behavior for missing area/faculty/major detail resources
- [ ] 4.2 Validate filter semantics for `/faculties` and `/majors` (including combined major filters)
- [ ] 4.3 Verify list endpoints return full datasets without pagination metadata

## 5. Endpoint Verification

- [ ] 5.1 Add/adjust tests (or equivalent verification) for all six read endpoints and response schema contracts
- [ ] 5.2 Add/adjust tests (or equivalent verification) for nested hierarchy context in major responses
- [ ] 5.3 Add/adjust tests (or equivalent verification) for 404 and filter behavior across areas/faculties/majors
