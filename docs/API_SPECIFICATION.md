# REST API Specification — Kerala Road Damage System

Base URL: `http://localhost:8000/api/v1`

All responses follow standard HTTP status codes. Errors return JSON with `{ "detail": "error message" }`.

---

## 1. Authentication (`/api/v1/auth`)

### `POST /auth/register`
Register a citizen account.
- **Request Body:**
  ```json
  {
    "full_name": "Sreejith Kumar",
    "email": "sreejith@example.com",
    "password": "Password123!",
    "phone_number": "+919876543210"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "role": "citizen",
    "full_name": "Sreejith Kumar"
  }
  ```

### `POST /auth/login`
OAuth2 password flow.
- **Content-Type:** `application/x-www-form-urlencoded`
- **Fields:** `username` (email), `password`
- **Response `200 OK`:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "role": "admin",
    "full_name": "Kerala PWD Administrator"
  }
  ```

### `GET /auth/me`
Retrieve authenticated user profile.
- **Header:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "admin@roadwatch.local",
    "full_name": "Kerala PWD Administrator",
    "phone_number": null,
    "role": "admin"
  }
  ```

---

## 2. Road Inspector (`/api/v1/road-inspector`)

### `POST /road-inspector/snap`
Snap raw GPS coordinates to the nearest road corridor centerline within search radius.
- **Request Body:**
  ```json
  {
    "latitude": 9.9816,
    "longitude": 76.2999,
    "search_radius_m": 25.0
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "road_segment_id": "c1f7a0b3-6d2c-4f1b-a5d6-8e9f0a1b2c3d",
    "road_name": "Mahatma Gandhi Road",
    "road_class": "primary",
    "speed_limit": 50,
    "adt_volume": 8000,
    "snapped_lat": 9.98158,
    "snapped_lon": 76.29988,
    "distance_to_road_m": 2.45,
    "segment_geojson": {
      "type": "MultiLineString",
      "coordinates": [...]
    }
  }
  ```

### `GET /road-inspector/segment-status-map`
Fetches all road segments with active or recently resolved issues, colored by operational status.
- **Response `200 OK`:**
  GeoJSON `FeatureCollection` where each feature includes:
  ```json
  {
    "type": "Feature",
    "geometry": { "type": "MultiLineString", "coordinates": [...] },
    "properties": {
      "road_segment_id": "...",
      "road_name": "NH 66 Alappuzha Bypass",
      "road_class": "trunk",
      "status_colour": "red" // red | yellow | green
    }
  }
  ```

---

## 3. Citizen Complaints & Deduplication (`/api/v1/complaints`)

### `POST /complaints/check-duplicate`
Checks if an active, open distress complaint exists within 30m of the given coordinates.
- **Request Body:**
  ```json
  {
    "latitude": 9.9816,
    "longitude": 76.2999,
    "search_radius_m": 30.0
  }
  ```
- **Response `200 OK` (Duplicate Found):**
  ```json
  {
    "is_duplicate": true,
    "existing_ticket": {
      "ticket_id": "TKT-2026-00001",
      "distance_m": 12.4,
      "status": "SUBMITTED",
      "upvote_count": 3,
      "created_at": "2026-11-05T18:30:00Z",
      "media_url": "/uploads/TKT-2026-00001_pothole.jpg",
      "defect_type": "pothole"
    },
    "message": "An active report already exists 12.4m away (Ticket #TKT-2026-00001)."
  }
  ```

### `POST /complaints/upvote`
Increments upvote count on an existing ticket and registers citizen email for closure notifications.
- **Request Body:**
  ```json
  {
    "ticket_id": "TKT-2026-00001",
    "citizen_email": "citizen@example.com"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "ticket_id": "TKT-2026-00001",
    "upvote_count": 4,
    "message": "Upvote recorded for ticket TKT-2026-00001. Total endorsements: 4."
  }
  ```

### `POST /complaints/submit`
Submits a new road distress complaint with media file and GPS coordinates.
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `file`: Image (.jpg, .png) or video (.mp4)
  - `latitude`: `9.9816`
  - `longitude`: `76.2999`
  - `citizen_email`: `citizen@example.com`
- **Response `201 Created`:**
  ```json
  {
    "ticket_id": "TKT-2026-00002",
    "status": "SUBMITTED",
    "message": "Complaint registered successfully under Ticket #TKT-2026-00002.",
    "road_name": "Mahatma Gandhi Road",
    "road_class": "primary",
    "snapped_lat": 9.98158,
    "snapped_lon": 76.29988,
    "media_url": "/uploads/TKT-2026-00002_a1b2c3d4.jpg",
    "created_at": "2026-11-05T18:35:00Z"
  }
  ```

### `GET /complaints/track/{ticket_id}`
Returns live lifecycle telemetry, AI metrics, and completion proof for a ticket.
- **Response `200 OK`:**
  ```json
  {
    "ticket_id": "TKT-2026-00002",
    "citizen_email": "citizen@example.com",
    "raw_lat": 9.9816,
    "raw_lon": 76.2999,
    "snapped_lat": 9.98158,
    "snapped_lon": 76.29988,
    "road_segment_id": "c1f7a0b3-6d2c-4f1b-a5d6-8e9f0a1b2c3d",
    "road_name": "Mahatma Gandhi Road",
    "road_class": "primary",
    "media_url": "/uploads/TKT-2026-00002_a1b2c3d4.jpg",
    "media_type": "image",
    "defect_type": "pothole",
    "severity_area_sqm": 0.85,
    "severity_depth_cm": 6.2,
    "uncertainty_score": 0.08,
    "priority_score": 78.5,
    "status": "SUBMITTED",
    "upvote_count": 1,
    "post_repair_media_url": null,
    "repair_notes": null,
    "created_at": "2026-11-05T18:35:00Z",
    "resolved_at": null,
    "segment_geojson": { "type": "MultiLineString", "coordinates": [...] }
  }
  ```

---

## 4. System Telemetry (`/api/v1/health`)

### `GET /health`
Verifies database connection, PostGIS availability, and Redis message queue.
- **Response `200 OK`:**
  ```json
  {
    "status": "ok",
    "region": "Kerala",
    "authority": "Kerala Public Works Department",
    "db": "connected",
    "redis": "connected"
  }
  ```

---

## 5. Work Orders & Field Operations (`/api/v1/work-orders`)

### `GET /work-orders`
List work orders for municipal authorities.
- **Query Params:** `status_filter` (optional)
- **Header:** `Authorization: Bearer <admin_token>`
- **Response `200 OK`:** List of work orders with assigned depot, target defect, priority score, and completion status.

### `POST /work-orders/resolve`
Resolves a defect ticket upon physical upload of post-repair proof.
- **Header:** `Authorization: Bearer <admin_token>`
- **Request Body:**
  ```json
  {
    "ticket_id": "TKT-2026-00001",
    "post_repair_media_url": "http://localhost:8000/uploads/resolved_123.jpg",
    "repair_notes": "Filled with dense bituminous cold mix and compacted with 8-ton vibratory roller.",
    "technician_lat": 9.98162,
    "technician_lon": 76.29991
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "status": "SUCCESS",
    "ticket_id": "TKT-2026-00001",
    "message": "Ticket TKT-2026-00001 marked RESOLVED. Citizen email dispatched.",
    "location_verification": "PASS"
  }
  ```

### `POST /work-orders/snap-override`
Administrative tool allowing engineers to override or correct automated road snapping.
- **Header:** `Authorization: Bearer <admin_token>`
- **Request Body:**
  ```json
  {
    "ticket_id": "TKT-2026-00001",
    "manual_road_segment_id": "c1f7a0b3-6d2c-4f1b-a5d6-8e9f0a1b2c3d"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "status": "SUCCESS",
    "ticket_id": "TKT-2026-00001",
    "road_name": "Mahatma Gandhi Road"
  }
  ```

---

## 6. Geotechnical AI Advisory Engine (`/api/v1/geotech`)

### `POST /geotech/advise`
Synthesizes environmental telemetry (Copernicus DEM, ISRIC SoilGrids, Open-Meteo) and outputs IRC-compliant pavement design specifications.
- **Header:** `Authorization: Bearer <admin_token>`
- **Request Body:**
  ```json
  {
    "road_segment_id": "c1f7a0b3-6d2c-4f1b-a5d6-8e9f0a1b2c3d",
    "latitude": 9.9816,
    "longitude": 76.2999,
    "force_refresh": false
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "road_segment_id": "c1f7a0b3-6d2c-4f1b-a5d6-8e9f0a1b2c3d",
    "road_name": "Mahatma Gandhi Road",
    "road_class": "primary",
    "elevation_m": 8.5,
    "slope_percentage": 0.8,
    "soil_texture": "Clay Loam",
    "clay_percent": 36.0,
    "silt_percent": 28.0,
    "sand_percent": 36.0,
    "cbr_estimate": 3.8,
    "water_retention_capacity": "High",
    "soil_moisture_index": 0.42,
    "ai_advisory": {
      "primary_recommendation": "Interlocking Concrete Paver Blocks (ICPB / IRC:SP:63)",
      "pavement_type": "Semi-Rigid Composite",
      "technical_justification": "Subgrade is saturated with high clay content (36.0%) and near-zero gradient (0.8%), where standing monsoon water causes rapid bituminous debonding...",
      "layer_specifications": [
        { "layer": "Subgrade Preparation", "spec": "300mm lime-stabilized subgrade compacted to 98% Proctor density..." },
        { "layer": "Sub-Base (Drainage Blanket)", "spec": "150mm Granular Sub-Base (GSB Grading-II)..." },
        { "layer": "Base Course", "spec": "100mm Wet Mix Macadam (WMM)..." },
        { "layer": "Bedding & Wearing Surface", "spec": "30mm washed river sand with 80mm M-40 Paver Blocks (IRC:SP:63)..." }
      ],
      "drainage_mitigation": "Perforated corrugated PVC French drains wrapped in geotextile sock along both road shoulders.",
      "expected_durability_comparison": {
        "proposed_solution_lifespan_years": 12.0,
        "conventional_asphalt_lifespan_months": 7.0
      }
    },
    "cached": false,
    "updated_at": "2026-11-06T12:00:00Z"
  }
  ```

### `GET /geotech/candidate-corridors`
Returns high-priority or chronically damaged road corridors requiring geotechnical analysis.
- **Header:** `Authorization: Bearer <admin_token>`
- **Response `200 OK`:**
  ```json
  [
    {
      "road_segment_id": "c1f7a0b3-6d2c-4f1b-a5d6-8e9f0a1b2c3d",
      "road_name": "Mahatma Gandhi Road",
      "road_class": "primary",
      "adt_volume": 8000,
      "defect_count": 5,
      "max_priority_score": 88.4
    }
  ]
  ```

