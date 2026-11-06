"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  ExternalLink,
  Sparkles,
  MapPin,
  Layers,
  Activity,
  Eye,
  CheckCircle2,
  HelpCircle,
  Phone,
  Compass,
  Mountain,
  Droplets,
  Camera,
  Shield,
  Clock,
  ChevronDown,
  Building2,
  FileCheck,
} from "lucide-react";

interface ShowcaseItem {
  id: string;
  category: "all" | "citizen" | "ai" | "geotech" | "admin" | "corridors";
  title: string;
  subtitle: string;
  description: string;
  image: string;
  locationTag: string;
  badge: string;
  badgeColor: string;
  href: string;
  actionText: string;
  features: string[];
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "citizen-report",
    category: "citizen",
    title: "Citizen Road Distress Portal",
    subtitle: "AI-Powered Instant Geotagged Reporting",
    description:
      "Capture road damage with automatic EXIF GPS extraction, 25m road snapping, and 30m duplicate detection with community endorsement.",
    image:
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80",
    locationTag: "Kuttanad & Alappuzha Waterways",
    badge: "Public Portal",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    href: "/citizen/report",
    actionText: "File Distress Report",
    features: ["Zero-friction EXIF auto-tag", "30m Duplicate Radar", "Ticket tracking ID"],
  },
  {
    id: "war-room",
    category: "admin",
    title: "Geospatial Municipal War Room",
    subtitle: "Real-Time Kerala State Road Corridor Radar",
    description:
      "Dynamic operational color-coded road network (Red: Active Distress, Yellow: Maintenance Underway, Green: Certified Repaired within 90 days).",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
    locationTag: "Ernakulam — NH 66 Coastal Highway",
    badge: "Command Console",
    badgeColor: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    href: "/admin/dashboard",
    actionText: "Open War Room",
    features: ["CartoDB Dark Matter Tiles", "Defect Density Heatmap", "24h/72h SLA Priority"],
  },
  {
    id: "geotech-ai",
    category: "geotech",
    title: "Geotechnical AI Material Advisory",
    subtitle: "Copernicus DEM & ISRIC SoilGrids Synthesis",
    description:
      "Autonomous civil engineering consultant delivering IRC:SP:63 and IRC:58 pavement designs tailored to Kerala's monsoon deluge and topography.",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    locationTag: "Wayanad Ghats — High Gradient Runoff",
    badge: "AI Civil Consultant",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    href: "/admin/geotech",
    actionText: "Analyze Soil & Slope",
    features: ["IRC:SP:63 Interlocking Pavers", "M-40 Rigid Hill Pavement", "French Drain Calculations"],
  },
  {
    id: "segment-inspector",
    category: "admin",
    title: "Split-Pane Road Segment Inspector",
    subtitle: "Live Multi-Criteria Decision Analysis (MCDA)",
    description:
      "Inspect individual road segments with exact mathematical formula breakdowns: P = 0.40S + 0.25T + 0.20R + 0.15Z with dynamic operational halo indicators.",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
    locationTag: "Kozhikode — Calicut Beach Bypass",
    badge: "MCDA Analytics",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    href: "/admin/inspector",
    actionText: "Inspect Segments",
    features: ["Mathematical Breakdown", "Centimeter Cavity Volume", "Administrative Snap Override"],
  },
  {
    id: "work-orders",
    category: "admin",
    title: "Field Operations & Work Order Hub",
    subtitle: "Technician 30m GPS Verification & Closed Loop",
    description:
      "Dispatch municipal repair crews with strict location geofencing and generate automated side-by-side Before/After citizen completion emails.",
    image:
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
    locationTag: "Thiruvananthapuram PWD Central Depot",
    badge: "Field Operations",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    href: "/admin/work-orders",
    actionText: "Manage Work Orders",
    features: ["30m Technician Geofence", "Before/After Proof Email", "Automated Citizen Notification"],
  },
  {
    id: "track-ticket",
    category: "citizen",
    title: "Citizen Ticket Status & Resolution Gallery",
    subtitle: "Transparent Civic Accountability",
    description:
      "Citizens can enter their complaint tracking code (e.g. KL-2026-XXXXX) to view live progress, assigned depot, and photographic proof of repair.",
    image:
      "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",
    locationTag: "Kumarakom Backwater Corridor",
    badge: "Civic Tracking",
    badgeColor: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    href: "/citizen/track",
    actionText: "Track Complaint",
    features: ["Live Status Badges", "Verified Repair Photos", "Community Endorsements"],
  },
];

const CATEGORIES = [
  { key: "all", label: "All Systems" },
  { key: "citizen", label: "Citizen Portals" },
  { key: "admin", label: "Municipal War Room" },
  { key: "geotech", label: "Geotechnical AI" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    return SHOWCASE_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.locationTag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const faqs = [
    {
      q: "How does the AI automatically identify potholes and cracks?",
      a: "The perception pipeline pairs YOLOv8 instance segmentation with Depth Anything V2 monocular depth estimation. When you upload a photo, it computes pixel surface area, relative depth in centimeters, and calculated cavity volume without requiring manual measurement tapes.",
    },
    {
      q: "What prevents duplicate complaints for the same road distress?",
      a: "Our PostGIS spatial radar continuously scans within a 30-meter radius of active reports. If someone has already reported the issue, you are prompted to endorse (upvote) the existing ticket and subscribe your email for repair verification.",
    },
    {
      q: "Why do Kerala roads deteriorate rapidly during monsoons, and how does Geotech AI solve it?",
      a: "High rainfall (>3000mm) combined with flat terrain (<1.2% slope) and clay subgrades creates hydrostatic pressure that strips bitumen. Our Geotechnical AI applies IRC:SP:63 and IRC:58 guidelines, recommending Interlocking Concrete Paver Blocks (ICPB) and French drains to prevent waterlogging.",
    },
    {
      q: "How are field technicians verified during repair?",
      a: "Technicians must upload a photo from the site. The system verifies their device GPS is within 30 meters of the original complaint coordinates before marking the ticket RESOLVED and dispatching before/after photos to citizen subscribers.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Top Government Banner */}
      <div className="border-b border-emerald-900/40 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 px-4 py-2 text-xs font-medium text-emerald-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Government of Kerala • Public Works Department (PWD)</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-400">
            <span>Toll-Free Helpline: 1800-425-7771</span>
            <span>•</span>
            <span className="text-emerald-400">IRC:SP:63 & IRC:58 Certified</span>
          </div>
        </div>
      </div>

      {/* 2. Sticky Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
              🛣️
            </div>
            <div>
              <div className="font-bold text-white tracking-tight leading-none text-base">
                Kerala PWD
              </div>
              <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold mt-0.5">
                Road Damage & AI Advisory
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-slate-300 font-medium">
            <a href="#showcase" className="hover:text-emerald-400 transition">
              System Modules
            </a>
            <a href="#stats" className="hover:text-emerald-400 transition">
              State Telemetry
            </a>
            <a href="#geotech" className="hover:text-emerald-400 transition">
              Civil AI Engine
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/citizen/report"
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 transition"
            >
              Report Distress
            </Link>
            <Link
              href="/auth/login?role=admin"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              Authority Console
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. Hero Section (Hostinger-Style Bold Layout) */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-900">
        {/* Subtle Atmospheric Backdrop Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[450px] w-[800px] bg-gradient-to-b from-emerald-600/15 via-teal-700/5 to-transparent blur-3xl -z-10"></div>
        <div className="absolute top-40 right-10 h-72 w-72 bg-sky-600/10 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-5xl mx-auto text-center">
          {/* Announcement Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md mb-6 shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Next-Generation Geospatial Infrastructure for Kerala State</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Preserving Kerala&apos;s Corridors with{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              Artificial Intelligence
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            From the coastal backwaters of Alappuzha to the steep hairpins of the Western Ghats,
            our unified platform connects citizen reports directly to municipal war rooms,
            automated work orders, and climate-resilient geotechnical pavement designs.
          </p>

          {/* Action Row */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/citizen/report"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 transition transform hover:-translate-y-0.5"
            >
              <Camera className="h-4 w-4" />
              File Citizen Distress Report
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition"
            >
              <Building2 className="h-4 w-4 text-sky-400" />
              Municipal Authority War Room
            </Link>
          </div>

          {/* Quick Search & Filter Bar (Hostinger Style) */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules, corridors (e.g. NH 66, SoilGrids, Paver Blocks, Wayanad)..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 py-3.5 pl-12 pr-4 text-sm text-slate-200 placeholder-slate-500 shadow-2xl backdrop-blur-xl focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live State Infrastructure Telemetry Banner */}
      <section id="stats" className="border-b border-slate-800/80 bg-slate-900/40 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              34,000+ <span className="text-sm font-normal text-emerald-400">km</span>
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              Active Monitored Corridors
            </div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              &lt; 24 <span className="text-sm font-normal text-slate-300">hrs</span>
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              Critical Distress SLA
            </div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              98.4%
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              GPS Verification Precision
            </div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-extrabold text-sky-400 tracking-tight">
              IRC:SP:63
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
              Monsoon Paver Standard
            </div>
          </div>
        </div>
      </section>

      {/* 5. Showcase Category Filter Pills (Hostinger Style) */}
      <section id="showcase" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Explore Kerala Infrastructure Systems
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Click any module to inspect interactive maps, submit data, or examine civil AI telemetry.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeCategory === cat.key
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25"
                    : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Showcase Grid of Cards with Kerala Atmosphere Photography */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-emerald-500/10"
            >
              {/* Photo Header with Location Badge */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                {/* Location Pill */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-md border border-slate-700/60">
                  <MapPin className="h-3 w-3 text-emerald-400" />
                  <span>{item.locationTag}</span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-6">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  {item.subtitle}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">
                  {item.description}
                </p>

                {/* Key Features List */}
                <div className="space-y-1.5 border-t border-slate-800/80 pt-3 mb-5 text-[11px] text-slate-300">
                  {item.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action Link */}
                <Link
                  href={item.href}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/20"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <Compass className="h-8 w-8 text-slate-500 mx-auto mb-3" />
            <div className="text-sm font-semibold text-white">No modules match your search</div>
            <div className="text-xs text-slate-400 mt-1">
              Try searching for &quot;War Room&quot;, &quot;Citizen&quot;, &quot;Geotech&quot;, or &quot;Paver&quot;
            </div>
          </div>
        )}
      </section>

      {/* 7. Deep-Dive Section: Kerala Geotechnical AI Innovation */}
      <section id="geotech" className="border-t border-slate-900 bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3.5 py-1 text-xs font-medium text-purple-300">
              <Mountain className="h-3.5 w-3.5 text-purple-400" />
              <span>Civil Engineering Innovation for Heavy Rainfall</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Why Conventional Asphalt Fails in Kerala — And How AI Solves It
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              With over 3,000 mm of annual monsoon precipitation and a high water table across the
              coastal belts, traditional bituminous asphalt suffers severe stripping and subgrade
              softening within 6 to 10 months.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                  <Droplets className="h-4 w-4" />
                  <span>Kuttanad & Coastal Basins</span>
                </div>
                <p className="text-slate-400">
                  Flat slopes (&lt;1.2%) &gt;35% clay subgrade mandate <strong>IRC:SP:63 Interlocking Concrete Paver Blocks (ICPB)</strong> with French drains.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center gap-2 font-bold text-sky-400 mb-1">
                  <Mountain className="h-4 w-4" />
                  <span>Western Ghats Corridors</span>
                </div>
                <p className="text-slate-400">
                  Steep gradients (&gt;5%) with extreme hydraulic shear runoff mandate <strong>IRC:58 M-40 Rigid Concrete Pavements</strong>.
                </p>
              </div>
            </div>

            <div>
              <Link
                href="/admin/geotech"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 transition"
              >
                <span>Launch Geotechnical AI Advisor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 text-xs">
                <span className="font-bold text-slate-300">Autonomous Civil Engineering Telemetry</span>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  LIVE MODEL
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Copernicus DEM Slope</span>
                    <span className="text-white font-semibold">0.8% (Floodplain Risk)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-500 w-[15%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>ISRIC SoilGrids Clay Ratio</span>
                    <span className="text-white font-semibold">38.2% (High Plasticity)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-rose-500 w-[78%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Inferred California Bearing Ratio (CBR)</span>
                    <span className="text-white font-semibold">3.8% (Sub-optimal Subgrade)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-purple-500 w-[38%]"></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-xs">
                <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Structural Specification Recommendation
                </div>
                <div className="text-slate-300 leading-relaxed">
                  Interlocking Concrete Paver Blocks (ICPB / IRC:SP:63) with 150mm Granular Sub-Base drainage blanket. Expected lifespan: <strong>12.0 years</strong> vs 7 months for conventional asphalt.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions (Accordion) */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-900">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Everything you need to know about the Kerala PWD Road Damage AI ecosystem.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-white hover:text-emerald-400 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    openFaq === idx ? "rotate-180 text-emerald-400" : ""
                  }`}
                />
              </button>

              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs leading-relaxed text-slate-400 border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. Bottom Civic Call-to-Action */}
      <section className="border-t border-slate-900 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-teal-950/40 py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Help Keep Kerala&apos;s Roads Safe &amp; Pristine
          </h2>
          <p className="text-sm text-slate-400 mt-3 max-w-xl mx-auto">
            Spotted a pothole, edge breakdown, or flooded corridor? Snap a photo with your mobile
            device and submit your ticket in under 30 seconds.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/citizen/report"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 transition"
            >
              Submit Photo Report
            </Link>
            <Link
              href="/citizen/track"
              className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-xs font-bold text-slate-200 hover:bg-slate-800 transition"
            >
              Track Active Ticket
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Kerala Public Works Department</span>
            <span>•</span>
            <span>Road Infrastructure Division</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/citizen/report" className="hover:text-emerald-400">
              Citizen Portal
            </Link>
            <Link href="/admin/dashboard" className="hover:text-emerald-400">
              Authority War Room
            </Link>
            <Link href="/admin/geotech" className="hover:text-emerald-400">
              Geotech AI
            </Link>
            <Link href="/auth/login?role=admin" className="hover:text-emerald-400">
              Admin Login
            </Link>
          </div>
          <div>© 2026 Kerala PWD. Built with Free &amp; Open Source Software (FOSS).</div>
        </div>
      </footer>
    </div>
  );
}
