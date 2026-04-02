## ADDED Requirements

### Requirement: Results page SHALL adopt shared global filter contract
The system SHALL treat `process_id` and `academic_area_id` as the only shared URL-synced filter parameters for `/results` in v1.

#### Scenario: Results consumes shared global filter values
- **WHEN** `/results` renders with shared global filter state
- **THEN** Results data requests SHALL read scope from `process_id` and `academic_area_id`

#### Scenario: Results preserves global-filter-only URL contract
- **WHEN** Results interactions update page-local state such as search text, page number, or sorting
- **THEN** the URL synchronization contract SHALL remain limited to shared global filters and SHALL NOT require URL persistence of page-local params in v1

### Requirement: Process-scoped analytics pages SHALL resolve latest-process fallback
The system SHALL provide consistent latest-process fallback behavior for process-scoped analytics pages, including `/results`, when `process_id` is absent.

#### Scenario: Results resolves latest process by default
- **WHEN** `/results` loads without `process_id` in URL query params
- **THEN** Results SHALL resolve and use the most recent available process as default scope

#### Scenario: Explicit process selection overrides fallback
- **WHEN** `process_id` is present in URL query params for `/results`
- **THEN** Results SHALL use the explicit `process_id` and SHALL NOT replace it with fallback logic
