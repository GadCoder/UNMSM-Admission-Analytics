## ADDED Requirements

### Requirement: Environment-driven backend settings
The system MUST load backend configuration from environment variables through a centralized, typed settings module.

#### Scenario: Required configuration is validated at startup
- **WHEN** the application loads configuration during startup
- **THEN** required settings are validated centrally and startup fails fast if mandatory values are missing or invalid

### Requirement: Centralized database initialization primitives
The system SHALL expose centralized database initialization primitives, including ORM base metadata and session/engine wiring, from dedicated core modules.

#### Scenario: Database primitives are consumed by application modules
- **WHEN** backend modules require persistence access or metadata references
- **THEN** they use shared database primitives from the centralized core database package instead of re-defining local connections
