## Why

The frontend currently hardcodes UI copy in a single language across pages and shared components, which makes content updates slow and prevents us from shipping a consistent multilingual experience. We need a centralized i18n foundation now so the product can default to Spanish while still supporting additional locales without duplicating UI logic.

## What Changes

- Add an application-level internationalization foundation for the frontend (message catalogs, translation lookup, and locale provider wiring).
- Set Spanish (`es`) as the default and fallback locale used on first load and when no explicit locale is selected.
- Add locale persistence so user language preference survives page reloads.
- Introduce a language switcher pattern in the app shell for changing locale at runtime.
- Migrate existing user-facing copy in core pages/components to translation keys and locale dictionaries.
- Add guardrails for missing keys/fallback behavior and tests to prevent regressions.

## Capabilities

### New Capabilities

- `frontend-internationalization-foundation`: Locale provider, translation resources, runtime language switching, and fallback behavior for frontend UI text.

### Modified Capabilities

- `frontend-app-shell-layout`: Add language selection entry point and ensure shell-level labels are localized.
- `frontend-app-bootstrap-foundation`: Initialize frontend runtime with Spanish default locale and persisted user preference handling.

## Impact

- Affected code: frontend app bootstrap, shell/navigation UI, shared UI primitives, and page-level copy currently rendered as hardcoded strings.
- New assets: locale dictionaries (starting with `es` as default plus at least one secondary locale scaffold).
- QA/testing: translation-key coverage checks, locale-switch behavior tests, and fallback validation for missing translations.
