import uuid
from sqlalchemy import Column, String, Integer, Boolean, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from app.database import Base


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    osm_way_id = Column(BigInteger, unique=True, nullable=True, index=True)
    road_name = Column(String(255), nullable=False, default="Unnamed Road")
    road_class = Column(String(50), nullable=False)
    # motorway | trunk | primary | secondary | tertiary | residential | unclassified
    speed_limit_kmh = Column(Integer, default=50)
    adt_volume = Column(Integer, default=1500)   # Average Daily Traffic
    is_sensitive_zone = Column(Boolean, default=False)
    # Near school, hospital, steep curve, or flood-prone area
    region = Column(String(100), default="kerala")
    geom = Column(Geometry("MULTILINESTRING", srid=4326), nullable=False)

