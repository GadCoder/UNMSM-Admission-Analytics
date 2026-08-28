# Web

React + TypeScript public web application for UNMSM Admission Analytics.

## Local setup

From this directory:

```bash
npm install
npm run dev
```

The API base URL defaults to `http://localhost:8000`. Set
`VITE_API_BASE_URL` when using another backend, for example:

```bash
VITE_API_BASE_URL=https://api.resultados-unmsm.com npm run dev
```

## Validation

```bash
npm test
npm run lint
npm run build
```

## Structure

- `src/app/`: application providers, router and shell.
- `src/pages/`: route-level composition only.
- `src/features/`: domain capabilities and their API hooks/components.
- `src/shared/`: reusable UI, API client, styles and pure utilities.
