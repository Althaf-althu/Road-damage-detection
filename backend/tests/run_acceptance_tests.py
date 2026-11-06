"""
Kerala PWD Road Damage Detection & Geotechnical Advisory System
Acceptance Test Matrix Verification Runner (Section 10 of Blueprint)

Executes all 6 Acceptance Criteria test suites:
1. Role-Based Routing & Access Control Isolation (RBAC)
2. Metadata Extraction & EXIF Fallbacks
3. Road Snapping Precision (< 25m)
4. Spatial Deduplication Radar (30m Radius)
5. Geotechnical AI Material Advisory (IRC:SP:63 / IRC:58)
6. Closed-Loop Maintenance Resolution & Citizen Email
"""

import sys
import unittest

# Import test suites
from tests.test_auth_rbac import (
    test_password_hashing,
    test_token_creation_and_decoding,
    test_invalid_token_decoding,
    test_rbac_citizen_forbidden_from_admin,
    test_rbac_admin_allowed_on_admin,
    test_rbac_citizen_allowed_on_citizen,
)
from tests.test_snapping_deduplication import (
    test_haversine_accuracy_kerala_coordinates,
    test_deduplication_threshold_30_meters,
    test_subscriber_email_merging,
)
from tests.test_mcda_engine import (
    test_severity_norm_bounds,
    test_severity_defect_hierarchy,
    test_traffic_norm_bounds,
    test_road_hierarchy_weights,
    test_mcda_composite_priority_score_tiers,
    test_mcda_weights_sum_to_one,
)
from tests.test_geotech_advisor import (
    test_geotech_kuttanad_floodplain_recommendation,
    test_geotech_western_ghats_steep_slope_recommendation,
    test_geotech_heavy_highway_traffic_recommendation,
)
from tests.test_work_orders_resolution import (
    test_technician_gps_proximity_verification,
    test_resolution_html_email_generation,
    test_mailer_simulated_dispatch,
)
from tests.test_exif_metadata_fallback import (
    test_exif_metadata_auto_population,
    test_metadata_stripped_prompts_fallback,
    test_out_of_bounds_coordinates_rejected,
)


class TestAcceptanceCriteria(unittest.TestCase):

    def test_criterion_1_rbac_isolation(self):
        """Criterion 1: Unauthenticated 401, Citizen 403 Forbidden on /admin/*"""
        test_password_hashing()
        test_token_creation_and_decoding()
        test_invalid_token_decoding()
        test_rbac_citizen_forbidden_from_admin()
        test_rbac_admin_allowed_on_admin()
        test_rbac_citizen_allowed_on_citizen()

    def test_criterion_2_metadata_extraction_and_fallback(self):
        """Criterion 2: EXIF coordinates auto-populate; missing metadata prompts fallback."""
        test_exif_metadata_auto_population()
        test_metadata_stripped_prompts_fallback()
        test_out_of_bounds_coordinates_rejected()

    def test_criterion_3_road_snapping_precision(self):
        """Criterion 3: Precision geodesic coordinates within road proximity (< 25m)."""
        test_haversine_accuracy_kerala_coordinates()

    def test_criterion_4_spatial_deduplication(self):
        """Criterion 4: 30-meter PostGIS deduplication radar & subscriber email merging."""
        test_deduplication_threshold_30_meters()
        test_subscriber_email_merging()

    def test_criterion_5_geotechnical_llm_output(self):
        """Criterion 5: Clay > 35% and Slope < 1% mandates Interlocking Concrete Paver Blocks (IRC:SP:63)."""
        test_geotech_kuttanad_floodplain_recommendation()
        test_geotech_western_ghats_steep_slope_recommendation()
        test_geotech_heavy_highway_traffic_recommendation()

    def test_criterion_6_closed_loop_email_delivery(self):
        """Criterion 6: Resolving a work order verifies technician GPS and generates citizen notification."""
        test_technician_gps_proximity_verification()
        test_resolution_html_email_generation()
        test_mailer_simulated_dispatch()

    def test_mcda_prioritization_engine(self):
        """MCDA dynamic multi-criteria priority formula consistency."""
        test_severity_norm_bounds()
        test_severity_defect_hierarchy()
        test_traffic_norm_bounds()
        test_road_hierarchy_weights()
        test_mcda_composite_priority_score_tiers()
        test_mcda_weights_sum_to_one()


def run_acceptance_suite():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestAcceptanceCriteria)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)


if __name__ == "__main__":
    run_acceptance_suite()
