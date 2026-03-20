## ADDED Requirements

### Requirement: Cached dashboard aggregate endpoints
The system SHALL apply read-through caching to dashboard aggregate endpoints using deterministic parameter-sensitive keys.

#### Scenario: Dashboard overview cache key encodes process and hierarchy scope
- **WHEN** `GET /dashboard/overview` is requested
- **THEN** cache key includes `process_id`, `academic_area_id`, and `faculty_id` (or explicit `all` markers for omitted optional filters)

#### Scenario: Dashboard rankings cache key includes ranking controls
- **WHEN** `GET /dashboard/rankings` is requested
- **THEN** cache key includes `process_id`, hierarchy filters, and `limit` so distinct request scopes do not collide

#### Scenario: Dashboard trends cache keys isolate metric domains
- **WHEN** `GET /dashboard/trends/applicants` and `GET /dashboard/trends/cutoff` are requested
- **THEN** each endpoint uses a distinct cache-key namespace with hierarchy filter parameters encoded

#### Scenario: Cache hit preserves dashboard response contracts
- **WHEN** cached payload exists for a dashboard request
- **THEN** returned payload matches the same response schema shape as uncached DB-backed computation

#### Scenario: Cache miss stores dashboard payload with configured TTL
- **WHEN** dashboard cache entry is missing
- **THEN** aggregate data is computed from PostgreSQL, stored with configured TTL, and returned
