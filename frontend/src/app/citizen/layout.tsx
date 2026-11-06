import React from "react";
import Link from "next/link";

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl">🛣️</span>
            <div>
              <p className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight">
                Kerala PWD
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                Citizen Road Distress Portal
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
            <Link
              href="/"
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1"
            >
              ← Home
            </Link>
            <Link
              href="/citizen/report"
              className="px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all"
            >
              + File Report
            </Link>
            <Link
              href="/citizen/track"
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              🔍 Track Ticket
            </Link>
            <Link
              href="/auth/login?role=admin"
              className="hidden sm:inline-block px-3 py-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-all"
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
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
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
        <p>Government of Kerala · Public Works Department (Roads Division) · IRC Compliance Engine</p>
      </footer>
    </div>
  );
}

