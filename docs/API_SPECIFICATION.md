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
    "email": "admin@pwd.kerala.gov.in",
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

