# major-hierarchy-context-response Specification

## Purpose
TBD - created by archiving change add-academic-structure-endpoints. Update Purpose after archive.
## Requirements
### Requirement: Major responses include hierarchy context
The system MUST include faculty and academic area context in major list and detail responses.

#### Scenario: Major list includes nested hierarchy objects
- **WHEN** `GET /majors` is requested
- **THEN** each major item includes `faculty` and `academic_area` nested objects with `id`, `name`, and `slug`

#### Scenario: Major detail includes nested hierarchy objects
- **WHEN** `GET /majors/{major_id}` is requested for an existing major
- **THEN** the returned major includes `faculty` and `academic_area` nested objects with `id`, `name`, and `slug`

### Requirement: Major base fields are preserved
The system SHALL return required major base attributes alongside hierarchy context.

#### Scenario: Major payload includes base fields
- **WHEN** a major resource is returned
- **THEN** it includes `id`, `name`, `slug`, and `is_active`

