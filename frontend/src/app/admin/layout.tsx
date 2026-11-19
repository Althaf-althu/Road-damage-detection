"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { endpoints } from "@/config/endpoints";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("Authority Engineer");
  const [userRole, setUserRole] = useState<string>("admin");

  useEffect(() => {
    const token = Cookies.get("kerala_pwd_token");
    if (!token) {
      router.replace("/auth/login?role=admin");
      return;
    }

    // Verify token with backend
    fetch(endpoints.auth.me, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((user) => {
        if (user.role === "citizen") {
          setAuthorized(false);
        } else {
          setAuthorized(true);
          setUserName(user.full_name);
          setUserRole(user.role);
        }
      })
      .catch(() => {
        Cookies.remove("kerala_pwd_token");
        router.replace("/auth/login?role=admin");
      });
  }, [router]);

  const handleLogout = () => {
    Cookies.remove("kerala_pwd_token");
    router.replace("/auth/login?role=admin");
  };

  if (authorized === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 text-center">
        <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-8 max-w-md shadow-2xl">
          <div className="text-4xl mb-3">🚫</div>
          <h1 className="text-xl font-bold text-white mb-2">403 — Unauthorized Access</h1>
          <p className="text-sm text-slate-300 mb-6">
            Citizen accounts do not have permission to access the Road Maintenance Municipal Command Console.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/citizen/report"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Return to Citizen Portal
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Sign In as Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400 text-sm">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-sky-400 animate-ping"></span>
          Authenticating authority credentials...
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: "/admin/dashboard", label: "War Room", icon: "📊" },
    { href: "/admin/inspector", label: "Segment Inspector", icon: "🔬" },
    { href: "/admin/work-orders", label: "Work Orders", icon: "📋" },
    { href: "/admin/geotech", label: "Geotech AI", icon: "⛰️" },
  ];

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col selection:bg-sky-600 selection:text-white">
      {/* 0. Scenic Wayanad Rainy Hillside Road Backdrop with darker contrast overlay for administrative telemetry readability */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed pointer-events-none"
        style={{
          backgroundImage: "url('/images/wayanad-rainy-road-backdrop.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/80 to-slate-950/90" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Top Operations Header — Optimized high-contrast administrative command bar */}
      <header className="border-b border-slate-700/80 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                } else {
                  router.push("/");
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700 bg-slate-900/90 transition-all shadow-sm"
              title="Go to previous page"
            >
              ← Back
            </button>

            <Link href="/admin/dashboard" className="flex items-center gap-2.5">
              <span className="text-2xl drop-shadow">🏛️</span>
              <div>
                <p className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-tight drop-shadow-sm">
                  Road Maintenance Command Center
                </p>
                <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                  Road Infrastructure Operations Division
                </p>
              </div>
            </Link>

            {/* Status Legend Pill */}
            <div className="hidden xl:flex items-center gap-3 ml-4 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-semibold text-slate-200 shadow-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
                <span>Active Distress</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
                <span>Maintenance Active</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                <span>Verified Restored</span>
              </span>
            </div>
          </div>

          {/* Navigation & User Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-sky-500/20 text-sky-300 border border-sky-400/50 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/90 border border-slate-800 py-1 px-2.5 rounded-xl">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-white leading-tight">{userName}</p>
                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {userRole}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 p-2 text-xs text-slate-300 transition-colors border border-slate-700"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      </div>
    </div>
  );
}

