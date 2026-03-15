## Why

The frontend needs stable read-only endpoints to navigate the university academic hierarchy before analytics features are delivered. Providing these APIs now enables filter/navigation UX with minimal API round trips and a clear contract for hierarchy-based selection.

## What Changes

- Add read-only API endpoints for listing and retrieving details of academic areas, faculties, and majors.
- Add frontend-friendly filtering on list endpoints:
  - `GET /faculties` by `academic_area_id`
  - `GET /majors` by `faculty_id` and `academic_area_id`
- Ensure major responses include embedded faculty and academic area context to reduce follow-up calls.
- Define explicit Pydantic response schemas for list and detail payloads.
- Keep route handlers thin by delegating query logic to repositories/services.
- Add proper 404 behavior for missing area/faculty/major resources.
- Return full datasets for these small entities (no pagination in this phase).

## Capabilities

### New Capabilities

- `academic-structure-read-apis`: Defines read-only endpoints and response contracts for areas, faculties, and majors.
- `academic-structure-filtering`: Defines filtering behavior for faculties/majors by hierarchy identifiers.
- `major-hierarchy-context-response`: Defines major payload requirements that embed faculty and academic area context.
- `academic-structure-repository-service-separation`: Defines thin-route and repository/service query responsibility boundaries for these endpoints.

### Modified Capabilities

- None.

## Impact

- Affected code: backend API route modules, response schemas, repository/service query modules, and router registration.
- API surface: introduces `GET /areas`, `GET /areas/{area_id}`, `GET /faculties`, `GET /faculties/{faculty_id}`, `GET /majors`, `GET /majors/{major_id}`.
- Data access: adds read paths across existing `academic_areas`, `faculties`, and `majors` domain models.
- Frontend integration: unblocks hierarchy navigation/filter controls with fewer dependent calls due to enriched major responses.
