"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { formatCoordinates } from "@/lib/geo-utils";
import { statusColours } from "@/config/endpoints";

const InspectorMap = dynamic(
  () => import("./InspectorMapComponent").then((mod) => mod.InspectorMapComponent),
  { ssr: false, loading: () => <div className="h-full w-full rounded-2xl bg-slate-800 animate-pulse flex items-center justify-center text-slate-500 text-sm">Loading road segment canvas...</div> }
);

interface RankedDefect {
  id: string;
  ticket_id: string;
  road_name: string;
  road_class: string;
  speed_limit: number;
  adt_volume: number;
  is_sensitive_zone: boolean;
  defect_type: string;
  severity_area_sqm: number;
  severity_depth_cm: number;
  uncertainty_score: number;
  priority_score: number;
  status: string;
  upvote_count: number;
  raw_lat: number;
  raw_lon: number;
  snapped_lat: number;
  snapped_lon: number;
  media_url: string;
  created_at: string;
  segment_geojson: any;
}

function InspectorContent() {
  const searchParams = useSearchParams();
  const roadIdParam = searchParams.get("road_id");

  const [queue, setQueue] = useState<RankedDefect[]>([]);
  const [selected, setSelected] = useState<RankedDefect | null>(null);
  const [loading, setLoading] = useState(true);

  // Dispatch modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedDepot, setSelectedDepot] = useState("Ernakulam Central PWD Depot");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [dispatching, setDispatching] = useState(false);

  // Snap override modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideRadius, setOverrideRadius] = useState(50);
  const [overriding, setOverriding] = useState(false);

  const fetchQueue = async () => {
    const token = Cookies.get("kerala_pwd_token");
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1/prioritization/ranked-queue?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: RankedDefect[] = await res.json();
        setQueue(data);
        if (data.length > 0) {
          // If road_id was passed, find first matching defect on that road
          const matched = roadIdParam ? data.find((d) => (d as any).road_segment_id === roadIdParam) : null;
          setSelected(matched || data[0]);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch ranked queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [roadIdParam]);

  // Dispatch Work Order
  const handleDispatch = async () => {
    if (!selected) return;
    const token = Cookies.get("kerala_pwd_token");
    setDispatching(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1/work-orders/dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticket_id: selected.ticket_id,
          assigned_to_depot: selectedDepot,
          notes: dispatchNotes,
        }),
      });

      if (res.ok) {
        alert(`Work order assigned to ${selectedDepot}!`);
        setShowDispatchModal(false);
        fetchQueue();
      } else {
        alert("Failed to dispatch work order.");
      }
    } catch (e) {
      alert("Error contacting server.");
    } finally {
      setDispatching(false);
    }
  };

  // Administrative Snap Override
  const handleSnapOverride = async () => {
    if (!selected) return;
    const token = Cookies.get("kerala_pwd_token");
    setOverriding(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1/work-orders/snap-override`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticket_id: selected.ticket_id,
          new_radius_m: overrideRadius,
        }),
      });

      if (res.ok) {
        alert(`Spatial override re-snapped with ${overrideRadius}m radius!`);
        setShowOverrideModal(false);
        fetchQueue();
      } else {
        alert("Failed to apply spatial override.");
      }
    } catch (e) {
      alert("Error contacting server.");
    } finally {
      setOverriding(false);
    }
  };

  // Determine Halo color
  const haloColor = selected?.priority_score && selected.priority_score >= 75
    ? statusColours.red
    : selected?.priority_score && selected.priority_score >= 50
    ? statusColours.yellow
    : statusColours.green;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Split-Pane Road Segment &amp; Defect Inspector
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Transparent multi-criteria prioritization scoring, computer vision diagnostics &amp; municipal dispatch controls.
        </p>
      </div>

      {/* Main Split-Pane Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
        {/* Left Pane (Diagnostics & Queue) */}
        <div className="lg:col-span-6 space-y-6 flex flex-col">
          {/* Queue Selector Pill Strip */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-4 shadow-xl">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Ranked Prioritization Queue ({queue.length} Active Defects)
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {queue.map((item) => {
                const isSelected = selected?.id === item.id;
                const scoreColor = item.priority_score >= 75 ? "text-red-400 border-red-500/40 bg-red-950/30" : item.priority_score >= 50 ? "text-amber-400 border-amber-500/40 bg-amber-950/30" : "text-emerald-400 border-emerald-500/40 bg-emerald-950/30";

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-left border transition-all ${
                      isSelected
                        ? "border-sky-500 bg-sky-500/10 shadow-md ring-1 ring-sky-500"
                        : "border-slate-700 bg-slate-800/80 hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-bold text-white">#{item.ticket_id}</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${scoreColor}`}>
                        {item.priority_score.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-[130px] mt-0.5">{item.road_name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {selected && (
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5 shadow-2xl space-y-5 flex-1">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      #{selected.ticket_id}
                    </span>
                    <span className="text-xs text-slate-400 uppercase font-semibold">
                      Class: {selected.road_class}
                    </span>
                    {selected.is_sensitive_zone && (
                      <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded font-bold">
                        ⚠️ SENSITIVE ZONE
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1.5">{selected.road_name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-xs text-slate-400">
                      Location: {formatCoordinates(selected.snapped_lat, selected.snapped_lon)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${selected.snapped_lat},${selected.snapped_lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded transition"
                      title="Open coordinates in Google Maps"
                    >
                      🗺️ Google Maps ↗
                    </a>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Priority Score</span>
                  <p className={`text-2xl font-black ${selected.priority_score >= 75 ? "text-red-400" : selected.priority_score >= 50 ? "text-amber-400" : "text-emerald-400"}`}>
                    {selected.priority_score.toFixed(1)}
                    <span className="text-xs font-normal text-slate-500"> / 100</span>
                  </p>
                </div>
              </div>

              {/* Media & AI Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5 relative rounded-xl overflow-hidden border border-slate-700 aspect-video bg-black flex items-center justify-center">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}${selected.media_url}`}
                    alt="Citizen media"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-1.5 left-1.5 rounded bg-black/80 px-2 py-0.5 text-[9px] font-bold text-red-400">
                    🔴 Citizen Proof
                  </div>
                </div>

                <div className="sm:col-span-7 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-800/80 p-2.5 border border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Taxonomy</span>
                    <p className="font-bold text-white capitalize mt-0.5">{selected.defect_type}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/80 p-2.5 border border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Surface Area</span>
                    <p className="font-bold text-white mt-0.5">{selected.severity_area_sqm} m²</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/80 p-2.5 border border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Est. Depth</span>
                    <p className="font-bold text-white mt-0.5">{selected.severity_depth_cm} cm</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/80 p-2.5 border border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Uncertainty</span>
                    <p className="font-bold text-emerald-400 mt-0.5">{selected.uncertainty_score} (Calibrated)</p>
                  </div>
                </div>
              </div>

              {/* Transparent MCDA Prioritization Equation Card */}
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">MCDA Prioritization Math Breakdown</span>
                  <span className="text-[10px] text-slate-500 font-mono">100 × (0.40·S + 0.25·T + 0.20·R + 0.15·Z)</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-2">
                  <div className="rounded bg-slate-800/60 p-2 border border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase">Severity (S)</p>
                    <p className="font-mono text-xs font-bold text-sky-400 mt-0.5">
                      40%
                    </p>
                  </div>
                  <div className="rounded bg-slate-800/60 p-2 border border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase">Traffic (T)</p>
                    <p className="font-mono text-xs font-bold text-sky-400 mt-0.5">
                      25%
                    </p>
                  </div>
                  <div className="rounded bg-slate-800/60 p-2 border border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase">Road Class (R)</p>
                    <p className="font-mono text-xs font-bold text-sky-400 mt-0.5">
                      20%
                    </p>
                  </div>
                  <div className="rounded bg-slate-800/60 p-2 border border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase">Sensitivity (Z)</p>
                    <p className="font-mono text-xs font-bold text-sky-400 mt-0.5">
                      15%
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(true)}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all"
                >
                  🚀 Assign to Maintenance Depot
                </button>

                <button
                  type="button"
                  onClick={() => setShowOverrideModal(true)}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 transition-all"
                >
                  🎯 Spatial Override
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane (Dynamic Map Canvas) */}
        <div className="lg:col-span-6 h-[550px] lg:h-auto rounded-2xl border border-slate-800 bg-slate-800/40 p-4 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-slate-300">
              Corridor Halo &amp; 30m Clustering Radar
            </span>
            <span className="text-slate-400 text-[11px]">
              Merged Endorsements: <strong className="text-white">👍 {selected?.upvote_count || 1} citizens</strong>
            </span>
          </div>

          <div className="flex-1 rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
            {selected && (
              <InspectorMap
                snappedCoords={[selected.snapped_lat, selected.snapped_lon]}
                rawCoords={[selected.raw_lat, selected.raw_lon]}
                roadGeoJson={selected.segment_geojson}
                haloColor={haloColor}
                roadName={selected.road_name}
              />
            )}
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && selected && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-white space-y-4">
            <h3 className="text-lg font-bold">Dispatch Municipal Field Repair</h3>
            <p className="text-xs text-slate-400">
              Create official maintenance work order for Ticket #{selected.ticket_id} on {selected.road_name}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Maintenance Depot
              </label>
              <select
                value={selectedDepot}
                onChange={(e) => setSelectedDepot(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Ernakulam Central PWD Depot">Ernakulam Central PWD Depot</option>
                <option value="Thiruvananthapuram South Maintenance Depot">Thiruvananthapuram South Maintenance Depot</option>
                <option value="Kozhikode North Highway Division">Kozhikode North Highway Division</option>
                <option value="Thrissur Sub-Division Depot">Thrissur Sub-Division Depot</option>
                <option value="Alappuzha Waterlogged Roads Cell">Alappuzha Waterlogged Roads Cell</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Depot Instructions / Asphalt Mix Spec
              </label>
              <textarea
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="e.g. Requires DBM hot-mix patch or cold bituminous emulsion..."
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDispatch}
                disabled={dispatching}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/20"
              >
                {dispatching ? "Issuing Work Order..." : "Confirm Dispatch"}
              </button>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snap Override Modal */}
      {showOverrideModal && selected && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-white space-y-4">
            <h3 className="text-lg font-bold">Admin Spatial Snap Override</h3>
            <p className="text-xs text-slate-400">
              If an automated snap mis-identified a service road or junction, adjust the search radius to re-snap to the primary corridor.
            </p>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Search Radius</span>
                <span className="font-mono text-emerald-400 font-bold">{overrideRadius} meters</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={overrideRadius}
                onChange={(e) => setOverrideRadius(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSnapOverride}
                disabled={overriding}
                className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-500 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-sky-600/20"
              >
                {overriding ? "Re-snapping PostGIS..." : "Re-Calculate Snapping"}
              </button>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InspectorPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-400 py-12">Loading Inspector...</div>}>
      <InspectorContent />
    </Suspense>
  );
}

