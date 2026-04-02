from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.academic import Major
from app.models.base import TimestampMixin


class AdmissionProcess(TimestampMixin, Base):
    __tablename__ = "admission_processes"
    __table_args__ = (
        UniqueConstraint("year", "cycle", name="uq_admission_processes_year_cycle"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    cycle: Mapped[str] = mapped_column(String(12), nullable=False)
    label: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    exam_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    results: Mapped[list[AdmissionResult]] = relationship(back_populates="admission_process")


class AdmissionResult(TimestampMixin, Base):
    __tablename__ = "admission_results"
    __table_args__ = (
        UniqueConstraint(
            "admission_process_id",
            "major_id",
            "candidate_code",
            name="uq_admission_results_process_major_candidate",
        ),
        Index("ix_admission_results_admission_process_id", "admission_process_id"),
        Index("ix_admission_results_major_id", "major_id"),
        Index("ix_admission_results_score", "score"),
        Index("ix_admission_results_candidate_code", "candidate_code"),
        Index("ix_admission_results_is_admitted", "is_admitted"),
        Index(
            "ix_admission_results_process_major",
            "admission_process_id",
            "major_id",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    admission_process_id: Mapped[int] = mapped_column(
        ForeignKey("admission_processes.id", ondelete="RESTRICT"),
        nullable=False,
    )
    major_id: Mapped[int] = mapped_column(ForeignKey("majors.id", ondelete="RESTRICT"), nullable=False)
    candidate_code: Mapped[str] = mapped_column(String(64), nullable=False)
    candidate_lastnames: Mapped[str] = mapped_column(String(160), nullable=False)
    candidate_names: Mapped[str] = mapped_column(String(160), nullable=False)
    score: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    merit_rank: Mapped[int | None] = mapped_column(Integer, nullable=True)
    observation_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_admitted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    row_number: Mapped[int | None] = mapped_column(Integer, nullable=True)

    admission_process: Mapped[AdmissionProcess] = relationship(back_populates="results")
    major: Mapped[Major] = relationship()
