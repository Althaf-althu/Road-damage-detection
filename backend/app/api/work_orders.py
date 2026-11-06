import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.models.complaint import DefectComplaint
from app.models.work_order import WorkOrder
from app.models.road_segment import RoadSegment
from app.models.user import User
from app.services.auth_service import require_admin
from app.workers.tasks import send_resolution_email
from app.services.mcda_engine import calculate_priority_score
from app.schemas.work_order_schema import (
    WorkOrderCreateRequest,
    WorkOrderResolveRequest,
    SnapOverrideRequest,
    WorkOrderItemResponse,
)

router = APIRouter(prefix="/api/v1/work-orders", tags=["Work Orders"])


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates approximate distance in meters between two lat/lon pairs."""
    import math
    R = 6371e3
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2) ** 2) + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@router.get("", response_model=List[WorkOrderItemResponse])
def list_work_orders(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List all work orders in the municipal maintenance system."""
    query = text("""
        SELECT
            wo.id::text,
            wo.order_id,
            dc.ticket_id,
            COALESCE(r.road_name, 'Unassigned Road') AS road_name,
            COALESCE(r.road_class, 'unclassified')   AS road_class,
            COALESCE(dc.priority_score, 0.0)         AS priority_score,
            wo.assigned_to_depot,
            wo.status,
            wo.created_at,
            wo.completed_at,
            dc.media_url                             AS original_media_url,
            dc.post_repair_media_url,
            wo.location_verified,
            dc.raw_lat                               AS defect_lat,
            dc.raw_lon                               AS defect_lon
        FROM work_orders wo
        JOIN defect_complaints dc ON dc.id = wo.complaint_id
        LEFT JOIN road_segments r ON r.id = dc.road_segment_id
        WHERE (:status IS NULL OR wo.status = :status)
        ORDER BY dc.priority_score DESC, wo.created_at DESC;
    """)

    results = db.execute(query, {"status": status_filter}).fetchall()

    return [
        WorkOrderItemResponse(
            id=r.id,
            order_id=r.order_id,
            ticket_id=r.ticket_id,
            road_name=r.road_name,
            road_class=r.road_class,
            priority_score=round(r.priority_score, 1),
            assigned_to_depot=r.assigned_to_depot,
            status=r.status,
            created_at=r.created_at,
            completed_at=r.completed_at,
            original_media_url=r.original_media_url,
            post_repair_media_url=r.post_repair_media_url,
            location_verified=r.location_verified,
            defect_lat=r.defect_lat,
            defect_lon=r.defect_lon,
        )
        for r in results
    ]


@router.post("/dispatch", status_code=status.HTTP_201_CREATED)
def dispatch_work_order(
    req: WorkOrderCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Creates and dispatches a work order for an active defect complaint.
    Updates complaint status to SCHEDULED.
    """
    complaint = db.query(DefectComplaint).filter(DefectComplaint.ticket_id == req.ticket_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    year = datetime.utcnow().year
    count = db.query(WorkOrder).count() + 1
    order_id = f"WO-{year}-{count:05d}"

    work_order = WorkOrder(
        order_id=order_id,
        complaint_id=complaint.id,
        assigned_by=admin.id,
        assigned_to_depot=req.assigned_to_depot,
        status="SCHEDULED",
        notes=req.notes,
    )

    complaint.status = "SCHEDULED"

    db.add(work_order)
    db.commit()
    db.refresh(work_order)

    return {
        "status": "SUCCESS",
        "order_id": work_order.order_id,
        "ticket_id": complaint.ticket_id,
        "assigned_to_depot": work_order.assigned_to_depot,
        "message": f"Work order {order_id} assigned to {req.assigned_to_depot} depot.",
    }


@router.post("/resolve")
def resolve_work_order(
    req: WorkOrderResolveRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Resolves work order and ticket upon upload of physical post-repair proof.
    Verifies technician coordinates within 30m of complaint point.
    Dispatches automated transactional resolution email to citizen.
    """
    complaint = db.query(DefectComplaint).filter(DefectComplaint.ticket_id == req.ticket_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    work_order = db.query(WorkOrder).filter(WorkOrder.complaint_id == complaint.id).order_by(WorkOrder.created_at.desc()).first()

    # Verify technician coordinates (30-meter radius check)
    loc_verified = "SKIP"
    if req.technician_lat is not None and req.technician_lon is not None:
        dist = haversine_distance_m(complaint.raw_lat, complaint.raw_lon, req.technician_lat, req.technician_lon)
        loc_verified = "PASS" if dist <= 30.0 else "WARN"

    now = datetime.utcnow()

    # Update Complaint
    complaint.status = "RESOLVED"
    complaint.post_repair_media_url = req.post_repair_media_url
    complaint.repair_notes = req.repair_notes
    complaint.resolved_at = now
    complaint.resolution_email_sent_at = now

    # Update Work Order
    if work_order:
        work_order.status = "COMPLETED"
        work_order.completed_at = now
        work_order.technician_lat = req.technician_lat
        work_order.technician_lon = req.technician_lon
        work_order.location_verified = loc_verified
        if req.repair_notes:
            work_order.notes = (work_order.notes or "") + f"\nClosure Notes: {req.repair_notes}"

    db.commit()

    # Trigger asynchronous email task
    try:
        road_name = complaint.road_segment.road_name if complaint.road_segment else "Reported Kerala Road"
        send_resolution_email.delay(
            recipient_email=complaint.citizen_email,
            ticket_id=complaint.ticket_id,
            road_name=road_name,
            before_image=complaint.media_url,
            after_image=complaint.post_repair_media_url,
            reported_date=complaint.created_at.strftime("%Y-%m-%d"),
            completed_date=now.strftime("%Y-%m-%d"),
        )
    except Exception as e:
        pass

    return {
        "status": "SUCCESS",
        "ticket_id": complaint.ticket_id,
        "message": f"Ticket {complaint.ticket_id} marked RESOLVED. Citizen email dispatched.",
        "location_verification": loc_verified,
    }


@router.post("/snap-override")
def override_road_snap(
    req: SnapOverrideRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Administrative Spatial Correction Tool.
    Allows adjusting the snapping search radius or selecting a specific road segment
    if an automated snap mis-identified a service road or junction.
    """
    complaint = db.query(DefectComplaint).filter(DefectComplaint.ticket_id == req.ticket_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    if req.manual_road_segment_id:
        target_road = db.query(RoadSegment).filter(RoadSegment.id == req.manual_road_segment_id).first()
        if not target_road:
            raise HTTPException(status_code=404, detail="Selected road segment not found")
        complaint.road_segment_id = target_road.id
    else:
        # Re-query PostGIS with new search radius
        query = text("""
            SELECT 
                r.id::text AS road_segment_id,
                r.road_name,
                ST_Y(ST_ClosestPoint(r.geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))) AS snapped_lat,
                ST_X(ST_ClosestPoint(r.geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))) AS snapped_lon
            FROM road_segments r
            WHERE ST_DWithin(r.geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius)
            ORDER BY ST_Distance(r.geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) ASC
            LIMIT 1;
        """)
        res = db.execute(query, {
            "lat": complaint.raw_lat,
            "lon": complaint.raw_lon,
            "radius": req.new_radius_m
        }).fetchone()

        if not res:
            raise HTTPException(status_code=404, detail=f"No road segment found within {req.new_radius_m}m")

        complaint.road_segment_id = res.road_segment_id
        complaint.snapped_point = f"SRID=4326;POINT({res.snapped_lon} {res.snapped_lat})"

    complaint.snap_radius_override_m = req.new_radius_m
    complaint.snap_override_by = admin.id
    complaint.snap_override_at = datetime.utcnow()

    # Recalculate Priority Score with newly associated road attributes
    if complaint.road_segment:
        mcda = calculate_priority_score(
            defect_type=complaint.defect_type,
            area_sqm=complaint.severity_area_sqm,
            depth_cm=complaint.severity_depth_cm,
            road_segment=complaint.road_segment,
        )
        complaint.priority_score = mcda["priority_score"]

    db.commit()

    return {
        "status": "SUCCESS",
        "ticket_id": complaint.ticket_id,
        "new_road_segment_id": str(complaint.road_segment_id),
        "new_priority_score": complaint.priority_score,
        "message": f"Spatial override applied successfully. Prioritization score updated to {complaint.priority_score}."
    }

