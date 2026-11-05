from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os

from app.config_apis import api_keys, app_config
from app.database import engine, Base

# Import all models so Alembic/Base can see them
from app.models import User, RoadSegment, DefectComplaint, WorkOrder, GeotechProfile  # noqa: F401

# Import routers
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.road_inspector import router as road_inspector_router
from app.api.complaints import router as complaints_router
from app.api.work_orders import router as work_orders_router
from app.api.prioritization import router as prioritization_router

logger = logging.getLogger(__name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {api_keys.REGION_AUTHORITY} Road Damage System")
    logger.info(f"Region: {api_keys.REGION_DISPLAY_NAME} | OSM Relation: {api_keys.REGION_OSM_RELATION_ID}")
    yield
    logger.info("Shutting down Road Damage System")


app = FastAPI(
    title=f"{api_keys.REGION_DISPLAY_NAME} Road Damage Detection System",
    description=(
        f"End-to-end road damage detection, prioritization, and maintenance tracking system "
        f"for {api_keys.REGION_AUTHORITY}."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for local uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(road_inspector_router)
app.include_router(complaints_router)
app.include_router(work_orders_router)
app.include_router(prioritization_router)
# Phase 5 router:
#   app.include_router(geotech_router)

