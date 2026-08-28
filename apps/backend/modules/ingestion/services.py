from pathlib import Path

from django.db import transaction

from modules.academics.models import AcademicArea, Faculty, Major
from modules.admission_processes.models import AdmissionModality, AdmissionProcess
from modules.results.models import AdmissionResult

from .models import ImportBatch
from .parser import parse_csv
from .resolver import resolve_major


def _area_code(directory: Path) -> str:
    name = directory.name.strip().upper()
    return name.removeprefix("AREA-")


def _process_identity(directory: Path) -> tuple[int, str]:
    year = int(directory.parent.name)
    return year, directory.name


def _collect_rows(directory: Path) -> tuple[list[dict], list[str]]:
    rows: list[dict] = []
    errors: list[str] = []
    for area_dir in sorted(path for path in directory.iterdir() if path.is_dir()):
        area_code = _area_code(area_dir)
        for major_dir in sorted(path for path in area_dir.iterdir() if path.is_dir()):
            try:
                resolved = resolve_major(area_code, major_dir.name)
            except ValueError as exc:
                errors.append(f"{major_dir.name}: {exc}")
                continue
            for csv_path in sorted(major_dir.glob("*.csv")):
                with csv_path.open(encoding="utf-8-sig", newline="") as handle:
                    parsed, parse_errors = parse_csv(handle, source_name=csv_path.name)
                for error in parse_errors:
                    errors.append(f"{csv_path}: {error}")
                for row in parsed:
                    row.update(
                        {
                            "area_code": area_code,
                            "faculty_code": resolved["faculty"]["code"],
                            "faculty_name": resolved["faculty"]["name"],
                            "major_code": resolved["major"]["code"],
                            "major_name": resolved["major"]["name"],
                            "area_name": resolved["academic_area"]["name"],
                            "source_file": str(csv_path),
                        }
                    )
                    rows.append(row)
    return rows, errors


def _merge_rows(rows: list[dict]) -> list[dict]:
    merged: dict[tuple[str, str], dict] = {}
    for row in rows:
        key = (row["major_code"], row["candidate_code"])
        previous = merged.get(key)
        if previous is None or (
            row["status"] == AdmissionResult.Status.ADMITTED
            and previous["status"] != AdmissionResult.Status.ADMITTED
        ):
            merged[key] = row
    return list(merged.values())


@transaction.atomic
def import_process_directory(
    directory: str | Path, *, source_name: str = "Resultados-UNMSM", dry_run: bool = False
) -> ImportBatch | dict[str, int]:
    directory = Path(directory)
    year, sequence = _process_identity(directory)
    raw_rows, errors = _collect_rows(directory)
    rows = _merge_rows(raw_rows)
    summary = {
        "total_rows": len(raw_rows) + len(errors),
        "imported_rows": len(rows),
        "rejected_rows": len(errors),
    }
    if dry_run:
        return summary

    batch = ImportBatch.objects.create(
        source_name=source_name,
        source_path=str(directory),
        status=ImportBatch.Status.PROCESSING,
        total_rows=summary["total_rows"],
        rejected_rows=summary["rejected_rows"],
    )
    try:
        process, _ = AdmissionProcess.objects.update_or_create(
            year=year,
            sequence=sequence,
            defaults={"name": f"Admisión {year} — {sequence}", "is_published": True},
        )
        AdmissionResult.objects.filter(process=process).delete()
        area_cache: dict[str, AcademicArea] = {}
        faculty_cache: dict[str, Faculty] = {}
        major_cache: dict[str, Major] = {}
        modality_cache: dict[str, AdmissionModality] = {}
        for row in rows:
            area = area_cache.setdefault(
                row["area_code"],
                AcademicArea.objects.get_or_create(
                    code=row["area_code"], defaults={"name": row["area_name"]}
                )[0],
            )
            faculty = faculty_cache.setdefault(
                row["faculty_code"],
                Faculty.objects.get_or_create(
                    code=row["faculty_code"],
                    academic_area=area,
                    defaults={"name": row["faculty_name"]},
                )[0],
            )
            major = major_cache.setdefault(
                row["major_code"],
                Major.objects.get_or_create(
                    code=row["major_code"],
                    defaults={"name": row["major_name"], "faculty": faculty},
                )[0],
            )
            modality = None
            if row["modality_name"]:
                modality = modality_cache.setdefault(
                    row["modality_name"],
                    AdmissionModality.objects.get_or_create(name=row["modality_name"])[0],
                )
            AdmissionResult.objects.create(
                process=process,
                major=major,
                modality=modality,
                candidate_code=row["candidate_code"],
                last_names=row["last_names"],
                given_names=row["given_names"],
                score=row["score"],
                merit=row["merit"],
                status=row["status"],
                source_file=row["source_file"],
                import_batch=batch,
            )
        batch.status = ImportBatch.Status.COMPLETED
        batch.imported_rows = summary["imported_rows"]
        batch.error_message = "\n".join(errors)
        batch.save(update_fields=["status", "imported_rows", "error_message", "updated_at"])
        return batch
    except Exception as exc:
        batch.status = ImportBatch.Status.FAILED
        batch.error_message = str(exc)
        batch.save(update_fields=["status", "error_message", "updated_at"])
        raise
