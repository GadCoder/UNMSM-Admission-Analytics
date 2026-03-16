from dataclasses import dataclass

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.admission import AdmissionProcess, AdmissionResult


@dataclass(frozen=True)
class ProcessOverviewMetrics:
    total_applicants: int
    total_admitted: int
    acceptance_rate: float
    total_majors: int


class ProcessesRepository:
    def list_processes(self, db: Session) -> list[AdmissionProcess]:
        cycle_rank = case(
            (AdmissionProcess.cycle == "II", 2),
            (AdmissionProcess.cycle == "I", 1),
            else_=0,
        )
        stmt = select(AdmissionProcess).order_by(
            AdmissionProcess.year.desc(),
            cycle_rank.desc(),
            AdmissionProcess.id.desc(),
        )
        return list(db.scalars(stmt).all())

    def get_process_by_id(self, db: Session, process_id: int) -> AdmissionProcess | None:
        stmt = select(AdmissionProcess).where(AdmissionProcess.id == process_id)
        return db.scalar(stmt)

    def get_process_overview_metrics(self, db: Session, process_id: int) -> ProcessOverviewMetrics:
        total_applicants = func.count(AdmissionResult.id)
        total_admitted = func.coalesce(
            func.sum(
                case(
                    (AdmissionResult.is_admitted.is_(True), 1),
                    else_=0,
                )
            ),
            0,
        )
        total_majors = func.count(func.distinct(AdmissionResult.major_id))

        agg_query = (
            select(
                total_applicants.label("total_applicants"),
                total_admitted.label("total_admitted"),
                total_majors.label("total_majors"),
            )
            .where(AdmissionResult.admission_process_id == process_id)
            .subquery()
        )

        acceptance_rate = case(
            (agg_query.c.total_applicants == 0, 0.0),
            else_=(agg_query.c.total_admitted * 1.0) / agg_query.c.total_applicants,
        )
        stmt = select(
            agg_query.c.total_applicants,
            agg_query.c.total_admitted,
            acceptance_rate.label("acceptance_rate"),
            agg_query.c.total_majors,
        )
        row = db.execute(stmt).one()

        return ProcessOverviewMetrics(
            total_applicants=int(row.total_applicants),
            total_admitted=int(row.total_admitted),
            acceptance_rate=float(row.acceptance_rate),
            total_majors=int(row.total_majors),
        )
