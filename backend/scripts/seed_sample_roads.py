#!/usr/bin/env python3
import os
import uuid
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgrespassword@localhost:5432/road_damage_db"
)

engine = create_engine(DATABASE_URL)

SAMPLE_ROADS = [
    {
        "id": str(uuid.uuid4()),
        "osm_way_id": 100001,
        "road_name": "NH 766 Wayanad Ghat Road (Lakkidi - Vythiri)",
        "road_class": "primary",
        "speed_limit_kmh": 50,
        "adt_volume": 14000,
        "is_sensitive_zone": True,
        "region": "kerala",
        "geom_wkt": "MULTILINESTRING((76.0200 11.5100, 76.0280 11.5200, 76.0350 11.5300, 76.0450 11.5500))"
    },
    {
        "id": str(uuid.uuid4()),
        "osm_way_id": 100002,
        "road_name": "NH 66 Kozhikode Bypass (Ramanattukara - Vengeri)",
        "road_class": "trunk",
        "speed_limit_kmh": 80,
        "adt_volume": 25000,
        "is_sensitive_zone": False,
        "region": "kerala",
        "geom_wkt": "MULTILINESTRING((75.8200 11.2100, 75.8350 11.2500, 75.8400 11.2800, 75.8300 11.3100))"
    },
    {
        "id": str(uuid.uuid4()),
        "osm_way_id": 100003,
        "road_name": "M.G. Road (Marine Drive - Thevara, Ernakulam)",
        "road_class": "primary",
        "speed_limit_kmh": 50,
        "adt_volume": 32000,
        "is_sensitive_zone": True,
        "region": "kerala",
        "geom_wkt": "MULTILINESTRING((76.2800 9.9500, 76.2810 9.9600, 76.2820 9.9700, 76.2850 9.9850))"
    },
    {
        "id": str(uuid.uuid4()),
        "osm_way_id": 100004,
        "road_name": "NH 66 Kazhakoottam Bypass (Technopark, Thiruvananthapuram)",
        "road_class": "trunk",
        "speed_limit_kmh": 80,
        "adt_volume": 28000,
        "is_sensitive_zone": False,
        "region": "kerala",
        "geom_wkt": "MULTILINESTRING((76.8800 8.5600, 76.8900 8.5400, 76.9000 8.5100, 76.9200 8.4800))"
    }
]

def seed():
    with engine.begin() as conn:
        for road in SAMPLE_ROADS:
            # Check if exists by osm_way_id
            exists = conn.execute(
                text("SELECT id FROM road_segments WHERE osm_way_id = :osm_id"),
                {"osm_id": road["osm_way_id"]}
            ).fetchone()
            if not exists:
                conn.execute(
                    text("""
                        INSERT INTO road_segments (
                            id, osm_way_id, road_name, road_class,
                            speed_limit_kmh, adt_volume, is_sensitive_zone,
                            region, geom
                        ) VALUES (
                            :id, :osm_way_id, :road_name, :road_class,
                            :speed_limit_kmh, :adt_volume, :is_sensitive_zone,
                            :region, ST_Multi(ST_GeomFromText(:geom_wkt, 4326))
                        )
                    """),
                    road
                )
                print(f"Seeded road: {road['road_name']}")
            else:
                print(f"Road already exists: {road['road_name']}")

if __name__ == "__main__":
    seed()

