# Frontend

React + TypeScript frontend for UNMSM Admission Analytics.

## Tech

- React 19
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Axios
- Recharts

## Requirements

- Node.js 20+
- pnpm 10+

## Setup

```bash
cd frontend
pnpm install
```

## Run Locally

```bash
cd frontend
pnpm dev
```

Default dev server: `http://localhost:5173`.

## Scripts

```bash
cd frontend
pnpm dev      # start Vite dev server
pnpm test     # run Vitest test suite
pnpm build    # type-check and production build
pnpm preview  # preview built app
pnpm lint     # run ESLint
```

## Feature Areas

- `src/pages/`: route-level pages
- `src/features/`: domain modules (dashboard, explore, compare, rankings, results, global filters)
- `src/components/design-system/`: reusable UI primitives and composed components
- `src/lib/api/`: shared API client utilities

## Notes

- Global process/area filters are URL-synced through the shared filter model.
- Data fetching uses TanStack Query with backend-driven pagination and filtering on analytics pages.
