from fastapi import APIRouter

from app.api.routes.academic_structure import router as academic_structure_router
from app.api.routes.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(academic_structure_router)
