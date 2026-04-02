from __future__ import annotations

import csv
import io
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

REQUIRED_RESULTS_IMPORT_COLUMNS: tuple[str, ...] = (
    "code",
    "lastnames",
    "names",
    "major",
    "score",
    "merit",
    "observation",
    "modality",
)


@dataclass(frozen=True)
class CsvImportRow:
    row_number: int
    values: dict[str, str]


class CsvImportFormatError(ValueError):
    pass


def parse_csv_rows(file_bytes: bytes) -> tuple[list[str], list[CsvImportRow]]:
    try:
        content = file_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise CsvImportFormatError("CSV file must be valid UTF-8") from exc

    buffer = io.StringIO(content, newline="")
    reader = csv.DictReader(buffer)
    if reader.fieldnames is None:
        raise CsvImportFormatError("CSV file must include a header row")

    columns = [field.strip() for field in reader.fieldnames]
    rows: list[CsvImportRow] = []
    for row_index, row in enumerate(reader, start=2):
        normalized: dict[str, str] = {}
        for key, value in row.items():
            if key is None:
                continue
            normalized[key.strip()] = (value or "").strip()
        rows.append(CsvImportRow(row_number=row_index, values=normalized))

    return columns, rows


def missing_required_columns(columns: list[str]) -> list[str]:
    provided = {column.strip() for column in columns}
    return [column for column in REQUIRED_RESULTS_IMPORT_COLUMNS if column not in provided]


def parse_score(raw_value: str) -> Decimal:
    value = raw_value.strip()
    if value == "":
        raise ValueError("Missing required value: score")
    try:
        return Decimal(value)
    except InvalidOperation as exc:
        raise ValueError("Invalid score value") from exc


def parse_merit(raw_value: str) -> int | None:
    value = raw_value.strip()
    if value == "":
        return None
    try:
        return int(value)
    except ValueError as exc:
        raise ValueError("Invalid merit value") from exc


def normalize_observation(raw_value: str) -> str | None:
    value = raw_value.strip()
    return value or None


def derive_is_admitted(raw_value: str) -> bool:
    return raw_value.strip().casefold() == "ALCANZÓ VACANTE".casefold()
