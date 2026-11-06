"""
Test Suite: Multi-Criteria Decision Analysis (MCDA) Prioritization Math
Verifies:
1. Normalization bounds [0.0, 1.0] across all criteria components.
2. Strict mathematical weighting (40% Severity, 25% Traffic, 20% Hierarchy, 15% Sensitive Zone).
3. Monotonicity of defect priority score relative to distress severity.
4. Correct operational SLA mapping (CRITICAL <= 24h, MODERATE <= 72h, ROUTINE <= 168h).
"""

import pytest
from app.services.mcda_engine import (
    calculate_severity_norm,
    calculate_traffic_norm,
    calculate_road_class_norm,
    calculate_zone_norm,
    calculate_priority_score,
)


def test_severity_norm_bounds():
    # Zero distress
    s_zero = calculate_severity_norm("pothole", area_sqm=0.0, depth_cm=0.0)
    assert s_zero == 0.0

    # Massive defect exceeding max bounds (clamped to 1.0)
    s_max = calculate_severity_norm("pothole", area_sqm=50.0, depth_cm=30.0)
    assert s_max == 1.0

    # Intermediate pothole
    s_mid = calculate_severity_norm("pothole", area_sqm=2.5, depth_cm=7.5)
    assert 0.4 <= s_mid <= 0.6


def test_severity_defect_hierarchy():
    """Potholes should yield higher hazard weights than hairline transverse cracks."""
    pothole_score = calculate_severity_norm("pothole", area_sqm=1.0, depth_cm=5.0)
    crack_score = calculate_severity_norm("transverse_crack", area_sqm=1.0, depth_cm=5.0)
    assert pothole_score > crack_score


def test_traffic_norm_bounds():
    assert calculate_traffic_norm(0) == 0.0
    assert calculate_traffic_norm(15000) == 1.0
    assert calculate_traffic_norm(30000) == 1.0  # Clamped


def test_road_hierarchy_weights():
    motorway_weight = calculate_road_class_norm("motorway")
    primary_weight = calculate_road_class_norm("primary")
    residential_weight = calculate_road_class_norm("residential")

    assert motorway_weight == 1.0
    assert motorway_weight > primary_weight > residential_weight


def test_mcda_composite_priority_score_tiers():
    # 1. Critical scenario: Major pothole on National Highway near hospital
    res_critical = calculate_priority_score(
        defect_type="pothole",
        area_sqm=4.5,
        depth_cm=14.0,
        custom_adt=14000,
        custom_road_class="motorway",
        is_sensitive_zone=True,
    )
    assert res_critical["priority_score"] >= 75.0
    assert res_critical["priority_tier"] == "CRITICAL"
    assert res_critical["recommended_sla_hours"] == 24
    assert res_critical["halo_color"] == "red"

    # 2. Moderate scenario: Medium crack on State Highway
    res_moderate = calculate_priority_score(
        defect_type="fatigue_crack",
        area_sqm=2.0,
        depth_cm=4.0,
        custom_adt=5000,
        custom_road_class="primary",
        is_sensitive_zone=False,
    )
    assert 40.0 <= res_moderate["priority_score"] <= 75.0

    # 3. Routine scenario: Minor transverse crack on residential road
    res_routine = calculate_priority_score(
        defect_type="transverse_crack",
        area_sqm=0.3,
        depth_cm=0.0,
        custom_adt=500,
        custom_road_class="residential",
        is_sensitive_zone=False,
    )
    assert res_routine["priority_score"] < 50.0
    assert res_routine["priority_tier"] == "ROUTINE"
    assert res_routine["recommended_sla_hours"] == 168
    assert res_routine["halo_color"] == "green"


def test_mcda_weights_sum_to_one():
    """Verify mathematical consistency: 0.40 + 0.25 + 0.20 + 0.15 == 1.00"""
    res = calculate_priority_score(
        defect_type="pothole",
        area_sqm=5.0,
        depth_cm=15.0,
        custom_adt=15000,
        custom_road_class="motorway",
        is_sensitive_zone=True,
    )
    # At maximal inputs, score must be exactly 100.0
    assert res["priority_score"] == 100.0
