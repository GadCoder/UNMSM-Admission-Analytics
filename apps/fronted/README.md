# Web

React + TypeScript public web application for UNMSM Admission Analytics.

## Local setup

From this directory:

```bash
corepack pnpm install
corepack pnpm run dev
```

The API base URL defaults to `http://localhost:8000`. Set
`VITE_API_BASE_URL` when using another backend, for example:

```bash
VITE_API_BASE_URL=https://api.resultados-unmsm.com corepack pnpm run dev
```

## Validation

```bash
corepack pnpm test
corepack pnpm run lint
corepack pnpm run build
```

## Structure

- `src/app/`: application providers, router and shell.
- `src/pages/`: route-level composition only.
- `src/features/`: domain capabilities and their API hooks/components.
- `src/shared/`: reusable UI, API client, styles and pure utilities.
