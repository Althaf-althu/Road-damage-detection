import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from src.inference import RoadDefectDetector
from src.depth_estimation import DefectDepthEstimator
from src.severity_calculator import calculate_defect_severity
from src.uncertainty import compute_uncertainty_score

app = FastAPI(
    title="Kerala Road Damage Perception & Depth Engine",
    description="Instance segmentation, relative depth mapping, severity calculation, and uncertainty calibration.",
    version="2.0.0",
)

# Instantiate models as singletons
detector = RoadDefectDetector()
depth_estimator = DefectDepthEstimator()


class InferenceRequest(BaseModel):
    complaint_id: str
    image_path: str


class InferenceResponse(BaseModel):
    complaint_id: str
    defect_type: str
    confidence: float
    bbox: list
    severity_area_sqm: float
    severity_depth_cm: float
    cavity_volume_cbm: float
    estimated_asphalt_mix_kg: float
    uncertainty_score: float
    is_reliable: bool


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ml_pipeline",
        "detector_model_loaded": detector.model is not None,
        "depth_model_loaded": depth_estimator.pipeline is not None,
    }


@app.post("/ml/infer", response_model=InferenceResponse)
async def infer(req: InferenceRequest):
    """
    Executes full computer vision pipeline:
    1. YOLOv8 instance segmentation (pothole, crack, rutting)
    2. Depth Anything V2 relative depth map calculation
    3. Surface area ($m^2$) & cavity volume ($m^3$) calculation
    4. Monte Carlo dropout uncertainty scoring
    """
    if not os.path.exists(req.image_path):
        raise HTTPException(status_code=404, detail=f"Image file not found: {req.image_path}")

    # 1. Defect Segmentation
    seg_result = detector.segment_defect(req.image_path)
    defect_type = seg_result["defect_type"]
    confidence = seg_result["confidence"]
    bbox = seg_result["bbox"]
    mask = seg_result["mask"]

    # 2. Depth Estimation
    depth_result = depth_estimator.estimate_depth(req.image_path, mask)
    depth_cm = depth_result["estimated_depth_cm"]

    # 3. Severity & Volume
    severity_result = calculate_defect_severity(mask, depth_cm, defect_type)

    # 4. Uncertainty
    uncertainty_result = compute_uncertainty_score(confidence, mask, defect_type)

    return InferenceResponse(
        complaint_id=req.complaint_id,
        defect_type=defect_type,
        confidence=confidence,
        bbox=bbox,
        severity_area_sqm=severity_result["surface_area_sqm"],
        severity_depth_cm=severity_result["estimated_depth_cm"],
        cavity_volume_cbm=severity_result["cavity_volume_cbm"],
        estimated_asphalt_mix_kg=severity_result["estimated_asphalt_mix_kg"],
        uncertainty_score=uncertainty_result["uncertainty_score"],
        is_reliable=uncertainty_result["is_reliable"],
    )
