import csv
import re
from decimal import Decimal, InvalidOperation
from typing import TextIO

_HEADER_ALIASES = {
    "code": "candidate_code",
    "codigo": "candidate_code",
    "lastnames": "last_names",
    "apellidos": "last_names",
    "names": "given_names",
    "nombres": "given_names",
    "name": "full_name",
    "major": "major_name",
    "carrera": "major_name",
    "score": "score",
    "puntaje": "score",
    "merit": "merit",
    "merito": "merit",
    "observation": "observation",
    "observacion": "observation",
    "status": "observation",
    "modality": "modality_name",
    "modalidad": "modality_name",
}


def _clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def _parse_score(value: str | None) -> str | None:
    value = _clean(value).replace(",", ".")
    if not value or value.lower().startswith("articulo"):
        return None
    try:
        return f"{Decimal(value):.4f}"
    except InvalidOperation as exc:
        raise ValueError("invalid score") from exc


def _parse_merit(value: str | None) -> int | None:
    value = _clean(value)
    if not value or value.lower().startswith("articulo"):
        return None
    try:
        merit = int(value)
    except ValueError as exc:
        raise ValueError("invalid merit") from exc
    if merit <= 0:
        raise ValueError("merit must be positive")
    return merit


def _status(source_name: str, observation: str, score: str | None) -> str:
    observation_upper = observation.upper()
    if any(word in observation_upper for word in ("NO INGRES", "NO ADMIT", "NO ALCANZ")):
        return "not_admitted"
    if "ALCANZ" in observation_upper or "INGRES" in observation_upper:
        return "admitted"
    if not score or any(word in observation_upper for word in ("AUSENTE", "AUSENT", "NO SE PRESENT")):
        return "absent"
    if source_name.lower().startswith("ingres"):
        return "admitted"
    return "postulant"


def _split_full_name(value: str) -> tuple[str, str]:
    last_names, separator, given_names = value.partition(",")
    if not separator:
        return value, ""
    return _clean(last_names), _clean(given_names)


def parse_csv(handle: TextIO, *, source_name: str) -> tuple[list[dict], list[str]]:
    reader = csv.DictReader(handle)
    if not reader.fieldnames:
        return [], ["missing CSV header"]

    fields = {_clean(field).lower(): field for field in reader.fieldnames if field}
    normalized_fields = {
        canonical: fields[header]
        for header, canonical in _HEADER_ALIASES.items()
        if header in fields
    }
    required = {"candidate_code", "major_name"}
    has_split_name = {"last_names", "given_names"}.issubset(normalized_fields)
    has_full_name = "full_name" in normalized_fields
    if not has_split_name and not has_full_name:
        return [], ["missing columns: given_names, last_names"]
    missing = required - normalized_fields.keys()
    if missing:
        return [], [f"missing columns: {', '.join(sorted(missing))}"]

    rows: list[dict] = []
    errors: list[str] = []
    for row_number, raw_row in enumerate(reader, start=2):
        values = {
            key: _clean(raw_row.get(field))
            for key, field in normalized_fields.items()
        }
        if has_full_name:
            values["last_names"], values["given_names"] = _split_full_name(
                values.get("full_name", "")
            )
        if not values.get("last_names") or not values.get("given_names"):
            errors.append(f"row {row_number}: invalid full name")
            continue
        if not values.get("candidate_code"):
            errors.append(f"row {row_number}: missing candidate code")
            continue
        try:
            score = _parse_score(values.get("score"))
            merit = _parse_merit(values.get("merit"))
        except ValueError as exc:
            errors.append(f"row {row_number}: {exc}")
            continue
        rows.append(
            {
                "candidate_code": values["candidate_code"],
                "last_names": values["last_names"],
                "given_names": values["given_names"],
                "major_name": values["major_name"],
                "score": score,
                "merit": merit,
                "modality_name": values.get("modality_name", ""),
                "status": _status(source_name, values.get("observation", ""), score),
            }
        )
    return rows, errors
