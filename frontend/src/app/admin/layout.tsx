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
            Citizen accounts do not have permission to access the Kerala PWD Municipal Command Console.
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Operations Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <p className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight">
                  Kerala PWD Command Center
                </p>
                <p className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">
                  Road Infrastructure Operations Division
                </p>
              </div>
            </Link>

            {/* Status Legend Pill */}
            <div className="hidden lg:flex items-center gap-3 ml-6 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 font-medium">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500"></span> 🔴 Active Distress
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span> 🟡 Maintenance Active
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> 🟢 Verified Restored
              </span>
            </div>
          </div>

          {/* Navigation & User Profile */}
          <div className="flex items-center gap-3 sm:gap-6">
            <nav className="flex items-center gap-1 sm:gap-2">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-white">{userName}</p>
                <p className="text-[10px] text-slate-400 uppercase font-mono">{userRole}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 p-2 text-xs text-slate-400 transition-colors"
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
  );
}

