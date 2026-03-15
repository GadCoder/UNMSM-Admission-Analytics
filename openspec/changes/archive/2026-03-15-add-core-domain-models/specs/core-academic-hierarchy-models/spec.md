## ADDED Requirements

### Requirement: Academic hierarchy ownership
The system SHALL model the academic hierarchy such that each faculty belongs to exactly one academic area and each major belongs to exactly one faculty.

#### Scenario: Faculty is linked to one academic area
- **WHEN** a faculty record is stored
- **THEN** it includes a non-null foreign key to one academic area

#### Scenario: Major is linked to one faculty
- **WHEN** a major record is stored
- **THEN** it includes a non-null foreign key to one faculty

### Requirement: Hierarchy uniqueness constraints
The system MUST enforce unique values and scoped uniqueness for hierarchy identity fields.

#### Scenario: Academic area identity is unique
- **WHEN** academic areas are persisted
- **THEN** `name` and `slug` are each globally unique

#### Scenario: Faculty identity is unique within parent scope
- **WHEN** faculties are persisted under an academic area
- **THEN** `(academic_area_id, name)` is unique and `slug` is globally unique

#### Scenario: Major identity is unique within parent scope
- **WHEN** majors are persisted under a faculty
- **THEN** `(faculty_id, name)` is unique and `slug` is globally unique

### Requirement: Hierarchy lifecycle fields
The system SHALL include creation and update timestamps for hierarchy entities.

#### Scenario: Timestamps exist on hierarchy tables
- **WHEN** `AcademicArea`, `Faculty`, and `Major` tables are defined
- **THEN** each table includes `created_at` and `updated_at` fields
