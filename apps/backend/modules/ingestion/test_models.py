import pytest

from modules.ingestion.models import ImportBatch


@pytest.mark.django_db
def test_import_batch_tracks_source_and_counts():
    batch = ImportBatch.objects.create(
        source_name="Resultados-UNMSM",
        source_path="2026/26-2",
        status=ImportBatch.Status.COMPLETED,
        total_rows=100,
        imported_rows=98,
        rejected_rows=2,
    )

    assert str(batch) == "Resultados-UNMSM — 2026/26-2"
    assert batch.completed_at is not None
