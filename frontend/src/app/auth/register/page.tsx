"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { endpoints } from "@/config/endpoints";
import { setAuthToken } from "@/lib/api-client";
import { AuthResponse } from "@/types/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let response: Response;
      try {
        response = await fetch(endpoints.auth.register, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName,
            email,
            password,
            phone_number: phone || null,
          }),
        });
      } catch {
        throw new Error(
          "Unable to connect to backend server (http://localhost:8000). Please make sure the backend Docker service is running (`docker compose up -d`)."
        );
      }

      if (!response.ok) {
        let message = "Registration failed";
        try {
          const errorData = await response.json();
          message = errorData.detail || message;
        } catch {}
        throw new Error(message);
      }

      const data: AuthResponse = await response.json();
      setAuthToken(data.access_token);
      router.push("/citizen/report");
    } catch (err: any) {
      setError(err.message || "Failed to register account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
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
            ✍️
          </div>
          <h1 className="text-2xl font-bold text-white">Create Citizen Account</h1>
          <p className="text-xs text-slate-400 mt-1">
            Register to submit road distress reports & receive direct repair completion proofs
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
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Nair"
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="citizen@example.com"
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Mobile Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-sm text-white transition-all shadow-md shadow-emerald-600/20 hover:bg-emerald-500 ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-700/60 pt-4">
          Already registered?{" "}
          <Link href="/auth/login" className="text-emerald-400 hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </main>
  );
}

