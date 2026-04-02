from pydantic import BaseModel, ConfigDict


class AcademicAreaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class FacultyResponse(BaseModel):
    id: int
    name: str
    slug: str
    academic_area_id: int
    academic_area_name: str


class HierarchyContextResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class MajorResponse(BaseModel):
    id: int
    name: str
    slug: str
    is_active: bool
    faculty: HierarchyContextResponse
    academic_area: HierarchyContextResponse
