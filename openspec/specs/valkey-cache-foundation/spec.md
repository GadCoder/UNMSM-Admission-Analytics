## Purpose

Define centralized Valkey caching foundations for selective, failure-tolerant read-through behavior.

## ADDED Requirements

### Requirement: Valkey cache backend configuration
The system SHALL support Valkey as the cache backend with runtime configuration controls.

#### Scenario: Cache settings configure backend behavior
- **WHEN** application settings are loaded
- **THEN** `VALKEY_URL`, `CACHE_ENABLED`, and `CACHE_DEFAULT_TTL_SECONDS` control cache connectivity, enablement, and TTL policy

#### Scenario: Cache disabled bypasses backend
- **WHEN** `CACHE_ENABLED` is `false`
- **THEN** cache get/set operations are bypassed and responses are computed from PostgreSQL paths

### Requirement: Centralized cache service behavior
The system MUST provide a centralized cache service for explicit JSON-safe read/write operations.

#### Scenario: Cache service reads/writes JSON payloads
- **WHEN** cacheable services interact with cache
- **THEN** payloads are serialized to JSON-safe representations before storage and deserialized before use

#### Scenario: Unsafe object storage is prevented
- **WHEN** cache values are written
- **THEN** raw ORM objects are not stored directly in Valkey

### Requirement: Cache failure fallback policy
The system MUST treat cache failures as non-fatal and continue normal DB-backed processing.

#### Scenario: Cache operation failure does not break response
- **WHEN** Valkey is unavailable or cache get/set fails
- **THEN** the failure is logged and the endpoint still returns a valid PostgreSQL-computed response

### Requirement: Deterministic cache key helpers
The system SHALL generate deterministic keys from response-affecting request parameters.

#### Scenario: Equal parameters produce equal key
- **WHEN** the same cacheable endpoint is called with identical inputs
- **THEN** the generated cache key is identical

#### Scenario: Distinct parameters produce distinct key
- **WHEN** response-affecting parameters differ
- **THEN** generated cache keys differ to prevent cross-parameter cache pollution
