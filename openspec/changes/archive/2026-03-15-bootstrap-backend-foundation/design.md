## Context

The change establishes the first backend baseline for UNMSM admission analytics using FastAPI and Python. The current need is not domain behavior, but a stable architectural skeleton that standardizes service bootstrapping, environment-based configuration, modular routing, database wiring, and migrations so future features can be added without restructuring core foundations.

Constraints include:
- Configuration must be sourced from environment variables.
- Database concerns must be centralized in a dedicated core module.
- Routing must remain modular and scalable, avoiding monolithic endpoint files.
- Alembic must be initialized and aligned with ORM metadata for future schema evolution.
- Out-of-scope domain endpoints and analytics logic must not leak into this phase.

## Goals / Non-Goals

**Goals:**
- Provide a production-oriented FastAPI startup structure (app factory + entrypoint).
- Define a backend package layout aligned with modular-monolith growth.
- Centralize settings and database initialization in reusable `core` modules.
- Add a minimal operational endpoint (`GET /health`) for startup verification.
- Integrate Alembic as the migration foundation for subsequent model work.
- Keep boundaries clear so domain capabilities can be implemented incrementally.

**Non-Goals:**
- Implementing admission/business models or domain use cases.
- Building academic structure, admission process, or analytics endpoints.
- Integrating Redis, background job logic, or object storage adapters.
- Optimizing for distributed deployment or microservice decomposition.

## Decisions

1. FastAPI app factory with thin runtime entrypoint.
- Decision: Implement `create_app()` (or equivalent) and keep `main.py` minimal.
- Rationale: Supports testing, future environment-specific startup hooks, and clean separation between framework initialization and server runtime concerns.
- Alternative considered: Single global app object in one file.
  - Rejected because it becomes harder to test and tends to accumulate boot logic in an unstructured way.

2. Centralized settings via Pydantic-based environment loading.
- Decision: Place settings in `core/config` with typed fields, defaults where safe, and required values for sensitive/critical settings (e.g., database URL).
- Rationale: Enforces consistency and prevents ad hoc `os.getenv` usage across modules.
- Alternative considered: Reading environment variables directly in each module.
  - Rejected due to duplication, weaker validation, and harder maintainability.

3. Centralized DB wiring (`engine`, `sessionmaker`, ORM base) in `core/db`.
- Decision: Keep SQLAlchemy initialization and session lifecycle primitives in one module family.
- Rationale: Aligns with requirement for dedicated database core module and simplifies Alembic/env integration.
- Alternative considered: Keeping DB wiring in application entrypoint.
  - Rejected because it creates tight coupling and makes reuse in repositories/services cumbersome.

4. Modular router registration through a route package aggregator.
- Decision: Define route modules under `api/routes` and register them through a composed router function/module.
- Rationale: Avoids a giant endpoint file and provides explicit extension points for future domain routers.
- Alternative considered: Directly attaching all routes in `main.py`.
  - Rejected for poor scalability and high merge-conflict potential.

5. Health check as dedicated route module.
- Decision: Implement `GET /health` in its own route file and include it through router registration.
- Rationale: Keeps operational endpoints discoverable and follows the same modular composition pattern as business routes.
- Alternative considered: Inline health route in app bootstrap.
  - Rejected to preserve architectural consistency.

6. Alembic initialized early and wired to project metadata.
- Decision: Set up Alembic config/environment to import centralized DB configuration and ORM base metadata.
- Rationale: Prevents drift between migration tooling and runtime model metadata as domain models are introduced.
- Alternative considered: Postponing migration setup until first model.
  - Rejected because late setup usually causes avoidable restructuring and inconsistent conventions.

## Risks / Trade-offs

- [Risk] Early folder structure may need minor refactors once first domain modules arrive.  
  → Mitigation: Keep package boundaries coarse but explicit; avoid premature deep nesting.

- [Risk] Over-generalized settings model could introduce unnecessary complexity at bootstrap stage.  
  → Mitigation: Start with only required settings; expand fields alongside real capabilities.

- [Risk] Alembic environment misconfiguration can block future migrations.  
  → Mitigation: Validate migration command execution during bootstrap and document expected env vars.

- [Trade-off] App factory pattern adds slight upfront indirection.  
  → Mitigation: Maintain clear naming and minimal factory responsibilities.

- [Trade-off] Strict modular routing adds boilerplate early.  
  → Mitigation: Use a consistent router registration convention to keep additions low-friction.

## Migration Plan

1. Create backend package skeleton and empty `__init__.py` modules for planned package areas.
2. Implement core settings module and validate required environment variables at startup.
3. Implement database core module (engine/session/base) and reference it from app bootstrap.
4. Add router composition module and register `health` route.
5. Add FastAPI app factory + runtime entrypoint and confirm app boot.
6. Initialize Alembic and wire `env.py` to project ORM metadata/settings.
7. Add short backend bootstrap notes for local startup and migration commands.

Rollback strategy:
- If integration issues arise, remove or isolate new bootstrap wiring while preserving package scaffolding.
- Revert Alembic initialization files together with DB wiring changes to maintain consistency.

## Open Questions

- Should settings support multiple runtime profiles immediately (development/test/production) or remain single-profile for now?
- Which database dialect/driver is the first target for local development (e.g., PostgreSQL via `psycopg`)?
- Should the health endpoint include DB connectivity checks now, or remain process-only in this foundation phase?
