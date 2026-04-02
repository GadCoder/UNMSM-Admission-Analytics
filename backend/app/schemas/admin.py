from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class AdminAcademicAreaCreateRequest(BaseModel):
    name: str
    slug: str


class AdminAcademicAreaUpdateRequest(BaseModel):
    name: str
    slug: str
    version_token: datetime


class AdminAcademicAreaResponse(BaseModel):
    id: int
    name: str
    slug: str
    updated_at: datetime


class AdminFacultyCreateRequest(BaseModel):
    name: str
    slug: str
    academic_area_id: int


class AdminFacultyUpdateRequest(BaseModel):
    name: str
    slug: str
    academic_area_id: int
    version_token: datetime


class AdminFacultyResponse(BaseModel):
    id: int
    name: str
    slug: str
    academic_area_id: int
    updated_at: datetime


class AdminMajorCreateRequest(BaseModel):
    name: str
    slug: str
    faculty_id: int
    is_active: bool = True


class AdminMajorUpdateRequest(BaseModel):
    name: str
    slug: str
    faculty_id: int
    is_active: bool
    version_token: datetime


class AdminMajorResponse(BaseModel):
    id: int
    name: str
    slug: str
    faculty_id: int
    is_active: bool
    updated_at: datetime


class AdminAdmissionProcessCreateRequest(BaseModel):
    year: int
    cycle: Literal["I", "II"]
    is_published: bool = False


class AdminAdmissionProcessUpdateRequest(BaseModel):
    year: int
    cycle: Literal["I", "II"]
    is_published: bool
    version_token: datetime


class AdminAdmissionProcessResponse(BaseModel):
    id: int
    year: int
    cycle: str
    label: str
    is_published: bool
    updated_at: datetime
