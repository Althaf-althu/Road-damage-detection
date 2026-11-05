from fastapi import APIRouter
from sqlalchemy import text
from app.database import SessionLocal
from app.config_apis import api_keys
import redis as redis_lib

router = APIRouter(prefix="/api/v1", tags=["Health"])


@router.get("/health")
def health_check():
    """System health check — verifies DB and Redis connectivity."""
    result = {
        "status": "ok",
        "region": api_keys.REGION_DISPLAY_NAME,
        "authority": api_keys.REGION_AUTHORITY,
        "db": "unknown",
        "redis": "unknown",
    }

    # Check DB
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        result["db"] = "connected"
    except Exception as e:
        result["db"] = f"error: {str(e)}"
        result["status"] = "degraded"

    # Check Redis
    try:
        r = redis_lib.from_url("redis://redis:6379/0", socket_connect_timeout=2)
        r.ping()
        result["redis"] = "connected"
    except Exception as e:
        result["redis"] = f"error: {str(e)}"
        result["status"] = "degraded"

    return result

