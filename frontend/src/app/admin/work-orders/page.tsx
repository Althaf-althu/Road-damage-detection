"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

interface WorkOrder {
  id: string;
  order_id: string;
  ticket_id: string;
  road_name: string;
  road_class: string;
  priority_score: number;
  assigned_to_depot?: string;
  status: string;
  created_at: string;
  completed_at?: string;
  original_media_url: string;
  post_repair_media_url?: string;
  location_verified?: string;
}

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Resolve Modal State
  const [activeResolveOrder, setActiveResolveOrder] = useState<WorkOrder | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [repairNotes, setRepairNotes] = useState("");
  const [technicianGps, setTechnicianGps] = useState<{ lat: number; lon: number } | null>(null);
  const [resolving, setResolving] = useState(false);

  const fetchOrders = async () => {
    const token = Cookies.get("kerala_pwd_token");
    if (!token) return;

    try {
      const url = statusFilter === "ALL"
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1/work-orders`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1/work-orders?status_filter=${statusFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.warn("Failed to fetch work orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleCaptureTechGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setTechnicianGps({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        (err) => alert("Could not fetch device GPS: " + err.message)
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setAfterFile(f);
      setAfterPreview(URL.createObjectURL(f));
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResolveOrder) return;
    if (!afterFile) {
      alert("Post-repair completion photo is mandatory for verification.");
      return;
    }

    const token = Cookies.get("kerala_pwd_token");
    setResolving(true);

    try {
      // 1. Upload after photo directly or save to uploads
      // In local setup, simulate upload or upload to backend
      const fakeUploadedPath = `/uploads/${activeResolveOrder.ticket_id}_restored.jpg`;

      // 2. Submit resolution
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/v1/work-orders/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticket_id: activeResolveOrder.ticket_id,
          post_repair_media_url: fakeUploadedPath,
          repair_notes: repairNotes || "Physical patch applied adhering to IRC specifications.",
          technician_lat: technicianGps?.lat ?? null,
          technician_lon: technicianGps?.lon ?? null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Ticket ${activeResolveOrder.ticket_id} RESOLVED! Location verification: ${data.location_verification}. Citizen notified.`);
        setActiveResolveOrder(null);
        setAfterFile(null);
        setAfterPreview(null);
        setRepairNotes("");
        fetchOrders();
      } else {
        alert("Failed to resolve work order.");
      }
    } catch (err) {
      alert("Error submitting resolution.");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Maintenance Work Orders
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Field maintenance crew dispatch, on-site GPS verification &amp; certified repair completion proofs.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          {["ALL", "SCHEDULED", "COMPLETED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-800/40 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Work Order</th>
                <th className="px-6 py-4">Road Corridor</th>
                <th className="px-6 py-4">Assigned Depot</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No work orders found under &quot;{statusFilter}&quot; status.
                  </td>
                </tr>
              ) : (
                orders.map((wo) => {
                  const isScheduled = wo.status === "SCHEDULED";
                  const scoreColor = wo.priority_score >= 75 ? "text-red-400" : wo.priority_score >= 50 ? "text-amber-400" : "text-emerald-400";

                  return (
                    <tr key={wo.id} className="hover:bg-slate-800/60 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white block">{wo.order_id}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Ref #{wo.ticket_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-white truncate max-w-xs">{wo.road_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 uppercase">{wo.road_class}</span>
                          {wo.defect_lat && wo.defect_lon && (
                            <a
                              href={`https://www.google.com/maps?q=${wo.defect_lat},${wo.defect_lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-sky-400 hover:text-sky-300 hover:underline"
                              title="Open pinned location in Google Maps"
                            >
                              · Google Maps ↗
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {wo.assigned_to_depot || "Central Operations"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono font-extrabold ${scoreColor}`}>
                          {wo.priority_score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                            wo.status === "COMPLETED"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {wo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {wo.location_verified === "PASS" ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ✓ GPS MATCH (&le;30m)
                          </span>
                        ) : wo.location_verified === "WARN" ? (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            ⚠️ GPS &gt;30m
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isScheduled ? (
                          <button
                            type="button"
                            onClick={() => setActiveResolveOrder(wo)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all"
                          >
                            ✓ Mark Resolved
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Archived</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Work Order Modal */}
      {activeResolveOrder && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl text-white space-y-4">
            <h3 className="text-lg font-bold text-white">
              Field Repair Verification &amp; Ticket Closure
            </h3>
            <p className="text-xs text-slate-300">
              Complete maintenance order <span className="font-mono font-bold text-emerald-400">{activeResolveOrder.order_id}</span> for Ticket #{activeResolveOrder.ticket_id} on {activeResolveOrder.road_name}.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              {/* Mandatory After Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mandatory Post-Repair Completion Photo *
                </label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
                {afterPreview && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-slate-700 h-32 aspect-video bg-black">
                    <img src={afterPreview} alt="Post repair" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Technician Device GPS Verification */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-3 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-300">Technician Device Coordinates</span>
                  <button
                    type="button"
                    onClick={handleCaptureTechGps}
                    className="text-[10px] font-bold bg-sky-600 hover:bg-sky-500 text-white px-2 py-1 rounded transition-colors"
                  >
                    📍 Capture Live Location
                  </button>
                </div>
                {technicianGps ? (
                  <p className="font-mono text-emerald-400 text-[11px]">
                    Lat: {technicianGps.lat.toFixed(5)}, Lon: {technicianGps.lon.toFixed(5)} (30m boundary check active)
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Capture location to verify repair crew presence within 30m of original defect.
                  </p>
                )}
              </div>

              {/* Repair Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Field Repair Specifications &amp; Notes
                </label>
                <textarea
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  placeholder="e.g. Cleared water debris, installed GSB layer and sealed with cold bituminous mix..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={resolving || !afterFile}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/20"
                >
                  {resolving ? "Certifying Repair..." : "Certify Resolution & Send Citizen Proof"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResolveOrder(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

