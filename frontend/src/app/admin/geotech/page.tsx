"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";
import { endpoints } from "@/config/endpoints";
import {
  Mountain,
  Layers,
  Droplets,
  Gauge,
  Sparkles,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Info,
} from "lucide-react";

// Dynamically import Leaflet TerrainViewer to prevent SSR issues
const TerrainViewer = dynamic(
  () => import("@/components/map/TerrainViewer").then((mod) => mod.TerrainViewer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] w-full rounded-2xl bg-slate-800/80 animate-pulse flex items-center justify-center text-slate-500 text-sm">
        Loading Topographic Terrain Radar...
      </div>
    ),
  }
);

interface CandidateCorridor {
  road_segment_id: string;
  road_name: string;
  road_class: string;
  adt_volume: number;
  defect_count: number;
  max_priority_score: number;
}

interface LayerSpec {
  layer: string;
  spec: string;
}

interface DurabilityComp {
  proposed_solution_lifespan_years: number;
  conventional_asphalt_lifespan_months: number;
}

interface AIAdvisoryResponse {
  primary_recommendation: string;
  pavement_type: string;
  technical_justification: string;
  layer_specifications: LayerSpec[];
  drainage_mitigation: string;
  expected_durability_comparison: DurabilityComp;
}

interface GeotechProfile {
  road_segment_id: string;
  road_name: string;
  road_class: string;
  elevation_m: number;
  slope_percentage: number;
  soil_texture: string;
  clay_percent: number;
  silt_percent: number;
  sand_percent: number;
  cbr_estimate: number;
  water_retention_capacity: string;
  soil_moisture_index: number;
  ai_advisory: AIAdvisoryResponse;
  cached: boolean;
  updated_at: string;
}

export default function GeotechPage() {
  const [candidates, setCandidates] = useState<CandidateCorridor[]>([]);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>("");
  const [manualLat, setManualLat] = useState<string>("9.9816");
  const [manualLon, setManualLon] = useState<string>("76.2999");
  const [useManualCoords, setUseManualCoords] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<GeotechProfile | null>(null);

  // Fetch candidate corridors on initial load
  useEffect(() => {
    const token = Cookies.get("kerala_pwd_token");
    if (!token) return;

    fetch(endpoints.geotech.candidateCorridors, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load candidate corridors");
        return res.json();
      })
      .then((data: CandidateCorridor[]) => {
        setCandidates(data);
        if (data.length > 0) {
          setSelectedCorridorId(data[0].road_segment_id);
        }
      })
      .catch((err) => {
        console.warn("Could not load candidate corridors:", err);
      });
  }, []);

  const handleRunAdvisory = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    const token = Cookies.get("kerala_pwd_token");
    if (!token) {
      setError("Authorization expired. Please sign in again.");
      setLoading(false);
      return;
    }

    const payload: {
      road_segment_id?: string;
      latitude?: number;
      longitude?: number;
      force_refresh?: boolean;
    } = {
      force_refresh: forceRefresh,
    };

    if (useManualCoords) {
      const latNum = parseFloat(manualLat);
      const lonNum = parseFloat(manualLon);
      if (isNaN(latNum) || isNaN(lonNum)) {
        setError("Please enter valid decimal coordinates for latitude and longitude.");
        setLoading(false);
        return;
      }
      payload.latitude = latNum;
      payload.longitude = lonNum;
    } else {
      if (!selectedCorridorId) {
        setError("Please select a road corridor from the list.");
        setLoading(false);
        return;
      }
      payload.road_segment_id = selectedCorridorId;
    }

    try {
      const res = await fetch(endpoints.geotech.advise, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server responded with ${res.status}`);
      }

      const data: GeotechProfile = await res.json();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate geotechnical advisory.");
    } finally {
      setLoading(false);
    }
  };

  const getCbrQualityBadge = (cbr: number) => {
    if (cbr < 3.0) {
      return {
        label: "Very Poor (CBR < 3%)",
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        desc: "Requires lime/cement soil stabilization before any paving",
      };
    }
    if (cbr < 5.0) {
      return {
        label: "Sub-optimal (CBR 3–5%)",
        color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        desc: "Standard Kerala laterite subgrade; requires capping layer",
      };
    }
    return {
      label: "Competent (CBR > 5%)",
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      desc: "Adequate load-bearing subgrade foundation",
    };
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 text-sm">
              ⛰️
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Geotechnical AI Material Advisory Engine
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous synthesis of Copernicus DEM slope, ISRIC SoilGrids subgrade, and Open-Meteo hydrology with IRC:SP:63 & IRC:58 pavement standards.
          </p>
        </div>

        {profile && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <FileText className="h-4 w-4 text-sky-400" />
            Export Engineering Brief
          </button>
        )}
      </div>

      {/* Corridor Selection & Controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Corridor Target
              </label>
              <button
                type="button"
                onClick={() => setUseManualCoords(!useManualCoords)}
                className="text-xs text-sky-400 hover:underline"
              >
                {useManualCoords ? "Switch to Corridor Selector" : "Input Manual GPS Coordinates"}
              </button>
            </div>

            {!useManualCoords ? (
              <select
                value={selectedCorridorId}
                onChange={(e) => setSelectedCorridorId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {candidates.length === 0 ? (
                  <option value="">No corridors registered yet</option>
                ) : (
                  candidates.map((c) => (
                    <option key={c.road_segment_id} value={c.road_segment_id}>
                      {c.road_name} ({c.road_class.toUpperCase()}) — {c.defect_count} defects | Priority {c.max_priority_score} | ADT {c.adt_volume}
                    </option>
                  ))
                )}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="Latitude (e.g. 9.9816)"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={manualLon}
                    onChange={(e) => setManualLon(e.target.value)}
                    placeholder="Longitude (e.g. 76.2999)"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleRunAdvisory(false)}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Synthesizing Open Geodata...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Advisory
                </>
              )}
            </button>

            {profile && (
              <button
                onClick={() => handleRunAdvisory(true)}
                disabled={loading}
                title="Bypass 7-day cache and fetch fresh telemetry from APIs"
                className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Geotechnical Telemetry Grid */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Elevation */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Elevation (DEM)</span>
              <Mountain className="h-4 w-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {profile.elevation_m.toFixed(1)} <span className="text-sm font-normal text-slate-400">m MSL</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {profile.elevation_m < 20
                ? "Coastal floodplain / Kuttanad basin (High water table)"
                : profile.elevation_m < 200
                ? "Midland laterite terrain"
                : "Western Ghats Highland corridor"}
            </div>
          </div>

          {/* Slope & Runoff */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Slope & Runoff</span>
              <TrendingDown className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {profile.slope_percentage.toFixed(1)} <span className="text-sm font-normal text-slate-400">%</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {profile.slope_percentage < 1.2 ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Flat (&lt;1.2%) — Severe Water Ponding
                </span>
              ) : profile.slope_percentage > 5.0 ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Steep (&gt;5%) — High Runoff Velocity
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Nominal Self-Draining Slope
                </span>
              )}
            </div>
          </div>

          {/* Subgrade Soil Composition */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Subgrade Soil</span>
              <Layers className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white truncate" title={profile.soil_texture}>
              {profile.soil_texture}
            </div>
            {/* Visual ratio bar */}
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                style={{ width: `${profile.clay_percent}%` }}
                className="bg-amber-600"
                title={`Clay: ${profile.clay_percent}%`}
              />
              <div
                style={{ width: `${profile.silt_percent}%` }}
                className="bg-amber-400"
                title={`Silt: ${profile.silt_percent}%`}
              />
              <div
                style={{ width: `${profile.sand_percent}%` }}
                className="bg-sky-400"
                title={`Sand: ${profile.sand_percent}%`}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span className="text-amber-500">Clay {profile.clay_percent}%</span>
              <span className="text-amber-300">Silt {profile.silt_percent}%</span>
              <span className="text-sky-300">Sand {profile.sand_percent}%</span>
            </div>
          </div>

          {/* CBR Subgrade Strength */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Inferred CBR</span>
              <Gauge className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {profile.cbr_estimate.toFixed(1)} <span className="text-sm font-normal text-slate-400">%</span>
            </div>
            {(() => {
              const badge = getCbrQualityBadge(profile.cbr_estimate);
              return (
                <div className="mt-2">
                  <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Main Section: Topographic Map & AI Engineering Advisory */}
      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Topographic Radar & Soil Profile */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Mountain className="h-4 w-4 text-sky-400" />
                Terrain Contour & Elevation Profile
              </h3>
              <div className="h-[320px]">
                <TerrainViewer
                  lat={profile.road_segment_id === "custom-coords" ? parseFloat(manualLat) : 9.9816}
                  lon={profile.road_segment_id === "custom-coords" ? parseFloat(manualLon) : 76.2999}
                  roadName={profile.road_name}
                  elevation={profile.elevation_m}
                  slope={profile.slope_percentage}
                  soilType={profile.soil_texture}
                />
              </div>
            </div>

            {/* Hydrological Telemetry */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-400" />
                Hydrology & Retention Profile (Open-Meteo)
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Soil Moisture Index:</span>
                  <span className="font-semibold text-slate-200">{profile.soil_moisture_index.toFixed(2)} m³/m³</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Water Retention Capacity:</span>
                  <span className="font-semibold text-slate-200">{profile.water_retention_capacity}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Monsoon Vulnerability:</span>
                  <span className="font-semibold text-rose-400">High Hydrostatic Stripping Risk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Material Advisory & Layer Specifications */}
          <div className="lg:col-span-7 space-y-6">
            {/* Primary Recommendation Banner */}
            <div className="rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-950/30 via-slate-900/70 to-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/20 text-sky-400">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Road Maintenance Engineering AI Advisory
                  </span>
                </div>
                <span className="rounded-lg bg-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-300 border border-sky-500/30">
                  {profile.ai_advisory.pavement_type}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-3">
                {profile.ai_advisory.primary_recommendation}
              </h2>

              <p className="text-sm leading-relaxed text-slate-300 mb-6 bg-slate-950/40 rounded-xl p-4 border border-slate-800/80">
                {profile.ai_advisory.technical_justification}
              </p>

              {/* Multi-layer Specifications Table */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-sky-400" />
                  IRC Structural Cross-Section Specifications
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                        <th className="py-2.5 px-4 font-semibold">Pavement Layer</th>
                        <th className="py-2.5 px-4 font-semibold">Specification & Materials</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {profile.ai_advisory.layer_specifications.map((layer, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-4 font-semibold text-sky-300 whitespace-nowrap">
                            {layer.layer}
                          </td>
                          <td className="py-2.5 px-4 leading-relaxed">
                            {layer.spec}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Drainage Mitigation */}
              <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1 flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5" />
                  Mandatory Hydrological Mitigation
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {profile.ai_advisory.drainage_mitigation}
                </p>
              </div>

              {/* Durability & ROI Comparison */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    Proposed Solution Lifespan
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {profile.ai_advisory.expected_durability_comparison.proposed_solution_lifespan_years}{" "}
                    <span className="text-sm font-normal text-slate-400">Years</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Zero stripping under heavy monsoon rains
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    Conventional Bitumen Lifespan
                  </div>
                  <div className="text-2xl font-bold text-rose-400 mt-1">
                    {profile.ai_advisory.expected_durability_comparison.conventional_asphalt_lifespan_months}{" "}
                    <span className="text-sm font-normal text-slate-400">Months</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Premature potholing via subgrade pumping
                  </div>
                </div>
              </div>

              {/* Cache Stamp */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Telemetry Source: Copernicus DEM, ISRIC SoilGrids, Open-Meteo
                </span>
                <span>
                  {profile.cached ? "Cached Advisory" : "Live Computation"} (
                  {new Date(profile.updated_at).toLocaleDateString()})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
