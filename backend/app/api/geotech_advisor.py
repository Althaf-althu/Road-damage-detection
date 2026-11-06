from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.models.road_segment import RoadSegment
from app.models.work_order import GeotechProfile
from app.models.user import User
from app.services.auth_service import require_admin
from app.services.geotech_service import gather_geotechnical_telemetry
from app.services.llm_consultant import query_gemini_geotech_advisor
from app.schemas.geotech_schema import (
    GeotechAdviseRequest,
    GeotechProfileResponse,
    AIAdvisoryResponse,
)

router = APIRouter(prefix="/api/v1/geotech", tags=["Geotechnical AI Advisor"])


@router.post("/advise", response_model=GeotechProfileResponse)
def get_geotechnical_advisory(
    req: GeotechAdviseRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Ingests environmental and geotechnical telemetry (Copernicus DEM slope, ISRIC SoilGrids,
    Open-Meteo hydrology) and produces IRC-compliant structural pavement recommendations via Gemini AI.
    Caches profiles in geotech_profiles table.
    """
    road: Optional[RoadSegment] = None
    lat: float = 0.0
    lon: float = 0.0

    # 1. Resolve Road Segment
    if req.road_segment_id:
        road = db.query(RoadSegment).filter(RoadSegment.id == req.road_segment_id).first()
        if not road:
            raise HTTPException(status_code=404, detail="Road segment corridor not found")
        # Extract centroid coordinates of road segment
        coord_query = text("""
            SELECT 
                ST_Y(ST_Centroid(geom)) AS lat,
                ST_X(ST_Centroid(geom)) AS lon
            FROM road_segments
            WHERE id = :id;
        """)
        c_row = db.execute(coord_query, {"id": road.id}).fetchone()
        lat = c_row.lat
        lon = c_row.lon
    elif req.latitude is not None and req.longitude is not None:
        lat = req.latitude
        lon = req.longitude
        # Snap to nearest road
        snap_query = text("""
            SELECT id::text
            FROM road_segments
            WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 100.0)
            ORDER BY ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) ASC
            LIMIT 1;
        """)
        snap_row = db.execute(snap_query, {"lat": lat, "lon": lon}).fetchone()
        if snap_row:
            road = db.query(RoadSegment).filter(RoadSegment.id == snap_row.id).first()
    else:
        raise HTTPException(
            status_code=400,
            detail="Either road_segment_id or latitude/longitude coordinates must be provided."
        )

    # 2. Check Cache in geotech_profiles Table
    cached_profile = None
    if road:
        cached_profile = db.query(GeotechProfile).filter(GeotechProfile.road_segment_id == road.id).first()

    # If cached within the last 7 days and not forced refresh, return cached advisory
    if cached_profile and not req.force_refresh and cached_profile.ai_advisory_payload:
        cache_age = datetime.utcnow() - cached_profile.updated_at.replace(tzinfo=None) if cached_profile.updated_at else timedelta(days=999)
        if cache_age < timedelta(days=7):
            return GeotechProfileResponse(
                road_segment_id=str(road.id),
                road_name=road.road_name,
                road_class=road.road_class,
                elevation_m=cached_profile.elevation_m or 15.0,
                slope_percentage=cached_profile.slope_percentage or 1.0,
                soil_texture=cached_profile.soil_texture or "Laterite Subgrade",
                clay_percent=cached_profile.clay_percent or 32.0,
                silt_percent=cached_profile.silt_percent or 25.0,
                sand_percent=cached_profile.sand_percent or 43.0,
                cbr_estimate=cached_profile.cbr_estimate or 5.0,
                water_retention_capacity=cached_profile.water_retention_capacity or "Moderate",
                soil_moisture_index=cached_profile.soil_moisture_index or 0.35,
                ai_advisory=AIAdvisoryResponse(**cached_profile.ai_advisory_payload),
                cached=True,
                updated_at=cached_profile.updated_at or datetime.utcnow(),
            )

    # 3. Gather Live Telemetry from Open APIs (DEM, SoilGrids, Open-Meteo)
    telemetry = gather_geotechnical_telemetry(lat, lon)

    # 4. Invoke Domain-Tuned Gemini AI Consultant
    road_name = road.road_name if road else "Kerala Highway Corridor"
    road_class = road.road_class if road else "primary"
    adt = road.adt_volume if road else 5000

    ai_advisory = query_gemini_geotech_advisor(
        road_name=road_name,
        road_class=road_class,
        adt_volume=adt,
        elevation_m=telemetry["elevation_m"],
        slope_percentage=telemetry["slope_percentage"],
        soil_texture=telemetry["soil_texture"],
        clay_percent=telemetry["clay_percent"],
        silt_percent=telemetry["silt_percent"],
        sand_percent=telemetry["sand_percent"],
        cbr_estimate=telemetry["cbr_estimate"],
        water_retention=telemetry["water_retention_capacity"],
        moisture_index=telemetry["soil_moisture_index"],
    )

    # 5. Persist / Update Geotech Profile
    now = datetime.utcnow()
    if road:
        if not cached_profile:
            cached_profile = GeotechProfile(
                road_segment_id=road.id,
                elevation_m=telemetry["elevation_m"],
                slope_percentage=telemetry["slope_percentage"],
                soil_texture=telemetry["soil_texture"],
                clay_percent=telemetry["clay_percent"],
                silt_percent=telemetry["silt_percent"],
                sand_percent=telemetry["sand_percent"],
                cbr_estimate=telemetry["cbr_estimate"],
                water_retention_capacity=telemetry["water_retention_capacity"],
                soil_moisture_index=telemetry["soil_moisture_index"],
                ai_advisory_payload=ai_advisory,
                updated_at=now,
            )
            db.add(cached_profile)
        else:
            cached_profile.elevation_m = telemetry["elevation_m"]
            cached_profile.slope_percentage = telemetry["slope_percentage"]
            cached_profile.soil_texture = telemetry["soil_texture"]
            cached_profile.clay_percent = telemetry["clay_percent"]
            cached_profile.silt_percent = telemetry["silt_percent"]
            cached_profile.sand_percent = telemetry["sand_percent"]
            cached_profile.cbr_estimate = telemetry["cbr_estimate"]
            cached_profile.water_retention_capacity = telemetry["water_retention_capacity"]
            cached_profile.soil_moisture_index = telemetry["soil_moisture_index"]
            cached_profile.ai_advisory_payload = ai_advisory
            cached_profile.updated_at = now

        db.commit()

    return GeotechProfileResponse(
        road_segment_id=str(road.id) if road else "custom-coords",
        road_name=road_name,
        road_class=road_class,
        elevation_m=telemetry["elevation_m"],
        slope_percentage=telemetry["slope_percentage"],
        soil_texture=telemetry["soil_texture"],
        clay_percent=telemetry["clay_percent"],
        silt_percent=telemetry["silt_percent"],
        sand_percent=telemetry["sand_percent"],
        cbr_estimate=telemetry["cbr_estimate"],
        water_retention_capacity=telemetry["water_retention_capacity"],
        soil_moisture_index=telemetry["soil_moisture_index"],
        ai_advisory=AIAdvisoryResponse(**ai_advisory),
        cached=False,
        updated_at=now,
    )


@router.get("/candidate-corridors")
def list_candidate_corridors(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Returns high-priority or chronically damaged road corridors for geotechnical analysis.
    """
    query = text("""
        SELECT 
            r.id::text AS road_segment_id,
            r.road_name,
            r.road_class,
            r.adt_volume,
            COUNT(dc.id) AS defect_count,
            COALESCE(MAX(dc.priority_score), 0.0) AS max_priority_score
        FROM road_segments r
        LEFT JOIN defect_complaints dc ON dc.road_segment_id = r.id
        GROUP BY r.id, r.road_name, r.road_class, r.adt_volume
        ORDER BY defect_count DESC, max_priority_score DESC
        LIMIT 25;
    """)

    results = db.execute(query).fetchall()

    return [
        {
            "road_segment_id": r.road_segment_id,
            "road_name": r.road_name,
            "road_class": r.road_class,
            "adt_volume": r.adt_volume,
            "defect_count": r.defect_count,
            "max_priority_score": round(r.max_priority_score, 1),
        }
        for r in results
    ]
