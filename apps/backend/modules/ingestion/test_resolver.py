import pytest

from modules.ingestion.resolver import resolve_major


def test_resolve_major_uses_legacy_taxonomy_and_normalizes_accents():
    result = resolve_major("C", "INGENIERIA MECATRONICA")

    assert result == {
        "academic_area": {"code": "C", "name": "Ingenierías"},
        "faculty": {
            "code": "facultad-de-ingenieria-electronica-y-electrica",
            "name": "Facultad de Ingeniería Electrónica y Eléctrica",
        },
        "major": {"code": "ingenieria-mecatronica", "name": "Ingeniería Mecatrónica"},
    }


def test_resolve_major_strips_location_suffixes_from_source_names():
    result = resolve_major("D", "ADMINISTRACIÓN - LIMA")

    assert result["major"]["name"] == "Administración"


def test_resolve_major_rejects_unknown_area_or_major():
    with pytest.raises(ValueError, match="unknown major"):
        resolve_major("A", "NOT A REAL MAJOR")
