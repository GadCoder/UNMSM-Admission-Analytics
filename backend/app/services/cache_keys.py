from __future__ import annotations

from app.schemas.major_trends import TrendMetricName
from app.schemas.rankings import MajorRankingsParams


def process_overview_cache_key(process_id: int) -> str:
    return f"process_overview:{process_id}"


def major_analytics_cache_key(major_id: int, process_id: int | None) -> str:
    process_scope = str(process_id) if process_id is not None else "all"
    return f"major_analytics:{major_id}:process:{process_scope}"


def major_trends_cache_key(major_id: int, metrics: list[TrendMetricName] | None) -> str:
    if metrics is None or len(metrics) == 0:
        signature = "all"
    else:
        signature = "-".join(metrics)
    return f"major_trends:{major_id}:metrics:{signature}"


def rankings_majors_cache_key(params: MajorRankingsParams) -> str:
    academic_area = str(params.academic_area_id) if params.academic_area_id is not None else "all"
    faculty = str(params.faculty_id) if params.faculty_id is not None else "all"
    limit = str(params.limit) if params.limit is not None else "all"
    return (
        "rankings:majors:"
        f"process:{params.process_id}:"
        f"metric:{params.metric}:"
        f"sort:{params.sort_order}:"
        f"area:{academic_area}:"
        f"faculty:{faculty}:"
        f"limit:{limit}"
    )
