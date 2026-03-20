## ADDED Requirements

### Requirement: Global filter model SHALL define shared analytics filters

The system SHALL define a reusable global filter model for analytics pages that includes `process_id` and `academic_area_id` as optional selected values.

#### Scenario: Filter model initializes with no query params

- **WHEN** an analytics page loads without `process_id` or `academic_area_id` in the URL
- **THEN** the filter model SHALL represent both filters as unset default values

#### Scenario: Filter model initializes from URL query params

- **WHEN** an analytics page loads with `process_id` and/or `academic_area_id` in the URL
- **THEN** the filter model SHALL initialize selected values from those query params

### Requirement: Global filter state SHALL synchronize with URL query parameters

The system SHALL keep global filter state synchronized with URL query parameters using `process_id` and `academic_area_id`.

#### Scenario: UI update changes URL

- **WHEN** a user changes process or academic area in the filter UI
- **THEN** the URL query parameters SHALL be updated to reflect the selected values

#### Scenario: Browser refresh preserves selected filters

- **WHEN** the user refreshes the page while `process_id` and/or `academic_area_id` are present in the URL
- **THEN** the filter state and UI SHALL restore the same selections after reload

### Requirement: Reset action SHALL clear managed filters

The system SHALL provide a reset action that clears global filter selections and returns the managed query params to the default unfiltered state.

#### Scenario: Reset from filtered state

- **WHEN** a user triggers reset while at least one global filter is selected
- **THEN** the system SHALL clear selected filter values and remove or cleanly reset `process_id` and `academic_area_id` in the URL

#### Scenario: Reset preserves unrelated query params

- **WHEN** a user triggers reset on a page URL that also includes unrelated query parameters
- **THEN** the system SHALL only clear managed global filter params and SHALL preserve unrelated query parameters

### Requirement: Global filter bar SHALL be reusable across analytics pages

The system SHALL provide a reusable `GlobalFilterBar` component that can be embedded in multiple analytics pages without page-specific filter logic changes.

#### Scenario: Filter bar exposes required controls

- **WHEN** `GlobalFilterBar` is rendered
- **THEN** it SHALL render a process selector, an academic area selector, and a reset action

#### Scenario: Page consumes shared filter outputs

- **WHEN** an analytics page integrates the shared filter system
- **THEN** the page SHALL be able to read selected filter values and invoke update/reset methods through reusable hooks/helpers

### Requirement: Filter options SHALL be loaded from backend data sources

The system SHALL load process options from `GET /processes` and academic area options from `GET /areas` through reusable frontend data hooks.

#### Scenario: Process options load successfully

- **WHEN** the process data hook retrieves backend data successfully
- **THEN** the process selector SHALL display options derived from `GET /processes`

#### Scenario: Academic area options load successfully

- **WHEN** the academic area data hook retrieves backend data successfully
- **THEN** the academic area selector SHALL display options derived from `GET /areas`

### Requirement: Global filter UI SHALL follow system design standards

The `GlobalFilterBar` UI SHALL align with `openspec/design-system.md` for container treatment, spacing, readable labels, and consistent analytical control styling.

#### Scenario: Visual structure follows design system

- **WHEN** the filter bar is rendered on an analytics page
- **THEN** it SHALL use the design-system-aligned container style, spacing rhythm, and control hierarchy defined for global filters

#### Scenario: Reusable styling consistency across pages

- **WHEN** the same filter bar is used in dashboard, rankings, and trends pages
- **THEN** the filter UI SHALL preserve consistent visual behavior and styling without page-specific divergence
