# Architecture & System Design: Kerala Road Damage Decision Support Engine

## System Topology & End-to-End Data Flow

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Presentation Layer"]
        CP["Citizen Portal (Next.js 14)<br/>• EXIF Client GPS Parser<br/>• Road Segment Snap Map<br/>• Upvote Deduplication"]
        AC["Admin Console (Next.js 14)<br/>• Geospatial War Room<br/>• Split-Pane Inspector<br/>• Geotech 3D Terrain Viewer"]
    end

    subgraph APILayer ["2. Application & Ingestion Layer (FastAPI)"]
        AUTH["JWT RBAC Guard<br/>Citizen | Admin"]
        SNAP["Road Inspector API<br/>PostGIS ST_ClosestPoint (25m)"]
        COMP["Complaint Intake & Deduplication<br/>DBSCAN 30m Clustering"]
        WO["Work Order Lifecycle<br/>Before/After Photo Verification"]
        GEO["Geotech Advisor Endpoint"]
    end

    subgraph AsyncLayer ["3. Background Task Pipeline (Celery + Redis)"]
        Q["Redis Message Broker"]
        CW["Celery Workers"]
        ML["ML Pipeline (FastAPI Container)<br/>• YOLOv8x-seg ONNX<br/>• Depth Anything V2<br/>• Severity & Monte Carlo Uncertainty"]
        MAIL["Email Service<br/>Gmail SMTP / Resend<br/>Side-by-side Photo Dispatch"]
    end

    subgraph DataLayer ["4. Persistence & Spatial Cache"]
        PG[("PostgreSQL 15 + PostGIS 3.3<br/>• MultiLineString Road Corridors<br/>• Point Defect Geometry<br/>• GiST Spatial Indexes")]
    end

    subgraph ExternalAPIs ["5. Open Earth & Geotechnical Telemetry"]
        OSM["OpenStreetMap Overpass API<br/>Road Network Centerlines"]
        SG["ISRIC SoilGrids REST API<br/>Clay / Silt / Sand / CBR"]
        DEM["Open-Elevation / Copernicus DEM<br/>Slope Percentage & Runoff Vectors"]
        OM["Open-Meteo API<br/>Root-Zone Soil Moisture"]
        GEM["Google Gemini 1.5 Flash<br/>Pavement Structural Design AI"]
    end

    CP -->|Upload & Snap| SNAP
    CP -->|Register & Track| COMP
    AC -->|Dispatch & Review| WO
    AC -->|Analyze Segment| GEO

    SNAP <-->|Spatial Query| PG
    COMP -->|Persist| PG
    COMP -->|Enqueue Task| Q
    Q --> CW
    CW -->|Infer Defect & Depth| ML
    CW -->|Send Resolution Notice| MAIL
    GEO --> SG
    GEO --> DEM
    GEO --> OM
    GEO --> GEM
    OSM -->|import_osm_roads.py| PG
```

## Security & Access Control
- Passwords hashed with `bcrypt`
- Stateless JWT bearer tokens with configurable expiration (default 24h)
- Dual-role authorization:
  - `citizen`: Can report defects, upvote duplicates, and track tickets
  - `inspector` / `supervisor` / `admin`: Access war-room heatmap, split-pane road inspector, work order completion review, and geotech AI advisory

