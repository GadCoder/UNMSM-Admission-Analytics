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

    source_key = _key(source_name)
    source_key = re.sub(r" +(LIMA|HUARAL|S J L)$", "", source_key)
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
        "faculty": {"code": faculty["slug"], "name": faculty["name"]},
        "major": {"code": major["slug"], "name": major["name"]},
    }
