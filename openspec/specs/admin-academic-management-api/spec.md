# admin-academic-management-api Specification

## Purpose
Define admin APIs for managing academic areas, faculties, and majors with optimistic concurrency.

## Requirements
### Requirement: Admin academic area management endpoints
The system SHALL expose admin endpoints to create and update academic areas.

#### Scenario: Admin creates an academic area
- **WHEN** an authenticated admin submits valid area payload
- **THEN** the API creates the area and returns the created resource

#### Scenario: Duplicate area identity is rejected
- **WHEN** payload conflicts with existing unique constraints (for example name/slug)
- **THEN** the API returns validation error response and no area is created

### Requirement: Admin faculty management endpoints
The system SHALL expose admin endpoints to create and update faculties with area linkage validation.

#### Scenario: Admin creates faculty linked to area
- **WHEN** an authenticated admin submits valid faculty payload with existing `academic_area_id`
- **THEN** the API creates the faculty and returns the created resource

#### Scenario: Unknown academic area is rejected
- **WHEN** admin payload references non-existent `academic_area_id`
- **THEN** the API returns `404 Not Found`

### Requirement: Admin major management endpoints
The system SHALL expose admin endpoints to create and update majors with faculty linkage validation.

#### Scenario: Admin creates major linked to faculty
- **WHEN** an authenticated admin submits valid major payload with existing `faculty_id`
- **THEN** the API creates the major and returns the created resource

#### Scenario: Unknown faculty is rejected
- **WHEN** admin payload references non-existent `faculty_id`
- **THEN** the API returns `404 Not Found`

### Requirement: Optimistic concurrency for catalog updates
The system MUST prevent stale admin updates for areas, faculties, and majors using optimistic concurrency tokens.

#### Scenario: Stale update token is rejected
- **WHEN** an admin update request includes outdated version context
- **THEN** the API returns `409 Conflict` and does not apply the update

#### Scenario: Current update token allows update
- **WHEN** an admin update request includes current version context
- **THEN** the API applies the update and returns the updated resource
