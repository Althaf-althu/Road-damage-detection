from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.config_apis import app_config

router = APIRouter(prefix="/api/v1/road-inspector", tags=["Road Inspector"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class SnapRequest(BaseModel):
    latitude: float
    longitude: float
    search_radius_m: Optional[float] = None  # None → uses DEFAULT_SNAP_RADIUS_M


class SnappedRoadResponse(BaseModel):
    road_segment_id: str
    road_name: str
    road_class: str
    speed_limit: int
    adt_volume: int
    snapped_lat: float
    snapped_lon: float
    distance_to_road_m: float
    segment_geojson: dict


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/snap", response_model=SnappedRoadResponse)
def snap_coordinates_to_road(req: SnapRequest, db: Session = Depends(get_db)):
    """
    Snap raw GPS coordinates to the nearest road segment within search radius.
    Uses PostGIS ST_ClosestPoint and ST_DWithin for sub-metre precision.
    """
    radius = req.search_radius_m or app_config.DEFAULT_SNAP_RADIUS_M

    query = text("""
        SELECT
            r.id::text                                                          AS road_segment_id,
            r.road_name,
            r.road_class,
            r.speed_limit_kmh                                                   AS speed_limit,
            r.adt_volume,
            ST_Y(ST_ClosestPoint(r.geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))) AS snapped_lat,
            ST_X(ST_ClosestPoint(r.geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))) AS snapped_lon,
            ST_Distance(
                r.geom::geography,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
            )                                                                   AS distance_to_road_m,
            ST_AsGeoJSON(r.geom)::json                                          AS segment_geojson
        FROM road_segments r
        WHERE ST_DWithin(
            r.geom::geography,
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
            :radius
        )
        ORDER BY distance_to_road_m ASC
        LIMIT 1;
    """)

    result = db.execute(query, {"lat": req.latitude, "lon": req.longitude, "radius": radius}).fetchone()

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No road segment found within {radius}m of the provided coordinates."
        )

    return SnappedRoadResponse(
        road_segment_id=result.road_segment_id,
        road_name=result.road_name,
        road_class=result.road_class,
        speed_limit=result.speed_limit,
        adt_volume=result.adt_volume,
        snapped_lat=result.snapped_lat,
        snapped_lon=result.snapped_lon,
        distance_to_road_m=round(result.distance_to_road_m, 2),
        segment_geojson=result.segment_geojson,
    )


@router.get("/segment-status-map")
def get_segment_status_map(db: Session = Depends(get_db)):
    """
    Returns a GeoJSON FeatureCollection of all road segments colour-coded by
    their current operational status:
      red    → Active damage (SUBMITTED / UNDER_REVIEW)
      yellow → Under maintenance (SCHEDULED / IN_PROGRESS)
      green  → Recently resolved (RESOLVED within RESOLVED_GREEN_DAYS days)
      default → No active issues
    Only segments with complaints are included; default segments are rendered
    by the frontend using the base CartoDB tile.
    """
    days = app_config.RESOLVED_GREEN_DAYS
    query = text(f"""
        WITH segment_colours AS (
            SELECT
                dc.road_segment_id,
                CASE
                    WHEN bool_or(dc.status IN ('SUBMITTED', 'UNDER_REVIEW'))  THEN 'red'
                    WHEN bool_or(dc.status IN ('SCHEDULED', 'IN_PROGRESS'))   THEN 'yellow'
                    WHEN bool_or(
                        dc.status = 'RESOLVED'
                        AND dc.resolved_at >= NOW() - INTERVAL '{days} days'
                    )                                                          THEN 'green'
                    ELSE 'default'
                END AS status_colour
            FROM defect_complaints dc
            WHERE dc.road_segment_id IS NOT NULL
            GROUP BY dc.road_segment_id
        )
        SELECT
            r.id::text                      AS road_segment_id,
            r.road_name,
            r.road_class,
            sc.status_colour,
            ST_AsGeoJSON(r.geom)::json      AS geometry
        FROM segment_colours sc
        JOIN road_segments r ON r.id = sc.road_segment_id
        WHERE sc.status_colour != 'default';
    """)

    rows = db.execute(query).fetchall()

    features = [
        {
            "type": "Feature",
            "geometry": row.geometry,
            "properties": {
                "road_segment_id": row.road_segment_id,
                "road_name": row.road_name,
                "road_class": row.road_class,
                "status_colour": row.status_colour,
            },
        }
        for row in rows
    ]

    return {"type": "FeatureCollection", "features": features}

