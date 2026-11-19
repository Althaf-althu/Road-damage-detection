"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { endpoints, statusColours } from "@/config/endpoints";

// Dynamically import Leaflet map components
const WarRoomMap = dynamic(
  () => import("./WarRoomMapComponent").then((mod) => mod.WarRoomMapComponent),
  { ssr: false, loading: () => <div className="h-[520px] w-full rounded-2xl bg-slate-800 animate-pulse flex items-center justify-center text-slate-500 text-sm">Loading Road Network Operations Canvas...</div> }
);

interface Metrics {
  total_active_complaints: number;
  critical_count: number;
  moderate_count: number;
  routine_count: number;
  under_maintenance_count: number;
  resolved_past_month: number;
  average_priority_score: number;
  highest_risk_corridor: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);
  const [heatPoints, setHeatPoints] = useState<Array<{ lat: number; lon: number; intensity?: number }>>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    const token = Cookies.get("kerala_pwd_token");
    if (!token) return;

    try {
      // 1. Fetch Metrics
      const mRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1/prioritization/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (mRes.ok) {
        setMetrics(await mRes.json());
      }

      // 2. Fetch Operational Road Segment Status Map GeoJSON
      const mapRes = await fetch(endpoints.roadInspector.segmentStatusMap);
      if (mapRes.ok) {
        setGeoJsonData(await mapRes.json());
      }

      // 3. Fetch Ranked Queue to extract defect heat points
      const queueRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1/prioritization/ranked-queue?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (queueRes.ok) {
        const queue = await queueRes.json();
        setHeatPoints(
          queue.map((item: any) => ({
            lat: item.snapped_lat,
            lon: item.snapped_lon,
            intensity: item.priority_score / 100.0,
          }))
        );
      }
    } catch (err) {
      console.warn("Dashboard telemetry fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions — High-contrast administrative banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-700/80 p-5 rounded-2xl backdrop-blur-md shadow-2xl">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl drop-shadow-sm">
            Geospatial War Room
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-200 font-medium">
            Real-time municipal road network telemetry, defect clustering &amp; operational maintenance corridors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-200 bg-slate-800/95 px-3.5 py-2.5 rounded-xl border border-slate-600 cursor-pointer hover:bg-slate-700 transition-all shadow-md">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              className="rounded border-slate-500 text-sky-500 focus:ring-sky-500"
            />
            🔥 Density Heatmap
          </label>

          <button
            type="button"
            onClick={() => router.push("/admin/inspector")}
            className="rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 transition-all border border-sky-400/40"
          >
            Open Segment Inspector →
          </button>
        </div>
      </div>

      {/* KPI Operational Metrics Bar — High contrast cards with readable labels */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Total Active</p>
          <p className="mt-1 text-2xl font-black text-white">
            {metrics?.total_active_complaints ?? "--"}
          </p>
          <span className="text-[11px] font-medium text-slate-300">Unresolved complaints</span>
        </div>

        <div className="rounded-2xl border border-red-500/50 bg-slate-900/95 p-4 shadow-xl backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            Critical Hazards
          </p>
          <p className="mt-1 text-2xl font-black text-red-400">
            {metrics?.critical_count ?? "--"}
          </p>
          <span className="text-[11px] font-medium text-red-200">Priority Score ≥ 75</span>
        </div>

        <div className="rounded-2xl border border-amber-500/50 bg-slate-900/95 p-4 shadow-xl backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            Under Maintenance
          </p>
          <p className="mt-1 text-2xl font-black text-amber-300">
            {metrics?.under_maintenance_count ?? "--"}
          </p>
          <span className="text-[11px] font-medium text-amber-200">Field crews deployed</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/50 bg-slate-900/95 p-4 shadow-xl backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Restored (30d)
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-300">
            {metrics?.resolved_past_month ?? "--"}
          </p>
          <span className="text-[11px] font-medium text-emerald-200">Verified completions</span>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Avg Priority</p>
          <p className="mt-1 text-2xl font-black text-sky-400">
            {metrics?.average_priority_score ?? "--"}
            <span className="text-xs font-normal text-slate-400"> /100</span>
          </p>
          <span className="text-[11px] font-medium text-slate-300">MCDA weighted average</span>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Highest Risk Corridor</p>
          <p className="mt-1 text-xs font-black text-white truncate" title={metrics?.highest_risk_corridor}>
            {metrics?.highest_risk_corridor || "Nominal state"}
          </p>
          <span className="text-[11px] font-medium text-slate-300">Requires immediate patch</span>
        </div>
      </div>

      {/* Main Vector War Room Map */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-slate-200">
            State Road Corridors · Operational Status Layer
          </span>
          <span className="text-amber-300 font-semibold text-[11px] bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
            ⚡ Click any coloured corridor polyline to inspect defects
          </span>
        </div>

        <div className="h-[520px] w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
          <WarRoomMap
            geoJsonData={geoJsonData}
            heatPoints={heatPoints}
            showHeatmap={showHeatmap}
            onSelectRoad={(roadId) => router.push(`/admin/inspector?road_id=${roadId}`)}
          />
        </div>
      </div>
    </div>
  );
}

