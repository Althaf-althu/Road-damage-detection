"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* 0. Scenic Wayanad Rainy Hillside Road Backdrop */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed pointer-events-none"
        style={{
          backgroundImage: "url('/images/wayanad-rainy-road-backdrop.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-[#091e17]/92 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Top Navigation Bar */}
        <header className="border-b border-emerald-900/60 bg-[#071d17]/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-emerald-900/40 border border-emerald-700/50 bg-[#092b21]/70 transition-all shadow-sm"
                title="Go to previous page"
              >
                ← Back
              </button>

              <Link href="/" className="flex items-center gap-2.5">
                <span className="text-2xl">🌴</span>
                <div>
                  <p className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight">
                    Kerala PWD
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    Citizen Road Distress Portal
                  </p>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
              <Link
                href="/"
                className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-emerald-900/40 transition-all"
              >
                Home
              </Link>
              <Link
                href="/citizen/report"
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-all"
              >
                + File Report
              </Link>
              <Link
                href="/citizen/track"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-emerald-900/40 hover:text-white transition-all"
              >
                🔍 Track Ticket
              </Link>
              <Link
                href="/auth/login?role=admin"
                className="hidden sm:inline-block px-3 py-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-emerald-900/40 transition-all"
              >
                🏛️ Admin Portal
              </Link>
            </nav>
          </div>
        </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-900/40 py-6 text-center text-xs text-slate-400 bg-[#061812]/80 backdrop-blur-md">
        <div className="flex justify-center items-center gap-4 mb-2">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500"></span> 🔴 Active Distress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span> 🟡 Maintenance Crew Dispatched
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> 🟢 Verified Resolved
          </span>
        </div>
        <p>Public Works Road Maintenance · Safe Corridors System · IRC Compliance Engine</p>
      </footer>
      </div>
    </div>
  );
}

