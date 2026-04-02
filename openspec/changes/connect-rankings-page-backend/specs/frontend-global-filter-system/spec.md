## ADDED Requirements

### Requirement: Process-scoped analytics pages SHALL resolve latest-process fallback
The system SHALL provide a consistent latest-process fallback behavior for process-scoped analytics pages when `process_id` is absent.

#### Scenario: Rankings resolves latest process by default
- **WHEN** `/rankings` loads without `process_id` in URL query params
- **THEN** Rankings SHALL resolve and use the most recent available process as its default scope

#### Scenario: Explicit process selection overrides fallback
- **WHEN** `process_id` is present in URL query params
- **THEN** analytics pages SHALL use the explicit `process_id` and SHALL NOT replace it with fallback logic
