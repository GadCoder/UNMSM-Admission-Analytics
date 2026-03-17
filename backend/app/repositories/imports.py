from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.academic import Major
from app.models.admission import AdmissionProcess, AdmissionResult


@dataclass(frozen=True)
class AdmissionResultInsertPayload:
    admission_process_id: int
    major_id: int
    candidate_code: str
    candidate_lastnames: str
    candidate_names: str
    score: Decimal
    merit_rank: int | None
    observation_raw: str | None
    is_admitted: bool
    row_number: int


class ResultsImportRepository:
    def get_process_by_id(self, db: Session, process_id: int) -> AdmissionProcess | None:
        stmt = select(AdmissionProcess).where(AdmissionProcess.id == process_id)
        return db.scalar(stmt)

    def get_major_name_map(self, db: Session) -> dict[str, int]:
        stmt: Select = select(Major.id, Major.name)
        return {name.strip(): major_id for major_id, name in db.execute(stmt).all()}

    def insert_admission_result(self, db: Session, payload: AdmissionResultInsertPayload) -> None:
        entity = AdmissionResult(
            admission_process_id=payload.admission_process_id,
            major_id=payload.major_id,
            candidate_code=payload.candidate_code,
            candidate_lastnames=payload.candidate_lastnames,
            candidate_names=payload.candidate_names,
            score=payload.score,
            merit_rank=payload.merit_rank,
            observation_raw=payload.observation_raw,
            is_admitted=payload.is_admitted,
            row_number=payload.row_number,
        )
        db.add(entity)
        db.flush()
