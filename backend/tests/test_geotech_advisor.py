"""
Test Suite: Geotechnical Material Advisory Engine (Acceptance Criterion 5)
Verifies:
1. Criterion 5: Waterlogged flat corridors (Clay > 35%, Slope < 1%) mandate Interlocking Concrete Paver Blocks (ICPB / IRC:SP:63).
2. Steep hillside corridors (Slope > 5%) mandate Rigid M-40 Concrete (IRC:58).
3. Highway high-traffic corridors mandate Polymer Modified Bitumen (PMB-120 / IRC:37).
4. Layer specifications adhere to structural cross-section engineering standards.
"""

import pytest
from app.services.llm_consultant import generate_irc_rule_recommendation


def test_geotech_kuttanad_floodplain_recommendation():
    """
    Criterion 5: Testing for coordinates with clay > 35% and slope < 1%
    must output specifications recommending Interlocking Concrete Paver Blocks (ICPB) or porous concrete.
    """
    advisory = generate_irc_rule_recommendation(
        road_class="secondary",
        adt_volume=3000,
        slope_percentage=0.7,   # < 1.0% (Flat, high ponding)
        clay_percent=38.5,       # > 35% (Heavy clay subgrade)
        silt_percent=26.0,
        water_retention="High",
        soil_texture="Clay Loam",
    )

    assert "Interlocking Concrete Paver Blocks" in advisory["primary_recommendation"]
    assert "IRC:SP:63" in advisory["primary_recommendation"]
    assert advisory["pavement_type"] == "Semi-Rigid Composite"

    # Drainage mitigation must specify French drains or subsurface dissipation
    assert "French drain" in advisory["drainage_mitigation"].lower() or "drain" in advisory["drainage_mitigation"].lower()

    # Structural cross section verification
    layers = advisory["layer_specifications"]
    assert len(layers) >= 3
    layer_names = [l["layer"].lower() for l in layers]
    assert any("subgrade" in name for name in layer_names)
    assert any("wearing" in name or "bedding" in name for name in layer_names)

    # Durability comparison check
    comp = advisory["expected_durability_comparison"]
    assert comp["proposed_solution_lifespan_years"] > 5.0
    assert comp["conventional_asphalt_lifespan_months"] < 12.0


def test_geotech_western_ghats_steep_slope_recommendation():
    """Steep gradients (>5%) subject to monsoon shear runoff must mandate Rigid M-40 Pavement (IRC:58)."""
    advisory = generate_irc_rule_recommendation(
        road_class="secondary",
        adt_volume=2500,
        slope_percentage=7.4,   # > 5.0% (Steep mountain pass)
        clay_percent=18.0,
        silt_percent=22.0,
        water_retention="Moderate",
        soil_texture="Gravelly Sandy Loam",
    )

    assert "Rigid" in advisory["pavement_type"] or "Rigid" in advisory["primary_recommendation"]
    assert "M-40" in advisory["primary_recommendation"]


def test_geotech_heavy_highway_traffic_recommendation():
    """Major arterial corridors (ADT > 10,000) mandate Polymer Modified Bitumen."""
    advisory = generate_irc_rule_recommendation(
        road_class="motorway",
        adt_volume=18000,
        slope_percentage=2.1,
        clay_percent=24.0,
        silt_percent=20.0,
        water_retention="Moderate",
        soil_texture="Lateritic Loam",
    )

    assert "Polymer Modified Bitumen" in advisory["primary_recommendation"]
    assert "Flexible" in advisory["pavement_type"]

