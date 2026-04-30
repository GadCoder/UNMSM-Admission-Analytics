## 1. i18n foundation and contracts

- [x] 1.1 Add `frontend/src/lib/i18n/` runtime primitives (supported locale registry, translator utility, fallback resolution, and exported i18n types).
- [x] 1.2 Add locale resource dictionaries with Spanish (`es`) as complete baseline and at least one secondary locale scaffold.
- [x] 1.3 Add missing-key handling behavior that resolves active locale -> default locale (`es`) -> explicit fallback token.

## 2. App bootstrap and persistence wiring

- [x] 2.1 Wire an i18n provider into root frontend provider composition so pages/components can access `locale`, `setLocale`, and translation lookup.
- [x] 2.2 Implement startup locale resolution with Spanish default when no valid preference exists.
- [x] 2.3 Persist locale selection in local storage and restore it on reload with validation against supported locales.

## 3. Shell localization and language switching

- [x] 3.1 Add a shell-level language switcher control in the app layout and connect it to runtime locale updates.
- [x] 3.2 Migrate shell navigation and top-bar user-facing labels from hardcoded copy to translation keys.
- [x] 3.3 Ensure locale changes rerender shell/core translatable text without full page reload.

## 4. Verification and regression safety

- [x] 4.1 Add/update frontend tests for Spanish default behavior, invalid-locale fallback, runtime switching, and persisted locale restoration.
- [x] 4.2 Add/update tests for missing translation key fallback behavior and deterministic output expectations.
- [x] 4.3 Run frontend verification (`pnpm test` and `pnpm build`) and document any follow-up gaps.

Follow-up gaps: Vite reports the main bundle is above the default chunk-size warning threshold; no functional blockers for i18n, but chunk splitting can be addressed in a separate performance pass.
