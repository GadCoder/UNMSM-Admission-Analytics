import json
import re
import unicodedata
from pathlib import Path

_TAXONOMY = json.loads(Path(__file__).with_name("taxonomy.json").read_text(encoding="utf-8"))


def _key(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = value.upper().replace("&", " Y ")
    return re.sub(r"[^A-Z0-9]+", " ", value).strip()


def resolve_major(area_code: str, source_name: str) -> dict:
    area_code = area_code.strip().upper()
    areas = {area["slug"]: area for area in _TAXONOMY["areas"]}
    area = areas.get(area_code)
    if area is None:
        raise ValueError(f"unknown academic area: {area_code}")

    aliases = {
        "CIENCIAS DE LOS ALIMENTOS": "CIENCIA DE LOS ALIMENTOS",
        "CIENCIAS DE LA COMPUTACION": "CIENCIA DE LA COMPUTACION",
        "INGENIERIA DEL AGUA Y TECNOLOGIAS DE TRATAMIENTO": "INGENIERIA DEL AGUA Y TECNOLOGIAS DE TRATAMIENTOS",
        "INGENIERIA DE INTELIGENCIA ARTIFICIAL": "INTELIGENCIA ARTIFICIAL",
        "INGENIERIA LOGISTICA Y CADENA DE SUMISTRO DIGITAL": "INGENIERIA LOGISTICA Y CADENA DE SUMINISTRO DIGITAL",
        "TEC MED LAB CLINICO Y ANATOMIA PATOLOGICA": "TECNOLOGIA MEDICA LABORATORIO CLINICO Y ANATOMIA PATOLOGICA",
        "TEC MED RADIOLOGIA": "TECNOLOGIA MEDICA RADIOLOGIA",
        "TEC MED TERAPIA FISICA Y REHABILITACION": "TECNOLOGIA MEDICA TERAPIA FISICA Y REHABILITACION",
        "TEC MED TERAPIA OCUPACIONAL": "TECNOLOGIA MEDICA TERAPIA OCUPACIONAL",
    }
    source_key = _key(source_name)
    source_key = re.sub(r" +(LIMA|HUARAL|S J L)$", "", source_key)
    source_key = aliases.get(source_key, source_key)
    major = next(
        (
            item
            for item in _TAXONOMY["majors"]
            if item["academic_area_slug"] == area_code
            and _key(item["name"]) == source_key
        ),
        None,
    )
    if major is None:
        raise ValueError(f"unknown major: {source_name}")

    faculty = next(
        item
        for item in _TAXONOMY["faculties"]
        if item["slug"] == major["faculty_slug"]
    )
    return {
        "academic_area": {"code": area["slug"], "name": area["name"]},
        "faculty": {"code": faculty["code"], "name": faculty["name"]},
        "major": {"code": major["code"], "name": major["name"]},
    }
