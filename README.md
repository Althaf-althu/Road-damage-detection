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
*Default login: `admin@pwd.kerala.gov.in` / `ChangeMe@2026!`*

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

---

## 🧪 Phase-by-Phase Roadmap

Refer to `BUILD_PHASES.md` in the system artifacts for full details:
- **Phase 1**: Foundation & Infrastructure (`Completed ✅`)
- **Phase 2**: Citizen Portal, EXIF Extraction, Snapping & Deduplication (`Completed ✅`)
- **Phase 3**: ML Perception Pipeline (YOLOv8 & Depth Anything V2) (`Completed ✅`)
- **Phase 4**: Admin War Room, Priority Scoring, Work Orders & Resolution Emails (`Completed ✅`)
- **Phase 5**: Geotechnical AI Material Advisory (SoilGrids, Open-Elevation, Gemini) (`Next ⏳`)
- **Phase 6**: Acceptance Testing, Hardening & Final Documentation

