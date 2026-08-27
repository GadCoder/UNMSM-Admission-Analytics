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
| Completed | 1. Monorepo foundation | Repository conventions, environment configuration, and PostgreSQL `compose.yml`. Application Dockerfiles will be added with their respective scaffolds. |
| Not started | 2. Backend scaffold | Django project, modular settings, DRF, API routing, and health endpoint. |
| Not started | 3. Domain model | Academic hierarchy, admission processes, modalities, results, migrations, and Django Admin. |
| Not started | 4. Initial API | Catalog and process resources plus a latest-process analytics overview. |
| Not started | 5. Web scaffold | React + TypeScript application, routing, and API-client foundation. |
| Not started | 6. CSV ingestion | Process replacement service and a thin Django management command. |
| Not started | 7. Quality baseline | Focused tests, setup documentation, and local container validation. |

## Working Agreement

- Update this document as milestones are started and completed.
- Keep the first iteration focused on foundations and core domain behavior.
- Defer caching, rate limiting, generated API clients, and exports until there
  is a concrete product need.
