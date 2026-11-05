from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Tuple
from app.config_apis import app_config


def find_nearby_active_complaint(
    db: Session,
    lat: float,
    lon: float,
    radius_m: Optional[float] = None
) -> Optional[Tuple[dict, float]]:
    """
    Checks if an unresolved complaint exists within `radius_m` (default 30m)
    of the specified coordinates using PostGIS ST_DWithin geography query.
    Returns (complaint_data_dict, distance_m) if found, else None.
    """
    search_radius = radius_m or app_config.DEFAULT_DEDUP_RADIUS_M

    query = text("""
        SELECT
            dc.id::text AS id,
            dc.ticket_id,
            dc.status,
            dc.upvote_count,
            dc.media_url,
            dc.defect_type,
            dc.created_at,
            ST_Distance(
                COALESCE(dc.snapped_point, ST_SetSRID(ST_MakePoint(dc.raw_lon, dc.raw_lat), 4326))::geography,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
            ) AS distance_m
        FROM defect_complaints dc
        WHERE dc.status IN ('SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'IN_PROGRESS')
          AND ST_DWithin(
              COALESCE(dc.snapped_point, ST_SetSRID(ST_MakePoint(dc.raw_lon, dc.raw_lat), 4326))::geography,
              ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
              :radius
          )
        ORDER BY distance_m ASC
        LIMIT 1;
    """)

    result = db.execute(query, {
        "lat": lat,
        "lon": lon,
        "radius": search_radius
    }).fetchone()

    if not result:
        return None

    complaint_data = {
        "id": result.id,
        "ticket_id": result.ticket_id,
        "status": result.status,
        "upvote_count": result.upvote_count,
        "media_url": result.media_url,
        "defect_type": result.defect_type,
        "created_at": result.created_at,
    }
    return complaint_data, round(result.distance_m, 2)

