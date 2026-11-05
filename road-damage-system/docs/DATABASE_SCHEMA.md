# Database Schema & Spatial Indexing Specification

PostgreSQL 15 with PostGIS 3.3 extension. All spatial geometries use SRID 4326 (WGS 84).

---

## 1. Extension Initialization

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 2. Table Specifications

### `users`
Authentication and RBAC.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique user identifier |
| `email` | `VARCHAR(255)` | `UNIQUE NOT NULL` | Login email (indexed) |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Bcrypt hashed password |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | Display name |
| `phone_number` | `VARCHAR(30)` | `NULLABLE` | Contact phone |
| `role` | `VARCHAR(30)` | `DEFAULT 'citizen'` | `citizen`, `inspector`, `supervisor`, `admin` |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Soft-deactivation toggle |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()` | Registration timestamp |

---

### `road_segments`
Centerlines and traffic characteristics for road corridors across Kerala.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique segment identifier |
| `osm_way_id` | `BIGINT` | `UNIQUE` | OpenStreetMap Way ID |
| `road_name` | `VARCHAR(255)` | `NOT NULL` | Highway/road corridor name |
| `road_class` | `VARCHAR(50)` | `NOT NULL` | motorway, trunk, primary, secondary, tertiary, residential |
| `speed_limit_kmh`| `INT` | `DEFAULT 50` | Operational speed limit |
| `adt_volume` | `INT` | `DEFAULT 1500` | Average Daily Traffic volume |
| `is_sensitive_zone`| `BOOLEAN` | `DEFAULT FALSE` | Proximity to schools, hospitals, or steep hairpin bends |
| `region` | `VARCHAR(100)` | `DEFAULT 'kerala'` | State/jurisdiction identifier |
| `geom` | `GEOMETRY(MultiLineString, 4326)` | `NOT NULL` | Polyline centerline |

**Spatial Index:**
```sql
CREATE INDEX idx_road_segments_geom ON road_segments USING GIST(geom);
CREATE INDEX idx_road_segments_region ON road_segments(region);
```

---

### `defect_complaints`
Citizen-submitted distress records and automated vision inferences.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | Internal defect record ID |
| `ticket_id` | `VARCHAR(50) UNIQUE` | Public tracking ID (`TKT-YYYY-XXXXX`) |
| `citizen_id` | `UUID REFERENCES users(id)` | Foreign key to submitting citizen |
| `citizen_email` | `VARCHAR(255)` | Receipt email for completion notification |
| `raw_lat`, `raw_lon`| `DOUBLE PRECISION` | Client EXIF or device GPS coordinates |
| `snapped_point` | `GEOMETRY(Point, 4326)` | Sub-metre snapped point on the road polyline |
| `road_segment_id`| `UUID REFERENCES road_segments(id)`| Matched corridor |
| `snap_radius_override_m`| `DOUBLE PRECISION NULL` | Admin override for mis-snap correction |
| `snap_override_by` | `UUID REFERENCES users(id)` | Admin who applied snap correction |
| `media_url` | `TEXT NOT NULL` | Original complaint photo or video |
| `media_type` | `VARCHAR(20)` | `image` or `video` |
| `defect_type` | `VARCHAR(50)` | `pothole`, `fatigue_crack`, `transverse_crack`, `rutting` |
| `severity_area_sqm`| `DOUBLE PRECISION` | Surface area ($m^2$) from segmentation mask |
| `severity_depth_cm`| `DOUBLE PRECISION` | Estimated depth ($cm$) from depth map |
| `uncertainty_score`| `DOUBLE PRECISION` | Monte Carlo dropout uncertainty (0.0 – 1.0) |
| `priority_score` | `DOUBLE PRECISION` | Dynamic MCDA prioritization score (0 – 100) |
| `status` | `VARCHAR(50)` | `SUBMITTED`, `UNDER_REVIEW`, `SCHEDULED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED` |
| `upvote_count` | `INT DEFAULT 1` | Merged duplicate complaint count |
| `cluster_id` | `UUID` | 30m DBSCAN spatial cluster identifier |
| `post_repair_media_url` | `TEXT` | Mandatory photo uploaded by field repair crew |
| `repair_notes` | `TEXT` | Field crew notes |
| `created_at` | `TIMESTAMPTZ` | Submission time |
| `resolved_at` | `TIMESTAMPTZ` | Official ticket resolution time |
| `resolution_email_sent_at` | `TIMESTAMPTZ` | Timestamp when notification was delivered |

**Spatial & B-Tree Indexes:**
```sql
CREATE INDEX idx_defect_geom ON defect_complaints USING GIST(snapped_point);
CREATE INDEX idx_defect_ticket ON defect_complaints(ticket_id);
CREATE INDEX idx_defect_status ON defect_complaints(status);
CREATE INDEX idx_defect_road_segment ON defect_complaints(road_segment_id);
```

---

### `work_orders`
Municipal maintenance crew dispatch and execution verification.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | Order UUID |
| `order_id` | `VARCHAR(50) UNIQUE` | Public work order identifier (`WO-YYYY-XXXXX`) |
| `complaint_id` | `UUID REFERENCES defect_complaints(id)` | Target defect ticket |
| `assigned_by` | `UUID REFERENCES users(id)` | Supervising engineer |
| `assigned_to_depot`| `VARCHAR(255)` | PWD Maintenance Depot name |
| `status` | `VARCHAR(50)` | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `technician_lat`, `technician_lon`| `DOUBLE PRECISION` | GPS coordinates when technician completed repair |
| `location_verified`| `VARCHAR(10)` | Verification match: `PASS` (≤ 30m), `WARN` (> 30m), `SKIP` |
| `notes` | `TEXT` | Work order logs |
| `created_at`, `completed_at` | `TIMESTAMPTZ` | Dispatch & completion timestamps |

---

### `geotech_profiles`
Terrain, hydrology, and soil intelligence cached per road corridor.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | Profile ID |
| `road_segment_id`| `UUID UNIQUE REFERENCES road_segments(id)` | Target road segment |
| `elevation_m` | `DOUBLE PRECISION` | Elevation above sea level (Copernicus DEM) |
| `slope_percentage`| `DOUBLE PRECISION` | Gradient percentage |
| `soil_texture` | `VARCHAR(100)` | Primary soil classification (ISRIC SoilGrids) |
| `clay_percent`, `silt_percent`, `sand_percent` | `DOUBLE PRECISION` | Soil texture fraction |
| `cbr_estimate` | `DOUBLE PRECISION` | Estimated California Bearing Ratio |
| `water_retention_capacity` | `VARCHAR(50)` | `Low`, `Moderate`, `Extreme` |
| `soil_moisture_index` | `DOUBLE PRECISION` | Open-Meteo root-zone moisture index |
| `ai_advisory_payload` | `JSONB` | Cached structural recommendation from Gemini LLM |
| `updated_at` | `TIMESTAMPTZ` | Telemetry refresh timestamp |

