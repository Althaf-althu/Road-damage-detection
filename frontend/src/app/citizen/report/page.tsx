"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MediaDropzone } from "@/components/citizen/MediaDropzone";
import { DuplicateAlertModal } from "@/components/citizen/DuplicateAlertModal";
import { endpoints } from "@/config/endpoints";
import { DuplicateTicketInfo } from "@/types/defect";
import { formatCoordinates } from "@/lib/geo-utils";

// Dynamically import Leaflet Map component with SSR disabled
const RoadSegmentMap = dynamic(
  () => import("@/components/map/RoadSegmentMap").then((mod) => mod.RoadSegmentMap),
  { ssr: false, loading: () => <div className="h-[420px] w-full rounded-2xl bg-slate-800 animate-pulse flex items-center justify-center text-slate-500 text-sm">Loading dynamic road network map...</div> }
);

export default function ReportPage() {
  const router = useRouter();

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<[number, number]>([10.8505, 76.2711]); // Default to Kerala center
  const [hasValidLocation, setHasValidLocation] = useState(false);
  const [roadInfo, setRoadInfo] = useState<{
    segment_id: string;
    road_name: string;
    road_class: string;
    geojson: any;
    distance_m: number;
  } | null>(null);

  const [email, setEmail] = useState("");
  const [snapping, setSnapping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    ticket_id: string;
    road_name: string;
  } | null>(null);

  // Deduplication state
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateTicketInfo | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [upvoteSuccess, setUpvoteSuccess] = useState<string | null>(null);

  // Trigger Road Snapping when coordinates change
  const snapToRoad = async (lat: number, lon: number) => {
    setSnapping(true);
    try {
      const res = await fetch(endpoints.roadInspector.snap, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lon, search_radius_m: 35.0 }),
      });

      if (res.ok) {
        const data = await res.json();
        setRoadInfo({
          segment_id: data.road_segment_id,
          road_name: data.road_name,
          road_class: data.road_class,
          geojson: data.segment_geojson,
          distance_m: data.distance_to_road_m,
        });
      } else {
        setRoadInfo(null);
      }
    } catch (err) {
      console.warn("Road snap failed:", err);
      setRoadInfo(null);
    } finally {
      setSnapping(false);
    }
  };

  // Trigger Deduplication check
  const checkDuplicate = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1/complaints/check-duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lon, search_radius_m: 30.0 }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.is_duplicate && data.existing_ticket) {
          setDuplicateInfo(data.existing_ticket);
          setShowDuplicateModal(true);
        }
      }
    } catch (err) {
      console.warn("Deduplication check failed:", err);
    }
  };

  const handleCoordinatesFound = (newCoords: [number, number]) => {
    setCoords(newCoords);
    setHasValidLocation(true);
    snapToRoad(newCoords[0], newCoords[1]);
    checkDuplicate(newCoords[0], newCoords[1]);
  };

  const handleManualMapSelect = (newCoords: [number, number]) => {
    setCoords(newCoords);
    setHasValidLocation(true);
    snapToRoad(newCoords[0], newCoords[1]);
    checkDuplicate(newCoords[0], newCoords[1]);
  };

  // Upvote Existing Duplicate Ticket
  const handleUpvote = async () => {
    if (!duplicateInfo) return;
    if (!email) {
      alert("Please provide your email address to receive repair completion notifications.");
      return;
    }

    setUpvoting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1/complaints/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: duplicateInfo.ticket_id,
          citizen_email: email,
        }),
      });

      if (res.ok) {
        setUpvoteSuccess(duplicateInfo.ticket_id);
        setShowDuplicateModal(false);
      } else {
        alert("Failed to record upvote. Please try again.");
      }
    } catch (err) {
      alert("Error contacting server.");
    } finally {
      setUpvoting(false);
    }
  };

  // Submit New Complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please upload a defect photo or video.");
      return;
    }
    if (!hasValidLocation) {
      alert("Please specify defect location using EXIF, device GPS, or tapping on the map.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("latitude", coords[0].toString());
      formData.append("longitude", coords[1].toString());
      formData.append("citizen_email", email);

      const res = await fetch(endpoints.complaints.submit, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Submission failed");
      }

      const data = await res.json();
      setSubmissionSuccess({
        ticket_id: data.ticket_id,
        road_name: data.road_name,
      });
    } catch (err: any) {
      alert(err.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Report Road Damage
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload photo or video proof. Our spatial engine will snap the defect to the road corridor and notify road maintenance engineers.
        </p>
      </div>

      {/* Success Modal: New Submission */}
      {submissionSuccess && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-400">
              ✅
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-bold text-white">
                Distress Report Registered!
              </h2>
              <p className="text-sm text-slate-300">
                Ticket <span className="font-mono font-bold text-emerald-400">#{submissionSuccess.ticket_id}</span> has been created and snapped to <span className="font-semibold text-white">{submissionSuccess.road_name}</span>.
              </p>
              <p className="text-xs text-slate-400">
                AI defect perception tasks have been enqueued. You will receive an automated resolution email with before/after photos once repairs are completed.
              </p>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/citizen/track?ticket=${submissionSuccess.ticket_id}`)}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all"
                >
                  Track This Ticket Live →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionSuccess(null);
                    setSelectedFile(null);
                    setRoadInfo(null);
                  }}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition-all"
                >
                  File Another Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal: Upvote */}
      {upvoteSuccess && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-400">
              👍
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-bold text-white">
                Upvote Endorsed!
              </h2>
              <p className="text-sm text-slate-300">
                You successfully endorsed active Ticket <span className="font-mono font-bold text-emerald-400">#{upvoteSuccess}</span>.
              </p>
              <p className="text-xs text-slate-400">
                Your email ({email}) is subscribed to closure notifications. When road maintenance teams resolve this distress, you will receive photo proof.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push(`/citizen/track?ticket=${upvoteSuccess}`)}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all"
                >
                  Track Existing Ticket →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 30m Deduplication Alert Modal */}
      {duplicateInfo && (
        <DuplicateAlertModal
          isOpen={showDuplicateModal}
          duplicateInfo={duplicateInfo}
          onUpvote={handleUpvote}
          onProceedAnyway={() => setShowDuplicateModal(false)}
          onClose={() => setShowDuplicateModal(false)}
          upvoting={upvoting}
        />
      )}

      {/* Main Reporting Form */}
      {!submissionSuccess && !upvoteSuccess && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Media Dropzone & Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Step 1: Defect Media Proof
              </h2>
              <MediaDropzone
                onMediaSelect={(file, extractedCoords) => {
                  setSelectedFile(file);
                  if (extractedCoords) {
                    setCoords(extractedCoords);
                    setHasValidLocation(true);
                  }
                }}
                onCoordinatesFound={handleCoordinatesFound}
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Step 2: Citizen Contact
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email for Resolution &amp; Proof Photos *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  We send automatic side-by-side Before/After photo proofs when the road is restored.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedFile || !hasValidLocation}
                className={`w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/25 transition-all ${
                  submitting || !selectedFile || !hasValidLocation
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {submitting ? "Transmitting Distress Report..." : "Submit Distress Report"}
              </button>
            </div>
          </div>

          {/* Right Column: Live Snapping Map Visualizer */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Step 3: Road Corridor Verification
                  </h2>
                  <p className="text-xs text-slate-400">
                    {snapping
                      ? "Snapping coordinates to road network..."
                      : roadInfo
                      ? `Snapped to ${roadInfo.road_name} (${roadInfo.distance_m}m away)`
                      : "Tap anywhere on the map to pinpoint location"}
                  </p>
                </div>
                {hasValidLocation && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      {formatCoordinates(coords[0], coords[1])}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${coords[0]},${coords[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-950/60 border border-sky-800/60 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                      title="View pinned location on Google Maps"
                    >
                      🗺️ Google Maps ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Dynamic Map Component */}
              <RoadSegmentMap
                defectCoords={coords}
                roadGeoJson={roadInfo?.geojson}
                roadName={roadInfo?.road_name || "Unsnapped Location"}
                roadClass={roadInfo?.road_class}
                interactive={true}
                onLocationSelect={handleManualMapSelect}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
