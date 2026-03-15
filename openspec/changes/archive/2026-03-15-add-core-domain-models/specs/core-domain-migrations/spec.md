## ADDED Requirements

### Requirement: ORM-to-migration parity for core domain
The system MUST provide Alembic migrations that create all core domain tables represented in ORM models.

#### Scenario: Core tables are present in migration
- **WHEN** the initial core domain migration is generated and applied
- **THEN** it creates `academic_areas`, `faculties`, `majors`, `admission_processes`, and `admission_results`

### Requirement: Constraints are enforced in migrations
The system SHALL encode primary keys, foreign keys, and unique constraints for the core domain in Alembic migrations.

#### Scenario: Hierarchy and result constraints exist in database
- **WHEN** migration is applied
- **THEN** hierarchy ownership and uniqueness constraints are created as defined by domain requirements

### Requirement: Read-heavy index strategy in migrations
The system SHALL create indexes for expected high-frequency query paths.

#### Scenario: Core hierarchy and result indexes exist
- **WHEN** migration is applied
- **THEN** indexes exist for `faculties.academic_area_id`, `majors.faculty_id`, `admission_results.admission_process_id`, `admission_results.major_id`, `admission_results.score`, `admission_results.candidate_code`, `admission_results.is_admitted`, and `(admission_process_id, major_id)`

### Requirement: PostgreSQL-friendly schema definitions
The system MUST generate schema and migration definitions that are compatible with PostgreSQL.

#### Scenario: Migration uses PostgreSQL-compatible types and constraints
- **WHEN** migration is reviewed for deployment
- **THEN** all columns, defaults, and constraints are valid for PostgreSQL execution
