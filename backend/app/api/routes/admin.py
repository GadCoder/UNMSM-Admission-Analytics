from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_admin
from app.core.db import get_db_session
from app.schemas.admin import (
    AdminAdmissionProcessCreateRequest,
    AdminAdmissionProcessResponse,
    AdminAdmissionProcessUpdateRequest,
    AdminAcademicAreaCreateRequest,
    AdminAcademicAreaResponse,
    AdminAcademicAreaUpdateRequest,
    AdminFacultyCreateRequest,
    AdminFacultyResponse,
    AdminFacultyUpdateRequest,
    AdminMajorCreateRequest,
    AdminMajorResponse,
    AdminMajorUpdateRequest,
)
from app.schemas.auth import AuthenticatedAdmin
from app.services.admin import (
    AdminConflictError,
    AdminResourceNotFoundError,
    AdminService,
    AdminValidationError,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def get_admin_service() -> AdminService:
    return AdminService()


@router.get(
    "/processes",
    response_model=list[AdminAdmissionProcessResponse],
    summary="List admission processes for admin",
)
def admin_list_processes(
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> list[AdminAdmissionProcessResponse]:
    return service.list_processes(db)


@router.post(
    "/processes",
    response_model=AdminAdmissionProcessResponse,
    summary="Create admission process",
)
def admin_create_process(
    payload: AdminAdmissionProcessCreateRequest,
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> AdminAdmissionProcessResponse:
    try:
        return service.create_process(
            db,
            year=payload.year,
            cycle=payload.cycle,
            is_published=payload.is_published,
        )
    except AdminValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.put(
    "/processes/{process_id}",
    response_model=AdminAdmissionProcessResponse,
    summary="Update admission process",
)
def admin_update_process(
    process_id: int,
    payload: AdminAdmissionProcessUpdateRequest,
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> AdminAdmissionProcessResponse:
    try:
        return service.update_process(
            db,
            process_id=process_id,
            year=payload.year,
            cycle=payload.cycle,
            is_published=payload.is_published,
            version_token=payload.version_token,
        )
    except AdminResourceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except AdminValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get(
    "/areas",
    response_model=list[AdminAcademicAreaResponse],
    summary="List areas for admin",
)
def admin_list_areas(
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> list[AdminAcademicAreaResponse]:
    return service.list_areas(db)


@router.post("/areas", response_model=AdminAcademicAreaResponse, summary="Create area")
def admin_create_area(
    payload: AdminAcademicAreaCreateRequest,
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> AdminAcademicAreaResponse:
    try:
        return service.create_area(db, name=payload.name, slug=payload.slug)
    except AdminValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.put(
    "/areas/{area_id}", response_model=AdminAcademicAreaResponse, summary="Update area"
)
def admin_update_area(
    area_id: int,
    payload: AdminAcademicAreaUpdateRequest,
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> AdminAcademicAreaResponse:
    try:
        return service.update_area(
            db,
            area_id=area_id,
            name=payload.name,
            slug=payload.slug,
            version_token=payload.version_token,
        )
    except AdminResourceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except AdminValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get(
    "/faculties",
    response_model=list[AdminFacultyResponse],
    summary="List faculties for admin",
)
def admin_list_faculties(
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> list[AdminFacultyResponse]:
    return service.list_faculties(db)


@router.post(
    "/faculties", response_model=AdminFacultyResponse, summary="Create faculty"
)
def admin_create_faculty(
    payload: AdminFacultyCreateRequest,
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> AdminFacultyResponse:
    try:
        return service.create_faculty(
            db,
            name=payload.name,
            slug=payload.slug,
            academic_area_id=payload.academic_area_id,
        )
    except AdminResourceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.put(
    "/faculties/{faculty_id}",
    response_model=AdminFacultyResponse,
    summary="Update faculty",
)
def admin_update_faculty(
    faculty_id: int,
    payload: AdminFacultyUpdateRequest,
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> AdminFacultyResponse:
    try:
        return service.update_faculty(
            db,
            faculty_id=faculty_id,
            name=payload.name,
            slug=payload.slug,
            academic_area_id=payload.academic_area_id,
            version_token=payload.version_token,
        )
    except AdminResourceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except AdminValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get(
    "/majors", response_model=list[AdminMajorResponse], summary="List majors for admin"
)
def admin_list_majors(
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> list[AdminMajorResponse]:
    return service.list_majors(db)


@router.post("/majors", response_model=AdminMajorResponse, summary="Create major")
def admin_create_major(
    payload: AdminMajorCreateRequest,
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> AdminMajorResponse:
    try:
        return service.create_major(
            db,
            name=payload.name,
            slug=payload.slug,
            faculty_id=payload.faculty_id,
            is_active=payload.is_active,
        )
    except AdminResourceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.put(
    "/majors/{major_id}", response_model=AdminMajorResponse, summary="Update major"
)
def admin_update_major(
    major_id: int,
    payload: AdminMajorUpdateRequest,
    db: Session = Depends(get_db_session),
    service: AdminService = Depends(get_admin_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> AdminMajorResponse:
    try:
        return service.update_major(
            db,
            major_id=major_id,
            name=payload.name,
            slug=payload.slug,
            faculty_id=payload.faculty_id,
            is_active=payload.is_active,
            version_token=payload.version_token,
        )
    except AdminResourceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AdminConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except AdminValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
