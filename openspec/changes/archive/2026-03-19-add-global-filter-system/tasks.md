## 1. Shared Filter State and URL Sync Foundation

- [x] 1.1 Define shared global filter types/constants for `process_id` and `academic_area_id`.
- [x] 1.2 Implement query param parse/serialize helpers for global filters with normalized empty-state handling.
- [x] 1.3 Implement reusable filter state hook/utility to read current filter values from URL.
- [x] 1.4 Implement reusable update methods that write filter changes back to URL query params.
- [x] 1.5 Implement reset method that clears managed filter params while preserving unrelated query params.

## 2. Backend-Backed Filter Option Data Hooks

- [x] 2.1 Create process options data hook wired to backend `GET /processes` and map response to selector options.
- [x] 2.2 Create academic area options data hook wired to backend `GET /areas` and map response to selector options.
- [x] 2.3 Add loading/error-safe outputs needed by reusable select controls.

## 3. Reusable Global Filter UI Components

- [x] 3.1 Build reusable process selector component integrated with shared filter state and process options hook.
- [x] 3.2 Build reusable academic area selector component integrated with shared filter state and area options hook.
- [x] 3.3 Build reusable reset control that triggers shared filter reset behavior.
- [x] 3.4 Compose selectors and reset action into `GlobalFilterBar` with design-system-aligned spacing, hierarchy, and container treatment.

## 4. Analytics Page Integration and Validation

- [x] 4.1 Integrate `GlobalFilterBar` into the target analytics page entry point using shared hook outputs.
- [x] 4.2 Ensure page-level consumers can read selected process and academic area IDs through reusable filter APIs.
- [x] 4.3 Verify URL initialization, UI-to-URL updates, refresh persistence, and reset behavior end-to-end.
- [x] 4.4 Add or update tests for query sync helpers and core filter state behavior.
