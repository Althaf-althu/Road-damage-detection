import json
import logging
import re
from typing import Dict, Any, Optional
from app.config_apis import api_keys

logger = logging.getLogger(__name__)


def generate_irc_rule_recommendation(
    road_class: str,
    adt_volume: int,
    slope_percentage: float,
    clay_percent: float,
    silt_percent: float,
    water_retention: str,
    soil_texture: str,
) -> Dict[str, Any]:
    """
    Deterministic Civil Engineering Decision Engine adhering strictly to:
    - IRC:SP:63 (Interlocking Concrete Paver Blocks)
    - IRC:58 (Rigid Pavements)
    - IRC:37 (Flexible Pavements)
    - Kerala PWD Standard Specifications for High-Rainfall Environments
    """
    # 1. Coastal / Waterlogged / Flat Lowland (e.g. Kuttanad, Alappuzha)
    if (slope_percentage < 1.2 and clay_percent > 30.0) or water_retention == "Extreme":
        return {
            "primary_recommendation": "Interlocking Concrete Paver Blocks (ICPB / IRC:SP:63)",
            "pavement_type": "Semi-Rigid Composite",
            "technical_justification": f"Subgrade is saturated with high clay content ({clay_percent}%) and near-zero gradient ({slope_percentage}%), where standing monsoon water causes rapid bituminous debonding. Precast ICPB blocks allow subsurface hydrostatic dissipation without stripping.",
            "layer_specifications": [
                {"layer": "Subgrade Preparation", "spec": "300mm lime-stabilized subgrade compacted to 98% Proctor density with non-woven geotextile membrane (250 GSM)."},
                {"layer": "Sub-Base (Drainage Blanket)", "spec": "150mm Granular Sub-Base (GSB Grading-II) acting as a positive drainage relief filter layer."},
                {"layer": "Base Course", "spec": "100mm Wet Mix Macadam (WMM) or Zero Slump Dry Lean Concrete (DLC)."},
                {"layer": "Bedding & Wearing Surface", "spec": "30mm washed river sand bedding layer supporting 80mm M-40 Grade Interlocking Paver Blocks (IRC:SP:63)."}
            ],
            "drainage_mitigation": "Perforated corrugated PVC French drains wrapped in geotextile sock along both road shoulders discharging into roadside bioswales.",
            "expected_durability_comparison": {
                "proposed_solution_lifespan_years": 12.0,
                "conventional_asphalt_lifespan_months": 7.0
            }
        }

    # 2. Steep Terrain / Western Ghats Runoff (e.g. Wayanad, Idukki, Munnar Gap Road)
    if slope_percentage > 5.0 or (silt_percent > 35.0 and slope_percentage > 3.0):
        return {
            "primary_recommendation": "M-40 Reinforced Rigid Cement Concrete",
            "pavement_type": "Rigid",
            "technical_justification": f"High gradient ({slope_percentage}%) causes extreme surface runoff velocity during monsoons, creating severe hydraulic shear that washes away bitumen emulsions. Rigid concrete provides high compressive and tractive resistance.",
            "layer_specifications": [
                {"layer": "Subgrade Preparation", "spec": "Rock cut or stabilized rocky colluvium benching compacted with boulder toe-wall reinforcement."},
                {"layer": "Sub-Base (GSB)", "spec": "150mm crushed stone Granular Sub-Base with cross-fall drainage outlets at 10m intervals."},
                {"layer": "Separation Membrane", "spec": "125 micron impermeable polyethylene sheet to eliminate friction between slab and sub-base."},
                {"layer": "Wearing Course", "spec": "200mm M-40 grade Pavement Quality Concrete (PQC) with 32mm dowel bars at transverse contraction joints (IRC:58)."}
            ],
            "drainage_mitigation": "Cast-in-situ reinforced concrete side drain channels with energy dissipator cascade chutes and boulder retaining walls.",
            "expected_durability_comparison": {
                "proposed_solution_lifespan_years": 20.0,
                "conventional_asphalt_lifespan_months": 11.0
            }
        }

    # 3. Heavy Traffic Corridors / National & State Highways (e.g. NH 66, MC Road)
    if adt_volume > 10000 or road_class in ["motorway", "trunk", "primary"]:
        return {
            "primary_recommendation": "Polymer Modified Bitumen (PMB-120) with DBM Structural Overlay",
            "pavement_type": "Flexible",
            "technical_justification": f"High traffic volume ({adt_volume} ADT) demands elastomeric rut resistance. Polymer Modified Bitumen (PMB-120) prevents stripping under high axial loads during wet seasons.",
            "layer_specifications": [
                {"layer": "Subgrade Preparation", "spec": "500mm compacted subgrade achieving minimum 8% California Bearing Ratio (CBR)."},
                {"layer": "Sub-Base (GSB)", "spec": "200mm Granular Sub-Base (IRC:37 Category-I) with permeable shoulder extensions."},
                {"layer": "Base Course", "spec": "150mm Dense Bituminous Macadam (DBM) with 60/70 penetration bitumen and anti-stripping agent."},
                {"layer": "Wearing Course", "spec": "50mm Stone Matrix Asphalt (SMA) utilizing PMB-120 elastomer with 0.3% cellulose fibers."}
            ],
            "drainage_mitigation": "Cambered 2.5% lateral cross-fall draining to trapezoidal longitudinal concrete drains with silt-trap collection chambers.",
            "expected_durability_comparison": {
                "proposed_solution_lifespan_years": 8.0,
                "conventional_asphalt_lifespan_months": 18.0
            }
        }

    # 4. Standard Kerala Midlands Laterite Road (Default)
    return {
        "primary_recommendation": "Laterite Stabilized Subgrade with DBM Flexible Pavement",
        "pavement_type": "Flexible",
        "technical_justification": f"Soil profile features well-drained laterite subgrade ({soil_texture}) on moderate slope ({slope_percentage}%). Flexible pavement with an enhanced GSB drainage blanket is cost-effective and structurally durable.",
        "layer_specifications": [
            {"layer": "Subgrade Preparation", "spec": "Compacted lateritic gravel subgrade achieving 7% CBR with 200 GSM non-woven geotextile separation."},
            {"layer": "Sub-Base (GSB)", "spec": "150mm Granular Sub-Base Grading-III compacted to 98% maximum dry density."},
            {"layer": "Base Course", "spec": "100mm Wet Mix Macadam (WMM) followed by cationic bitumen emulsion prime coat."},
            {"layer": "Wearing Course", "spec": "30mm Bituminous Concrete (BC Grade-II) with anti-stripping additive."}
        ],
        "drainage_mitigation": "Unlined v-shaped earthen shoulder ditches with stone check-dams to prevent erosion during monsoon surges.",
        "expected_durability_comparison": {
            "proposed_solution_lifespan_years": 6.0,
            "conventional_asphalt_lifespan_months": 14.0
        }
    }


def query_gemini_geotech_advisor(
    road_name: str,
    road_class: str,
    adt_volume: int,
    elevation_m: float,
    slope_percentage: float,
    soil_texture: str,
    clay_percent: float,
    silt_percent: float,
    sand_percent: float,
    cbr_estimate: float,
    water_retention: str,
    moisture_index: float,
) -> Dict[str, Any]:
    """
    Invokes Google Gemini 1.5 Flash using domain-tuned civil engineering prompt.
    Adheres strictly to IRC / AASHTO design codes.
    Falls back to deterministic IRC rule engine if API key is invalid or quota exceeded.
    """
    rule_fallback = generate_irc_rule_recommendation(
        road_class=road_class,
        adt_volume=adt_volume,
        slope_percentage=slope_percentage,
        clay_percent=clay_percent,
        silt_percent=silt_percent,
        water_retention=water_retention,
        soil_texture=soil_texture,
    )

    api_key = api_keys.GEMINI_API_KEY
    if not api_key or "your_gemini" in api_key or len(api_key) < 10:
        logger.info("[llm_consultant] Gemini API key not provided or placeholder. Using verified IRC Civil Engineering rule engine.")
        return rule_fallback

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        system_prompt = (
            "You are a Principal Geotechnical & Pavement Infrastructure Engineer adhering strictly to IRC (Indian Roads Congress) "
            "and AASHTO standards, specifically calibrated for Kerala's extreme monsoon climate (annual rainfall > 3000mm).\n"
            "Given the telemetry below, recommend the optimal, most durable pavement structure and explain why conventional asphalt fails "
            "in high-moisture/high-gradient zones.\n\n"
            f"Road Name: {road_name}\n"
            f"Classification: {road_class}\n"
            f"Average Daily Traffic: {adt_volume} vehicles/day\n"
            f"Elevation: {elevation_m}m above sea level\n"
            f"Terrain Slope: {slope_percentage}%\n"
            f"Soil Taxonomy: {soil_texture} (Clay: {clay_percent}%, Silt: {silt_percent}%, Sand: {sand_percent}%, Est. CBR: {cbr_estimate}%)\n"
            f"Water Retention Capacity: {water_retention} (Moisture Index: {moisture_index})\n\n"
            "OUTPUT FORMAT: Return STRICTLY a valid JSON object matching this schema without any markdown formatting or surrounding backticks:\n"
            "{\n"
            '  "primary_recommendation": "Interlocking Concrete Paver Blocks (ICPB / IRC:SP:63) | M-40 Reinforced Rigid Concrete | Polymer Modified Asphalt (DBM)",\n'
            '  "pavement_type": "Rigid | Flexible | Semi-Rigid Composite",\n'
            '  "technical_justification": "Clear, concise 2-sentence rationale based on soil, rainfall and slope.",\n'
            '  "layer_specifications": [\n'
            '    {"layer": "Subgrade Preparation", "spec": "..."},\n'
            '    {"layer": "Sub-Base (GSB / Drainage Blanket)", "spec": "..."},\n'
            '    {"layer": "Base Course", "spec": "..."},\n'
            '    {"layer": "Wearing Surface", "spec": "..."}\n'
            "  ],\n"
            '  "drainage_mitigation": "Detailed drainage specification (e.g., perforated PVC French drain, concrete chute)",\n'
            '  "expected_durability_comparison": {\n'
            '    "proposed_solution_lifespan_years": 12,\n'
            '    "conventional_asphalt_lifespan_months": 8\n'
            "  }\n"
            "}"
        )

        response = model.generate_content(system_prompt)
        text_resp = response.text.strip()

        # Clean JSON backticks if Gemini wraps in ```json ... ```
        clean_json = re.sub(r"^```(?:json)?\s*", "", text_resp)
        clean_json = re.sub(r"\s*```$", "", clean_json).strip()

        parsed = json.loads(clean_json)

        # Validate required fields
        if "primary_recommendation" in parsed and "layer_specifications" in parsed:
            logger.info(f"[llm_consultant] Successfully generated AI advisory from Gemini for {road_name}")
            return parsed

    except Exception as e:
        logger.warning(f"[llm_consultant] Gemini API query failed: {e}. Falling back to verified IRC rule engine.")

    return rule_fallback
