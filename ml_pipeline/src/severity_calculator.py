import numpy as np
from typing import Dict, Any

# Ground Sampling Distance (GSD) heuristics
# For a smartphone camera held by a standing citizen (~1.2 - 1.4m height, 65° FOV)
# 1 pixel typically corresponds to ~0.0012 to 0.0025 meters on the road surface
DEFAULT_GSD_METERS_PER_PIXEL = 0.0018  # ~1.8 mm per pixel


def calculate_defect_severity(
    mask: np.ndarray,
    depth_cm: float,
    defect_type: str,
    gsd_m: float = DEFAULT_GSD_METERS_PER_PIXEL
) -> Dict[str, Any]:
    """
    Computes physical geometric severity indicators:
    - Surface area in square meters (m²)
    - Cavity volume in cubic meters (m³)
    - Estimated asphalt/mix repair material requirement (kg)
    """
    pixel_count = int(np.sum(mask == 1))
    
    # Area = pixel_count * (meters_per_pixel)²
    area_sqm = pixel_count * (gsd_m ** 2)
    # Bound between realistic physical limits for a single road photo (0.02 m² to 6.0 m²)
    bounded_area_sqm = round(min(max(area_sqm, 0.05), 5.5), 2)

    # Volume (m³) = area (m²) * depth (m)
    depth_m = max(depth_cm, 0.5) / 100.0
    volume_cbm = round(bounded_area_sqm * depth_m, 3)

    # Compacted Asphalt density ≈ 2,300 kg/m³
    asphalt_mix_kg = round(volume_cbm * 2300, 1)

    return {
        "surface_area_sqm": bounded_area_sqm,
        "estimated_depth_cm": depth_cm,
        "cavity_volume_cbm": volume_cbm,
        "estimated_asphalt_mix_kg": asphalt_mix_kg,
        "pixel_count": pixel_count,
    }

