"""
Test Suite: Metadata Extraction, Regional Bounding Box & Fallbacks (Acceptance Criterion 2)
Verifies:
1. Kerala regional bounding box validation (Lat [8.18, 12.80], Lon [74.85, 77.40]).
2. Fallback handling when image metadata is stripped.
3. Clean error-free coordination for client-side map pin placement.
"""

import pytest


KERALA_BBOX = {
    "min_lat": 8.18,
    "max_lat": 12.80,
    "min_lon": 74.85,
    "max_lon": 77.40,
}


def is_within_regional_bounds(lat: float, lon: float, bbox: dict = KERALA_BBOX) -> bool:
    """Verifies that coordinates reside inside the active administrative state bounds."""
    return (
        bbox["min_lat"] <= lat <= bbox["max_lat"]
        and bbox["min_lon"] <= lon <= bbox["max_lon"]
    )


def resolve_metadata_coordinates(
    exif_lat: float | None,
    exif_lon: float | None,
    fallback_lat: float | None,
    fallback_lon: float | None,
) -> tuple[float, float, str]:
    """
    Simulates coordinate resolution priority:
    1. EXIF metadata if present and valid.
    2. Fallback browser GPS / manual map pin drop.
    """
    if exif_lat is not None and exif_lon is not None:
        if is_within_regional_bounds(exif_lat, exif_lon):
            return exif_lat, exif_lon, "EXIF_AUTO_POPULATED"

    if fallback_lat is not None and fallback_lon is not None:
        if is_within_regional_bounds(fallback_lat, fallback_lon):
            return fallback_lat, fallback_lon, "MANUAL_PIN_FALLBACK"

    raise ValueError("Coordinates missing or outside regional bounds.")


def test_exif_metadata_auto_population():
    """Criterion 2a: Valid EXIF coordinates auto-populate seamlessly."""
    # Kochi coordinates
    exif_lat, exif_lon = 9.9816, 76.2999
    lat, lon, source = resolve_metadata_coordinates(
        exif_lat=exif_lat,
        exif_lon=exif_lon,
        fallback_lat=None,
        fallback_lon=None,
    )
    assert lat == 9.9816
    assert lon == 76.2999
    assert source == "EXIF_AUTO_POPULATED"


def test_metadata_stripped_prompts_fallback():
    """Criterion 2b: Metadata-stripped images gracefully fall back to map pin drop."""
    pin_lat, pin_lon = 10.5276, 76.2144  # Thrissur
    lat, lon, source = resolve_metadata_coordinates(
        exif_lat=None,
        exif_lon=None,
        fallback_lat=pin_lat,
        fallback_lon=pin_lon,
    )
    assert lat == 10.5276
    assert lon == 76.2144
    assert source == "MANUAL_PIN_FALLBACK"


def test_out_of_bounds_coordinates_rejected():
    """Coordinates far outside Kerala (e.g. New Delhi: 28.6139, 77.2090) should raise error."""
    with pytest.raises(ValueError):
        resolve_metadata_coordinates(
            exif_lat=28.6139,
            exif_lon=77.2090,
            fallback_lat=None,
            fallback_lon=None,
        )

