from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.rankings import MajorRankingRow, RankingsRepository
from app.schemas.academic_structure import HierarchyContextResponse
from app.schemas.rankings import MajorRankingItemResponse, MajorRankingsParams, MajorRankingsResponse


class RankingsService:
    def __init__(self, repository: RankingsRepository | None = None) -> None:
        self.repository = repository or RankingsRepository()

    def list_major_rankings(self, db: Session, params: MajorRankingsParams) -> MajorRankingsResponse:
        rows = self.repository.list_major_rankings(db, params)
        items = [self._to_item_response(row, rank=index + 1) for index, row in enumerate(rows)]
        return MajorRankingsResponse(items=items)

    def _to_item_response(self, row: MajorRankingRow, rank: int) -> MajorRankingItemResponse:
        return MajorRankingItemResponse(
            rank=rank,
            major=HierarchyContextResponse(id=row.major_id, name=row.major_name, slug=row.major_slug),
            faculty=HierarchyContextResponse(id=row.faculty_id, name=row.faculty_name, slug=row.faculty_slug),
            academic_area=HierarchyContextResponse(
                id=row.academic_area_id,
                name=row.academic_area_name,
                slug=row.academic_area_slug,
            ),
            applicants=row.applicants,
            admitted=row.admitted,
            acceptance_rate=row.acceptance_rate,
            cutoff_score=float(row.cutoff_score) if row.cutoff_score is not None else None,
        )
