export type DefectType = "pothole" | "fatigue_crack" | "transverse_crack" | "rutting";

export type ComplaintStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED";

export interface DefectComplaint {
  id: string;
  ticket_id: string;
  citizen_id?: string | null;
  citizen_email: string;
  raw_lat: number;
  raw_lon: number;
  snapped_point?: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  } | null;
  road_segment_id?: string | null;
  media_url: string;
  media_type: "image" | "video";
  defect_type?: DefectType | null;
  severity_area_sqm: number;
  severity_depth_cm: number;
  uncertainty_score: number;
  priority_score: number;
  status: ComplaintStatus;
  upvote_count: number;
  cluster_id?: string | null;
  post_repair_media_url?: string | null;
  repair_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
  resolution_email_sent_at?: string | null;
  road_segment?: {
    road_name: string;
    road_class: string;
    speed_limit_kmh: number;
    adt_volume: number;
  } | null;
}

export interface SnappedRoadResponse {
  road_segment_id: string;
  road_name: string;
  road_class: string;
  speed_limit: number;
  adt_volume: number;
  snapped_lat: number;
  snapped_lon: number;
  distance_to_road_m: number;
  segment_geojson: GeoJSON.GeoJsonObject;
}

export interface DuplicateTicketInfo {
  ticket_id: string;
  distance_m: number;
  status: string;
  upvote_count: number;
  created_at: string;
  media_url: string;
  defect_type?: string | null;
}

export interface ComplaintDetailResponse {
  ticket_id: string;
  citizen_email: string;
  raw_lat: number;
  raw_lon: number;
  snapped_lat?: number | null;
  snapped_lon?: number | null;
  road_segment_id?: string | null;
  road_name?: string | null;
  road_class?: string | null;
  media_url: string;
  media_type: string;
  defect_type?: string | null;
  severity_area_sqm: number;
  severity_depth_cm: number;
  uncertainty_score: number;
  priority_score: number;
  status: string;
  upvote_count: number;
  post_repair_media_url?: string | null;
  repair_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
  segment_geojson?: any | null;
}

