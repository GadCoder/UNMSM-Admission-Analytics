## Why

The project currently has no frontend baseline to consume the backend analytics APIs, which blocks all UI feature delivery. Establishing a standardized React + TypeScript foundation now prevents inconsistent setup decisions and enables fast, predictable implementation of upcoming pages and layouts.

## What Changes

- Scaffold a frontend application foundation using React, TypeScript, and Vite.
- Configure Tailwind CSS with design-system-aligned theme tokens (colors, radius, shadow, typography) from `openspec/design-system.md`.
- Configure Lexend as the global application font.
- Set up routing, root-level TanStack Query provider, and scalable app/provider composition.
- Add centralized API client and environment configuration for backend base URL.
- Establish a clean, scalable folder structure and a placeholder route that boots in development.

## Capabilities

### New Capabilities
- `frontend-app-bootstrap-foundation`: Frontend project bootstrap, runtime providers, theme/token setup, and API integration foundation for future UI work.

### Modified Capabilities
- None.

## Impact

- Adds a new frontend workspace/app scaffold and foundational source structure.
- Introduces frontend toolchain dependencies (React, Vite, Tailwind, Router, TanStack Query).
- Introduces initial environment contract for frontend-to-backend API communication.
- Defines design-system token mapping to keep future UI implementation consistent.
