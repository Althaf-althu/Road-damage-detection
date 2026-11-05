import uuid
from sqlalchemy import (
    Column, String, Integer, Float, DateTime,
    Text, ForeignKey, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.database import Base


class DefectComplaint(Base):
    __tablename__ = "defect_complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(String(50), unique=True, nullable=False, index=True)
    # e.g. TKT-2026-00001

    # Citizen linkage
    citizen_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    citizen_email = Column(String(255), nullable=False)

    # Location
    raw_lat = Column(Float, nullable=False)
    raw_lon = Column(Float, nullable=False)
    snapped_point = Column(Geometry("POINT", srid=4326), nullable=True)
    road_segment_id = Column(UUID(as_uuid=True), ForeignKey("road_segments.id", ondelete="CASCADE"), nullable=True)

    # Admin snap override (correction tool for mis-snapped reports)
    snap_radius_override_m = Column(Float, nullable=True)
    snap_override_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    snap_override_at = Column(DateTime(timezone=True), nullable=True)

    # Media
    media_url = Column(Text, nullable=False)
    media_type = Column(String(20), default="image")  # image | video

    # AI Perception Results (populated by Celery ML task)
    defect_type = Column(String(50), nullable=True)
    # pothole | fatigue_crack | transverse_crack | rutting
    severity_area_sqm = Column(Float, default=0.0)
    severity_depth_cm = Column(Float, default=0.0)
    uncertainty_score = Column(Float, default=0.0)

    # MCDA Priority Score (recalculated after ML inference)
    priority_score = Column(Float, default=0.0)

    # Status lifecycle
    status = Column(String(50), default="SUBMITTED")
    # SUBMITTED → UNDER_REVIEW → SCHEDULED → IN_PROGRESS → RESOLVED | REJECTED

    # Deduplication
    upvote_count = Column(Integer, default=1)
    cluster_id = Column(UUID(as_uuid=True), nullable=True)

    # Post-repair
    post_repair_media_url = Column(Text, nullable=True)
    repair_notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_email_sent_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    road_segment = relationship("RoadSegment", foreign_keys=[road_segment_id])
    citizen = relationship("User", foreign_keys=[citizen_id])

