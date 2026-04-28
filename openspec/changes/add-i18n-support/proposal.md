## Why

The product currently ships with a single language experience, which limits usability for Spanish-speaking and English-speaking users in mixed academic and administrative contexts. Adding first-class i18n now enables broader adoption and prevents future feature work from hard-coding user-facing text.

## What Changes

- Introduce an application-level internationalization layer for frontend user-facing content.
- Add locale support for `en` (English) and `es` (Spanish) as the initial languages.
- Define locale selection behavior (default language, user switch, and persistence) for a consistent experience across sessions.
- Replace hard-coded UI strings in key screens and shared components with translation keys.
- Establish translation resource structure and conventions to support future language expansion without major refactors.

## Capabilities

### New Capabilities
- `frontend-internationalization`: Provides locale-aware rendering, translation key lookup, and language switching for frontend UI content with initial support for English and Spanish.

### Modified Capabilities
- `frontend-app-shell-layout`: Update shell-level behavior to expose language selection and apply the active locale across navigational and layout text.
- `frontend-design-system-components`: Update reusable components to consume translation keys for built-in labels, actions, and helper text.
- `frontend-admin-management-interface`: Update admin-facing pages to render translated user-visible text for the supported locales.

## Impact

- Affected code: frontend app bootstrap, shell layout, shared UI components, and admin-facing views.
- Dependencies: add or standardize on an i18n library/runtime for React and translation resource loading.
- APIs/systems: no backend API contract changes required for this phase.
- Process impact: feature teams will need to provide translation keys and `en`/`es` copy for new user-facing strings.
