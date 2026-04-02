## 1. Cache Infrastructure and Configuration

- [x] 1.1 Add cache-related settings (`VALKEY_URL`, `CACHE_ENABLED`, `CACHE_DEFAULT_TTL_SECONDS`) to backend config with safe defaults
- [x] 1.2 Add Valkey client initialization in a centralized core/infrastructure module
- [x] 1.3 Add dependency wiring so services can access cache without route-level duplication

## 2. Central Cache Service and Key Builders

- [x] 2.1 Implement centralized cache service methods for JSON-safe read/write (`get_json`, `set_json`) with explicit serialization/deserialization
- [x] 2.2 Implement deterministic cache key helpers for process overview, major analytics, major trends, and rankings
- [x] 2.3 Implement cache-bypass behavior when `CACHE_ENABLED=false`
- [x] 2.4 Add failure-tolerant cache handling (log and continue on cache get/set errors)

## 3. Service-Layer Read-Through Integration

- [x] 3.1 Integrate read-through caching into process overview service flow using `process_overview:{process_id}` key format
- [x] 3.2 Integrate read-through caching into major analytics service flow with process-sensitive keying
- [x] 3.3 Integrate read-through caching into major trends service flow with metrics-signature keying
- [x] 3.4 Integrate read-through caching into rankings service flow with full parameter-sensitive keying
- [x] 3.5 Ensure cached payloads and uncached payloads remain schema-consistent for all cached endpoints

## 4. Cache Scope and Safety Guarantees

- [x] 4.1 Verify non-cache scope remains uncached (`/results`, hierarchy browsing, import endpoints)
- [x] 4.2 Ensure Valkey unavailability does not return cache-induced 500 errors
- [x] 4.3 Ensure configured default TTL is applied to cached entries for all scoped endpoints

## 5. Test Coverage

- [x] 5.1 Add tests for deterministic key generation per endpoint and parameter set
- [x] 5.2 Add tests for cache hit/miss behavior on process overview and major analytics
- [x] 5.3 Add tests for cache hit/miss behavior on major trends and rankings
- [x] 5.4 Add tests for cache-disabled mode and cache-failure fallback behavior
- [x] 5.5 Add tests confirming cached vs uncached response shape parity
