## Context

The backend currently computes process overview, major analytics, major trends, and rankings directly from PostgreSQL for every request. These endpoints are read-heavy and frequently requested with repeated parameter combinations, making them good candidates for selective caching. Caching must remain an optimization: if Valkey fails, APIs still need to return correct DB-backed responses.

## Goals / Non-Goals

**Goals:**
- Introduce centralized Valkey cache infrastructure configured via application settings.
- Implement reusable cache service with explicit JSON serialization/deserialization.
- Apply read-through caching only to selected endpoints:
  - `GET /processes/{process_id}/overview`
  - `GET /majors/{major_id}/analytics`
  - `GET /majors/{major_id}/trends`
  - `GET /rankings/majors`
- Use deterministic, parameter-sensitive cache keys and configurable default TTL.
- Ensure cache failures are logged and bypassed without failing endpoint responses.

**Non-Goals:**
- Caching all endpoints (including `/results` and hierarchy lists).
- Invalidation on imports, cache warming, distributed locks, or background jobs.
- Endpoint-specific TTLs in V1.

## Decisions

1. Centralized cache service in core/services layer
- Decision: build one reusable cache abstraction (`get_json`, `set_json`) instead of endpoint-local cache calls.
- Rationale: avoids duplicated logic and keeps route handlers thin.
- Alternative considered: integrating raw Valkey calls in each service; rejected due to duplication and inconsistent failure handling.

2. Read-through strategy at service layer
- Decision: apply cache lookups and write-backs in service methods after key construction.
- Rationale: service layer has response-shape and parameter context while repositories stay DB-only.
- Alternative considered: repository-level caching; rejected because repositories should focus on SQL/data access.

3. Deterministic key builders per endpoint
- Decision: implement dedicated helper functions for each cached endpoint key format.
- Rationale: ensures stable cache identity and prevents collisions.
- Alternative considered: ad hoc formatted strings in each service; rejected due to maintainability risk.

4. Failure-tolerant cache policy
- Decision: treat Valkey errors as soft failures (log and continue with DB path).
- Rationale: cache must never become an availability dependency.
- Alternative considered: surfacing cache exceptions to clients; rejected due to reliability impact.

5. Config-driven enablement and TTL
- Decision: add `VALKEY_URL`, `CACHE_ENABLED`, and `CACHE_DEFAULT_TTL_SECONDS` settings; bypass cache entirely when disabled.
- Rationale: supports safe rollout and environment control without code changes.
- Alternative considered: hardcoded TTL and mandatory cache connection; rejected due to operational inflexibility.

## Risks / Trade-offs

- [Risk] Stale responses until TTL expiry.
  → Mitigation: keep TTL configurable and selective endpoint scope.

- [Risk] Cache key bugs could mix responses across parameter sets.
  → Mitigation: central key builders with explicit required parameter inputs and tests.

- [Risk] Valkey outages could add latency due to repeated fallback attempts.
  → Mitigation: short timeout configuration and graceful bypass logic.

## Migration Plan

1. Add cache settings and Valkey client initialization.
2. Add cache utility/service and key helper module.
3. Integrate read-through caching in selected service methods.
4. Add tests for cache hit/miss parity and fallback behavior.
5. Deploy with `CACHE_ENABLED=false` initially, then enable progressively.
6. Rollback by disabling cache via settings; endpoint behavior remains DB-backed.

## Open Questions

- Should hit/miss logging be debug-level only or include lightweight info-level counters?
- Should future changes introduce cache invalidation hooks after import completion?
