# Project Context

## Overview

This project is a university admission analytics web application for UNMSM.

The system ingests and normalizes historical admission results collected from CSV files starting from 2024. The platform allows users to explore admission data by academic area, faculty, major, and admission process.

The backend is the source of truth for business logic and analytics, and the frontend provides a navigable analytics UI shell and reusable design system. The system is read-heavy and analytics-oriented.

## Product Goals

The product must support:

- browsing academic structure
- browsing admission processes
- searching candidate-level admission results
- analytics and rankings for admission entities
- historical trend exploration
- comparison workflows
- robust CSV ingestion and normalization

## Current Implementation Snapshot

Documentation linkage:

- Backend endpoint contract snapshot: `backend/ENDPOINTS_REPORT.md`
- Keep this section aligned with `backend/ENDPOINTS_REPORT.md` whenever endpoint capabilities change.

### Backend implemented

- health check endpoint
- academic structure read APIs (areas, faculties, majors, details)
- admission process read APIs (list, detail, overview)
- candidate results search API with filtering, sorting, and pagination
- major analytics API and major trends API (with metric allowlist)
- major rankings API (metric-based ranking with hierarchy filters)
- dashboard aggregate API domain (`/dashboard/overview`, `/dashboard/rankings`, `/dashboard/trends/applicants`, `/dashboard/trends/cutoff`)
- admission results CSV import API with file-level and row-level validation summaries
- repository + service separation across implemented domains
- Valkey cache foundation with cache key strategy and selective caching in process overview, major analytics, major trends, rankings, and dashboard aggregates
- automated endpoint and cache service tests

### Frontend implemented

- React + TypeScript + Vite app bootstrap
- app shell with sidebar/topbar layout and routing
- navigation routes: dashboard, explore, compare, rankings, results, trends, showcase
- reusable design system primitives/components (cards, tables, charts, filters, layout blocks)
- global filter feature model with URL-param serialization/parsing
- process and academic area filter options loaded from backend APIs
- API client foundation and system health check integration utility

### Not implemented yet

- backend exports workflow
- backend faculty/area analytics endpoints
- backend major comparison endpoint
- worker-driven async processing flows
- frontend pages wired end-to-end to all production backend analytics endpoints

## Domain Model

### Academic hierarchy

- AcademicArea
- Faculty
- Major

### Admission entities

- AdmissionProcess
- AdmissionStatus
- AdmissionResult

### Operational entities

- ImportBatch

### Optional later optimization

- MajorProcessStat

## Source Data

Raw source data comes from CSV files. Example fields include:

- code
- lastnames
- names
- major
- score
- merit
- observation

Raw CSV files are not queried directly for analytics. They are ingested, normalized, and stored in PostgreSQL.

## Architecture

This backend must follow a modular monolith architecture.

### Main technologies

- Python
- FastAPI
- PostgreSQL
- Valkey/Redis
- Alembic
- Pydantic
- SQLAlchemy
- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Axios
- S3-compatible object storage (planned)
- background worker backed by Valkey/Redis queue (planned)

### Deployment shape

- single VPS
- Dokploy
- Docker compose
- backend API
- worker
- PostgreSQL
- Redis

## Architecture Rules

- Use FastAPI for the HTTP API.
- Use PostgreSQL as the primary source of truth.
- Use Redis only for selective caching and async job coordination.
- Use S3-compatible storage for raw CSV uploads and exports.
- Organize code into clear layers:
  - api/routes
  - schemas
  - models
  - repositories
  - services
  - workers
  - core
  - utils
- Keep business logic out of route handlers.
- Keep SQL/query logic out of route handlers.
- Prefer repository + service separation.
- Use Alembic for database migrations.
- Use Pydantic schemas for request and response models.
- Design endpoints by business capability, not by raw table CRUD.
- Make the codebase easy to extend and test.
- use uv as the python project management tool

## API Domains

Current backend route groups:

- /health
- /areas
- /faculties
- /majors
- /processes
- /results
- /rankings
- /dashboard
- /imports

Notes:

- trends are currently exposed under `/majors/{major_id}/trends`
- `/exports` is not implemented yet

Current frontend route groups:

- /dashboard
- /explore
- /compare
- /rankings
- /results
- /trends
- /showcase

## V1 Functional Scope

### Academic structure

- list academic areas
- list faculties
- list majors
- filter faculties by area
- filter majors by faculty
- get area, faculty, and major details by id
- major analytics endpoint
- major trends endpoint with metric filtering

### Admission processes

- list admission processes
- retrieve process detail
- retrieve process overview

### Analytics

- major analytics
- rankings
- trends
- dashboard aggregates

Deferred in V1:

- faculty analytics
- area analytics
- major comparison

### Raw results

- search and filter candidate-level results
- support pagination and sorting

### Imports

- parse and ingest CSV rows
- normalize status values
- insert rows into PostgreSQL
- return import summary with row-level errors

### Exports

- export results to CSV
- support async large exports later

Current status:

- not implemented yet

## Non-Goals for V1

- no microservices
- no frontend rendering in backend
- no analytics directly from CSV files
- no overengineered authentication or authorization
- no premature optimization with many precomputed tables

## Performance Guidance

This system is read-heavy.

Prioritize:

- correct schema design
- proper indexing
- clean queries
- pagination
- selective Redis caching for expensive repeated endpoints

Good cache candidates:

- dashboard summary
- rankings
- major analytics
- faculty analytics
- process overview

Do not cache everything by default.

## Implementation Priorities

Completed:

1. bootstrap backend foundation
2. database config and base project structure
3. core domain models
4. Alembic migrations
5. academic structure endpoints
6. admission process endpoints
7. raw results search endpoint
8. major analytics service
9. major rankings and trends endpoints
10. CSV import workflow
11. frontend app bootstrap foundation
12. frontend app shell layout and navigation
13. frontend design-system foundation
14. frontend global filter system foundation

Next:

15. complete Valkey caching rollout policy for production configuration
16. export workflow
17. dashboard-oriented aggregations
18. faculty/area analytics and major comparison APIs
19. connect frontend analytics pages to live backend datasets end-to-end

## Coding Preferences

- prefer explicit, readable code
- prefer typed function signatures
- prefer small focused modules
- avoid large god classes and god services
- keep naming descriptive and domain-oriented
- return clean API response schemas
- avoid leaking ORM models directly from route handlers
- write code that is straightforward for a solo developer to maintain
