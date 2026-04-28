## Context

The frontend is a Vite + React application with shared shell and design-system components used across admin and analytics views. User-facing copy is currently hard-coded, which makes bilingual delivery expensive and error-prone.

This change introduces a cross-cutting i18n foundation for the frontend with two initial locales: Spanish (`es`) and English (`en`). Per product direction, Spanish must be the default locale for first-time visitors.

Constraints:
- Keep scope limited to frontend rendering and localization resources.
- Avoid backend/API contract changes for this phase.
- Ensure new copy paths are easy to extend to additional locales later.

## Goals / Non-Goals

**Goals:**
- Provide a single i18n runtime and translation loading strategy for the React app.
- Make `es` the default language when there is no prior user preference.
- Allow users to switch between `es` and `en` from the app shell.
- Persist user language preference across sessions.
- Replace hard-coded strings in shell, shared components, and admin interfaces with translation keys.

**Non-Goals:**
- Full localization of every existing screen in one pass.
- Regional variants (for example, `es-PE` or `en-US`) in this initial rollout.
- Server-side locale negotiation or backend-managed translation payloads.
- Runtime machine translation.

## Decisions

1. Adopt `react-i18next` + `i18next` for frontend localization runtime.
   - Rationale: Mature React integration, namespaced resources, interpolation/pluralization support, and a low-friction migration path from hard-coded strings.
   - Alternatives considered:
     - `react-intl`: strong ICU tooling, but less convenient for incremental key migration in this codebase.
     - Custom context-based dictionary: simpler initially, but weak pluralization/interpolation support and higher long-term maintenance cost.

2. Set default locale to Spanish (`es`) and support explicit user override.
   - Resolution order:
     - Saved user preference from local storage (if valid).
     - Browser language if it matches supported locales (`es` or `en`).
     - Fallback to `es`.
   - Rationale: Honors explicit user choices while keeping Spanish as the product default.
   - Alternatives considered:
     - Always force `es`: simpler but ignores user/browser intent.
     - Browser-first with `en` fallback: conflicts with product requirement for Spanish default.

3. Store translation resources as static JSON files with feature-oriented namespaces.
   - Structure example: `locales/es/common.json`, `locales/es/admin.json`, mirrored for `en`.
   - Rationale: Keeps ownership clear by domain and enables gradual rollout.
   - Alternatives considered:
     - Single monolithic locale file per language: easier initially, but scales poorly and increases merge conflicts.

4. Expose language switching through a shell-level selector and app-wide provider.
   - Rationale: Ensures locale changes propagate consistently across routes and shared components.
   - Alternatives considered:
     - Per-page language controls: fragmented UX and duplicate logic.

5. Enforce key-based text usage for reusable components.
   - Rationale: Prevents regressions into hard-coded strings and keeps components locale-agnostic.
   - Alternatives considered:
     - Allow mixed key/raw string usage indefinitely: faster short-term but inconsistent and difficult to audit.

## Risks / Trade-offs

- [Incomplete migration leaves mixed-language UI] -> Prioritize shell + shared components + admin views in first rollout and track remaining screens as follow-up tasks.
- [Translation key drift between `es` and `en`] -> Add a lightweight validation check in CI/test scripts to detect missing keys.
- [Language switch causes visible re-render churn] -> Keep namespace loading predictable and preload core namespaces (`common`, `shell`) at bootstrap.
- [Terminology inconsistency across modules] -> Define a small glossary for recurring academic/admin terms and reuse shared keys.

## Migration Plan

1. Add i18n dependencies and initialize provider at frontend bootstrap.
2. Create locale resource directories for `es` and `en` with initial namespaces.
3. Implement locale resolution and persistence strategy with default fallback to `es`.
4. Add shell language selector and wire locale change actions.
5. Migrate shell labels, design-system built-in text, and admin page copy to translation keys.
6. Add tests/checks for locale resolution, selector behavior, and translation key coverage.
7. Roll out behind normal release flow (no data migration required).

Rollback strategy:
- Revert to previous frontend build if severe localization issues appear.
- Keep fallback language fixed to `es` to avoid blank text when a key is missing.

## Open Questions

- Should language preference be stored only in local storage, or also mirrored in user profile settings once authenticated profile APIs are available?
- Which domain should own translation review/approval for Spanish and English copy quality?
- Do we want to reserve namespace conventions now for analytics-specific modules to avoid future reshuffling?
