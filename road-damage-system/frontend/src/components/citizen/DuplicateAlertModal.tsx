"use client";

import React from "react";
import { DuplicateTicketInfo } from "@/types/defect";

interface DuplicateAlertModalProps {
  isOpen: boolean;
  duplicateInfo: DuplicateTicketInfo;
  onUpvote: () => void;
  onProceedAnyway: () => void;
  onClose: () => void;
  upvoting?: boolean;
}

export const DuplicateAlertModal: React.FC<DuplicateAlertModalProps> = ({
  isOpen,
  duplicateInfo,
  onUpvote,
  onProceedAnyway,
  onClose,
  upvoting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-amber-500/40 bg-slate-900 p-6 shadow-2xl text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-2xl text-amber-400 border border-amber-500/30">
            📡
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Nearby Open Report Detected
            </h3>
            <p className="text-xs text-amber-400 font-medium">
              30-Meter Spatial Deduplication Radar
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          A defect has already been reported <span className="font-semibold text-amber-400">{duplicateInfo.distance_m}m</span> away on this road corridor. 
          Endorsing this existing ticket will immediately elevate its municipal maintenance priority!
        </p>

        {/* Existing Ticket Card */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4 mb-6 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">
              Ticket ID
            </span>
            <span className="font-mono font-bold text-emerald-400">
              #{duplicateInfo.ticket_id}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Current Lifecycle Status</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {duplicateInfo.status}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Citizen Endorsements</span>
            <span className="font-semibold text-white">
              👍 {duplicateInfo.upvote_count} upvotes
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onUpvote}
            disabled={upvoting}
            className={`flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all ${
              upvoting ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {upvoting ? "Registering Upvote..." : "👍 Upvote This Ticket (Recommended)"}
          </button>

          <button
            type="button"
            onClick={onProceedAnyway}
            className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-3 text-xs font-semibold text-slate-300 transition-all"
          >
            Submit as New Ticket
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
