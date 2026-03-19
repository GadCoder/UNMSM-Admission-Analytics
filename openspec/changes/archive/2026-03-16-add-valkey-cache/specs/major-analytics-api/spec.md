## ADDED Requirements

### Requirement: Cached major analytics behavior
The system SHALL apply read-through caching to `GET /majors/{major_id}/analytics` with process-sensitive keying.

#### Scenario: Analytics key encodes major and process scope
- **WHEN** major analytics is requested
- **THEN** cache key follows `major_analytics:{major_id}:process:{process_id_or_all}`

#### Scenario: Cache hit preserves analytics response contract
- **WHEN** cached analytics payload exists
- **THEN** returned payload includes the same `major`, `filters`, and `metrics` shape as uncached analytics

#### Scenario: Cache miss writes analytics payload with TTL
- **WHEN** analytics cache entry is missing
- **THEN** service computes analytics from PostgreSQL, stores JSON payload with configured TTL, and returns it
