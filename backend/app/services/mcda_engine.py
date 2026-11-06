from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.road_segment import RoadSegment

# Defect class severity weights (IRC & civil engineering damage factor)
DEFECT_WEIGHTS = {
    "pothole": 1.00,          # High hazard: rim/tire failure, vehicle loss of control
    "rutting": 0.85,          # High hazard: water accumulation, aquaplaning during Kerala monsoon
    "fatigue_crack": 0.70,    # Alligator cracking: progressive structural subgrade failure
    "transverse_crack": 0.50, # Thermal / shrinkage cracking
}

# Road class hierarchy weights (IRC & Kerala PWD classification)
ROAD_CLASS_WEIGHTS = {
    "motorway": 1.00,        # Expressway / NH 66 corridor
    "trunk": 0.85,           # National Highway (NH)
    "primary": 0.70,         # State Highway (SH)
    "secondary": 0.55,       # Major District Road (MDR)
    "tertiary": 0.40,        # Other District Road (ODR)
    "residential": 0.25,     # Ward / Municipal residential road
    "unclassified": 0.15,    # Village / Rural road
    "service": 0.15,
}

# Normalization constants
MAX_CONSIDERED_AREA_SQM = 5.0     # 5 m² is treated as maximum single defect area
MAX_CONSIDERED_DEPTH_CM = 15.0    # 15 cm depth is critical failure threshold
MAX_CONSIDERED_ADT = 15000        # 15,000 Average Daily Traffic vehicle volume


def calculate_severity_norm(
    defect_type: Optional[str],
    area_sqm: float,
    depth_cm: float
) -> float:
    """
    Computes S_norm (Normalized Visual Distress Severity) in range [0.0, 1.0].
    Combines surface area (60% weight), depth (40% weight), and defect taxonomy multiplier.
    """
    type_weight = DEFECT_WEIGHTS.get(defect_type.lower() if defect_type else "pothole", 0.75)

    area_factor = min(max(area_sqm, 0.0) / MAX_CONSIDERED_AREA_SQM, 1.0)
    depth_factor = min(max(depth_cm, 0.0) / MAX_CONSIDERED_DEPTH_CM, 1.0)

    # If depth is unknown/zero (e.g. for cracks), area carries full weight
    if depth_cm <= 0:
        composite = area_factor
    else:
        composite = (0.60 * area_factor) + (0.40 * depth_factor)

    s_norm = min(type_weight * composite, 1.0)
    return round(s_norm, 4)


def calculate_traffic_norm(adt_volume: int) -> float:
    """
    Computes T_norm (Normalized Traffic Exposure Factor) in range [0.0, 1.0].
    """
    t_norm = min(max(adt_volume, 0) / MAX_CONSIDERED_ADT, 1.0)
    return round(t_norm, 4)


def calculate_road_class_norm(road_class: Optional[str]) -> float:
    """
    Computes R_norm (Normalized Road Hierarchy Factor) in range [0.0, 1.0].
    """
    key = road_class.lower() if road_class else "secondary"
    return ROAD_CLASS_WEIGHTS.get(key, 0.35)


def calculate_zone_norm(is_sensitive_zone: bool) -> float:
    """
    Computes Z_norm (Sensitive Zone Multiplier): 1.0 if near school/hospital/hairpin bend, else 0.0.
    """
    return 1.0 if is_sensitive_zone else 0.0


def calculate_priority_score(
    defect_type: Optional[str],
    area_sqm: float,
    depth_cm: float,
    road_segment: Optional["RoadSegment"] = None,
    custom_adt: Optional[int] = None,
    custom_road_class: Optional[str] = None,
    is_sensitive_zone: Optional[bool] = None,
) -> dict:
    """
    Evaluates the complete Multi-Criteria Decision Analysis (MCDA) Prioritization equation:
    Priority Score = 100 * (0.40 * S_norm + 0.25 * T_norm + 0.20 * R_norm + 0.15 * Z_norm)

    Returns a detailed breakdown dictionary with score, tier, and parameter contributions.
    """
    # 1. Defect Severity Component (Weight 40%)
    s_norm = calculate_severity_norm(defect_type, area_sqm, depth_cm)

    # 2. Traffic Component (Weight 25%)
    adt = custom_adt if custom_adt is not None else (road_segment.adt_volume if road_segment else 2000)
    t_norm = calculate_traffic_norm(adt)

    # 3. Road Class Hierarchy Component (Weight 20%)
    r_class = custom_road_class if custom_road_class is not None else (road_segment.road_class if road_segment else "secondary")
    r_norm = calculate_road_class_norm(r_class)

    # 4. Sensitive Zone Component (Weight 15%)
    sensitive = is_sensitive_zone if is_sensitive_zone is not None else (road_segment.is_sensitive_zone if road_segment else False)
    z_norm = calculate_zone_norm(sensitive)

    # Aggregate weighted score (0.0 to 100.0)
    raw_score = 100.0 * (
        (0.40 * s_norm) +
        (0.25 * t_norm) +
        (0.20 * r_norm) +
        (0.15 * z_norm)
    )
    priority_score = round(min(max(raw_score, 0.0), 100.0), 2)

    # Prioritization Tier & Operational SLA
    if priority_score >= 75.0:
        priority_tier = "CRITICAL"
        halo_color = "red"
        sla_hours = 24
    elif priority_score >= 50.0:
        priority_tier = "MODERATE"
        halo_color = "yellow"
        sla_hours = 72
    else:
        priority_tier = "ROUTINE"
        halo_color = "green"
        sla_hours = 168  # 1 week

    return {
        "priority_score": priority_score,
        "priority_tier": priority_tier,
        "halo_color": halo_color,
        "recommended_sla_hours": sla_hours,
        "breakdown": {
            "s_norm": s_norm,
            "s_weighted": round(0.40 * s_norm * 100, 2),
            "t_norm": t_norm,
            "t_weighted": round(0.25 * t_norm * 100, 2),
            "r_norm": r_norm,
            "r_weighted": round(0.20 * r_norm * 100, 2),
            "z_norm": z_norm,
            "z_weighted": round(0.15 * z_norm * 100, 2),
        }
    }
