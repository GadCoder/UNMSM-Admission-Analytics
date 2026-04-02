## Why

Read-heavy analytics endpoints repeatedly execute the same PostgreSQL aggregations for identical parameters, increasing latency and database load. Selective Valkey caching improves response time for hot paths while preserving fallback behavior when cache is unavailable.

## What Changes

- Add centralized Valkey cache infrastructure with configurable enable/disable flag and default TTL.
- Add deterministic cache key generation helpers for selected endpoints only.
- Integrate read-through caching at the service layer for:
  - `GET /processes/{process_id}/overview`
  - `GET /majors/{major_id}/analytics`
  - `GET /majors/{major_id}/trends`
  - `GET /rankings/majors`
- Enforce explicit JSON serialization/deserialization for cached payloads.
- Ensure cache failures never break API responses (fallback to PostgreSQL computation).

## Capabilities

### New Capabilities
- `valkey-cache-foundation`: Defines centralized Valkey client/configuration, cache service behavior, and failure-tolerant read-through semantics.

### Modified Capabilities
- `admission-process-read-apis`: Process overview endpoint behavior is extended with selective read-through caching.
- `major-analytics-api`: Major analytics endpoint behavior is extended with parameter-sensitive caching.
- `major-trends-api`: Major trends endpoint behavior is extended with metric-signature caching.
- `major-rankings-api`: Major rankings endpoint behavior is extended with fully parameterized caching.

## Impact

- Core configuration: new cache-related settings (`VALKEY_URL`, `CACHE_ENABLED`, `CACHE_DEFAULT_TTL_SECONDS`).
- Infrastructure/services: shared cache module and key builders used by selected service methods.
- Endpoint behavior: hot analytics endpoints gain cache hit/miss flow with DB fallback on cache failure.
- Dependencies: add Valkey/Redis-compatible client library if not already present.
