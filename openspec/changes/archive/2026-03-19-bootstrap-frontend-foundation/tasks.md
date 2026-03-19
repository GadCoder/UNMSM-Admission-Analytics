## 1. Frontend Project Scaffold

- [x] 1.1 Create the frontend app scaffold under `/frontend` with React + TypeScript + Vite
- [x] 1.2 Add and validate baseline scripts for development build/start workflow
- [x] 1.3 Create initial scalable source structure under `/frontend/src` (`app`, `components`, `features`, `hooks`, `layouts`, `lib`, `pages`, `router`, `types`)

## 2. Styling and Theme Foundation

- [x] 2.1 Configure Tailwind CSS in the frontend project
- [x] 2.2 Extend Tailwind theme with design-system tokens (primary/semantic colors, radius, shadow)
- [x] 2.3 Configure Lexend font and apply it globally at the app stylesheet/root level

## 3. Application Runtime Infrastructure

- [x] 3.1 Configure React Router and define a placeholder base route/page
- [x] 3.2 Configure TanStack Query `QueryClient` and mount provider at app root
- [x] 3.3 Compose root providers in a dedicated app/provider bootstrap module

## 4. API and Environment Foundation

- [x] 4.1 Add a dedicated HTTP client dependency and implement centralized API client module under `src/lib/api`
- [x] 4.2 Add environment configuration for backend API base URL and frontend `.env.example`
- [x] 4.3 Ensure API client reads backend base URL from environment configuration
- [x] 4.4 Ensure feature code uses `src/lib/api` client helpers instead of direct `fetch` calls

## 5. Verification and Readiness

- [x] 5.1 Verify the frontend application boots successfully in development
- [x] 5.2 Verify placeholder route renders under router + query provider composition
- [x] 5.3 Validate foundational structure is ready for backend REST integration and future feature modules
