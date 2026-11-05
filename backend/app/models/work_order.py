import uuid
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(String(50), unique=True, nullable=False, index=True)
    # e.g. WO-2026-00001

    complaint_id = Column(UUID(as_uuid=True), ForeignKey("defect_complaints.id", ondelete="CASCADE"))
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_to_depot = Column(String(255), nullable=True)

    status = Column(String(50), default="SCHEDULED")
    # SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED

    # Field completion
    technician_lat = Column(Float, nullable=True)
    technician_lon = Column(Float, nullable=True)
    location_verified = Column(String(10), nullable=True)  # PASS | WARN | SKIP

    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    complaint = relationship("DefectComplaint", foreign_keys=[complaint_id])
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])


class GeotechProfile(Base):
    __tablename__ = "geotech_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    road_segment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("road_segments.id", ondelete="CASCADE"),
        unique=True
    )

    # Terrain data
    elevation_m = Column(Float, nullable=True)
    slope_percentage = Column(Float, nullable=True)

    # Soil data (from ISRIC SoilGrids)
    soil_texture = Column(String(100), nullable=True)
    clay_percent = Column(Float, nullable=True)
    silt_percent = Column(Float, nullable=True)
    sand_percent = Column(Float, nullable=True)
    cbr_estimate = Column(Float, nullable=True)      # California Bearing Ratio
    water_retention_capacity = Column(String(50), nullable=True)   # Low | Moderate | Extreme
    groundwater_table_m = Column(Float, nullable=True)

    # Open-Meteo soil moisture
    soil_moisture_index = Column(Float, nullable=True)

    # LLM advisory result (cached JSON)
    ai_advisory_payload = Column(JSONB, nullable=True)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    road_segment = relationship("RoadSegment", foreign_keys=[road_segment_id])

