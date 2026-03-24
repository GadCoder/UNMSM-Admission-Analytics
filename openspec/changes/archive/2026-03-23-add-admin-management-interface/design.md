## Context

The current product has strong read/analytics coverage and a synchronous CSV import endpoint, but operations still depend on direct API usage and manual sequencing. There is no admin UX to maintain catalog entities (areas, faculties, majors), and no safe in-app path to process many result files in one run.

As a solo-maintained system, operational throughput and failure visibility matter more than enterprise IAM complexity. The design must keep route handlers thin, preserve existing repository/service layering, and avoid request-time processing for large imports.

Key constraints:
- Existing `POST /imports/results` is synchronous and suitable for single-file workflows.
- Worker-driven async flows are planned in project context but not yet implemented.
- Frontend already has app shell, routing, and design-system primitives to extend.

## Goals / Non-Goals

**Goals:**
- Provide an admin interface to manage academic entities used by analytics and import mapping.
- Provide an admin interface for both single upload and bulk upload of results files.
- Introduce asynchronous bulk import orchestration with batch-level and file-level status tracking.
- Keep imports idempotent and failure-tolerant, with actionable operator feedback.
- Preserve backward compatibility for current synchronous import endpoint.

**Non-Goals:**
- Full multi-tenant role/permission system.
- Replacing all existing import internals in one step.
- Building generalized ETL scheduling/orchestration outside admission-results domain.
- Implementing exports in this change.

## Decisions

### 1) Admin UI as a dedicated route group under app shell
- Decision: add `/admin` route group with subpages:
  - `/admin/areas`
  - `/admin/faculties`
  - `/admin/majors`
  - `/admin/imports`
- Rationale: keeps operation-centric workflows isolated from analytics browsing pages and maps cleanly to existing shell navigation patterns.
- Alternatives considered:
  - Embed admin actions inside existing `/explore` pages: rejected due to mixed intent and harder UX safeguards.
  - Separate standalone app: rejected for now to avoid deployment and code split overhead.

### 2) Add explicit admin write APIs for academic catalog management
- Decision: create admin-focused endpoints for create/update operations on areas, faculties, and majors (read remains on existing endpoints).
- Rationale: admin forms need clear validation contracts and write semantics without overloading read endpoints.
- Alternatives considered:
  - Reuse read endpoints with method overloading: rejected due to blurred contracts and maintainability risk.
  - Direct DB access tooling only: rejected because it bypasses domain validation and auditability.

### 3) Keep single-file import endpoint; add bulk import orchestration as async workflow
- Decision: preserve `POST /imports/results` for one-off/small jobs; add bulk workflow endpoints:
  - `POST /imports/results/batches` to create batch and enqueue many files
  - `GET /imports/results/batches/{batch_id}` for aggregate progress
  - `GET /imports/results/batches/{batch_id}/items` for per-file outcomes
  - `POST /imports/results/batches/{batch_id}/retry` for failed items
  - `POST /imports/results/batches/{batch_id}/cancel` for pending items
- Rationale: preserves compatibility while enabling massive uploads without request timeouts.
- Alternatives considered:
  - Make existing endpoint accept many files synchronously: rejected due to long request time, memory pressure, and poor failure isolation.
  - One endpoint per file from frontend loops only: rejected because cross-file visibility/retry is weak.

### 4) Queue-backed processing with import batch/item persistence
- Decision: introduce persistent import tracking model:
  - `ImportBatch` (operator request scope)
  - `ImportBatchItem` (one uploaded file + target process + status)
  - `ImportSourceFile` (canonical source-file catalog record for long-term retrieval)
  - statuses: `queued`, `processing`, `completed`, `failed`, `cancelled`
  - aggregate fields: totals, completed count, failed count, timestamps
- Rationale: predictable recovery and observability for high-volume uploads.
- Alternatives considered:
  - In-memory queue only: rejected (state loss on restart).
  - Pure object-store event driven ingestion: deferred until storage architecture matures.

### 5) File staging strategy for bulk uploads
- Decision: use S3-backed staging with backend-proxy uploads (frontend uploads to backend; backend stores each file in S3 and records object key on `ImportBatchItem`). Workers consume S3 objects and clean them up per retention policy.
- Rationale: files are not huge, so backend-proxy keeps client implementation simple while still giving durable staging and cleaner worker handoff.
- Alternatives considered:
  - Presigned direct-to-S3 uploads: better for very large/high-throughput uploads, deferred for now due to added client/orchestration complexity.
  - Zip-only ingestion: rejected; adds parser complexity and weak per-file UX feedback.

### 6) Canonical source-file catalog for future exports/downloads
- Decision: persist canonical file metadata for each uploaded CSV so power users can later browse and download original files via export APIs.
- Data model:
  - `ImportSourceFile` fields include `id`, `s3_bucket`, `s3_object_key` (or `storage_uri`), `original_filename`, `content_type`, `size_bytes`, `checksum_sha256`, `admission_process_id`, `major_id`, `uploaded_by`, `uploaded_at`, `deleted_at`.
  - `ImportBatchItem.source_file_id` references `ImportSourceFile.id`.
  - enforce domain expectation that one source file maps to one major + one admission process.
- Rationale: preserves provenance and enables future export/download APIs without reconstructing file identity from logs.
- Alternatives considered:
  - Keep links only in transient batch-item records: rejected because retention cleanup would remove download lineage.
  - Store files but not metadata catalog: rejected due to weak queryability for power-user workflows.

### 7) Reuse existing CSV row validation/import service as item processor
- Decision: worker item processing delegates to existing `ResultsImportService` logic (or extracted shared core) so row validation and normalization remain single-sourced.
- Rationale: avoids divergence between sync and async imports.
- Alternatives considered:
  - Build separate bulk parser: rejected due to duplicated validation rules.

### 8) Frontend UX for massive uploads
- Decision: admin imports page supports:
  - drag/drop multi-file selection
  - batch default process with optional per-file overrides
  - pre-submit validation (filename/type/size)
  - batch status view with polling and filter tabs (all/failed/completed)
  - retry failed item and cancel pending operations
- Rationale: operators need visibility and control to handle large runs safely.
- Alternatives considered:
  - Minimal fire-and-forget upload: rejected (insufficient operations control).

### 9) Admin auth model for this phase
- Decision: implement minimal JWT-based auth with one `admin` role and enforce it on:
  - frontend `/admin/*` route group
  - backend admin write endpoints and import batch endpoints
- Rationale: current routes have no auth guard, and admin operations require protection; this option is low-friction for a solo maintainer.
- Alternatives considered:
  - No auth in v1: rejected because admin endpoints would be publicly callable.
  - Full RBAC/multi-user auth system: deferred as out of scope for this change.

### 10) Operational defaults (limits, transport, retention, consistency)
- Decision: initial hard limits and defaults are:
  - `max_files_per_batch=100`
  - `max_file_size_mb=25`
  - `max_total_batch_size_mb=1024`
  - `max_import_workers=4` (tunable)
  - batch status transport: polling (2-5s with backoff)
  - staged file retention (temporary upload objects only): 48h for succeeded items, 7d for failed/cancelled items
  - canonical source files (`ImportSourceFile` S3 objects): long-lived retention for export use (default indefinite, lifecycle tiering allowed)
  - batch item/error logs retention: 30d; batch summary metadata retention: 90d
  - catalog writes use optimistic concurrency token (`updated_at` or version) and return `409` on conflict
- Rationale: safe defaults for a single-VPS deployment that still support meaningful bulk throughput.
- Alternatives considered:
  - SSE/WebSocket progress transport now: deferred to avoid extra operational complexity.
  - Mandatory per-file process assignment: rejected for poor operator ergonomics.
  - No optimistic locking: rejected due to accidental overwrite risk from stale admin tabs.

## Risks / Trade-offs

- [Large batches can saturate DB and degrade API latency] -> Mitigation: bounded worker concurrency, transactional chunking, and optional queue throttling.
- [Duplicate imports across multiple files/processes] -> Mitigation: rely on existing uniqueness constraints and report duplicate reason per row/item.
- [Temporary file growth in staging storage] -> Mitigation: retention TTL + cleanup job + hard batch/file limits.
- [Operator confusion from mixed sync/async options] -> Mitigation: clear UI split: "Quick single upload" vs "Bulk upload batch".
- [Partial failure complexity] -> Mitigation: first-class item statuses, retry endpoint, deterministic summary responses.

## Migration Plan

1. Add DB migration(s) for `import_batches` and `import_batch_items` plus indexes.
2. Implement backend batch APIs and worker processing pipeline behind feature flag.
3. Extract/shared import core logic so sync and async paths call the same validation+insert components.
4. Build frontend admin pages and wire API clients for catalog management and import batch flows.
5. Roll out with conservative concurrency defaults; monitor processing time and failure rates.
6. Remove feature flag once stable; keep sync endpoint operational.

Rollback:
- Disable feature flag for bulk workflow to fall back to synchronous imports only.
- Keep schema in place (non-breaking) and stop worker consumers if needed.

## Open Questions

- Do we need support for presigned direct-to-S3 uploads as an optional high-scale mode in a follow-up phase?
- Should we expose one canonical download endpoint with per-request presigned URLs, or separate endpoints for metadata listing vs link generation?
