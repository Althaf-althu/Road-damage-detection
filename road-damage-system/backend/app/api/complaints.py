import os
import uuid
import aiofiles
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

from app.database import get_db
from app.models.complaint import DefectComplaint
from app.models.road_segment import RoadSegment
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.deduplication import find_nearby_active_complaint
from app.workers.tasks import run_ml_inference
from app.config_apis import app_config
from app.schemas.complaint_schema import (
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    DuplicateTicketInfo,
    UpvoteRequest,
    UpvoteResponse,
    ComplaintCreateResponse,
    ComplaintDetailResponse,
)

router = APIRouter(prefix="/api/v1/complaints", tags=["Complaints"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def generate_ticket_id(db: Session) -> str:
    """Generate unique sequential ticket ID in format TKT-YYYY-NNNNN"""
    year = datetime.utcnow().year
    count = db.query(DefectComplaint).count() + 1
    return f"TKT-{year}-{count:05d}"


@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
def check_duplicate_complaint(req: DuplicateCheckRequest, db: Session = Depends(get_db)):
    """
    Checks if an open distress ticket already exists within 30m of the given coordinates.
    """
    match = find_nearby_active_complaint(db, req.latitude, req.longitude, req.search_radius_m)
    if not match:
        return DuplicateCheckResponse(
            is_duplicate=False,
            message="No duplicate active reports found in the immediate 30-meter vicinity."
        )

    complaint_data, distance_m = match
    return DuplicateCheckResponse(
        is_duplicate=True,
        existing_ticket=DuplicateTicketInfo(
            ticket_id=complaint_data["ticket_id"],
            distance_m=distance_m,
            status=complaint_data["status"],
            upvote_count=complaint_data["upvote_count"],
            created_at=complaint_data["created_at"],
            media_url=complaint_data["media_url"],
            defect_type=complaint_data["defect_type"],
        ),
        message=f"An active report already exists {distance_m}m away (Ticket #{complaint_data['ticket_id']})."
    )


@router.post("/upvote", response_model=UpvoteResponse)
def upvote_complaint(req: UpvoteRequest, db: Session = Depends(get_db)):
    """
    Increments upvote count on an existing ticket and attaches citizen email for closure notification.
    """
    complaint = db.query(DefectComplaint).filter(DefectComplaint.ticket_id == req.ticket_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    complaint.upvote_count += 1
    db.commit()
    db.refresh(complaint)

    return UpvoteResponse(
        ticket_id=complaint.ticket_id,
        upvote_count=complaint.upvote_count,
        message=f"Upvote recorded for ticket {complaint.ticket_id}. Total endorsements: {complaint.upvote_count}."
    )


@router.post("/submit", response_model=ComplaintCreateResponse, status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    citizen_email: str = Form(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = None,
):
    """
    Intake citizen complaint with media proof, perform road snapping, save record, and queue ML vision job.
    """
    # 1. Snap coordinates to the nearest road segment within 25m
    snap_query = text("""
        SELECT 
            r.id::text AS road_segment_id,
            r.road_name,
            r.road_class,
            ST_Y(ST_ClosestPoint(r.geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))) AS snapped_lat,
            ST_X(ST_ClosestPoint(r.geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))) AS snapped_lon,
            ST_Distance(r.geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) AS distance_to_road_m
        FROM road_segments r
        WHERE ST_DWithin(r.geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius)
        ORDER BY distance_to_road_m ASC
        LIMIT 1;
    """)

    snap_result = db.execute(snap_query, {
        "lat": latitude,
        "lon": longitude,
        "radius": app_config.DEFAULT_SNAP_RADIUS_M
    }).fetchone()

    # Generate ticket ID
    ticket_id = generate_ticket_id(db)

    # 2. Save media file locally
    file_extension = os.path.splitext(file.filename)[1] or ".jpg"
    safe_filename = f"{ticket_id}_{uuid.uuid4().hex[:8]}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    async with aiofiles.open(file_path, "wb") as buffer:
        content = await file.read()
        await buffer.write(content)

    media_url = f"/uploads/{safe_filename}"
    media_type = "video" if file_extension.lower() in [".mp4", ".mov", ".avi"] else "image"

    # 3. Create complaint record in database
    complaint = DefectComplaint(
        ticket_id=ticket_id,
        citizen_id=current_user.id if current_user else None,
        citizen_email=citizen_email,
        raw_lat=latitude,
        raw_lon=longitude,
        media_url=media_url,
        media_type=media_type,
        status="SUBMITTED",
        upvote_count=1,
    )

    if snap_result:
        complaint.road_segment_id = snap_result.road_segment_id
        complaint.snapped_point = f"SRID=4326;POINT({snap_result.snapped_lon} {snap_result.snapped_lat})"
        road_name = snap_result.road_name
        road_class = snap_result.road_class
        snapped_lat = snap_result.snapped_lat
        snapped_lon = snap_result.snapped_lon
    else:
        road_name = "Unassigned Network Location"
        road_class = "unclassified"
        snapped_lat = latitude
        snapped_lon = longitude

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # 4. Trigger asynchronous Celery ML inference task
    try:
        run_ml_inference.delay(str(complaint.id))
    except Exception as e:
        # Don't block HTTP response if Celery broker is temporarily unreachable
        pass

    return ComplaintCreateResponse(
        ticket_id=complaint.ticket_id,
        status=complaint.status,
        message=f"Complaint registered successfully under Ticket #{complaint.ticket_id}.",
        road_name=road_name,
        road_class=road_class,
        snapped_lat=snapped_lat,
        snapped_lon=snapped_lon,
        media_url=complaint.media_url,
        created_at=complaint.created_at,
    )


@router.get("/track/{ticket_id}", response_model=ComplaintDetailResponse)
def track_complaint(ticket_id: str, db: Session = Depends(get_db)):
    """
    Retrieve live ticket status, snapped road segment, AI metrics, and completion proof.
    """
    query = text("""
        SELECT
            dc.id::text,
            dc.ticket_id,
            dc.citizen_email,
            dc.raw_lat,
            dc.raw_lon,
            ST_Y(dc.snapped_point) AS snapped_lat,
            ST_X(dc.snapped_point) AS snapped_lon,
            dc.road_segment_id::text,
            r.road_name,
            r.road_class,
            dc.media_url,
            dc.media_type,
            dc.defect_type,
            dc.severity_area_sqm,
            dc.severity_depth_cm,
            dc.uncertainty_score,
            dc.priority_score,
            dc.status,
            dc.upvote_count,
            dc.post_repair_media_url,
            dc.repair_notes,
            dc.created_at,
            dc.resolved_at,
            ST_AsGeoJSON(r.geom)::json AS segment_geojson
        FROM defect_complaints dc
        LEFT JOIN road_segments r ON r.id = dc.road_segment_id
        WHERE dc.ticket_id = :ticket_id
        LIMIT 1;
    """)

    result = db.execute(query, {"ticket_id": ticket_id}).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    return ComplaintDetailResponse(
        ticket_id=result.ticket_id,
        citizen_email=result.citizen_email,
        raw_lat=result.raw_lat,
        raw_lon=result.raw_lon,
        snapped_lat=result.snapped_lat,
        snapped_lon=result.snapped_lon,
        road_segment_id=result.road_segment_id,
        road_name=result.road_name or "Unassigned Road",
        road_class=result.road_class or "unclassified",
        media_url=result.media_url,
        media_type=result.media_type or "image",
        defect_type=result.defect_type,
        severity_area_sqm=result.severity_area_sqm or 0.0,
        severity_depth_cm=result.severity_depth_cm or 0.0,
        uncertainty_score=result.uncertainty_score or 0.0,
        priority_score=result.priority_score or 0.0,
        status=result.status,
        upvote_count=result.upvote_count or 1,
        post_repair_media_url=result.post_repair_media_url,
        repair_notes=result.repair_notes,
        created_at=result.created_at,
        resolved_at=result.resolved_at,
        segment_geojson=result.segment_geojson,
    )

