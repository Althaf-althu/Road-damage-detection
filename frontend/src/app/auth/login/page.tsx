"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { endpoints } from "@/config/endpoints";
import { setAuthToken } from "@/lib/api-client";
import { AuthResponse } from "@/types/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "citizen";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      let response: Response;
      try {
        response = await fetch(endpoints.auth.login, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });
      } catch {
        throw new Error(
          "Unable to connect to backend server (http://localhost:8000). Please make sure the backend Docker service is running (`docker compose up -d`)."
        );
      }

      if (!response.ok) {
        let message = "Invalid email or password";
        try {
          const errorData = await response.json();
          message = errorData.detail || message;
        } catch {}
        throw new Error(message);
      }

      const data: AuthResponse = await response.json();
      setAuthToken(data.access_token);

      // Route based on role
      if (data.role === "admin" || data.role === "supervisor" || data.role === "inspector") {
        router.push("/admin/dashboard");
      } else {
        router.push("/citizen/report");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800/90 p-8 shadow-2xl backdrop-blur-md">
      {/* Back button navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <Link
          href="/"
          className="text-xs text-emerald-400 hover:underline"
        >
          Home
        </Link>
      </div>

      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-700/60 mb-3 text-2xl">
          {defaultRole === "admin" ? "🏛️" : "👷"}
        </div>
        <h1 className="text-2xl font-bold text-white">
          {defaultRole === "admin" ? "Kerala PWD Authority Login" : "Citizen Sign In"}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {defaultRole === "admin"
            ? "Operations command & maintenance dispatch console"
            : "Report road distress & track municipal repairs"}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={defaultRole === "admin" ? "admin@pwd.kerala.gov.in" : "citizen@example.com"}
            className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg py-2.5 font-semibold text-sm transition-all shadow-md ${
            defaultRole === "admin"
              ? "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
          } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-slate-400 border-t border-slate-700/60 pt-4">
        {defaultRole !== "admin" ? (
          <>
            <p>
              New citizen user?{" "}
              <Link href="/auth/register" className="text-emerald-400 hover:underline">
                Register an account
              </Link>
            </p>
            <p>
              PWD Official?{" "}
              <Link href="/auth/login?role=admin" className="text-sky-400 hover:underline">
                Authority login
              </Link>
            </p>
          </>
        ) : (
          <>
            <p>
              Citizen portal?{" "}
              <Link href="/auth/login" className="text-emerald-400 hover:underline">
                Citizen login
              </Link>
            </p>
            <p>
              New citizen user?{" "}
              <Link href="/auth/register" className="text-emerald-400 hover:underline">
                Register an account
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

