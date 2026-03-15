## ADDED Requirements

### Requirement: Faculty listing filter by academic area
The system SHALL support optional filtering of faculty listings by `academic_area_id`.

#### Scenario: Faculties filtered by academic area
- **WHEN** `GET /faculties?academic_area_id=<id>` is requested
- **THEN** only faculties belonging to the specified academic area are returned

### Requirement: Major listing filters by hierarchy level
The system SHALL support optional filtering of major listings by `faculty_id` and `academic_area_id`.

#### Scenario: Majors filtered by faculty
- **WHEN** `GET /majors?faculty_id=<id>` is requested
- **THEN** only majors belonging to the specified faculty are returned

#### Scenario: Majors filtered by academic area
- **WHEN** `GET /majors?academic_area_id=<id>` is requested
- **THEN** only majors under faculties within the specified academic area are returned

#### Scenario: Majors filtered by combined criteria
- **WHEN** `GET /majors` is requested with both `faculty_id` and `academic_area_id`
- **THEN** only majors matching both filters are returned
