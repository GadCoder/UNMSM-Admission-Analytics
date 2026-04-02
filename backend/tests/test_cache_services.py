import os
import tempfile
import unittest
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.core.db import Base
from app.models.academic import AcademicArea, Faculty, Major
from app.models.admission import AdmissionProcess, AdmissionResult
from app.schemas.major_trends import SUPPORTED_TREND_METRICS
from app.schemas.rankings import MajorRankingsParams
from app.services.academic_structure import AcademicStructureService
from app.services.cache import CacheService
from app.services.cache_keys import (
    dashboard_applicants_trend_cache_key,
    dashboard_cutoff_trend_cache_key,
    dashboard_overview_cache_key,
    dashboard_rankings_cache_key,
    major_analytics_cache_key,
    major_trends_cache_key,
    process_overview_cache_key,
    rankings_majors_cache_key,
)
from app.services.dashboard import DashboardService
from app.services.imports import ResultsImportService
from app.services.processes import ProcessesService
from app.services.rankings import RankingsService
from app.services.results import ResultsService
from app.schemas.dashboard import (
    DashboardRankingsParams,
    DashboardScopedParams,
    DashboardTrendParams,
)


class FakeCacheService:
    def __init__(self, fail_get: bool = False, fail_set: bool = False) -> None:
        self.store: dict[str, dict | list] = {}
        self.get_calls = 0
        self.set_calls = 0
        self.fail_get = fail_get
        self.fail_set = fail_set

    def get_json(self, key: str):
        self.get_calls += 1
        if self.fail_get:
            raise RuntimeError("cache get failed")
        return self.store.get(key)

    def set_json(self, key: str, value, ttl_seconds: int | None = None) -> bool:
        self.set_calls += 1
        if self.fail_set:
            raise RuntimeError("cache set failed")
        self.store[key] = value
        return True


class FakeValkeyClient:
    def __init__(self) -> None:
        self.storage: dict[str, str] = {}
        self.get_calls = 0
        self.set_calls = 0
        self.last_ex: int | None = None

    def get(self, key: str) -> str | None:
        self.get_calls += 1
        return self.storage.get(key)

    def set(self, key: str, value: str, ex: int | None = None) -> bool:
        self.set_calls += 1
        self.last_ex = ex
        self.storage[key] = value
        return True


class CacheServicesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.tempdir = tempfile.TemporaryDirectory()
        cls.db_path = f"{cls.tempdir.name}/cache-test.db"
        cls.engine = create_engine(f"sqlite+pysqlite:///{cls.db_path}", future=True)
        cls.session_factory = sessionmaker(
            bind=cls.engine, autoflush=False, autocommit=False, future=True
        )
        Base.metadata.create_all(bind=cls.engine)

        with cls.session_factory() as session:
            area = AcademicArea(id=1, name="Engineering", slug="engineering")
            faculty = Faculty(id=10, name="Systems", slug="systems", academic_area_id=1)
            major_software = Major(
                id=100, name="Software", slug="software", faculty_id=10, is_active=True
            )
            major_networks = Major(
                id=101, name="Networks", slug="networks", faculty_id=10, is_active=True
            )

            process_1 = AdmissionProcess(id=1, year=2024, cycle="I", label="2024-I")
            process_2 = AdmissionProcess(id=2, year=2024, cycle="II", label="2024-II")

            results = [
                AdmissionResult(
                    id=1,
                    admission_process_id=1,
                    major_id=100,
                    candidate_code="A1",
                    candidate_lastnames="AAA",
                    candidate_names="ONE",
                    score=Decimal("900.0"),
                    merit_rank=1,
                    observation_raw="ALCANZÓ VACANTE",
                    is_admitted=True,
                    row_number=1,
                ),
                AdmissionResult(
                    id=2,
                    admission_process_id=1,
                    major_id=100,
                    candidate_code="A2",
                    candidate_lastnames="AAA",
                    candidate_names="TWO",
                    score=Decimal("700.0"),
                    merit_rank=2,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=2,
                ),
                AdmissionResult(
                    id=3,
                    admission_process_id=1,
                    major_id=101,
                    candidate_code="B1",
                    candidate_lastnames="BBB",
                    candidate_names="ONE",
                    score=Decimal("800.0"),
                    merit_rank=3,
                    observation_raw="ALCANZÓ VACANTE",
                    is_admitted=True,
                    row_number=3,
                ),
            ]

            session.add_all(
                [
                    area,
                    faculty,
                    major_software,
                    major_networks,
                    process_1,
                    process_2,
                    *results,
                ]
            )
            session.commit()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.engine.dispose()
        cls.tempdir.cleanup()

    def test_cache_key_generation_is_deterministic(self) -> None:
        self.assertEqual(process_overview_cache_key(7), "process_overview:7")
        self.assertEqual(
            major_analytics_cache_key(10, None), "major_analytics:10:process:all"
        )
        self.assertEqual(
            major_analytics_cache_key(10, 1), "major_analytics:10:process:1"
        )

        self.assertEqual(major_trends_cache_key(3, None), "major_trends:3:metrics:all")
        self.assertEqual(
            major_trends_cache_key(3, ["applicants", "cutoff_score"]),
            "major_trends:3:metrics:applicants-cutoff_score",
        )
        self.assertEqual(
            major_trends_cache_key(3, list(SUPPORTED_TREND_METRICS)),
            major_trends_cache_key(3, list(SUPPORTED_TREND_METRICS)),
        )

        params = MajorRankingsParams(
            process_id=1, metric="cutoff_score", sort_order="desc", limit=10
        )
        self.assertEqual(
            rankings_majors_cache_key(params),
            "rankings:majors:process:1:metric:cutoff_score:sort:desc:area:all:faculty:all:limit:10",
        )

        overview_params = DashboardScopedParams(
            process_id=1, academic_area_id=None, faculty_id=10
        )
        rankings_params = DashboardRankingsParams(
            process_id=1, academic_area_id=1, faculty_id=None, limit=5
        )
        rankings_params_no_limit = DashboardRankingsParams(
            process_id=1, academic_area_id=1, faculty_id=None
        )
        trend_params = DashboardTrendParams(academic_area_id=None, faculty_id=10)
        self.assertEqual(
            dashboard_overview_cache_key(overview_params),
            "dashboard:overview:process:1:area:all:faculty:10",
        )
        self.assertEqual(
            dashboard_rankings_cache_key(rankings_params),
            "dashboard:rankings:process:1:area:1:faculty:all:limit:5",
        )
        self.assertEqual(
            dashboard_rankings_cache_key(rankings_params_no_limit),
            "dashboard:rankings:process:1:area:1:faculty:all:limit:all",
        )
        self.assertEqual(
            dashboard_applicants_trend_cache_key(trend_params),
            "dashboard:trends:applicants:area:all:faculty:10",
        )
        self.assertEqual(
            dashboard_cutoff_trend_cache_key(trend_params),
            "dashboard:trends:cutoff:area:all:faculty:10",
        )

    def test_process_overview_cache_hit_and_miss(self) -> None:
        cache = FakeCacheService()
        service = ProcessesService(cache_service=cache)

        with self.session_factory() as session:
            first = service.get_process_overview(session, 1)
            second = service.get_process_overview(session, 1)

        self.assertEqual(first.model_dump(), second.model_dump())
        self.assertEqual(cache.get_calls, 2)
        self.assertEqual(cache.set_calls, 1)

    def test_major_analytics_cache_hit_and_miss(self) -> None:
        cache = FakeCacheService()
        service = AcademicStructureService(cache_service=cache)

        with self.session_factory() as session:
            first = service.get_major_analytics(session, major_id=100, process_id=1)
            second = service.get_major_analytics(session, major_id=100, process_id=1)

        self.assertIsNotNone(first)
        self.assertIsNotNone(second)
        self.assertEqual(first.model_dump(), second.model_dump())
        self.assertEqual(cache.get_calls, 2)
        self.assertEqual(cache.set_calls, 1)

    def test_major_trends_and_rankings_cache_hit_and_miss(self) -> None:
        trends_cache = FakeCacheService()
        trends_service = AcademicStructureService(cache_service=trends_cache)
        rankings_cache = FakeCacheService()
        rankings_service = RankingsService(cache_service=rankings_cache)
        params = MajorRankingsParams(process_id=1, metric="applicants")

        with self.session_factory() as session:
            first_trends = trends_service.get_major_trends(session, major_id=100)
            second_trends = trends_service.get_major_trends(session, major_id=100)
            first_rankings = rankings_service.list_major_rankings(session, params)
            second_rankings = rankings_service.list_major_rankings(session, params)

        self.assertIsNotNone(first_trends)
        self.assertIsNotNone(second_trends)
        self.assertEqual(first_trends.model_dump(), second_trends.model_dump())
        self.assertEqual(first_rankings.model_dump(), second_rankings.model_dump())
        self.assertEqual(trends_cache.get_calls, 2)
        self.assertEqual(trends_cache.set_calls, 1)
        self.assertEqual(rankings_cache.get_calls, 2)
        self.assertEqual(rankings_cache.set_calls, 1)

    def test_dashboard_cache_hit_and_miss(self) -> None:
        cache = FakeCacheService()
        service = DashboardService(cache_service=cache)
        scoped = DashboardScopedParams(process_id=1)
        rankings_params = DashboardRankingsParams(process_id=1, limit=2)
        trend_params = DashboardTrendParams()

        with self.session_factory() as session:
            first_overview = service.get_overview(session, scoped)
            second_overview = service.get_overview(session, scoped)
            first_rankings = service.get_rankings(session, rankings_params)
            second_rankings = service.get_rankings(session, rankings_params)
            first_applicants = service.get_applicants_trend(session, trend_params)
            second_applicants = service.get_applicants_trend(session, trend_params)
            first_cutoff = service.get_cutoff_trend(session, trend_params)
            second_cutoff = service.get_cutoff_trend(session, trend_params)

        self.assertEqual(first_overview.model_dump(), second_overview.model_dump())
        self.assertEqual(first_rankings.model_dump(), second_rankings.model_dump())
        self.assertEqual(first_applicants.model_dump(), second_applicants.model_dump())
        self.assertEqual(first_cutoff.model_dump(), second_cutoff.model_dump())
        self.assertEqual(cache.get_calls, 8)
        self.assertEqual(cache.set_calls, 4)

    def test_cache_failure_fallback_and_non_cached_services(self) -> None:
        failing_cache = FakeCacheService(fail_get=True, fail_set=True)
        processes_service = ProcessesService(cache_service=failing_cache)
        academic_service = AcademicStructureService(cache_service=failing_cache)
        rankings_service = RankingsService(cache_service=failing_cache)
        dashboard_service = DashboardService(cache_service=failing_cache)

        with self.session_factory() as session:
            overview = processes_service.get_process_overview(session, 1)
            analytics = academic_service.get_major_analytics(
                session, major_id=100, process_id=None
            )
            trends = academic_service.get_major_trends(
                session, major_id=100, metrics=None
            )
            rankings = rankings_service.list_major_rankings(
                session,
                MajorRankingsParams(process_id=1, metric="applicants"),
            )
            dashboard_overview = dashboard_service.get_overview(
                session, DashboardScopedParams(process_id=1)
            )
            dashboard_rankings = dashboard_service.get_rankings(
                session, DashboardRankingsParams(process_id=1)
            )
            dashboard_applicants_trend = dashboard_service.get_applicants_trend(
                session, DashboardTrendParams()
            )
            dashboard_cutoff_trend = dashboard_service.get_cutoff_trend(
                session, DashboardTrendParams()
            )

        self.assertEqual(overview.total_applicants, 3)
        self.assertIsNotNone(analytics)
        self.assertIsNotNone(trends)
        self.assertGreaterEqual(len(rankings.items), 1)
        self.assertEqual(dashboard_overview.metrics.total_applicants, 3)
        self.assertGreaterEqual(len(dashboard_rankings.most_competitive), 1)
        self.assertGreaterEqual(len(dashboard_applicants_trend.items), 1)
        self.assertGreaterEqual(len(dashboard_cutoff_trend.items), 1)

        # Ensure out-of-scope services remain uncached.
        self.assertFalse(hasattr(ResultsService(), "cache_service"))
        self.assertFalse(hasattr(ResultsImportService(), "cache_service"))

    def test_cache_service_disabled_mode_and_ttl(self) -> None:
        client_disabled = FakeValkeyClient()
        disabled_cache = CacheService(
            client=client_disabled, enabled=False, default_ttl_seconds=321
        )
        self.assertIsNone(disabled_cache.get_json("k1"))
        self.assertFalse(disabled_cache.set_json("k1", {"value": 1}))
        self.assertEqual(client_disabled.get_calls, 0)
        self.assertEqual(client_disabled.set_calls, 0)

        client_enabled = FakeValkeyClient()
        enabled_cache = CacheService(
            client=client_enabled, enabled=True, default_ttl_seconds=120
        )
        self.assertTrue(enabled_cache.set_json("k2", {"value": 2}))
        self.assertEqual(client_enabled.last_ex, 120)
        self.assertEqual(enabled_cache.get_json("k2"), {"value": 2})


if __name__ == "__main__":
    unittest.main()
