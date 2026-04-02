## Context

The backend already has the foundational app/router structure and core domain models for academic hierarchy (`AcademicArea`, `Faculty`, `Major`). The frontend now requires read-only hierarchy endpoints to support filter controls and navigation before analytics features are built.

This change introduces a thin-route API layer and dedicated read-query paths for areas, faculties, and majors. Entity counts are expected to remain small, so list endpoints should return complete datasets without pagination. For frontend efficiency, major responses must embed both faculty and academic area context.

## Goals / Non-Goals

**Goals:**
- Expose read-only endpoints for list/detail views of areas, faculties, and majors.
- Support simple hierarchy filters on list endpoints:
  - `faculties` by `academic_area_id`
  - `majors` by `faculty_id` or `academic_area_id`
- Return full result sets (no pagination) for these domain entities.
- Ensure major payloads include nested `faculty` and `academic_area` context.
- Keep route handlers thin and move read/query logic into repository/service layers.
- Return explicit 404 responses when requested IDs do not exist.

**Non-Goals:**
- Mutating endpoints (create/update/delete) for hierarchy entities.
- Admission-result analytics, rankings, trends, or search.
- CSV import/export workflows or background processing changes.
- Authz/admin-only access controls beyond existing project baseline.

## Decisions

1. Group endpoints by academic-structure domain in dedicated route modules.
- Decision: Implement area/faculty/major handlers under domain-specific routes and register centrally.
- Rationale: Matches business-domain grouping requirement and avoids monolithic route files.
- Alternative considered: Keep everything in a single generic route module.
  - Rejected for scalability/maintainability.

2. Use explicit response schemas for list/detail contracts.
- Decision: Create Pydantic schemas per resource/list representation, including nested objects for major hierarchy context.
- Rationale: Provides a stable typed API contract for frontend integration and avoids accidental field leakage.
- Alternative considered: Return raw ORM objects/dicts directly.
  - Rejected for weak contract control.

3. Keep route handlers thin and delegate data retrieval to repositories/services.
- Decision: Routes validate request parameters and call service/repository methods; query composition remains outside handlers.
- Rationale: Enforces separation of concerns and testable query logic.
- Alternative considered: Build SQLAlchemy queries directly in route functions.
  - Rejected due to coupling and duplication.

4. Implement simple optional filter semantics (AND behavior when combined).
- Decision:
  - `GET /faculties?academic_area_id=...` filters by area only.
  - `GET /majors` supports `faculty_id`, `academic_area_id`, or both; both filters apply conjunctively.
- Rationale: Predictable behavior for frontend filtering and easy composition.
- Alternative considered: mutually exclusive filters.
  - Rejected because UI may require chained narrowing.

5. Resolve majors with joined hierarchy context in one query path.
- Decision: Use a query strategy that eagerly includes faculty and academic area data for major responses.
- Rationale: Avoids N+1 lookups and reduces client API fan-out.
- Alternative considered: separate frontend calls to fetch hierarchy context.
  - Rejected because requirement explicitly asks to reduce API calls.

6. Return standardized 404 for missing detail resources.
- Decision: Detail endpoints for `/areas/{id}`, `/faculties/{id}`, `/majors/{id}` return 404 when not found.
- Rationale: Frontend-friendly error semantics and explicit missing-resource behavior.
- Alternative considered: empty payload with 200.
  - Rejected as ambiguous and non-RESTful for detail retrieval.

## Risks / Trade-offs

- [Risk] Unpaginated lists could grow over time and impact response latency.  
  → Mitigation: Keep current non-paginated behavior per requirement; add pagination in a future change if growth demands it.

- [Risk] Ambiguous filter precedence may confuse clients.  
  → Mitigation: document and test explicit AND semantics when multiple filters are provided.

- [Risk] Nested major payloads can drift if schema and query loading diverge.  
  → Mitigation: centralize mapper/serializer logic with schema-level tests.

- [Trade-off] Additional repository/service layers add initial boilerplate.  
  → Mitigation: keep interfaces minimal and focused on the defined read use-cases.

## Migration Plan

1. Add response schemas for areas, faculties, and majors (including nested faculty/area objects for majors).
2. Add repository/service read methods for list/detail queries with optional filters.
3. Add route modules for six endpoints and wire them into API router registration.
4. Add 404 handling behavior in detail paths.
5. Validate endpoint responses and filters in local integration tests/manual checks.

Rollback strategy:
- Revert new route registration and endpoint modules to disable the feature.
- Keep underlying models unchanged since this change is read-only at API layer.

## Open Questions

- Should inactive majors (`is_active=false`) be included by default or filtered out by default in `/majors`?
- Do we want to support slug-based detail endpoints in a future extension (`/majors/{slug}`), or keep id-only contract for now?
