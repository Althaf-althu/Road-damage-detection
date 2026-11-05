#!/usr/bin/env python3
"""
Kerala Road Network Importer
==============================
Fetches road geometry from OpenStreetMap via the Overpass API and imports
it into the PostGIS road_segments table.

Usage:
    python import_osm_roads.py                    # Import all roads for configured region
    python import_osm_roads.py --classes primary  # Import only primary roads
    python import_osm_roads.py --clear            # Clear existing and re-import
    python import_osm_roads.py --relation 1263070 # Override OSM relation ID

The script chunks the bounding box into a grid and imports in batches to
handle Kerala's large road network (~180,000+ ways) without timeout issues.
"""

import sys
import os
import time
import argparse
import logging
import requests
from typing import Optional

# Add backend root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────────

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgrespassword@localhost:5432/road_damage_db"
)

# Overpass API endpoint (uses public instance with rate-limit respect)
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
OVERPASS_TIMEOUT = 300  # seconds

# Road classes to import — ordered by importance
ROAD_CLASSES_ALL = [
    "motorway", "motorway_link",
    "trunk", "trunk_link",
    "primary", "primary_link",
    "secondary", "secondary_link",
    "tertiary", "tertiary_link",
    "residential",
    "unclassified",
    "service",
]

# ADT (Average Daily Traffic) estimates by road class — Kerala-calibrated
ADT_BY_CLASS = {
    "motorway": 25000, "motorway_link": 15000,
    "trunk": 15000,    "trunk_link": 10000,
    "primary": 8000,   "primary_link": 5000,
    "secondary": 4000, "secondary_link": 3000,
    "tertiary": 2000,  "tertiary_link": 1500,
    "residential": 500,
    "unclassified": 800,
    "service": 300,
}

# Default speed limits by class (kmh)
SPEED_BY_CLASS = {
    "motorway": 100, "motorway_link": 80,
    "trunk": 80,     "trunk_link": 60,
    "primary": 60,   "primary_link": 50,
    "secondary": 50, "secondary_link": 40,
    "tertiary": 40,  "tertiary_link": 30,
    "residential": 30,
    "unclassified": 40,
    "service": 20,
}

# Kerala state OSM relation ID → Overpass area ID formula: relation_id + 3,600,000,000
KERALA_RELATION_ID = int(os.getenv("REGION_OSM_RELATION_ID", "1263070"))
KERALA_AREA_ID = 3_600_000_000 + KERALA_RELATION_ID
REGION_NAME = os.getenv("REGION_NAME", "kerala")

# Bounding box grid chunking (splits Kerala into NxN tiles to avoid Overpass timeout)
BBOX_STR = os.getenv("REGION_BBOX", "8.17,74.85,12.78,77.42")


def parse_bbox(bbox_str: str):
    parts = [float(x) for x in bbox_str.split(",")]
    return parts[0], parts[1], parts[2], parts[3]  # min_lat, min_lon, max_lat, max_lon


def build_bbox_grid(min_lat, min_lon, max_lat, max_lon, grid_n=3):
    """Split the bounding box into grid_n × grid_n tiles for chunked import."""
    lat_step = (max_lat - min_lat) / grid_n
    lon_step = (max_lon - min_lon) / grid_n
    tiles = []
    for i in range(grid_n):
        for j in range(grid_n):
            tiles.append((
                round(min_lat + i * lat_step, 4),
                round(min_lon + j * lon_step, 4),
                round(min_lat + (i + 1) * lat_step, 4),
                round(min_lon + (j + 1) * lon_step, 4),
            ))
    return tiles


def build_overpass_query(bbox: tuple, road_classes: list[str]) -> str:
    """Build an Overpass QL query for road ways in a bounding box."""
    s, w, n, e = bbox
    class_filter = "|".join(road_classes)
    return f"""
[out:json][timeout:{OVERPASS_TIMEOUT}];
(
  way["highway"~"^({class_filter})$"]({s},{w},{n},{e});
);
out body;
>;
out skel qt;
"""


def fetch_overpass(query: str, retries: int = 3) -> Optional[dict]:
    """Fetch road data from Overpass API with retry logic."""
    for attempt in range(1, retries + 1):
        try:
            logger.info(f"  Querying Overpass API (attempt {attempt}/{retries})...")
            resp = requests.post(
                OVERPASS_URL,
                data={"data": query},
                timeout=OVERPASS_TIMEOUT + 30,
                headers={"User-Agent": "KeralaRoadDamageSystem/1.0"},
            )
            resp.raise_for_status()
            data = resp.json()
            logger.info(f"  Got {len(data.get('elements', []))} elements")
            return data
        except requests.RequestException as e:
            logger.warning(f"  Overpass request failed: {e}")
            if attempt < retries:
                wait = 10 * attempt
                logger.info(f"  Retrying in {wait}s...")
                time.sleep(wait)
    return None


def parse_ways(data: dict) -> tuple[dict, list]:
    """
    Parse OSM JSON response into node map and way list.
    Returns: (node_map {id: (lat, lon)}, ways [{id, tags, node_ids}])
    """
    node_map = {}
    ways = []
    for el in data.get("elements", []):
        if el["type"] == "node":
            node_map[el["id"]] = (el["lat"], el["lon"])
        elif el["type"] == "way":
            ways.append(el)
    return node_map, ways


def way_to_wkt_multilinestring(node_ids: list, node_map: dict) -> Optional[str]:
    """Convert a list of OSM node IDs to PostGIS WKT MULTILINESTRING."""
    coords = []
    for nid in node_ids:
        if nid in node_map:
            lat, lon = node_map[nid]
            coords.append(f"{lon} {lat}")
    if len(coords) < 2:
        return None
    line = ", ".join(coords)
    return f"MULTILINESTRING(({line}))"


def import_ways(session, ways: list, node_map: dict, road_classes: list, region: str):
    """Insert ways into road_segments table, skipping duplicates by osm_way_id."""
    inserted = 0
    skipped = 0

    for way in ways:
        tags = way.get("tags", {})
        highway = tags.get("highway", "")
        if highway not in road_classes:
            continue

        wkt = way_to_wkt_multilinestring(way.get("nodes", []), node_map)
        if not wkt:
            skipped += 1
            continue

        road_name = (
            tags.get("name")
            or tags.get("name:en")
            or tags.get("ref")
            or "Unnamed Road"
        )

        road_class = highway.replace("_link", "")  # Normalize _link variants
        speed = int(tags.get("maxspeed", "").replace(" mph", "").replace(" kmh", "") or
                    SPEED_BY_CLASS.get(highway, 40))
        adt = ADT_BY_CLASS.get(highway, 1000)

        try:
            session.execute(text("""
                INSERT INTO road_segments
                    (osm_way_id, road_name, road_class, speed_limit_kmh, adt_volume, region, geom)
                VALUES
                    (:osm_id, :name, :class, :speed, :adt, :region,
                     ST_Multi(ST_GeomFromText(:wkt, 4326)))
                ON CONFLICT (osm_way_id) DO NOTHING;
            """), {
                "osm_id": way["id"],
                "name": road_name[:255],
                "class": road_class,
                "speed": min(speed, 150),
                "adt": adt,
                "region": region,
                "wkt": wkt,
            })
            inserted += 1
        except Exception as e:
            logger.debug(f"  Skip way {way['id']}: {e}")
            skipped += 1

    return inserted, skipped


def run_import(args):
    logger.info("=" * 60)
    logger.info("Kerala Road Network Importer")
    logger.info(f"Region: {REGION_NAME.upper()} | OSM Relation: {KERALA_RELATION_ID}")
    logger.info("=" * 60)

    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)

    road_classes = args.classes if args.classes else ROAD_CLASSES_ALL
    logger.info(f"Importing road classes: {road_classes}")

    if args.clear:
        logger.warning("⚠️  Clearing existing road_segments table...")
        with engine.begin() as conn:
            conn.execute(text("TRUNCATE road_segments CASCADE;"))
        logger.info("Table cleared.")

    min_lat, min_lon, max_lat, max_lon = parse_bbox(BBOX_STR)
    tiles = build_bbox_grid(min_lat, min_lon, max_lat, max_lon, grid_n=3)

    logger.info(f"Bbox: {min_lat},{min_lon} → {max_lat},{max_lon}")
    logger.info(f"Chunked into {len(tiles)} grid tiles")

    total_inserted = 0
    total_skipped = 0

    for idx, tile in enumerate(tiles):
        s, w, n, e = tile
        logger.info(f"\n[Tile {idx+1}/{len(tiles)}] bbox=({s},{w},{n},{e})")

        query = build_overpass_query(tile, road_classes)
        data = fetch_overpass(query)

        if not data:
            logger.error(f"  Failed to fetch tile {idx+1}, skipping.")
            continue

        node_map, ways = parse_ways(data)
        logger.info(f"  Parsed {len(ways)} ways, {len(node_map)} nodes")

        with Session() as session:
            with session.begin():
                ins, skip = import_ways(session, ways, node_map, road_classes, REGION_NAME)
                total_inserted += ins
                total_skipped += skip

        logger.info(f"  Inserted: {ins} | Skipped: {skip}")

        # Respect Overpass rate limits
        if idx < len(tiles) - 1:
            logger.info("  Waiting 5s before next tile...")
            time.sleep(5)

    logger.info("\n" + "=" * 60)
    logger.info(f"✅ Import complete!")
    logger.info(f"   Total inserted: {total_inserted}")
    logger.info(f"   Total skipped:  {total_skipped}")
    logger.info("=" * 60)

    # Verify count
    with engine.connect() as conn:
        count = conn.execute(
            text(f"SELECT COUNT(*) FROM road_segments WHERE region = '{REGION_NAME}'")
        ).scalar()
        logger.info(f"   Road segments in DB for '{REGION_NAME}': {count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import Kerala road network from OSM Overpass API")
    parser.add_argument(
        "--classes",
        nargs="+",
        choices=ROAD_CLASSES_ALL,
        help="Road classes to import (default: all)",
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear existing road_segments before importing",
    )
    parser.add_argument(
        "--relation",
        type=int,
        help="Override OSM relation ID (default: Kerala 1263070)",
    )
    args = parser.parse_args()

    if args.relation:
        KERALA_RELATION_ID = args.relation
        KERALA_AREA_ID = 3_600_000_000 + args.relation

    run_import(args)

