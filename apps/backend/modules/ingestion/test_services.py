import pytest

from modules.admission_processes.models import AdmissionProcess
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
