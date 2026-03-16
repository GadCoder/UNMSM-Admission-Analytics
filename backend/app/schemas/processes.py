from pydantic import BaseModel, ConfigDict


class AdmissionProcessListItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: int
    cycle: str
    label: str


class AdmissionProcessDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: int
    cycle: str
    label: str


class AdmissionProcessOverviewResponse(BaseModel):
    process: AdmissionProcessDetailResponse
    total_applicants: int
    total_admitted: int
    acceptance_rate: float
    total_majors: int
