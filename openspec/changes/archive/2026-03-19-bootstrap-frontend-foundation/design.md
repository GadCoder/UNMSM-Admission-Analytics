## Context

The backend API foundation already exists, but there is no frontend runtime, build pipeline, or UI infrastructure in this repository. Upcoming work (layout shell, dashboard pages, and analytics flows) depends on a stable frontend baseline with shared providers, design-system tokenization, and a predictable folder structure. The design system source of truth is `openspec/design-system.md`, including palette, typography (Lexend), spacing conventions, radius, and shadow language.

## Goals / Non-Goals

**Goals:**

- Establish a production-ready frontend foundation using React, TypeScript, and Vite.
- Configure Tailwind CSS and encode core design tokens from the design system.
- Provide root infrastructure for routing, server-state management, and API communication.
- Define scalable project structure and app/provider composition for future feature modules.
- Ensure local developer bootstrap is straightforward via environment-based API base URL.

**Non-Goals:**

- Implement dashboard, explorer, comparison, or trends UI pages.
- Implement full navigation shell (sidebar/topbar) and feature-specific components.
- Implement authentication, authorization, or session management.
- Implement endpoint-specific data fetching flows beyond base API client plumbing.

## Decisions

### Decision: Use Vite + React + TypeScript as the frontend baseline

- Rationale: Fast local startup, simple configuration, and strong compatibility with Tailwind, React Router, and TanStack Query.
- Alternative considered: Next.js. Rejected for now because SSR/routing conventions are unnecessary for this foundation-only scope.

### Decision: Introduce Tailwind theme tokens mapped to `openspec/design-system.md`

- Rationale: Captures visual rules centrally at the utility layer so future components remain consistent without repeating hard-coded values.
- Alternative considered: Plain CSS variables only. Rejected because Tailwind token integration better supports rapid UI development while still allowing CSS variable layering later.

### Decision: Configure Lexend as global app typography at root stylesheet level

- Rationale: Ensures all pages/components inherit consistent typography immediately and avoids per-component font drift.
- Alternative considered: Component-scoped font declarations. Rejected due to inconsistency risk and maintenance overhead.

### Decision: Add root provider composition (Router + QueryClient) in app bootstrap

- Rationale: Keeps entrypoint clean and guarantees all routes have consistent access to navigation and async state infrastructure.
- Alternative considered: Feature-level provider mounting. Rejected because it introduces duplicated setup and fragmented behavior.

### Decision: Centralize API communication under `src/lib/api/*` with environment-driven base URL

- Rationale: Establishes one integration seam for backend communication and future cross-cutting concerns (headers, error normalization, retries).
- Implementation direction: Adopt a dedicated HTTP client from the start and expose project-specific API helpers through `src/lib/api/*`.
- Alternative considered: Standardized `fetch` wrappers. Rejected to avoid rework and to start with stronger client ergonomics/interceptors/policies immediately.

### Decision: Create modular folder structure (`app`, `router`, `lib`, `features`, etc.)

- Rationale: Prepares for growth while keeping foundational concerns separated from feature code.
- Alternative considered: Flat `src/` structure. Rejected because it does not scale well as pages and feature modules expand.

## Risks / Trade-offs

- [Risk] Token names diverge from future design updates -> Mitigation: keep token mapping explicit and centralized in Tailwind config for low-friction updates.
- [Risk] Over-structuring too early could slow simple changes -> Mitigation: limit the foundation to minimal but stable seams (providers, API client, routing).
- [Risk] Missing backend URL configuration causes runtime failures -> Mitigation: ship `.env.example` with required variables and safe local defaults.
- [Risk] Query client defaults may not match future performance goals -> Mitigation: start with conservative defaults and tune when real usage patterns emerge.

## Migration Plan

1. Generate frontend scaffold and dependency baseline.
2. Add Tailwind + theme token extension + Lexend integration.
3. Add provider composition (Router and QueryClient) and placeholder route.
4. Add centralized API client and environment configuration contract.
5. Verify app starts in development and document startup expectations.

Rollback strategy: remove frontend scaffold directory and related dependency/config files from the change if needed; no backend schema/data migration is involved.

## Open Questions

- Resolved: Frontend will live under `/frontend`.
- Resolved: Use a dedicated HTTP client from day one, with `lib/api` kept as the stable feature-facing boundary.
