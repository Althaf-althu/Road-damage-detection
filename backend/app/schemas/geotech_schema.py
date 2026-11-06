from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class LayerSpec(BaseModel):
    layer: str
    spec: str


class DurabilityComp(BaseModel):
    proposed_solution_lifespan_years: float
    conventional_asphalt_lifespan_months: float


class AIAdvisoryResponse(BaseModel):
    primary_recommendation: str
    pavement_type: str
    technical_justification: str
    layer_specifications: List[LayerSpec]
    drainage_mitigation: str
    expected_durability_comparison: DurabilityComp


class GeotechAdviseRequest(BaseModel):
    road_segment_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    force_refresh: Optional[bool] = False


class GeotechProfileResponse(BaseModel):
    road_segment_id: str
    road_name: str
    road_class: str
    elevation_m: float
    slope_percentage: float
    soil_texture: str
    clay_percent: float
    silt_percent: float
    sand_percent: float
    cbr_estimate: float
    water_retention_capacity: str
    soil_moisture_index: float
    ai_advisory: AIAdvisoryResponse
    cached: bool
    updated_at: datetime
