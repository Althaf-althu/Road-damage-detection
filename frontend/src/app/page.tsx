import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="text-4xl">🛣️</span>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Kerala PWD
          </h1>
        </div>
        <p className="text-xl font-medium text-emerald-400">
          Road Damage Detection &amp; Maintenance System
        </p>
        <p className="mt-2 text-sm text-slate-400">
          AI-powered citizen reporting · Geospatial tracking · Authority dashboard
        </p>
      </div>

      {/* Role cards */}
      <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Citizen card */}
        <Link href="/citizen/report">
          <div className="group cursor-pointer rounded-2xl border border-slate-700 bg-slate-800 p-8 transition-all hover:border-emerald-500 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-emerald-500/10">
            <div className="mb-4 text-4xl">👷</div>
            <h2 className="mb-2 text-xl font-semibold text-white group-hover:text-emerald-400">
              Report Road Damage
            </h2>
            <p className="text-sm text-slate-400">
              Upload a photo, auto-detect location, and file a complaint. Track
              your ticket live.
            </p>
            <div className="mt-6 flex items-center text-sm font-medium text-emerald-400">
              Get started →
            </div>
          </div>
        </Link>

        {/* Admin card */}
        <Link href="/auth/login?role=admin">
          <div className="group cursor-pointer rounded-2xl border border-slate-700 bg-slate-800 p-8 transition-all hover:border-sky-500 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-sky-500/10">
            <div className="mb-4 text-4xl">🏛️</div>
            <h2 className="mb-2 text-xl font-semibold text-white group-hover:text-sky-400">
              Authority Console
            </h2>
            <p className="text-sm text-slate-400">
              Kerala PWD admin dashboard. Geospatial war room, work orders, and
              AI advisory engine.
            </p>
            <div className="mt-6 flex items-center text-sm font-medium text-sky-400">
              Admin login →
            </div>
          </div>
        </Link>
      </div>

      {/* Status legend */}
      <div className="mt-12 flex items-center gap-6 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
          Active damage
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
          Under maintenance
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          Recently resolved
        </span>
      </div>

      <p className="mt-8 text-xs text-slate-600">
        Kerala Public Works Department · Road Infrastructure Division
      </p>
    </main>
  );
}

