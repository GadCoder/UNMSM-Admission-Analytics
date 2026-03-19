## ADDED Requirements

### Requirement: Cached process overview behavior
The system SHALL apply read-through caching to `GET /processes/{process_id}/overview` using deterministic keying.

#### Scenario: Process overview cache key uses process scope
- **WHEN** process overview is requested for a `process_id`
- **THEN** cache key follows `process_overview:{process_id}`

#### Scenario: Cache hit returns schema-consistent payload
- **WHEN** cached process overview exists
- **THEN** the endpoint returns a response matching the same schema shape as uncached processing

#### Scenario: Cache miss stores response with configured TTL
- **WHEN** no cached process overview exists
- **THEN** overview is computed from PostgreSQL, cached with default TTL, and returned
