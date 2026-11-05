# MASTER ENGINEERING SPECIFICATION & AGENT PROMPT: ROAD DAMAGE DETECTION, GEOTECHNICAL ADVISORY & MAINTENANCE PRIORITIZATION SYSTEM

---

## 1. MISSION STATEMENT & CORE PRINCIPLES

You are tasked with building the complete, production-grade **Road Damage Detection and Maintenance Prioritization System**. This platform functions as an end-to-end spatial decision-support engine connecting civic reporting directly to municipal field operations, predictive maintenance scheduling, and geotechnical road design.

### Core Architectural Directives:
1. **Strict Decoupling of Concerns:** Maintain clean modularity between `/frontend` (Next.js/React), `/backend` (FastAPI), `/ml_pipeline` (Computer Vision & Inference), and `/docs` (Architecture & API contracts).
2. **Dual-Role Interface Separation:** Provide two isolated user experiences:
   - **Public Citizen Portal (`/portal`):** Zero-friction complaint registration, media upload (photo/video), automatic client-side EXIF GPS extraction, real-time map road-snapping visualizer, ticket status tracking, and automated email notifications with before/after photos upon repair completion.
   - **Municipal Authority / Admin Console (`/admin`):** Geospatial war-room dashboard, split-pane road segment inspector, automated 30-meter report deduplication radar, transparent multi-criteria prioritization scoring, work-order dispatch, and an AI-driven Geotechnical & Material Advisory Engine.
3. **Centralized API Management:** All external API keys, service URLs, and credentials must live exclusively in a root-level `api_keys.env` file. Under no circumstances should API endpoints or keys be hardcoded across business logic.
4. **Deployable by Design:** Every service must contain production-grade Dockerfiles, orchestrated via `docker-compose.yml`, with environment toggles allowing independent deployment (e.g., Frontend on Vercel, Backend container on Render, and PostGIS database on Supabase/Neon).

---

## 2. REPOSITORY & DIRECTORY ARCHITECTURE

Construct the file tree according to this directory layout:

```
road-damage-system/
├── api_keys.env                          # Single centralized configuration for all external API keys
├── docker-compose.yml                    # Multi-container orchestration (Backend, Frontend, DB, Redis)
├── .env.example                          # Application environment variable template
├── README.md                             # Installation, execution & deployment guide
│
├── frontend/                             # Next.js 14+ (App Router, TypeScript, Tailwind CSS)
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── public/
│   │   ├── icons/
│   │   └── markers/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx                # Root layout with Tailwind dark theme
│       │   ├── page.tsx                  # Public landing / role gateway
│       │   ├── (auth)/                   # Authentication sub-routes
│       │   │   ├── login/page.tsx        # Unified login with role-based routing
│       │   │   └── register/page.tsx     # Citizen registration
│       │   ├── (citizen)/                # Public Citizen Experience
│       │   │   ├── layout.tsx            # Citizen navigation & active ticket pill
│       │   │   ├── report/page.tsx       # Multi-step complaint wizard with map feedback
│       │   │   └── track/page.tsx        # Live ticket tracking & completion gallery
│       │   └── (admin)/                  # Municipal Authority Command Center
│       │       ├── layout.tsx            # Operations shell, sidebar & alert websockets
│       │       ├── dashboard/page.tsx    # High-density network overview & heatmap
│       │       ├── inspector/page.tsx    # Split-pane road segment & defect inspector
│       │       ├── work-orders/page.tsx  # Work-order dispatch & completion review
│       │       └── geotech/page.tsx      # 3D terrain, soil data & AI material advisory
│       ├── components/
│       │   ├── ui/                       # Reusable primitives (Buttons, Cards, Modals)
│       │   ├── map/
│       │   │   ├── RoadSegmentMap.tsx    # Dynamic snapped segment polyline highlighter
│       │   │   ├── DefectHeatmap.tsx     # WebGL/Leaflet density heatmap
│       │   │   └── TerrainViewer.tsx     # 3D contour elevation & runoff vectors
│       │   ├── citizen/                  # Upload Dropzone, EXIF Extractor, Ticket Card
│       │   └── admin/                    # Priority matrix breakdown, Dispatch modal
│       ├── config/
│       │   └── endpoints.ts              # Reads NEXT_PUBLIC_* API URLs & map tile styles
│       ├── lib/
│       │   ├── api-client.ts             # Axios/Fetch wrapper with JWT bearer interceptors
│       │   ├── exif-parser.ts            # Client-side EXIF GPS extraction from media
│       │   └── geo-utils.ts              # GeoJSON helpers & distance calculations
│       └── types/
│           ├── auth.d.ts
│           ├── defect.d.ts
│           └── geotech.d.ts
│
├── backend/                              # FastAPI (Python 3.11+, PostGIS, Celery)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── migrations/                       # Alembic PostGIS schema migrations
│   │   └── versions/
│   └── app/
│       ├── __init__.py
│       ├── main.py                       # FastAPI initialization & route mounting
│       ├── config_apis.py                # Pydantic settings loading api_keys.env
│       ├── database.py                   # SQLAlchemy engine & PostGIS connection pool
│       ├── api/                          # Route Handlers
│       │   ├── auth.py                   # JWT Auth (Citizen & Admin RBAC)
│       │   ├── complaints.py             # Citizen report intake & file upload
│       │   ├── road_inspector.py         # Map matching, snapping & segment queries
│       │   ├── prioritization.py         # Dynamic MCDA scoring endpoints
│       │   ├── work_orders.py            # Dispatch status, photo verification, ticket closure
│       │   └── geotech_advisor.py        # Topography, soil data & AI material advisory
│       ├── models/                       # SQLAlchemy ORM Models
│       │   ├── user.py                   # Users table with roles
│       │   ├── complaint.py              # Defect complaints & EXIF attributes
│       │   ├── road_segment.py           # Road network polylines (PostGIS geometry)
│       │   ├── work_order.py             # Maintenance orders & post-repair verification
│       │   └── geotech_profile.py        # Topography, slope & soil attributes
│       ├── schemas/                      # Pydantic DTOs (Request / Response validation)
│       │   ├── user_schema.py
│       │   ├── complaint_schema.py
│       │   ├── road_segment_schema.py
│       │   ├── work_order_schema.py
│       │   └── geotech_schema.py
│       ├── services/                     # Business Logic Layer
│       │   ├── map_matcher.py            # PostGIS ST_ClosestPoint & ST_DWithin query
│       │   ├── deduplication.py          # 30-meter buffer spatial clustering (DBSCAN)
│       │   ├── mcda_engine.py            # Multi-Criteria Prioritization calculation
│       │   ├── geotech_service.py        # DEM elevation, slope & SoilGrids fetcher
│       │   ├── llm_consultant.py         # Domain-tuned AI prompt for pavement materials
│       │   └── mailer.py                 # Automated resolution emails with comparison photos
│       └── workers/                      # Asynchronous Processing
│           ├── celery_app.py             # Celery worker connected to Redis
│           └── tasks.py                  # Background vision jobs & notification queues
│
├── ml_pipeline/                          # Machine Learning & Defect Perception Engine
│   ├── Dockerfile
│   ├── requirements-ml.txt
│   ├── weights/                          # Model checkpoints (.pt, .onnx)
│   │   └── yolov8x-seg-road-damage.onnx
│   └── src/
│       ├── inference.py                  # Instance segmentation (Pothole, Crack, Rutting)
│       ├── depth_estimation.py           # Relative depth estimation (Depth Anything V2)
│       ├── uncertainty.py                # Monte Carlo dropout & calibration scoring
│       └── severity_calculator.py        # Surface area ($m^2$) & volume estimation
│
└── docs/                                 # Architectural Documentation & Reference
    ├── ARCHITECTURE.md                   # System design, data flow diagrams
    ├── API_SPECIFICATION.md              # REST API endpoint contracts
    ├── DATABASE_SCHEMA.md                # PostgreSQL DDL & spatial indexes
    └── MCDA_PRIORITIZATION_MATH.md       # Scoring formula definitions and weights
```

---

## 3. CENTRALIZED API MANAGEMENT (`api_keys.env`)

Create a root file named `api_keys.env`. The backend reads this file through `backend/app/config_apis.py`. Each key is accompanied by instructions and acquisition links:

```env
# ==============================================================================
# 🔑 CENTRAL EXTERNAL API KEYS & CREDENTIALS
# ==============================================================================
# 1. Open the signup/dashboard URL provided above each key.
# 2. Generate or copy your API key.
# 3. Paste the key after the '=' sign (no quotes needed).
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. GEOTECHNICAL AI ADVISOR ENGINE
# ------------------------------------------------------------------------------
# Choose provider: gemini | openai | anthropic
LLM_PROVIDER=gemini

# Google Gemini API Key
# Get key here: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key (Optional alternative)
# Get key here: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Claude API Key (Optional alternative)
# Get key here: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here


# ------------------------------------------------------------------------------
# 2. MAP TILES & 3D TERRAIN VISUALIZATION
# ------------------------------------------------------------------------------
# Mapbox Public Access Token (for dark vector tiles & 3D contours)
# Get key here: https://account.mapbox.com/access-tokens/
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token_here
# Note: If left blank, the system automatically falls back to CartoDB Dark Matter / OSM (Free, no key needed)


# ------------------------------------------------------------------------------
# 3. CITIZEN TRANSACTIONAL RESOLUTION EMAILS
# ------------------------------------------------------------------------------
# Preferred: Resend API (Fast, modern, generous free tier)
# Get key here: https://resend.com/api-keys
RESEND_API_KEY=your_resend_api_key_here

# Alternative: SendGrid API Key
# Get key here: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Alternative: Standard Gmail SMTP (Use 16-char App Password, not main password)
# Generate here: https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_APP_PASSWORD=your_16_char_google_app_password
EMAIL_FROM_ADDRESS=notifications@roaddamage.gov


# ------------------------------------------------------------------------------
# 4. MEDIA STORAGE (CITIZEN UPLOADS & REPAIR PROOF)
# ------------------------------------------------------------------------------
# Cloudinary (Easy drop-in image/video hosting with auto transformations)
# Get credentials here: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Supabase Storage / S3 Alternative (If using Supabase bucket)
# Get credentials here: https://supabase.com/dashboard/project/_/settings/api
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
# Note: If cloud storage is unconfigured, the app falls back to local /backend/uploads directory.
```

### Backend API Configuration Loader (`backend/app/config_apis.py`):
```python
import os
from pydantic_settings import BaseSettings
from typing import Optional

class APIKeysConfig(BaseSettings):
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    NEXT_PUBLIC_MAPBOX_TOKEN: Optional[str] = None

    RESEND_API_KEY: Optional[str] = None
    SENDGRID_API_KEY: Optional[str] = None
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_APP_PASSWORD: Optional[str] = None
    EMAIL_FROM_ADDRESS: str = "notifications@roaddamage.gov"

    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    class Config:
        env_file = "../api_keys.env"
        env_file_encoding = "utf-8"
        extra = "ignore"

api_keys = APIKeysConfig()
```

---

## 4. DATABASE SCHEMA (POSTGRESQL + POSTGIS)

All spatial tables require PostGIS geometry data types indexed with GiST indexes.

```sql
-- Initialize spatial and cryptographic extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Authentication and Role-Based Access Control)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),
    role VARCHAR(30) DEFAULT 'citizen' CHECK (role IN ('citizen', 'inspector', 'supervisor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);

-- 2. Road Network Segments (Centerlines and Operational Metadata)
CREATE TABLE road_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    osm_way_id BIGINT UNIQUE,
    road_name VARCHAR(255) NOT NULL,
    road_class VARCHAR(50) NOT NULL, -- motorway, trunk, primary, secondary, tertiary, residential
    speed_limit_kmh INT DEFAULT 50,
    adt_volume INT DEFAULT 1500,     -- Average Daily Traffic volume
    is_sensitive_zone BOOLEAN DEFAULT FALSE, -- Near school, hospital, or steep curve
    geom GEOMETRY(MultiLineString, 4326) NOT NULL
);
CREATE INDEX idx_road_segments_geom ON road_segments USING GIST(geom);

-- 3. Defect Complaints Table (Citizen reports and automated inferences)
CREATE TABLE defect_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., TKT-2026-8941
    citizen_id UUID REFERENCES users(id) ON DELETE SET NULL,
    citizen_email VARCHAR(255) NOT NULL,
    raw_lat DOUBLE PRECISION NOT NULL,
    raw_lon DOUBLE PRECISION NOT NULL,
    snapped_point GEOMETRY(Point, 4326),
    road_segment_id UUID REFERENCES road_segments(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    defect_type VARCHAR(50), -- pothole, fatigue_crack, transverse_crack, rutting
    severity_area_sqm DOUBLE PRECISION DEFAULT 0.0,
    severity_depth_cm DOUBLE PRECISION DEFAULT 0.0,
    uncertainty_score DOUBLE PRECISION DEFAULT 0.0,
    priority_score DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'SUBMITTED' 
        CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
    upvote_count INT DEFAULT 1,
    cluster_id UUID,
    post_repair_media_url TEXT,
    repair_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_email_sent_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_defect_complaints_geom ON defect_complaints USING GIST(snapped_point);
CREATE INDEX idx_defect_complaints_ticket ON defect_complaints(ticket_id);
CREATE INDEX idx_defect_complaints_status ON defect_complaints(status);

-- 4. Geotechnical & Terrain Intelligence Profiles
CREATE TABLE geotech_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_segment_id UUID REFERENCES road_segments(id) UNIQUE ON DELETE CASCADE,
    elevation_m DOUBLE PRECISION,
    slope_percentage DOUBLE PRECISION,
    soil_texture VARCHAR(100), -- Clay, Silt, Sandy Loam, Clay Loam
    water_retention_capacity VARCHAR(50), -- Low, Moderate, Extreme
    groundwater_table_m DOUBLE PRECISION,
    ai_advisory_payload JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. COMPLETE END-TO-END FUNCTIONAL FLOWS

### 5.1 The Public Citizen Experience (`/portal`)
1. **Registration & Session Authentication:**
   - Citizens register at `/register` using Name, Email, Password, and Mobile Number.
   - Authentication issues a secure JWT with claim `role: 'citizen'`.
2. **Media Capture & Metadata Extraction:**
   - Citizen navigates to `/report`.
   - Citizen drops an image (`.jpg`, `.png`, `.heic`) or video (`.mp4`) into the dropzone.
   - Client-side EXIF extractor (`exif-parser.ts`) reads latitude, longitude, and capture timestamp.
   - *Fallback:* If EXIF tags are absent, the browser prompts for device GPS (`navigator.geolocation`) or allows tapping directly on the interactive map.
3. **Instant Road Snapping & Segment Highlighting:**
   - Client emits `POST /api/v1/road-inspector/snap` with extracted coordinates.
   - Backend queries PostGIS (`ST_ClosestPoint`, `ST_DWithin` with a 25-meter radius).
   - **Visual Feedback:** The map centers on the coordinates, drops the defect pin, and **highlights the entire road segment polyline** (e.g., an illuminated emerald corridor) with a badge: *"Identified Road: [Road Name] • Category: [Road Class]"*.
4. **Duplicate Detection Alert:**
   - If an open defect ticket already exists within a 30m radius on that road segment, the interface alerts the user:
     > *"A report has already been filed at this exact location (Ticket #TKT-2026-4821). Would you like to upvote this issue to increase its priority?"*
   - Clicking Upvote increments the existing report's `upvote_count` and attaches the user's email for closure notification without creating redundant database entries.
5. **Confirmation & Receipt:**
   - Citizen submits the form. The system outputs a unique tracking ID (`ticket_id`), enqueues background AI perception tasks, and directs the user to `/track`.

### 5.2 The Municipal Authority Command Experience (`/admin`)
1. **Geospatial War Room (`/admin/dashboard`):**
   - High-density vector map rendering road networks color-coded by urgency.
   - Heatmap overlays for pothole density and road deterioration clusters.
2. **Split-Pane Road Segment Inspector (`/admin/inspector`):**
   - **Left Pane (Diagnostics & Multi-Criteria Matrix):**
     - Citizen media proof (high-res image/video).
     - AI perception metrics: Defect taxonomy, surface area ($m^2$), estimated depth ($cm$), visual uncertainty score.
     - Road network profiling: Classification, speed limit, and Average Daily Traffic (ADT) tier.
     - Dynamic **Priority Score Formula** calculation displayed with full parameter breakdown:
       $$\text{Priority Score} = 100 \times \left( 0.40 \cdot S_{\text{norm}} + 0.25 \cdot T_{\text{norm}} + 0.20 \cdot R_{\text{norm}} + 0.15 \cdot Z_{\text{norm}} \right)$$
   - **Right Pane (Dynamic Map Canvas):**
     - Renders snapped road segment with priority halo coloring (Red = Urgent $\ge 75$, Orange = Moderate $50\text{--}74$, Green = Routine $< 50$).
     - Displays 30m cluster radius circle showing all merged citizen reports linked to this distress instance.
   - **Action Controls:**
     - One-click buttons: `Assign to Maintenance Depot`, `Schedule Corridor Patch`, or `Reject / False Alert`.

### 5.3 Closed-Loop Repair Completion & Citizen Email Notification
1. **On-Site Field Verification:**
   - Field crew completes the physical road repair.
   - Through `/admin/work-orders`, the technician uploads a mandatory **"Post-Repair Completion Photo"**.
   - The platform verifies that the technician's device coordinates match the original complaint coordinates within 30 meters.
2. **Ticket Closure & Email Dispatch:**
   - Marking the ticket `RESOLVED` triggers the asynchronous `send_resolution_email` Celery task.
   - The notification service delivers an HTML email to the citizen's registered email with before and after comparison photos.

---

## 6. GEOTECHNICAL AI MATERIAL ADVISORY ENGINE (`/admin/geotech`)

When authorities inspect chronic road failure locations, the system triggers the Geotechnical Intelligence Engine:

### 6.1 Data Ingestion (Free & Open APIs):
1. **Topography & Slope:** Copernicus 30m DEM / Open-Elevation API calculates terrain slope percentage ($0\text{--}15\%+$) and surface runoff vectors.
2. **Soil Taxonomy:** ISRIC SoilGrids REST API (`rest.isric.org`) provides clay, silt, and sand percentages and California Bearing Ratio (CBR) estimates.
3. **Moisture & Hydrology:** Open-Meteo Soil Moisture API provides root-zone soil water retention indices.

### 6.2 Civil Engineering Decision Logic:
- **Waterlogged / High-Retention Subgrade:** Slope $< 1.0\%$, Clay $> 35\%$, High Water Retention. Bitumen strips under standing water. **Mandate Interlocking Concrete Paver Blocks (ICPB / IRC:SP:63)** or porous concrete with perforated subsurface French drains.
- **Steep Gradient / High Runoff Velocity:** Slope $> 5.0\%$, silty erodible soil. **Mandate Reinforced Rigid Cement Concrete (M-40 grade)** with cast-in-situ side curb drains.
- **Heavy Traffic / Stable Subgrade:** Sandy Loam subgrade with high California Bearing Ratio (CBR). **Recommend Dense Bituminous Macadam (DBM)** with Polymer Modified Bitumen (PMB-120).
- **Expansive Clay / Black Cotton Soil:** High shrink-swell potential. **Mandate non-woven Geotextile Fabric** beneath Granular Sub-Base (GSB).

### 6.3 AI System Prompt for LLM Consultant:
```
You are a Principal Geotechnical & Pavement Infrastructure Engineer adhering strictly to IRC (Indian Roads Congress) and AASHTO standards.

Given the road classification, traffic tier, terrain slope percentage, soil taxonomy class, and water-retention capacity, provide concrete, durable engineering recommendations.

Always justify why asphalt fails in high-moisture zones and when Interlocking Concrete Paver Blocks (ICPB) or M-40 Rigid Concrete must replace conventional bituminous mixes.

OUTPUT FORMAT: Return strictly a valid JSON object matching this schema:
{
  "primary_recommendation": "Interlocking Concrete Paver Blocks (ICPB) | Rigid Concrete (M-40) | Polymer Modified Asphalt (DBM)",
  "pavement_type": "Rigid | Flexible | Semi-Rigid Composite",
  "technical_justification": "Clear, concise 2-sentence rationale based on soil and slope",
  "layer_specifications": [
    {"layer": "Subgrade Preparation", "spec": "..."},
    {"layer": "Sub-Base (GSB / Drainage)", "spec": "..."},
    {"layer": "Base Course", "spec": "..."},
    {"layer": "Wearing Surface", "spec": "..."}
  ],
  "drainage_mitigation": "Detailed drainage specification (e.g., perforated PVC French drain, concrete chute)",
  "expected_durability_comparison": {
    "proposed_solution_lifespan_years": 10,
    "conventional_asphalt_lifespan_months": 8
  }
}
```

---

## 7. CORE BACKEND CODE IMPLEMENTATION

### 7.1 Road Snapping & Map Matching Endpoint (`backend/app/api/road_inspector.py`)
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1/road-inspector", tags=["Road Inspector"])

class SnapRequest(BaseModel):
    latitude: float
    longitude: float
    search_radius_m: Optional[float] = 30.0

class SnappedRoadResponse(BaseModel):
    road_segment_id: str
    road_name: str
    road_class: str
    speed_limit: int
    adt_volume: int
    snapped_lat: float
    snapped_lon: float
    distance_to_road_m: float
    segment_geojson: str

@router.post("/snap", response_model=SnappedRoadResponse)
def snap_coordinates_to_road(req: SnapRequest, db: Session = Depends(get_db)):
    query = text("""
        SELECT 
            r.id::text AS road_segment_id,
            r.road_name,
            r.road_class,
            r.speed_limit_kmh AS speed_limit,
            r.adt_volume,
            ST_Y(ST_ClosestPoint(r.geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))) AS snapped_lat,
            ST_X(ST_ClosestPoint(r.geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))) AS snapped_lon,
            ST_Distance(r.geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) AS distance_to_road_m,
            ST_AsGeoJSON(r.geom) AS segment_geojson
        FROM road_segments r
        WHERE ST_DWithin(r.geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius)
        ORDER BY distance_to_road_m ASC
        LIMIT 1;
    """)

    result = db.execute(query, {
        "lat": req.latitude,
        "lon": req.longitude,
        "radius": req.search_radius_m
    }).fetchone()

    if not result:
        raise HTTPException(
            status_code=404, 
            detail="No designated road network segment found within the specified search radius."
        )

    return SnappedRoadResponse(
        road_segment_id=result.road_segment_id,
        road_name=result.road_name,
        road_class=result.road_class,
        speed_limit=result.speed_limit,
        adt_volume=result.adt_volume,
        snapped_lat=result.snapped_lat,
        snapped_lon=result.snapped_lon,
        distance_to_road_m=round(result.distance_to_road_m, 2),
        segment_geojson=result.segment_geojson
    )
```

### 7.2 Work-Order Resolution & Email Trigger (`backend/app/api/work_orders.py`)
```python
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.complaint import DefectComplaint
from app.services.mailer import send_resolution_email
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/v1/work-orders", tags=["Work Orders"])

class ResolveOrderRequest(BaseModel):
    ticket_id: str
    post_repair_media_url: str
    repair_notes: str

@router.post("/resolve")
def resolve_ticket(
    req: ResolveOrderRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    complaint = db.query(DefectComplaint).filter(DefectComplaint.ticket_id == req.ticket_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    complaint.status = "RESOLVED"
    complaint.post_repair_media_url = req.post_repair_media_url
    complaint.repair_notes = req.repair_notes
    complaint.resolved_at = datetime.utcnow()
    db.commit()

    # Dispatch resolution email to citizen
    background_tasks.add_task(
        send_resolution_email,
        recipient_email=complaint.citizen_email,
        ticket_id=complaint.ticket_id,
        road_name=complaint.road_segment.road_name if complaint.road_segment else "the reported road",
        lat=complaint.raw_lat,
        lon=complaint.raw_lon,
        before_image=complaint.media_url,
        after_image=complaint.post_repair_media_url,
        reported_date=complaint.created_at.strftime("%Y-%m-%d"),
        completed_date=complaint.resolved_at.strftime("%Y-%m-%d")
    )

    return {"status": "SUCCESS", "message": f"Ticket {req.ticket_id} marked RESOLVED. Citizen notified."}
```

---

## 8. FRONTEND IMPLEMENTATION: DYNAMIC SEGMENT VISUALIZER

```tsx
// frontend/src/components/map/RoadSegmentMap.tsx
"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RoadSegmentMapProps {
  defectCoords: [number, number]; // [lat, lng]
  roadGeoJson: any | null;        // GeoJSON Feature for the snapped road polyline
  roadName: string;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 17, { duration: 1.5 });
  }, [center, map]);
  return null;
}

const customDefectIcon = L.divIcon({
  className: "custom-pin",
  html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(239,68,68,0.9);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export const RoadSegmentMap: React.FC<RoadSegmentMapProps> = ({
  defectCoords,
  roadGeoJson,
  roadName,
}) => {
  return (
    <div className="relative w-full h-[450px] rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700 shadow-lg text-white">
        <p className="text-xs text-slate-400 uppercase font-semibold">Identified Road Corridor</p>
        <p className="text-sm font-bold text-emerald-400">{roadName || "Locating nearest road..."}</p>
      </div>

      <MapContainer center={defectCoords} className="w-full h-full" scrollWheelZoom={false} zoom={16}>
        <ChangeView center={defectCoords} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {roadGeoJson && (
          <GeoJSON
            data={roadGeoJson}
            key={JSON.stringify(roadGeoJson)}
            style={() => ({
              color: "#10b981", // Emerald illuminated corridor
              weight: 6,
              opacity: 0.85,
              lineCap: "round",
              lineJoin: "round",
            })}
          />
        )}
        <Marker icon={customDefectIcon} position={defectCoords} />
      </MapContainer>
    </div>
  );
};
```

---

## 9. DOCKER & DEPLOYMENT CONFIGURATIONS

### 9.1 Multi-Container Orchestration (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  db:
    image: postgis/postgis:15-3.3
    container_name: road_damage_db
    restart: always
    environment:
      POSTGRES_DB: road_damage_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: road_damage_redis
    restart: always
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: road_damage_backend
    restart: always
    env_file:
      - api_keys.env
      - .env
    environment:
      DATABASE_URL: postgresql://postgres:postgrespassword@db:5432/road_damage_db
      REDIS_URL: redis://redis:6379/0
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis

  celery_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: road_damage_worker
    restart: always
    command: celery -A app.workers.celery_app worker --loglevel=info
    env_file:
      - api_keys.env
      - .env
    environment:
      DATABASE_URL: postgresql://postgres:postgrespassword@db:5432/road_damage_db
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - backend
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: road_damage_frontend
    restart: always
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  pgdata:
```

### 9.2 Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required for PostGIS, GDAL & image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 10. VERIFICATION & ACCEPTANCE TESTING CRITERIA

Before declaring any implementation milestone complete, verify against these criteria:

1. **Role-Based Routing Isolation:**
   - Unauthenticated users attempting to access `/admin/*` must receive `401 Unauthorized` or redirect to `/login`.
   - Logged-in citizens attempting to access `/admin/*` must receive `403 Forbidden`.
2. **Metadata Extraction & Fallback:**
   - Uploading a JPEG with standard EXIF coordinates must auto-populate the coordinates and snap the road in under 2 seconds.
   - Uploading an image stripped of metadata must immediately prompt for browser GPS or map pin drop without application errors.
3. **Road Snapping Precision:**
   - Querying `POST /api/v1/road-inspector/snap` within 25m of a defined road must return valid GeoJSON for the road polyline.
4. **Spatial Deduplication:**
   - Submitting a second report within 30 meters of an active report must increment `upvote_count` and merge the user's email into the notification list.
5. **Geotechnical LLM Output:**
   - Testing `/api/v1/geotech/advise` for coordinates with clay $> 35\%$ and slope $< 1\%$ must output specifications recommending Interlocking Concrete Paver Blocks (ICPB) or porous concrete.
6. **Closed-Loop Email Delivery:**
   - Resolving a ticket via `/api/v1/work-orders/resolve` with a valid after-repair photo must generate an email dispatched to the reporting citizen's registered address.