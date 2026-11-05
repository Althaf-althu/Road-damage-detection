from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.services.auth_service import require_admin
from app.schemas.work_order_schema import PrioritizationMetricsResponse

router = APIRouter(prefix="/api/v1/prioritization", tags=["Prioritization"])


@router.get("/metrics", response_model=PrioritizationMetricsResponse)
def get_prioritization_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Returns aggregate war room operational KPI telemetry across Kerala road networks.
    """
    query = text("""
        SELECT
            COUNT(*) FILTER (WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'IN_PROGRESS')) AS total_active,
            COUNT(*) FILTER (WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'IN_PROGRESS') AND priority_score >= 75.0) AS critical_count,
            COUNT(*) FILTER (WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'IN_PROGRESS') AND priority_score >= 50.0 AND priority_score < 75.0) AS moderate_count,
            COUNT(*) FILTER (WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'IN_PROGRESS') AND priority_score < 50.0) AS routine_count,
            COUNT(*) FILTER (WHERE status IN ('SCHEDULED', 'IN_PROGRESS')) AS under_maintenance_count,
            COUNT(*) FILTER (WHERE status = 'RESOLVED' AND resolved_at >= NOW() - INTERVAL '30 days') AS resolved_past_month,
            COALESCE(AVG(priority_score) FILTER (WHERE status IN ('SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'IN_PROGRESS')), 0.0) AS avg_score
        FROM defect_complaints;
    """)

    row = db.execute(query).fetchone()

    # Find highest risk corridor
    corridor_query = text("""
        SELECT r.road_name, MAX(dc.priority_score) AS max_score
        FROM defect_complaints dc
        JOIN road_segments r ON r.id = dc.road_segment_id
        WHERE dc.status IN ('SUBMITTED', 'UNDER_REVIEW')
        GROUP BY r.road_name
        ORDER BY max_score DESC
        LIMIT 1;
    """)
    corridor_row = db.execute(corridor_query).fetchone()
    highest_corridor = corridor_row.road_name if corridor_row else "Nominal State (No Active Critical Hazards)"

    return PrioritizationMetricsResponse(
        total_active_complaints=row.total_active or 0,
        critical_count=row.critical_count or 0,
        moderate_count=row.moderate_count or 0,
        routine_count=row.routine_count or 0,
        under_maintenance_count=row.under_maintenance_count or 0,
        resolved_past_month=row.resolved_past_month or 0,
        average_priority_score=round(float(row.avg_score or 0.0), 1),
        highest_risk_corridor=highest_corridor,
    )


@router.get("/ranked-queue")
def get_ranked_prioritization_queue(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Returns ranked queue of active defects ordered by MCDA Priority Score (highest urgency first).
    """
    query = text("""
        SELECT
            dc.id::text,
            dc.ticket_id,
            COALESCE(r.road_name, 'Unassigned Road') AS road_name,
            COALESCE(r.road_class, 'unclassified')   AS road_class,
            COALESCE(r.speed_limit_kmh, 50)          AS speed_limit,
            COALESCE(r.adt_volume, 1500)             AS adt_volume,
            COALESCE(r.is_sensitive_zone, FALSE)     AS is_sensitive_zone,
            dc.defect_type,
            dc.severity_area_sqm,
            dc.severity_depth_cm,
            dc.uncertainty_score,
            dc.priority_score,
            dc.status,
            dc.upvote_count,
            dc.raw_lat,
            dc.raw_lon,
            ST_Y(dc.snapped_point) AS snapped_lat,
            ST_X(dc.snapped_point) AS snapped_lon,
            dc.media_url,
            dc.created_at,
            ST_AsGeoJSON(r.geom)::json AS segment_geojson
        FROM defect_complaints dc
        LEFT JOIN road_segments r ON r.id = dc.road_segment_id
        WHERE dc.status IN ('SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'IN_PROGRESS')
        ORDER BY dc.priority_score DESC, dc.created_at ASC
        LIMIT :limit;
    """)

    results = db.execute(query, {"limit": limit}).fetchall()

    return [
        {
            "id": r.id,
            "ticket_id": r.ticket_id,
            "road_name": r.road_name,
            "road_class": r.road_class,
            "speed_limit": r.speed_limit,
            "adt_volume": r.adt_volume,
            "is_sensitive_zone": r.is_sensitive_zone,
            "defect_type": r.defect_type or "pothole",
            "severity_area_sqm": round(r.severity_area_sqm or 0.0, 2),
            "severity_depth_cm": round(r.severity_depth_cm or 0.0, 1),
            "uncertainty_score": round(r.uncertainty_score or 0.0, 2),
            "priority_score": round(r.priority_score or 0.0, 1),
            "status": r.status,
            "upvote_count": r.upvote_count or 1,
            "raw_lat": r.raw_lat,
            "raw_lon": r.raw_lon,
            "snapped_lat": r.snapped_lat or r.raw_lat,
            "snapped_lon": r.snapped_lon or r.raw_lon,
            "media_url": r.media_url,
            "created_at": r.created_at,
            "segment_geojson": r.segment_geojson,
        }
        for r in results
    ]

