from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from fastapi import UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.repositories.imports import (
    AdmissionResultInsertPayload,
    ResultsImportRepository,
)
from app.schemas.imports import ImportErrorItemResponse, ResultsImportSummaryResponse
from app.utils.csv_import import (
    CsvImportFormatError,
    CsvImportRow,
    derive_is_admitted,
    missing_required_columns,
    normalize_observation,
    parse_csv_rows,
    parse_merit,
    parse_score,
)

REQUIRED_ROW_FIELDS: tuple[str, ...] = ("code", "lastnames", "names", "major", "score")


class CsvImportFileError(Exception):
    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


@dataclass(frozen=True)
class RowProcessingFailure:
    row_number: int
    reason: str


class ResultsImportService:
    def __init__(self, repository: ResultsImportRepository | None = None) -> None:
        self.repository = repository or ResultsImportRepository()

    def import_results_csv(
        self,
        db: Session,
        process_id: int,
        file: UploadFile,
    ) -> ResultsImportSummaryResponse:
        return self.import_results_bytes(
            db, process_id=process_id, file_bytes=file.file.read()
        )

    def import_results_bytes(
        self,
        db: Session,
        process_id: int,
        file_bytes: bytes,
    ) -> ResultsImportSummaryResponse:
        process = self.repository.get_process_by_id(db, process_id)
        if process is None:
            raise CsvImportFileError(
                status_code=404, message="Admission process not found"
            )

        try:
            columns, rows = parse_csv_rows(file_bytes)
        except CsvImportFormatError as exc:
            raise CsvImportFileError(status_code=400, message=str(exc)) from exc

        missing_columns = missing_required_columns(columns)
        if missing_columns:
            missing_text = ", ".join(missing_columns)
            raise CsvImportFileError(
                status_code=400,
                message=f"CSV file is missing required columns: {missing_text}",
            )

        major_map = self.repository.get_major_name_map(db)
        imported_rows = 0
        failures: list[RowProcessingFailure] = []

        for row in rows:
            failure = self._validate_and_insert_row(
                db=db,
                process_id=process_id,
                row=row,
                major_map=major_map,
            )
            if failure is None:
                imported_rows += 1
            else:
                failures.append(failure)

        db.commit()

        return ResultsImportSummaryResponse(
            process_id=process_id,
            total_rows=len(rows),
            imported_rows=imported_rows,
            failed_rows=len(failures),
            errors=[
                ImportErrorItemResponse(
                    row_number=failure.row_number,
                    reason=failure.reason,
                    reason_code=self._reason_code(failure.reason),
                )
                for failure in failures
            ],
        )

    def _reason_code(self, reason: str) -> str:
        lowered = reason.lower()
        if lowered.startswith("missing required value"):
            return "missing_required_value"
        if lowered.startswith("unknown major"):
            return "unknown_major"
        if lowered == "invalid score value":
            return "invalid_score"
        if lowered == "invalid merit value":
            return "invalid_merit"
        if lowered.startswith("duplicate row"):
            return "duplicate_row"
        return "import_error"

    def _validate_and_insert_row(
        self,
        db: Session,
        process_id: int,
        row: CsvImportRow,
        major_map: dict[str, int],
    ) -> RowProcessingFailure | None:
        missing = self._missing_required_row_fields(row)
        if missing:
            return RowProcessingFailure(
                row_number=row.row_number,
                reason=f"Missing required value: {missing[0]}",
            )

        major_name = row.values["major"].strip()
        major_id = major_map.get(major_name)
        if major_id is None:
            return RowProcessingFailure(
                row_number=row.row_number,
                reason=f"Unknown major: {major_name}",
            )

        try:
            score = self._resolve_score(row)
            merit_rank = parse_merit(row.values.get("merit", ""))
        except ValueError as exc:
            return RowProcessingFailure(row_number=row.row_number, reason=str(exc))

        payload = AdmissionResultInsertPayload(
            admission_process_id=process_id,
            major_id=major_id,
            candidate_code=row.values["code"].strip(),
            candidate_lastnames=row.values["lastnames"].strip(),
            candidate_names=row.values["names"].strip(),
            score=score,
            merit_rank=merit_rank,
            observation_raw=normalize_observation(row.values.get("observation", "")),
            is_admitted=derive_is_admitted(row.values.get("observation", "")),
            row_number=row.row_number,
        )

        try:
            with db.begin_nested():
                self.repository.insert_admission_result(db, payload)
        except IntegrityError:
            return RowProcessingFailure(
                row_number=row.row_number,
                reason="Duplicate row for process, major, and candidate code",
            )

        return None

    def _resolve_score(self, row: CsvImportRow) -> Decimal:
        raw_score = row.values.get("score", "")
        if raw_score.strip() != "":
            return parse_score(raw_score)

        observation = normalize_observation(row.values.get("observation", ""))
        if observation is not None and observation.casefold() == "AUSENTE".casefold():
            return Decimal("0")

        return parse_score(raw_score)

    def _missing_required_row_fields(self, row: CsvImportRow) -> list[str]:
        missing: list[str] = []
        for field in REQUIRED_ROW_FIELDS:
            value = row.values.get(field, "").strip()
            observation = normalize_observation(row.values.get("observation", ""))
            if (
                field == "score"
                and value == ""
                and observation is not None
                and observation.casefold() == "AUSENTE".casefold()
            ):
                continue
            if value == "":
                missing.append(field)
        return missing
