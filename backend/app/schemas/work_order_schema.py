from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class WorkOrderCreateRequest(BaseModel):
    ticket_id: str
    assigned_to_depot: str
    notes: Optional[str] = None


class WorkOrderResolveRequest(BaseModel):
    ticket_id: str
    post_repair_media_url: str
    repair_notes: str
    technician_lat: Optional[float] = None
    technician_lon: Optional[float] = None


class SnapOverrideRequest(BaseModel):
    ticket_id: str
    new_radius_m: float
    manual_road_segment_id: Optional[str] = None


class WorkOrderItemResponse(BaseModel):
    id: str
    order_id: str
    ticket_id: str
    road_name: str
    road_class: str
    priority_score: float
    assigned_to_depot: Optional[str] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    original_media_url: str
    post_repair_media_url: Optional[str] = None
    location_verified: Optional[str] = None
    defect_lat: Optional[float] = None
    defect_lon: Optional[float] = None


class PrioritizationMetricsResponse(BaseModel):
    total_active_complaints: int
    critical_count: int      # score >= 75
    moderate_count: int      # 50 <= score < 75
    routine_count: int       # score < 50
    under_maintenance_count: int
    resolved_past_month: int
    average_priority_score: float
    highest_risk_corridor: Optional[str] = None

