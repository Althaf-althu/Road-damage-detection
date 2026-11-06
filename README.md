# Road Damage Detection, Geotechnical Advisory & Maintenance Prioritization System

Production-grade, full-stack spatial decision-support system connecting citizen defect reporting directly to municipal field operations, predictive maintenance scheduling, and geotechnical road design for **Kerala Public Works Department (PWD)**.

---

## 🏗️ Architecture Overview

The system is strictly decoupled into modular layers:
- **`frontend/`**: Next.js 14+ (App Router, React, Tailwind CSS, Leaflet, CartoDB Dark Matter)
- **`backend/`**: FastAPI, PostgreSQL 15 + PostGIS 3.3, Celery, SQLAlchemy 2.0, Alembic
- **`ml_pipeline/`**: YOLOv8 instance segmentation + Depth Anything V2 depth estimation
- **`docs/`**: Architecture diagrams, schema, and civil engineering MCDA formulations

---

## 🚦 Color-Coded Operational Status Corridors

The road network in Kerala is dynamically color-coded:
- 🔴 **Red**: Active defect reported by citizens (`SUBMITTED` / `UNDER_REVIEW`)
- 🟡 **Yellow**: Road under physical maintenance (`SCHEDULED` / `IN_PROGRESS`)
- 🟢 **Green**: Defect recently corrected and verified (`RESOLVED` within 90 days)
- ⬛ **Default**: Nominal state (no active defects)

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Docker & Docker Compose
- Python 3.11+ (if running scripts outside Docker)
- Node.js 18+ (if running frontend outside Docker)

### 2. Configure Credentials
Copy `.env.example` to `.env` and verify `api_keys.env`:
```bash
cp .env.example .env
```
Ensure `api_keys.env` has your settings (Gemini API key for Geotechnical Advisory, Gmail SMTP credentials for notifications, etc.).

### 3. Launch Services with Docker Compose
```bash
docker-compose up --build
```
This starts:
- **PostGIS Database**: `localhost:5432`
- **Redis Queue**: `localhost:6379`
- **FastAPI Backend**: `http://localhost:8000`
- **Celery Worker**: Background inference & email queues
- **ML Pipeline**: `http://localhost:8001`
- **Next.js Frontend**: `http://localhost:3000`

### 4. Database Schema Migration
Run Alembic migrations to initialize spatial tables and GiST indexes:
```bash
docker exec -it road_damage_backend alembic upgrade head
```

### 5. Seed Initial Admin Account
Create the administrator credentials for Kerala PWD console:
```bash
docker exec -it road_damage_backend python scripts/seed_admin.py
```
*Default login: `admin@roadwatch.local` / `ChangeMe@2026!`*

### 6. Import Kerala Road Network from OpenStreetMap
Fetch and load the entire road network for Kerala via Overpass API:
```bash
docker exec -it road_damage_backend python scripts/import_osm_roads.py
```
*Note: To import only primary/major corridors first, use:*
```bash
docker exec -it road_damage_backend python scripts/import_osm_roads.py --classes primary trunk motorway secondary
```

---

## 🌍 Multi-State Extensibility

The system is configured region-first. To adapt to another Indian state (e.g. Maharashtra, Tamil Nadu):
1. In `api_keys.env`, update:
   ```env
   REGION_NAME=maharashtra
   REGION_DISPLAY_NAME=Maharashtra
   REGION_AUTHORITY=Maharashtra PWD
   REGION_OSM_RELATION_ID=1950884
   REGION_BBOX=15.60,72.63,22.02,80.89
   ```
2. Re-run `import_osm_roads.py` to ingest the new state's road geometries.



## 🧪 Acceptance Test Matrix Verification

The test suite in `backend/tests/` verifies all 6 core criteria established in Section 10 of the system master blueprint:
1. **Role-Based Routing Isolation (`test_auth_rbac.py`)**: Unauthenticated `401 Unauthorized`, Citizen `403 Forbidden` on administrative routes.
2. **Metadata Extraction & Fallback (`test_exif_metadata_fallback.py`)**: Automatic EXIF GPS parsing with bounding-box validation and browser pin drop fallback.
3. **Road Snapping Precision (`test_snapping_deduplication.py`)**: High-fidelity road corridor projection within 25m threshold.
4. **Spatial Deduplication Radar (`test_snapping_deduplication.py`)**: 30-meter PostGIS radius deduplication and subscriber email merging.
5. **Geotechnical Material Advisory (`test_geotech_advisor.py`)**: Automatic synthesis of IRC:SP:63 Interlocking Concrete Paver Blocks on flat clay floodplains and IRC:58 Rigid M-40 concrete on steep gradients.
6. **Closed-Loop Resolution & Verification (`test_work_orders_resolution.py`)**: Field technician 30m GPS proximity check and automated Before/After citizen completion notifications.

