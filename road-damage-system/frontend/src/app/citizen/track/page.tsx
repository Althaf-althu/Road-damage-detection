"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { endpoints, statusColours } from "@/config/endpoints";
import { ComplaintDetailResponse } from "@/types/defect";
import { formatCoordinates } from "@/lib/geo-utils";

const RoadSegmentMap = dynamic(
  () => import("@/components/map/RoadSegmentMap").then((mod) => mod.RoadSegmentMap),
  { ssr: false, loading: () => <div className="h-[360px] w-full rounded-2xl bg-slate-800 animate-pulse flex items-center justify-center text-slate-500 text-sm">Loading map...</div> }
);

const STATUS_STEPS = [
  { key: "SUBMITTED", label: "Report Submitted", desc: "Citizen complaint registered" },
  { key: "UNDER_REVIEW", label: "AI Inspection", desc: "Vision & severity assessed" },
  { key: "SCHEDULED", label: "Work Dispatched", desc: "Assigned to maintenance depot" },
  { key: "IN_PROGRESS", label: "Crews On-Site", desc: "Physical road repair active" },
  { key: "RESOLVED", label: "Repaired & Verified", desc: "Photo proof confirmed" },
];

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTicket = searchParams.get("ticket") || "";

  const [ticketInput, setTicketInput] = useState(initialTicket);
  const [complaint, setComplaint] = useState<ComplaintDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(endpoints.complaints.track(id.trim().toUpperCase()));
      if (!res.ok) {
        throw new Error("Ticket not found. Please verify the ticket ID.");
      }
      const data: ComplaintDetailResponse = await res.json();
      setComplaint(data);
    } catch (err: any) {
      setError(err.message || "Unable to fetch ticket details");
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTicket) {
      fetchTicket(initialTicket);
    }
  }, [initialTicket]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketInput.trim()) {
      router.push(`/citizen/track?ticket=${ticketInput.trim().toUpperCase()}`);
      fetchTicket(ticketInput.trim().toUpperCase());
    }
  };

  // Compute status step index
  const currentStepIndex = complaint
    ? STATUS_STEPS.findIndex((s) => s.key === complaint.status)
    : -1;

  // Status color for road segment polyline
  const segmentColor = complaint?.status === "RESOLVED"
    ? statusColours.green
    : complaint?.status === "SCHEDULED" || complaint?.status === "IN_PROGRESS"
    ? statusColours.yellow
    : statusColours.red;

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Track Road Distress Ticket
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter your unique tracking ticket number to view live repair operations, AI vision findings, and verified completion proofs.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            required
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            placeholder="e.g. TKT-2026-00001"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white uppercase placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all"
          >
            {loading ? "Searching..." : "Track"}
          </button>
        </form>
      </div>

      {error && (
        <div className="max-w-md mx-auto rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-center text-sm text-red-400">
          {error}
        </div>
      )}

      {complaint && (
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Ticket Header Banner */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  #{complaint.ticket_id}
                </span>
                <span className="text-xs text-slate-400">
                  Reported on {new Date(complaint.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-bold text-white">
                {complaint.road_name}
              </h2>
              <p className="text-xs text-slate-400">
                Class: <span className="uppercase text-slate-300 font-semibold">{complaint.road_class}</span> · 
                Location: {formatCoordinates(complaint.raw_lat, complaint.raw_lon)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Citizen Endorsements</p>
                <p className="text-lg font-bold text-white">👍 {complaint.upvote_count} upvotes</p>
              </div>
            </div>
          </div>

          {/* Lifecycle Progress Stepper */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 shadow-xl">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
              Municipal Resolution Pipeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={step.key}
                    className={`relative rounded-xl border p-4 transition-all ${
                      isCurrent
                        ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                        : isPassed
                        ? "border-slate-700 bg-slate-800/60"
                        : "border-slate-800/60 bg-slate-900/40 opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                          isPassed ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {isPassed ? "✓" : idx + 1}
                      </span>
                      <p className="text-xs font-bold text-white truncate">
                        {step.label}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid: Media Proofs & Road Snap Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Photos */}
            <div className="lg:col-span-5 space-y-6">
              {/* Reported Distress Media */}
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Citizen Reported Defect Photo
                </h3>
                <div className="relative overflow-hidden rounded-xl border border-slate-700 aspect-video bg-black flex items-center justify-center">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}${complaint.media_url}`}
                    alt="Original defect"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 rounded bg-black/75 px-2 py-1 text-[10px] font-bold text-red-400 border border-red-500/40">
                    🔴 Original Distress Report
                  </div>
                </div>
              </div>

              {/* Resolved Photo (if completed) */}
              {complaint.status === "RESOLVED" && complaint.post_repair_media_url && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 shadow-xl space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Municipal Completion Proof Photo
                  </h3>
                  <div className="relative overflow-hidden rounded-xl border border-emerald-500/40 aspect-video bg-black flex items-center justify-center">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}${complaint.post_repair_media_url}`}
                      alt="Restored road"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 rounded bg-emerald-950/90 px-2 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                      🟢 Post-Repair Verification
                    </div>
                  </div>
                  {complaint.repair_notes && (
                    <p className="text-xs text-slate-300 italic pt-1">
                      Technician Notes: &quot;{complaint.repair_notes}&quot;
                    </p>
                  )}
                </div>
              )}

              {/* AI Defect Perception Metrics */}
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Computer Vision Diagnostics
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
                    <p className="text-slate-400">Detected Taxonomy</p>
                    <p className="font-bold text-white capitalize mt-0.5">
                      {complaint.defect_type || "Analysis Pending"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
                    <p className="text-slate-400">MCDA Priority Score</p>
                    <p className="font-bold text-amber-400 mt-0.5">
                      {complaint.priority_score.toFixed(1)} / 100
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
                    <p className="text-slate-400">Surface Area</p>
                    <p className="font-bold text-white mt-0.5">
                      {complaint.severity_area_sqm > 0 ? `${complaint.severity_area_sqm.toFixed(2)} m²` : "Estimating..."}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
                    <p className="text-slate-400">Estimated Depth</p>
                    <p className="font-bold text-white mt-0.5">
                      {complaint.severity_depth_cm > 0 ? `${complaint.severity_depth_cm.toFixed(1)} cm` : "Estimating..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Road Snapped Map */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Snapped Road Corridor
                  </h3>
                  <span className="text-xs text-slate-400">
                    Corridor Status: <span className="font-bold uppercase" style={{ color: segmentColor }}>{complaint.status}</span>
                  </span>
                </div>

                <RoadSegmentMap
                  defectCoords={[complaint.raw_lat, complaint.raw_lon]}
                  roadGeoJson={complaint.segment_geojson}
                  roadName={complaint.road_name || "Identified Road"}
                  roadClass={complaint.road_class || "Road"}
                  statusColor={segmentColor}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-400 py-12">Loading ticket tracker...</div>}>
      <TrackContent />
    </Suspense>
  );
}
