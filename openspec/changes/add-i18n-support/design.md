## Context

The frontend currently renders most user-facing strings as hardcoded literals, which couples language content to component code and makes localization expensive to maintain. We already have a React + TypeScript bootstrap with shared provider composition and shell-level UI boundaries, so this change can introduce i18n at the app foundation and progressively migrate shell/core copy to translation keys.

This v1 i18n scope is frontend-only and prioritizes correctness and developer ergonomics: deterministic default locale (`es`), runtime switching, persistent preference, and safe fallback behavior when locale resources are incomplete.

## Goals / Non-Goals

**Goals:**

- Add a centralized i18n boundary (provider + lookup API + locale dictionaries) for frontend UI text.
- Set Spanish (`es`) as default and fallback locale when preference is missing or invalid.
- Support runtime locale switching from the app shell and persist user preference across reloads.
- Migrate shell-level labels and other core copy from hardcoded strings to translation keys.
- Add regression-safe tests for defaulting, switching, persistence, and missing-key fallback.

**Non-Goals:**

- Full translation migration of every page and feature in one pass.
- Backend-driven locale management, user profile locale sync, or server-side translation rendering.
- Introducing ICU-style advanced formatting (pluralization/select rules) beyond simple key-value lookup in v1.
- Redesigning shell layout or changing existing navigation IA.

## Decisions

### Decision 1: Introduce a lightweight i18n runtime in app providers

- **Choice:** Add an i18n provider to root provider composition that exposes `locale`, `setLocale`, and `t(key)` APIs.
- **Rationale:** Keeps translation concerns centralized and avoids ad hoc per-feature state or utility duplication.
- **Alternatives considered:**
  - Import dictionary objects directly in components.
  - **Rejected:** scatters locale logic and makes runtime switching/persistence difficult.

### Decision 2: Spanish-first locale model with strict supported-locale guard

- **Choice:** Use a supported locale allowlist (starting with `es` + one secondary scaffold locale) and resolve invalid/missing values to `es`.
- **Rationale:** Guarantees deterministic startup behavior and satisfies the requirement that Spanish is always default.
- **Alternatives considered:**
  - Browser-language autodetect as primary default.
  - **Rejected:** can violate explicit Spanish-default product requirement.

### Decision 3: Persist locale in local storage with safe hydration

- **Choice:** Store selected locale in local storage and hydrate during app bootstrap/provider init.
- **Rationale:** Simple client-side persistence with no backend dependency and good UX across reloads.
- **Alternatives considered:**
  - URL query parameter as primary persistence mechanism.
  - **Rejected:** noisy URLs and weaker global preference semantics for this phase.

### Decision 4: Translation resources organized by feature namespaces

- **Choice:** Structure locale files with stable namespaces (for example: `common`, `shell`, `dashboard`) and dot-notation keys.
- **Rationale:** Improves maintainability as dictionaries grow and avoids key collisions across features.
- **Alternatives considered:**
  - Single flat dictionary per locale.
  - **Rejected:** becomes hard to navigate and review at scale.

### Decision 5: Fallback strategy is default-locale entry, then explicit key token

- **Choice:** Resolve `t(key)` by active locale first, then default locale (`es`), and finally return an explicit fallback token when unresolved.
- **Rationale:** Prevents blank UI text and makes missing keys visible during development/testing.
- **Alternatives considered:**
  - Return empty string on missing key.
  - **Rejected:** hides defects and hurts usability.

### Decision 6: Start migration at shell/core surfaces before feature-by-feature rollout

- **Choice:** Localize shell navigation/topbar labels and shared core copy first; leave deeper feature copy for follow-up tasks if not in critical path.
- **Rationale:** Delivers visible multilingual behavior quickly with lower migration risk.
- **Alternatives considered:**
  - Big-bang translation migration of all pages.
  - **Rejected:** high churn and higher regression probability.

## Risks / Trade-offs

- [Risk] Incomplete dictionaries can leak fallback tokens into UI. → Mitigation: test coverage for key paths and targeted QA on shell routes.
- [Risk] Key naming inconsistency over time can degrade maintainability. → Mitigation: enforce namespace conventions and add code review checklist for new keys.
- [Trade-off] Local storage persistence is client-only and not profile-synced. → Mitigation: keep provider API extensible for later backend/user-preference integration.
- [Trade-off] Lightweight key-value i18n avoids complexity but limits advanced formatting. → Mitigation: defer ICU formatting until product requirements demand it.

## Migration Plan

1. Add i18n module (types, locale registry, dictionary loader, translator utility).
2. Wire i18n provider into root app bootstrap/provider composition.
3. Implement locale persistence and safe startup resolution with Spanish default.
4. Add shell language-switch control and connect it to provider `setLocale`.
5. Migrate shell/topbar/common copy to translation keys in locale dictionaries.
6. Add tests for default locale, invalid-locale fallback, runtime switching, and persisted preference restore.

Rollback strategy: remove provider wiring and shell language control, restore existing hardcoded strings, and keep bootstrap/provider tree otherwise unchanged.
