# Project Context

## Overview

This project is a university admission analytics web application for UNMSM.

The system ingests and normalizes historical admission results collected from CSV files starting from 2024. The platform allows users to explore admission data by academic area, faculty, major, and admission process.

The backend is the source of truth for all business logic and analytics. The system is read-heavy and analytics-oriented.

## Product Goals

The backend must support:

- browsing academic structure
- browsing admission processes
- searching candidate-level admission results
- computing analytics for majors, faculties, academic areas, and processes
- comparing majors
- generating rankings
- exposing historical trends

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
- Redis
- Alembic
- Pydantic
- SQLAlchemy or SQLModel
- S3-compatible object storage
- background worker backed by Redis queue

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

Main route groups:

- /health
- /dashboard
- /processes
- /areas
- /faculties
- /majors
- /rankings
- /trends
- /results
- /imports
- /exports

## V1 Functional Scope

### Academic structure

- list academic areas
- list faculties
- list majors
- filter faculties by area
- filter majors by faculty

### Admission processes

- list admission processes
- retrieve process overview

### Analytics

- major analytics
- faculty analytics
- area analytics
- rankings
- trends
- major comparison

### Raw results

- search and filter candidate-level results
- support pagination and sorting

### Imports

- register source CSV files
- create import batches
- parse and ingest CSV rows
- normalize status values
- insert rows into PostgreSQL

### Exports

- export results to CSV
- support async large exports later

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

1. bootstrap backend foundation
2. database config and base project structure
3. core domain models
4. Alembic migrations
5. academic structure endpoints
6. admission process endpoints
7. raw results search endpoint
8. analytics services
9. rankings and trends
10. import workflow
11. Redis integration
12. export workflow

## Coding Preferences

- prefer explicit, readable code
- prefer typed function signatures
- prefer small focused modules
- avoid large god classes and god services
- keep naming descriptive and domain-oriented
- return clean API response schemas
- avoid leaking ORM models directly from route handlers
- write code that is straightforward for a solo developer to maintain
