## 1. i18n foundation and dependencies

- [x] 1.1 Add `i18next` and `react-i18next` dependencies in `frontend/package.json`.
- [x] 1.2 Create frontend i18n bootstrap module and register it at app startup.
- [x] 1.3 Configure supported locales (`es`, `en`) and set default/fallback locale to Spanish (`es`).

## 2. Locale resolution and persistence

- [x] 2.1 Implement locale resolution order: persisted preference -> supported browser locale -> `es`.
- [x] 2.2 Persist user-selected locale in client storage and restore it on reload.
- [x] 2.3 Add guard logic for invalid/unsupported stored locales to prevent broken initialization.

## 3. Translation resource structure

- [x] 3.1 Create locale resource directories for Spanish and English (for example `common`, `shell`, `admin` namespaces).
- [x] 3.2 Add baseline translation keys for shell navigation, top bar, shared actions, and admin labels/messages.
- [x] 3.3 Add fallback-safe handling for missing translation keys so UI never renders blank text.

## 4. Shell and shared component integration

- [x] 4.1 Add a shell-level language selector that switches between `es` and `en` at runtime.
- [x] 4.2 Replace app shell hard-coded navigation/top bar labels with translation keys.
- [x] 4.3 Update reusable design-system components to consume translated strings or translation keys instead of hard-coded copy.

## 5. Admin interface localization

- [x] 5.1 Localize admin catalog management labels, helper text, and action button text.
- [x] 5.2 Localize admin validation/domain error presentation for active locale.
- [x] 5.3 Localize bulk upload workflow text including guidance, statuses, and retry/cancel labels.

## 6. Verification and quality gates

- [x] 6.1 Add tests for locale resolution behavior, including Spanish default and persistence behavior.
- [x] 6.2 Add tests for runtime language switching without full page reload.
- [x] 6.3 Add translation key coverage validation between `es` and `en` resources.
- [x] 6.4 Run frontend lint/test/build and resolve any i18n-related regressions before merge.
