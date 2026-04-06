## ADDED Requirements

### Requirement: Frontend SHALL provide centralized translation resources
The system SHALL define locale dictionaries and translation key lookup through a shared i18n boundary consumed by app and feature UI.

#### Scenario: Shared translation lookup is available
- **WHEN** a page or component needs user-facing copy
- **THEN** it SHALL resolve text through the shared translation API using keys instead of hardcoded literals

#### Scenario: Missing translation key fallback is deterministic
- **WHEN** a translation key is missing in the active locale
- **THEN** the system SHALL fall back to the default locale dictionary before returning a visible fallback value

### Requirement: Spanish SHALL be the default frontend locale
The system SHALL initialize runtime locale as Spanish (`es`) when no explicit user preference is present.

#### Scenario: First visit uses Spanish
- **WHEN** a user opens the app for the first time without a stored locale preference
- **THEN** rendered UI copy SHALL use Spanish translations by default

#### Scenario: Invalid locale preference falls back to Spanish
- **WHEN** stored or requested locale is unsupported
- **THEN** the runtime locale SHALL resolve to Spanish (`es`)

### Requirement: Runtime locale changes SHALL be supported and persisted
The system SHALL allow changing locale at runtime and persist the selected locale for subsequent visits.

#### Scenario: Locale switch updates rendered copy
- **WHEN** the user changes language from the UI language control
- **THEN** visible translatable text SHALL rerender using the selected locale without a full page reload

#### Scenario: Locale selection persists across reloads
- **WHEN** a user reloads the app after selecting a supported locale
- **THEN** the previous locale selection SHALL be restored and used for translation lookup

### Requirement: Core shell UI SHALL be localized through translation keys
The system SHALL migrate app-shell user-facing labels (navigation, top bar labels, and common shell copy) to translation keys backed by locale dictionaries.

#### Scenario: Shell navigation labels localize with selected locale
- **WHEN** the active locale changes
- **THEN** shell navigation labels SHALL display translations for the active locale

#### Scenario: Top-bar labels localize with selected locale
- **WHEN** the active locale changes
- **THEN** top-bar and global shell labels SHALL display translations for the active locale

### Requirement: i18n behavior SHALL be testable and regression-safe
The system SHALL include tests validating default locale behavior, runtime switching, persistence, and fallback handling.

#### Scenario: Default-locale test coverage exists
- **WHEN** frontend test suites run
- **THEN** tests SHALL verify Spanish is used as default when no preference exists

#### Scenario: Fallback behavior test coverage exists
- **WHEN** frontend test suites run against incomplete dictionaries
- **THEN** tests SHALL verify deterministic fallback to default-locale entries
