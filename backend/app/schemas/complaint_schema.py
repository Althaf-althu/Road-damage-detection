from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class DuplicateCheckRequest(BaseModel):
    latitude: float
    longitude: float
    search_radius_m: Optional[float] = 30.0


class DuplicateTicketInfo(BaseModel):
    ticket_id: str
    distance_m: float
    status: str
    upvote_count: int
    created_at: datetime
    media_url: str
    defect_type: Optional[str] = None


class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    existing_ticket: Optional[DuplicateTicketInfo] = None
    message: str


class UpvoteRequest(BaseModel):
    ticket_id: str
    citizen_email: EmailStr


class UpvoteResponse(BaseModel):
    ticket_id: str
    upvote_count: int
    message: str


class ComplaintCreateResponse(BaseModel):
    ticket_id: str
    status: str
    message: str
    road_name: str
    road_class: str
    snapped_lat: float
    snapped_lon: float
    media_url: str
    created_at: datetime


class ComplaintDetailResponse(BaseModel):
    ticket_id: str
    citizen_email: str
    raw_lat: float
    raw_lon: float
    snapped_lat: Optional[float] = None
    snapped_lon: Optional[float] = None
    road_segment_id: Optional[str] = None
    road_name: Optional[str] = None
    road_class: Optional[str] = None
    media_url: str
    media_type: str
    defect_type: Optional[str] = None
    severity_area_sqm: float
    severity_depth_cm: float
    uncertainty_score: float
    priority_score: float
    status: str
    upvote_count: int
    post_repair_media_url: Optional[str] = None
    repair_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    segment_geojson: Optional[Dict[str, Any]] = None

