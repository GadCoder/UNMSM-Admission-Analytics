# Implementation Plan

This document tracks the initial scaffolding and implementation of UNMSM
Admission Analytics.

## Project Understanding

- The project is an open-source monorepo with a React public web application
  and a Django REST Framework backend backed by PostgreSQL.
- Django Admin is the internal management interface; a separate admin frontend
  is out of scope.
- The backend follows a domain-oriented modular-monolith structure:
  `academics`, `admission_processes`, `results`, `analytics`, `ingestion`, and
  `exports`.
- Historical CSV files are imported through Django management commands. Web
  scraping is out of scope.
- Core domain rules include exact decimal scores, `absent` results with no
  score, merit orders scoped to a major within a process, and admission
  processes represented by separate year and sequence fields.

## Milestones

| Status | Milestone | Deliverables |
| --- | --- | --- |
| Completed | 1. Monorepo foundation | Repository conventions, environment configuration, and PostgreSQL `compose.yml`. |
| Completed | 2. Backend scaffold | Django project, modular settings, DRF, API routing, health endpoint, dependency management, and a backend container. |
| Completed | 3. Domain model | Academic hierarchy, admission processes, modalities, results, migrations, and Django Admin. |
| Completed | 4. Initial API | Catalog and process resources plus a latest-process analytics overview. |
| Completed | 5. CSV ingestion | Mixed-schema parser, canonical taxonomy resolver, transactional process replacement, and management command. Complete processes from 2024 through 2026 are loaded; 2020, 2022, and 2023 remain excluded because their source data is incomplete. |
| Completed | 6. Web scaffold | React + TypeScript application, routing, API-client foundation, and containerized frontend. |
| In progress | 7. Analytics dashboard | Connect the frontend to real process/catalog/analytics endpoints; implement process selection, dashboard cards, charts, comparison views, responsive layout, and loading/error/empty states. |
| Pending | 8. Quality baseline | Frontend tests, accessibility checks, local container validation, API smoke tests, and setup documentation. |
| Deferred | 9. Candidate search | Results listing/search endpoint, pagination, candidate lookup, and detailed result views. Implement only when candidate-level querying becomes a product priority. |

## Current Priority

The product priority is comparative admission analytics, not candidate lookup. The next implementation slice is the public dashboard: process selection, historical comparisons, academic breakdowns, and clear visual storytelling over the imported data. Candidate search and a general `/results/` endpoint are deliberately deferred and should not block dashboard delivery.

## Working Agreement

- Update this document as milestones are started and completed.
- Keep the first iteration focused on foundations and core domain behavior.
- Defer caching, rate limiting, generated API clients, and exports until there
  is a concrete product need.
