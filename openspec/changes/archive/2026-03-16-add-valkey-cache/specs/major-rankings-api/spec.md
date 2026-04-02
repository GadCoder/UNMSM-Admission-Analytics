## ADDED Requirements

### Requirement: Cached major rankings behavior
The system SHALL apply read-through caching to `GET /rankings/majors` using full parameter-sensitive keying.

#### Scenario: Rankings key encodes all response-affecting parameters
- **WHEN** rankings endpoint is requested
- **THEN** cache key follows `rankings:majors:process:{process_id}:metric:{metric}:sort:{sort_order}:area:{academic_area_id_or_all}:faculty:{faculty_id_or_all}:limit:{limit_or_all}`

#### Scenario: Cache hit returns rankings payload with same contract
- **WHEN** cached rankings payload exists
- **THEN** returned payload matches uncached rankings response schema and ordering contract

#### Scenario: Cache miss stores rankings payload with TTL
- **WHEN** rankings cache entry is missing
- **THEN** rankings are computed from PostgreSQL, stored with configured TTL, and returned
