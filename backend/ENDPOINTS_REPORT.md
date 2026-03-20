# Backend Endpoints Report

Base URL: `http://localhost:8000`  
Global API prefix: `""` (configurable with `api_prefix`)  
Auth at route layer: none configured

## Documentation Linkage

- Canonical project-level scope and roadmap: `openspec/project.md`
- This file is the route-level contract snapshot for implemented backend endpoints.
- When endpoint capabilities change, update this file and the `Current Implementation Snapshot`, `API Domains`, and `V1 Functional Scope` sections in `openspec/project.md` together.

## Endpoints

| Method | Path | Purpose | Key Inputs | Success | Common Errors |
|---|---|---|---|---|---|
| GET | `/health` | Health check | None | `200` | - |
| GET | `/areas` | List academic areas | None | `200` | - |
| GET | `/areas/{area_id}` | Get area by ID | `area_id` (path, int) | `200` | `404` not found |
| GET | `/faculties` | List faculties | `academic_area_id` (query, int, optional) | `200` | - |
| GET | `/faculties/{faculty_id}` | Get faculty by ID | `faculty_id` (path, int) | `200` | `404` not found |
| GET | `/majors` | List majors | `faculty_id` (query, int, optional), `academic_area_id` (query, int, optional) | `200` | - |
| GET | `/majors/{major_id}` | Get major by ID | `major_id` (path, int) | `200` | `404` not found |
| GET | `/majors/{major_id}/analytics` | Major KPI aggregates | `major_id` (path, int), `process_id` (query, int, optional) | `200` | `404` major not found |
| GET | `/majors/{major_id}/trends` | Major metrics over time | `major_id` (path, int), `metrics` (query, csv optional) | `200` | `404` major not found, `422` invalid metrics |
| GET | `/processes` | List admission processes | None | `200` | - |
| GET | `/processes/{process_id}` | Get process by ID | `process_id` (path, int) | `200` | `404` not found |
| GET | `/processes/{process_id}/overview` | Process-level aggregates | `process_id` (path, int) | `200` | `404` not found |
| GET | `/results` | Search admission results | Rich filters + paging + sorting (see below) | `200` | `422` validation errors |
| GET | `/rankings/majors` | Rank majors by metric | `process_id` (required), `metric` (required), optional hierarchy/sort/limit | `200` | `422` validation errors |
| POST | `/imports/results` | Import results CSV | Multipart form: `process_id` + `file` | `200` | `400` file validation, `404` unknown process, `422` form validation |

## Parameter Allowlists and Constraints

### `GET /majors/{major_id}/trends`

- `metrics` (comma-separated, optional) allows only:
  - `applicants`
  - `admitted`
  - `acceptance_rate`
  - `max_score`
  - `min_score`
  - `avg_score`
  - `median_score`
  - `cutoff_score`

### `GET /results`

- Filters:
  - `process_id`, `major_id`, `faculty_id`, `academic_area_id` (int, optional)
  - `candidate_code`, `candidate_name` (string, optional)
  - `score_min`, `score_max` (number, optional)
  - `is_admitted` (bool, optional)
- Pagination:
  - `page` (default `1`, min `1`)
  - `page_size` (default `50`, min `1`, max `100`)
- Sorting:
  - `sort_by`: `score`, `merit_rank`, `candidate_lastnames`, `candidate_names`
  - `sort_order`: `asc`, `desc`

### `GET /rankings/majors`

- Required:
  - `process_id` (int)
  - `metric`: `cutoff_score`, `acceptance_rate`, `applicants`, `admitted`
- Optional:
  - `sort_order`: `asc`, `desc` (default `desc`)
  - `academic_area_id` (int)
  - `faculty_id` (int)
  - `limit` (default `50`, min `1`, max `100`)

## Notes

- FastAPI docs are expected at `/docs`, `/redoc`, and `/openapi.json`.
- Route definitions are in `backend/app/api/routes/` and mounted in `backend/app/api/router.py`.
