from fastapi import APIRouter

from app.api.routes.academic_structure import router as academic_structure_router
from app.api.routes.health import router as health_router
from app.api.routes.processes import router as processes_router
from app.api.routes.results import router as results_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(academic_structure_router)
api_router.include_router(processes_router)
api_router.include_router(results_router)
