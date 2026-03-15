## 1. Domain Model Scaffolding

- [x] 1.1 Create ORM model modules for `AcademicArea`, `Faculty`, `Major`, `AdmissionProcess`, and `AdmissionResult` under the backend models package
- [x] 1.2 Register/import the new models so they are included in shared SQLAlchemy metadata used by Alembic
- [x] 1.3 Define shared timestamp strategy (`created_at`, `updated_at`) and apply it consistently across core domain tables

## 2. Academic Hierarchy and Process Constraints

- [x] 2.1 Implement `AcademicArea` fields and uniqueness constraints (`name`, `slug`)
- [x] 2.2 Implement `Faculty` with non-null FK to academic area, scoped unique `(academic_area_id, name)`, and unique `slug`
- [x] 2.3 Implement `Major` with non-null FK to faculty, scoped unique `(faculty_id, name)`, unique `slug`, and `is_active` flag
- [x] 2.4 Implement `AdmissionProcess` with `year`, `cycle`, `label`, `exam_date`, `is_published`, unique `(year, cycle)`, and unique `label`

## 3. Admission Results Fact Model and Indexing

- [x] 3.1 Implement `AdmissionResult` with FK links to process and major plus candidate/result fields (`candidate_code`, names, `score`, `merit_rank`, `observation_raw`, `is_admitted`, `row_number`)
- [x] 3.2 Add unique constraint `(admission_process_id, major_id, candidate_code)` for deduplication at candidate-major-process level
- [x] 3.3 Add indexes for hierarchy and result query paths (`faculties.academic_area_id`, `majors.faculty_id`, result process/major/score/candidate/is_admitted, and composite `(admission_process_id, major_id)`)

## 4. Alembic Migration and Validation

- [x] 4.1 Generate Alembic migration(s) for the complete core domain schema from ORM metadata
- [x] 4.2 Review and adjust migration DDL for PostgreSQL-friendly types/defaults/constraint names
- [x] 4.3 Validate migration lifecycle locally (upgrade and downgrade) and verify tables, FKs, unique constraints, and indexes exist as specified
