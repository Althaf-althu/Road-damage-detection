"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { endpoints, statusColours } from "@/config/endpoints";

// Dynamically import Leaflet map components
const WarRoomMap = dynamic(
  () => import("./WarRoomMapComponent").then((mod) => mod.WarRoomMapComponent),
  { ssr: false, loading: () => <div className="h-[520px] w-full rounded-2xl bg-slate-800 animate-pulse flex items-center justify-center text-slate-500 text-sm">Loading Kerala Road Network Operations Canvas...</div> }
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
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Geospatial War Room
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time municipal road network telemetry, defect clustering &amp; operational maintenance corridors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-700 transition-all">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              className="rounded border-slate-600 text-sky-500 focus:ring-sky-500"
            />
            🔥 Density Heatmap
          </label>

          <button
            type="button"
            onClick={() => router.push("/admin/inspector")}
            className="rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-sky-600/25 transition-all"
          >
            Open Segment Inspector →
          </button>
        </div>
      </div>

      {/* KPI Operational Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Active</p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            {metrics?.total_active_complaints ?? "--"}
          </p>
          <span className="text-[10px] text-slate-500">Unresolved complaints</span>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">🔴 Critical Hazards</p>
          <p className="mt-1 text-2xl font-extrabold text-red-400">
            {metrics?.critical_count ?? "--"}
          </p>
          <span className="text-[10px] text-red-500/80">Priority Score ≥ 75</span>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">🟡 Under Maintenance</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-400">
            {metrics?.under_maintenance_count ?? "--"}
          </p>
          <span className="text-[10px] text-amber-500/80">Field crews deployed</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">🟢 Restored (30d)</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">
            {metrics?.resolved_past_month ?? "--"}
          </p>
          <span className="text-[10px] text-emerald-500/80">Verified completions</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Avg Priority</p>
          <p className="mt-1 text-2xl font-extrabold text-sky-400">
            {metrics?.average_priority_score ?? "--"}
            <span className="text-xs font-normal text-slate-500"> /100</span>
          </p>
          <span className="text-[10px] text-slate-500">MCDA weighted average</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 shadow-xl col-span-2 sm:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Highest Risk Corridor</p>
          <p className="mt-1 text-xs font-bold text-white truncate" title={metrics?.highest_risk_corridor}>
            {metrics?.highest_risk_corridor || "Nominal state"}
          </p>
          <span className="text-[10px] text-slate-500">Requires immediate patch</span>
        </div>
      </div>

      {/* Main Vector War Room Map */}
      <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-slate-300">
            Kerala State Road Corridors · Operational Status Layer
          </span>
          <span className="text-slate-400 text-[11px]">
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

