from io import StringIO

import pytest

from modules.ingestion.parser import parse_csv


@pytest.mark.parametrize(
    ("csv_text", "expected"),
    [
        (
            "code,lastnames,names,major,score,merit,observation,modality\n"
            "A001,PÉREZ,ANA,MEDICINA HUMANA,145.2500,1,,ORDINARIO\n",
            {
                "candidate_code": "A001",
                "last_names": "PÉREZ",
                "given_names": "ANA",
                "major_name": "MEDICINA HUMANA",
                "score": "145.2500",
                "merit": 1,
                "modality_name": "ORDINARIO",
                "status": "admitted",
            },
        ),
        (
            "codigo,apellidos,nombres,carrera,puntaje,merito,observacion,modalidad\n"
            "A002,GARCÍA,LUIS, DERECHO ,120.5,,NO INGRESÓ,ORDINARIO\n",
            {
                "candidate_code": "A002",
                "last_names": "GARCÍA",
                "given_names": "LUIS",
                "major_name": "DERECHO",
                "score": "120.5000",
                "merit": None,
                "modality_name": "ORDINARIO",
                "status": "not_admitted",
            },
        ),
    ],
)
def test_parse_csv_normalizes_supported_schemas(csv_text, expected):
    rows, errors = parse_csv(StringIO(csv_text), source_name="ingresantes.csv")

    assert errors == []
    assert rows == [expected]


def test_parse_csv_marks_absent_candidates_without_a_score():
    csv_text = (
        "codigo,apellidos,nombres,carrera,puntaje,merito,observacion,modalidad\n"
        "A003,QUISPE,MARÍA,PSICOLOGÍA,, ,AUSENTE,ORDINARIO\n"
    )

    rows, errors = parse_csv(StringIO(csv_text), source_name="postulantes.csv")

    assert errors == []
    assert rows[0]["score"] is None
    assert rows[0]["status"] == "absent"


def test_parse_csv_rejects_rows_without_candidate_code():
    csv_text = "code,lastnames,names,major,score,merit,observation,modality\n,DOE,JANE,DERECHO,100,1,,\n"

    rows, errors = parse_csv(StringIO(csv_text), source_name="ingresantes.csv")

    assert rows == []
    assert errors == ["row 2: missing candidate code"]
