from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.schemas.academic_structure import AcademicAreaResponse, FacultyResponse, MajorResponse
from app.services.academic_structure import AcademicStructureService

router = APIRouter(tags=["academic-structure"])


def get_academic_structure_service() -> AcademicStructureService:
    return AcademicStructureService()


@router.get("/areas", response_model=list[AcademicAreaResponse], summary="List academic areas")
def list_areas(
    db: Session = Depends(get_db_session),
    service: AcademicStructureService = Depends(get_academic_structure_service),
) -> list[AcademicAreaResponse]:
    return service.list_areas(db)


@router.get("/areas/{area_id}", response_model=AcademicAreaResponse, summary="Get academic area by ID")
def get_area(
    area_id: int,
    db: Session = Depends(get_db_session),
    service: AcademicStructureService = Depends(get_academic_structure_service),
) -> AcademicAreaResponse:
    area = service.get_area(db, area_id)
    if area is None:
        raise HTTPException(status_code=404, detail="Academic area not found")
    return area


@router.get("/faculties", response_model=list[FacultyResponse], summary="List faculties")
def list_faculties(
    academic_area_id: int | None = Query(default=None),
    db: Session = Depends(get_db_session),
    service: AcademicStructureService = Depends(get_academic_structure_service),
) -> list[FacultyResponse]:
    return service.list_faculties(db, academic_area_id=academic_area_id)


@router.get("/faculties/{faculty_id}", response_model=FacultyResponse, summary="Get faculty by ID")
def get_faculty(
    faculty_id: int,
    db: Session = Depends(get_db_session),
    service: AcademicStructureService = Depends(get_academic_structure_service),
) -> FacultyResponse:
    faculty = service.get_faculty(db, faculty_id)
    if faculty is None:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return faculty


@router.get("/majors", response_model=list[MajorResponse], summary="List majors")
def list_majors(
    faculty_id: int | None = Query(default=None),
    academic_area_id: int | None = Query(default=None),
    db: Session = Depends(get_db_session),
    service: AcademicStructureService = Depends(get_academic_structure_service),
) -> list[MajorResponse]:
    return service.list_majors(
        db,
        faculty_id=faculty_id,
        academic_area_id=academic_area_id,
    )


@router.get("/majors/{major_id}", response_model=MajorResponse, summary="Get major by ID")
def get_major(
    major_id: int,
    db: Session = Depends(get_db_session),
    service: AcademicStructureService = Depends(get_academic_structure_service),
) -> MajorResponse:
    major = service.get_major(db, major_id)
    if major is None:
        raise HTTPException(status_code=404, detail="Major not found")
    return major
