## ADDED Requirements

### Requirement: Compare page SHALL load selectable majors from backend scope
The system SHALL populate Compare entity options from backend major data and apply active global filter scope.

#### Scenario: Compare loads major options
- **WHEN** a user opens `/compare`
- **THEN** the entity selector SHALL load major options from backend data instead of static hardcoded values

#### Scenario: Compare major options follow academic area scope
- **WHEN** `academic_area_id` is selected in global filters
- **THEN** Compare major options SHALL be limited to majors in that academic area scope

### Requirement: Compare page SHALL render real side-by-side metrics
The system SHALL compute and render comparison rows using backend analytics/trend responses for each selected major.

#### Scenario: Compare renders analytics metrics
- **WHEN** one or more majors are selected
- **THEN** the comparison table SHALL show applicants, admitted, and acceptance metrics from backend analytics data for each selected major

#### Scenario: Compare renders trend direction context
- **WHEN** one or more majors are selected
- **THEN** the comparison table SHALL show trend context derived from backend major trend history for each selected major

### Requirement: Compare page SHALL apply process scope to analytics requests
The system SHALL use selected `process_id` from global filters when requesting per-major analytics for comparison.

#### Scenario: Process filter scopes compare analytics
- **WHEN** a process is selected in global filters and majors are selected in Compare
- **THEN** each compare analytics request SHALL include that selected `process_id`

### Requirement: Compare page SHALL provide resilient selection and async states
The system SHALL provide actionable states for empty selection, loading, and partial request failure during comparison.

#### Scenario: Empty compare selection guidance
- **WHEN** no majors are selected in Compare
- **THEN** the page SHALL show a clear prompt to select entities before comparison rows are rendered

#### Scenario: Partial compare failure tolerance
- **WHEN** one selected major request fails while others succeed
- **THEN** Compare SHALL keep successful entity data visible and indicate unavailable cells for the failed entity instead of failing the full table

### Requirement: Compare page SHALL limit concurrent entity selection
The system SHALL enforce a bounded maximum number of simultaneously selected compare entities.

#### Scenario: Compare selection limit reached
- **WHEN** a user attempts to select more than the allowed maximum entity count
- **THEN** the system SHALL prevent adding additional entities and show clear feedback that the compare limit was reached
