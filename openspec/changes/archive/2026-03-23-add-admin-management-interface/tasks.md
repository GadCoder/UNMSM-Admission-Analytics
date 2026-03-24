## 1. Data Model and Configuration Foundations

- [x] 1.1 Add persistence models and migration for `import_batches`, `import_batch_items`, and `import_source_files` with foreign keys and lifecycle timestamps
- [x] 1.2 Add indexes and constraints for batch lookup, item status filtering, and source-file `(admission_process_id, major_id)` query patterns
- [x] 1.3 Add settings for bulk-upload limits (`max_files_per_batch`, file size, total batch size), worker concurrency, and retention windows
- [x] 1.4 Add S3 storage configuration for backend-proxy upload path and canonical object storage

## 2. Admin Authentication and Authorization

- [x] 2.1 Implement admin login endpoint that returns JWT access tokens for valid admin credentials
- [x] 2.2 Implement backend auth dependency/middleware to validate JWT and enforce admin role on protected routes
- [x] 2.3 Protect admin write endpoints and import orchestration endpoints with admin guard semantics (`401`/`403` behavior)
- [x] 2.4 Add frontend admin auth state handling (token storage, session restore, logout) and `/admin/*` route guard

## 3. Admin Academic Catalog Management APIs

- [x] 3.1 Add admin create/update APIs for academic areas with unique-validation error mapping
- [x] 3.2 Add admin create/update APIs for faculties with `academic_area_id` existence and linkage validation
- [x] 3.3 Add admin create/update APIs for majors with `faculty_id` existence validation and active-state support
- [x] 3.4 Implement optimistic concurrency token handling for catalog updates and return `409 Conflict` on stale writes

## 4. Bulk Import Orchestration Backend

- [x] 4.1 Implement `POST /imports/results/batches` to accept multi-file uploads, enforce hard limits, and create batch/item records
- [x] 4.2 Implement backend-proxy S3 file staging for uploaded files and persist canonical `ImportSourceFile` metadata (`bucket`, `key`, checksum, size, filename)
- [x] 4.3 Link each `ImportBatchItem` to `ImportSourceFile` and persist major/process scope metadata for provenance
- [x] 4.4 Implement worker/queue item processor to transition item lifecycle states (`queued`, `processing`, `completed`, `failed`, `cancelled`)
- [x] 4.5 Reuse/extract existing CSV import core logic so sync and batch item processing share validation and insertion behavior
- [x] 4.6 Implement batch control endpoints for retrying failed items and cancelling pending items
- [x] 4.7 Implement batch status endpoints for aggregate progress and itemized per-file outcomes

## 5. Import Endpoint and Error Contract Alignment

- [x] 5.1 Enforce admin authentication on `POST /imports/results` while preserving existing import semantics
- [x] 5.2 Standardize row-level error payload fields for deterministic admin UI rendering and grouping
- [x] 5.3 Ensure sync and async import paths emit compatible summary/error contracts

## 6. Frontend Admin Interface

- [x] 6.1 Add admin route group and shell navigation integration for `/admin/areas`, `/admin/faculties`, `/admin/majors`, and `/admin/imports`
- [x] 6.2 Build area/faculty/major admin pages with create/edit forms and list refresh behavior
- [x] 6.3 Add frontend handling for validation/domain API errors without losing unsaved form input
- [x] 6.4 Build admin imports page for massive upload flow with drag/drop multi-file selection and pre-submit checks
- [x] 6.5 Implement batch default process selection with per-file override controls in upload request builder
- [x] 6.6 Implement batch status polling (2-5s with backoff), per-file status table, and retry/cancel actions

## 7. Retention, Cleanup, and Operational Safety

- [x] 7.1 Implement cleanup job/policy for temporary staging artifacts using success/failure retention windows
- [x] 7.2 Ensure canonical `ImportSourceFile` objects are excluded from temporary cleanup and use long-lived lifecycle tiering
- [x] 7.3 Add guardrails for queue concurrency and import throughput to reduce DB/API contention under heavy batches

## 8. Testing, Documentation, and Rollout

- [x] 8.1 Add backend tests for admin auth (`401`/`403`), admin write APIs, optimistic concurrency conflicts, and validation semantics
- [x] 8.2 Add backend tests for bulk batch creation, status transitions, retry/cancel, limit enforcement, and S3 metadata persistence
- [x] 8.3 Add frontend tests for admin route guard, form workflows, upload UX, and polling-driven status updates
- [x] 8.4 Update `backend/ENDPOINTS_REPORT.md` and `openspec/project.md` to reflect admin APIs, auth guard, and batch orchestration endpoints
- [x] 8.5 Document operational runbook for bulk import limits, retention policy, and failure recovery steps
