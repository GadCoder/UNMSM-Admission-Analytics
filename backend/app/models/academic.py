from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Index, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import TimestampMixin


class AcademicArea(TimestampMixin, Base):
    __tablename__ = "academic_areas"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(140), nullable=False, unique=True)

    faculties: Mapped[list[Faculty]] = relationship(back_populates="academic_area")


class Faculty(TimestampMixin, Base):
    __tablename__ = "faculties"
    __table_args__ = (
        UniqueConstraint("academic_area_id", "name", name="uq_faculties_academic_area_name"),
        Index("ix_faculties_academic_area_id", "academic_area_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    academic_area_id: Mapped[int] = mapped_column(
        ForeignKey("academic_areas.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), nullable=False, unique=True)

    academic_area: Mapped[AcademicArea] = relationship(back_populates="faculties")
    majors: Mapped[list[Major]] = relationship(back_populates="faculty")


class Major(TimestampMixin, Base):
    __tablename__ = "majors"
    __table_args__ = (
        UniqueConstraint("faculty_id", "name", name="uq_majors_faculty_name"),
        Index("ix_majors_faculty_id", "faculty_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    faculty: Mapped[Faculty] = relationship(back_populates="majors")
