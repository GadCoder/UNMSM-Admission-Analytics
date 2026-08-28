from io import StringIO

from modules.ingestion.parser import parse_csv


def test_parse_csv_supports_new_combined_name_schema():
    csv_text = (
        "code,name,major,score,merit,status,location,modality\n"
        "110294,\"ACUÑA CHUMPITAZ, LUCIANA ESPERANZA\",ENFERMERÍA,813.000,,,CENTRAL,EBR\n"
    )

    rows, errors = parse_csv(StringIO(csv_text), source_name="postulantes.csv")

    assert errors == []
    assert rows[0]["last_names"] == "ACUÑA CHUMPITAZ"
    assert rows[0]["given_names"] == "LUCIANA ESPERANZA"
    assert rows[0]["score"] == "813.0000"
    assert rows[0]["modality_name"] == "EBR"
