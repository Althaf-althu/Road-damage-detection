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
from app.api.geotech_advisor import router as geotech_advisor_router

logger = logging.getLogger(__name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {api_keys.REGION_AUTHORITY} Road Damage System")
    logger.info(f"Region: {api_keys.REGION_DISPLAY_NAME} | OSM Relation: {api_keys.REGION_OSM_RELATION_ID}")
    try:
        from app.database import Base, engine, SessionLocal
        import app.models
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully in PostgreSQL.")

        # Automatically ensure admin credentials exist from environment variables
        admin_email = os.getenv("ADMIN_EMAIL")
        admin_pass = os.getenv("ADMIN_PASSWORD")
        admin_name = os.getenv("ADMIN_NAME", "Administrator")
        if admin_email and admin_pass:
            from app.models.user import User
            from app.services.auth_service import hash_password
            with SessionLocal() as session:
                admin_user = session.query(User).filter(User.email == admin_email).first()
                if not admin_user:
                    new_admin = User(
                        email=admin_email,
                        password_hash=hash_password(admin_pass),
                        full_name=admin_name,
                        role="admin",
                        is_active=True,
                    )
                    session.add(new_admin)
                    session.commit()
                    logger.info(f"Auto-seeded admin user on startup: {admin_email}")
                else:
                    admin_user.password_hash = hash_password(admin_pass)
                    admin_user.full_name = admin_name
                    admin_user.role = "admin"
                    admin_user.is_active = True
                    session.commit()
                    logger.info(f"Verified and updated admin credentials on startup: {admin_email}")
    except Exception as e:
        logger.warning(f"Database startup initialization note: {e}")
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
        "http://localhost",
        "http://127.0.0.1",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
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
app.include_router(geotech_advisor_router)

