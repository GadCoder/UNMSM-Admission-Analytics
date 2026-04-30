## ADDED Requirements

### Requirement: Frontend locale support and defaults
The system SHALL support two frontend locales, Spanish (`es`) and English (`en`), and MUST use Spanish (`es`) as the default locale when no valid preference is available.

#### Scenario: First visit uses Spanish default
- **WHEN** a user opens the application for the first time without a saved language preference
- **THEN** the UI renders in Spanish (`es`)

#### Scenario: Unsupported browser locale falls back to Spanish
- **WHEN** a user's browser language is not one of the supported locales
- **THEN** the application resolves the active locale to Spanish (`es`)

### Requirement: Locale resolution priority
The system SHALL resolve the active locale in this priority order: stored user preference, supported browser locale, then default Spanish (`es`).

#### Scenario: Stored preference takes priority
- **WHEN** a stored locale preference exists and is one of `es` or `en`
- **THEN** the application uses the stored preference regardless of browser locale

### Requirement: User language switching
The system SHALL provide a language switch action that allows users to change the active locale between `es` and `en` at runtime.

#### Scenario: Runtime switch updates visible text
- **WHEN** a user changes language from Spanish to English or from English to Spanish
- **THEN** visible translatable UI text updates to the selected locale without requiring a full page reload

### Requirement: Locale preference persistence
The system SHALL persist user-selected locale in client storage and reuse it across browser sessions.

#### Scenario: Selected locale persists across sessions
- **WHEN** a user selects English and later reopens the application
- **THEN** the application initializes using English from persisted preference

### Requirement: Translation key resolution and fallback
The system SHALL resolve UI strings through translation keys and MUST fall back safely when a key is missing in the active locale.

#### Scenario: Missing key in English falls back to Spanish
- **WHEN** the active locale is English and a translation key is absent in English resources but present in Spanish resources
- **THEN** the UI renders the Spanish translation for that key instead of empty text
