## ADDED Requirements

### Requirement: Cached major trends behavior
The system SHALL apply read-through caching to `GET /majors/{major_id}/trends` with metrics-sensitive keying.

#### Scenario: Trends key encodes selected metrics signature
- **WHEN** trends endpoint is requested
- **THEN** cache key follows `major_trends:{major_id}:metrics:{metrics_signature}` where omitted metrics use `all`

#### Scenario: Cache hit preserves trends response schema
- **WHEN** cached trends payload exists
- **THEN** returned payload matches uncached trends schema including `major`, `metrics`, and `history`

#### Scenario: Cache miss stores computed trends payload
- **WHEN** trends cache entry is missing
- **THEN** service computes trends from PostgreSQL, stores payload with configured TTL, and returns it
