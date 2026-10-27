from unittest.mock import patch

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from modules.academics.models import AcademicArea, Faculty, Major
from modules.admission_processes.models import AdmissionModality, AdmissionProcess
from modules.ingestion.models import ImportBatch
from modules.ingestion.services import import_process_directory
from modules.results.models import AdmissionResult


@pytest.mark.django_db
def test_import_process_directory_replaces_results_and_merges_admitted_rows(tmp_path):
    major_dir = tmp_path / "2026" / "26-2" / "A" / "MEDICINA HUMANA"
    major_dir.mkdir(parents=True)
    header = "code,lastnames,names,major,score,merit,observation,modality\n"
    (major_dir / "postulantes.csv").write_text(
        header + "A001,PEREZ,ANA,MEDICINA HUMANA,145,1,,ORDINARIO\n",
        encoding="utf-8",
    )
    (major_dir / "ingresantes.csv").write_text(
        header + "A001,PEREZ,ANA,MEDICINA HUMANA,145,1,,ORDINARIO\n",
        encoding="utf-8",
    )

    batch = import_process_directory(major_dir.parent.parent, source_name="Resultados-UNMSM")

    assert batch.status == ImportBatch.Status.COMPLETED
    assert batch.total_rows == 2
    assert batch.imported_rows == 1
    assert AdmissionProcess.objects.count() == 1
    result = AdmissionResult.objects.get()
    assert result.status == AdmissionResult.Status.ADMITTED

    import_process_directory(major_dir.parent.parent, source_name="Resultados-UNMSM")
    assert AdmissionResult.objects.count() == 1


@pytest.mark.django_db
def test_import_process_directory_dry_run_does_not_write_database(tmp_path):
    major_dir = tmp_path / "2026" / "26-2" / "E" / "DERECHO"
    major_dir.mkdir(parents=True)
    (major_dir / "postulantes.csv").write_text(
        "codigo,apellidos,nombres,carrera,puntaje,merito,observacion,modalidad\n"
        "A002,DOE,JANE,DERECHO,100,,NO INGRESÓ,ORDINARIO\n",
        encoding="utf-8",
    )

    summary = import_process_directory(major_dir.parent.parent, dry_run=True)

    assert summary == {"total_rows": 1, "imported_rows": 1, "rejected_rows": 0}
    assert ImportBatch.objects.count() == 0
    assert AdmissionProcess.objects.count() == 0


@pytest.mark.django_db
def test_import_batches_result_inserts_and_scales_queries_by_references(tmp_path):
    major_dir = tmp_path / "2026" / "26-2" / "A" / "MEDICINA HUMANA"
    major_dir.mkdir(parents=True)
    header = "code,lastnames,names,major,score,merit,observation,modality\n"
    records = "".join(
        f"A{number:03d},PEREZ,ANA,MEDICINA HUMANA,145,{number + 1},,ORDINARIO\n"
        for number in range(80)
    )
    (major_dir / "postulantes.csv").write_text(header + records, encoding="utf-8")

    with CaptureQueriesContext(connection) as queries, patch.object(
        AdmissionResult.objects, "bulk_create", wraps=AdmissionResult.objects.bulk_create
    ) as bulk_create:
        batch = import_process_directory(major_dir.parent.parent)

    result_inserts = [
        query["sql"]
        for query in queries
        if query["sql"].lstrip().upper().startswith("INSERT INTO")
        and AdmissionResult._meta.db_table in query["sql"]
    ]
    assert bulk_create.call_count == 1
    assert len(result_inserts) == 1
    for model in (AcademicArea, Faculty, Major, AdmissionModality):
        reference_lookups = [
            query["sql"]
            for query in queries
            if query["sql"].lstrip().upper().startswith("SELECT")
            and model._meta.db_table in query["sql"]
        ]
        assert len(reference_lookups) == 1
    assert batch.imported_rows == 80
    assert AdmissionResult.objects.count() == 80


@pytest.mark.django_db
def test_import_rolls_back_replacement_when_result_insert_fails(tmp_path):
    major_dir = tmp_path / "2026" / "26-2" / "E" / "DERECHO"
    major_dir.mkdir(parents=True)
    csv_path = major_dir / "postulantes.csv"
    header = "codigo,apellidos,nombres,carrera,puntaje,merito,observacion,modalidad\n"
    csv_path.write_text(
        header + "A001,DOE,JANE,DERECHO,100,1,,ORDINARIO\n", encoding="utf-8"
    )
    process_dir = major_dir.parent.parent
    import_process_directory(process_dir)
    previous = AdmissionResult.objects.get()
    csv_path.write_text(
        header + "A002,DOE,JANE,DERECHO,110,1,,ORDINARIO\n", encoding="utf-8"
    )

    with patch.object(AdmissionResult.objects, "bulk_create", side_effect=RuntimeError("insert failed")):
        with pytest.raises(RuntimeError, match="insert failed"):
            import_process_directory(process_dir)

    assert AdmissionResult.objects.count() == 1
    assert AdmissionResult.objects.get().pk == previous.pk
    assert ImportBatch.objects.count() == 1


@pytest.mark.django_db
def test_import_rolls_back_previously_inserted_batches_on_later_failure(tmp_path):
    major_dir = tmp_path / "2026" / "26-2" / "E" / "DERECHO"
    major_dir.mkdir(parents=True)
    csv_path = major_dir / "postulantes.csv"
    header = "codigo,apellidos,nombres,carrera,puntaje,merito,observacion,modalidad\n"
    csv_path.write_text(header + "ORIGINAL,DOE,JANE,DERECHO,100,1,,ORDINARIO\n", encoding="utf-8")
    process_dir = major_dir.parent.parent
    import_process_directory(process_dir)
    previous_id = AdmissionResult.objects.get().pk
    csv_path.write_text(
        header + "".join(f"A{i},DOE,JANE,DERECHO,110,1,,ORDINARIO\n" for i in range(1001)),
        encoding="utf-8",
    )
    insert = AdmissionResult.objects.bulk_create
    batch_sizes = []

    def fail_second_batch(objects, **kwargs):
        batch_sizes.append(len(objects))
        if len(batch_sizes) == 2:
            raise RuntimeError("second batch failed")
        return insert(objects, **kwargs)

    with patch.object(AdmissionResult.objects, "bulk_create", side_effect=fail_second_batch):
        with pytest.raises(RuntimeError, match="second batch failed"):
            import_process_directory(process_dir)

    assert batch_sizes == [1000, 1]
    assert list(AdmissionResult.objects.values_list("pk", flat=True)) == [previous_id]
    assert ImportBatch.objects.count() == 1
