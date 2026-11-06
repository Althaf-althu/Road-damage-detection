/**
 * Centralized API endpoint configuration.
 * All URLs read from NEXT_PUBLIC_* environment variables.
 * Never hardcode API endpoints — always use this file.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const endpoints = {
  // Auth
  auth: {
    register: `${API_BASE}/api/v1/auth/register`,
    login: `${API_BASE}/api/v1/auth/login`,
    me: `${API_BASE}/api/v1/auth/me`,
  },

  // Road Inspector
  roadInspector: {
    snap: `${API_BASE}/api/v1/road-inspector/snap`,
    segmentStatusMap: `${API_BASE}/api/v1/road-inspector/segment-status-map`,
  },

  // Complaints (Phase 2)
  complaints: {
    submit: `${API_BASE}/api/v1/complaints/submit`,
    track: (ticketId: string) => `${API_BASE}/api/v1/complaints/track/${ticketId}`,
    upvote: (ticketId: string) => `${API_BASE}/api/v1/complaints/${ticketId}/upvote`,
    list: `${API_BASE}/api/v1/complaints`,
  },

  // Work Orders (Phase 4)
  workOrders: {
    list: `${API_BASE}/api/v1/work-orders`,
    resolve: `${API_BASE}/api/v1/work-orders/resolve`,
    snapOverride: `${API_BASE}/api/v1/work-orders/snap-override`,
  },

  // Geotech Advisory (Phase 5)
  geotech: {
    advise: `${API_BASE}/api/v1/geotech/advise`,
    candidateCorridors: `${API_BASE}/api/v1/geotech/candidate-corridors`,
  },

  // Static uploads
  uploads: (path: string) => `${API_BASE}/uploads/${path}`,
};

// Map tile config — OpenStreetMap (100% Free & Open-Source, zero API key required)
// Mapbox used only if NEXT_PUBLIC_MAPBOX_TOKEN is explicitly set
export const mapConfig = {
  defaultCenter: [10.8505, 76.2711] as [number, number], // Kerala center
  defaultZoom: 8,
  tileUrl: process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution: process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    ? '© <a href="https://mapbox.com">Mapbox</a>'
    : '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

// Status → colour mapping (matches backend segment-status-map response)
export const statusColours = {
  red: "#ef4444",       // Active damage
  yellow: "#f59e0b",    // Under maintenance
  green: "#10b981",     // Recently resolved
  default: "#334155",   // No active issues (slate-700)
} as const;

export type StatusColour = keyof typeof statusColours;

