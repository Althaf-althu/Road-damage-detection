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
  CheckCircle2,
  ChevronDown,
  Building2,
  Mountain,
  Droplets,
  Camera,
  ShieldCheck,
  Compass,
  PhoneCall,
  Sun,
  CloudRain,
  Navigation,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface ShowcaseItem {
  id: string;
  category: "all" | "citizen" | "ai" | "geotech" | "admin";
  zone: "Malanad (Highlands)" | "Idanad (Midlands)" | "Theeram (Coastlands)";
  title: string;
  malayalamTitle: string;
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
    zone: "Theeram (Coastlands)",
    title: "Citizen Road Distress Portal",
    malayalamTitle: "പൗരന്മാരുടെ റോഡ് പരാതി പോർട്ടൽ",
    subtitle: "AI Geotagging · Alappuzha & Coastal Belt",
    description:
      "Capture road defects across coastal and backwater corridors with automatic client-side EXIF GPS extraction, 25m centerline snapping, and 30m PostGIS deduplication radar.",
    image:
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=85",
    locationTag: "Alappuzha & Kuttanad Waterways",
    badge: "Public Portal",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    href: "/citizen/report",
    actionText: "File Distress Report",
    features: [
      "Zero-friction auto EXIF geotag",
      "30-Meter community upvote radar",
      "Unique ticket tracking (KL-2026)",
    ],
  },
  {
    id: "war-room",
    category: "admin",
    zone: "Idanad (Midlands)",
    title: "Geospatial Municipal War Room",
    malayalamTitle: "സ്റ്റേറ്റ് റോഡ് കൺട്രോൾ റൂം",
    subtitle: "CartoDB Dark Tiles · Ernakulam NH 66 Corridor",
    description:
      "Full state operational network with dynamic color coding: Red (Active damage), Yellow (Maintenance underway), Green (Certified repaired <90 days), and Defect Density heatmaps.",
    image:
      "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=85",
    locationTag: "Ernakulam — Kochi City & NH 66",
    badge: "Authority Console",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    href: "/admin/dashboard",
    actionText: "Open War Room",
    features: [
      "Real-time operational road halos",
      "Dynamic defect density heatmap",
      "24h / 72h SLA prioritization",
    ],
  },
  {
    id: "geotech-ai",
    category: "geotech",
    zone: "Malanad (Highlands)",
    title: "Geotechnical AI Material Advisory",
    malayalamTitle: "ഭൂസാങ്കേതിക നിർമ്മാണ ഉപദേശി",
    subtitle: "Copernicus DEM & SoilGrids · Wayanad Mountain Passes",
    description:
      "Autonomous civil engineering consultant delivering IRC:SP:63 Interlocking Concrete Paver Blocks (ICPB) for monsoon floodplains and IRC:58 Rigid M-40 concrete for steep mountain roads.",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=85",
    locationTag: "Wayanad Thamarassery Churam Pass",
    badge: "AI Civil Consultant",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-400/40",
    href: "/admin/geotech",
    actionText: "Analyze Soil & Slope",
    features: [
      "IRC:SP:63 Interlocking Pavers",
      "M-40 Rigid Mountain Pavement",
      "Subsurface French Drain Specs",
    ],
  },
  {
    id: "segment-inspector",
    category: "admin",
    zone: "Theeram (Coastlands)",
    title: "Road Segment Inspector & MCDA Engine",
    malayalamTitle: "റോഡ് സെഗ്മെന്റ് വിശകലന കേന്ദ്രം",
    subtitle: "Multi-Criteria Decision Analysis · Kozhikode Bypass",
    description:
      "Interactive split-pane segment visualizer computing P = 0.40S + 0.25T + 0.20R + 0.15Z with traffic density, sensitive zones (schools/hospitals), and millimeter cavity depth.",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85",
    locationTag: "Kozhikode — Calicut Beach & Mini Bypass",
    badge: "MCDA Prioritization",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-400/40",
    href: "/admin/inspector",
    actionText: "Inspect Segments",
    features: [
      "Exact mathematical decomposition",
      "Centimeter depth & cavity volume",
      "Administrative snap override tool",
    ],
  },
  {
    id: "work-orders",
    category: "admin",
    zone: "Idanad (Midlands)",
    title: "Field Operations & Work Order Hub",
    malayalamTitle: "വർക്ക് ഓർഡർ വിതരണ വിഭാഗം",
    subtitle: "30m Technician GPS Verification · Thiruvananthapuram",
    description:
      "Dispatch maintenance work orders to PWD sub-division depots with mandatory 30-meter on-site technician location checks and transactional Before/After citizen completion emails.",
    image:
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
    locationTag: "Thiruvananthapuram PWD Headquarters",
    badge: "Field Operations",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-400/40",
    href: "/admin/work-orders",
    actionText: "Manage Work Orders",
    features: [
      "30-Meter technician geofence",
      "Before & After photographic proof",
      "Automated citizen resolution email",
    ],
  },
  {
    id: "track-ticket",
    category: "citizen",
    zone: "Theeram (Coastlands)",
    title: "Citizen Resolution Tracking Gallery",
    malayalamTitle: "പരാതി അന്വേഷണ സംവിധാനം",
    subtitle: "Public Accountability · Kumarakom Backwaters",
    description:
      "Input your ticket tracking code (e.g., KL-2026-XXXXX) to check real-time progress, assigned sub-division depot, and photographic evidence of post-repair restoration.",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=85",
    locationTag: "Kottayam — Kumarakom Tourism Corridor",
    badge: "Civic Tracking",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    href: "/citizen/track",
    actionText: "Track My Complaint",
    features: [
      "Live status indicator badges",
      "Restoration photos & engineer notes",
      "Community subscriber count",
    ],
  },
];

const KERALA_DISTRICTS = [
  { name: "Thiruvananthapuram", mal: "തിരുവനന്തപുരം", zone: "South", length: "2,840 km", count: 42 },
  { name: "Kollam", mal: "കൊല്ലം", zone: "South", length: "2,190 km", count: 28 },
  { name: "Pathanamthitta", mal: "പത്തനംതിട്ട", zone: "South", length: "1,870 km", count: 19 },
  { name: "Alappuzha", mal: "ആലപ്പുഴ", zone: "Central", length: "1,620 km", count: 54 },
  { name: "Kottayam", mal: "കോട്ടയം", zone: "Central", length: "2,410 km", count: 37 },
  { name: "Idukki", mal: "ഇടുക്കി", zone: "Highland", length: "3,150 km", count: 68 },
  { name: "Ernakulam", mal: "എറണാകുളം", zone: "Central", length: "3,320 km", count: 76 },
  { name: "Thrissur", mal: "തൃശ്ശൂർ", zone: "Central", length: "2,980 km", count: 41 },
  { name: "Palakkad", mal: "പാലക്കാട്", zone: "North", length: "3,450 km", count: 32 },
  { name: "Malappuram", mal: "മലപ്പുറം", zone: "North", length: "3,210 km", count: 49 },
  { name: "Kozhikode", mal: "കോഴിക്കോട്", zone: "North", length: "2,760 km", count: 51 },
  { name: "Wayanad", mal: "വയനാട്", zone: "Highland", length: "1,940 km", count: 63 },
  { name: "Kannur", mal: "കണ്ണൂർ", zone: "North", length: "2,890 km", count: 34 },
  { name: "Kasaragod", mal: "കാസർഗോഡ്", zone: "North", length: "1,920 km", count: 22 },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Ernakulam");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    return SHOWCASE_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.locationTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.malayalamTitle.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const activeDistrictData = useMemo(() => {
    return (
      KERALA_DISTRICTS.find((d) => d.name === selectedDistrict) ||
      KERALA_DISTRICTS[6]
    );
  }, [selectedDistrict]);

  const faqs = [
    {
      q: "How does the platform preserve Kerala's roads against the heavy South-West monsoon?",
      mal: "തെക്കുപടിഞ്ഞാറൻ കാലവർഷക്കെടുതിയിൽ നിന്ന് കേരളത്തിലെ റോഡുകളെ ഈ സംവിധാനം എങ്ങനെ സംരക്ഷിക്കുന്നു?",
      a: "Kerala receives 3,000+ mm of rainfall annually. Flat coastal regions with clay subgrades (e.g. Kuttanad) suffer severe bitumen stripping. Our Geotechnical AI applies IRC:SP:63 standards, prescribing Interlocking Concrete Paver Blocks (ICPB) and French drains to prevent hydrostatic ponding, while recommending IRC:58 Rigid M-40 concrete for steep Western Ghats ghat roads.",
    },
    {
      q: "How does citizen photo upload work with automatic GPS extraction?",
      mal: "മൊബൈൽ ഫോട്ടോ വഴി ജി.പി.എസ് വിവരങ്ങൾ എങ്ങനെ സ്വമേധയാ ശേഖരിക്കുന്നു?",
      a: "When you upload a photo from your mobile device, client-side EXIF parsers automatically extract the exact latitude and longitude. Our PostGIS engine snaps the point to the nearest road corridor within 25 meters. If metadata is stripped, an interactive map allows instant pin-drop verification.",
    },
    {
      q: "What is the 30-meter PostGIS Deduplication Radar?",
      mal: "30 മീറ്റർ പരിധിയിലെ ഇരട്ട പരാതികൾ എങ്ങനെ കണ്ടെത്തുന്നു?",
      a: "To prevent multiple citizens submitting redundant tickets for the same pothole, PostGIS scans within a 30m geodesic radius. If an active ticket already exists, you are prompted to endorse (upvote) the ticket and subscribe your email for closed-loop completion proofs.",
    },
    {
      q: "How are field technicians verified during repair?",
      mal: "റോഡ് അറ്റകുറ്റപ്പണി പൂർത്തിയാക്കിയത് എങ്ങനെ സാക്ഷ്യപ്പെടുത്തുന്നു?",
      a: "Field technicians must upload a post-repair photograph on-site. The platform verifies their device coordinates are within 30 meters of the original distress point before marking the work order RESOLVED and emailing before/after verification photos to citizens.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#071612] text-slate-100 font-sans selection:bg-emerald-600 selection:text-white">
      {/* 1. Traditional Kerala Kasavu Gold Top Ribbon */}
      <div className="bg-gradient-to-r from-[#042f24] via-[#064e3b] to-[#042f24] border-b border-amber-500/40 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold text-amber-300">
              കേരള സർക്കാർ • പൊതുമരാമത്ത് വകുപ്പ് (PWD)
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-300">
              Government of Kerala • Public Works Department
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-amber-200/90 font-medium">
            <span className="flex items-center gap-1">
              <PhoneCall className="h-3 w-3 text-amber-400" />
              <span>PWD Toll-Free: 1800-425-7771</span>
            </span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:flex items-center gap-1 text-emerald-300">
              <ShieldCheck className="h-3 w-3" />
              <span>IRC:SP:63 &amp; IRC:58 Certified</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Kerala Tourism-Inspired Navbar */}
      <nav className="sticky top-0 z-50 border-b border-emerald-900/60 bg-[#071a14]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Emblem */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-600 p-0.5 shadow-xl shadow-emerald-950/60 transition transform group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#071d17]">
                <span className="text-2xl">🌴</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-emerald-300 transition">
                  Kerala PWD
                </span>
                <span className="text-xs font-semibold text-amber-400">
                  സുരക്ഷിത പാത
                </span>
              </div>
              <div className="text-[11px] text-emerald-300 font-medium tracking-wider uppercase">
                God&apos;s Own Country • Safe Roads Network
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#showcase" className="hover:text-amber-300 transition flex items-center gap-1">
              <span>പോർട്ടലുകൾ</span>
              <span className="text-xs text-slate-400 font-normal">(Portals)</span>
            </a>
            <a href="#districts" className="hover:text-amber-300 transition flex items-center gap-1">
              <span>ജില്ലകൾ</span>
              <span className="text-xs text-slate-400 font-normal">(Districts)</span>
            </a>
            <a href="#geotech" className="hover:text-amber-300 transition flex items-center gap-1">
              <span>ഭൂസാങ്കേതികം</span>
              <span className="text-xs text-slate-400 font-normal">(Geotech AI)</span>
            </a>
            <a href="#faq" className="hover:text-amber-300 transition">
              FAQ
            </a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/citizen/report"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/40 hover:from-emerald-500 hover:to-teal-600 transition transform hover:-translate-y-0.5"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>പരാതി നൽകാം (Report)</span>
            </Link>

            <Link
              href="/auth/login?role=admin"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>PWD Console</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. Hero Section — Kerala Tourism Cinematic Aesthetic */}
      <section className="relative overflow-hidden pt-12 pb-24 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
        {/* Background Landscape Backdrop */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=85"
            alt="Munnar Western Ghats Kerala Landscape"
            className="h-full w-full object-cover object-center opacity-25 filter blur-[1px] transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#071612]/80 via-[#071612]/95 to-[#071612]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-600/20 via-teal-900/10 to-transparent"></div>
        </div>

        {/* Traditional Gold Accent Kasavu Divider Line */}
        <div className="max-w-4xl mx-auto h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mb-8"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Authentic Cultural Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/40 bg-amber-950/40 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-md mb-6 shadow-lg shadow-amber-950/30">
            <span className="text-base">⛵</span>
            <span>ദൈവത്തിന്റെ സ്വന്തം നാട് • God&apos;s Own Country Road Network</span>
          </div>

          {/* Master Cinematic Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Preserving Kerala&apos;s Scenic Roads with{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Civic AI &amp; Green Engineering
            </span>
          </h1>

          {/* Bilingual Subtitle */}
          <p className="mt-4 text-base sm:text-xl font-medium text-emerald-200/90 leading-relaxed max-w-3xl mx-auto">
            കേരളത്തിലെ പച്ചപ്പ് നിറഞ്ഞ മലനിരകളും തീരദേശ പാതകളും മഴക്കാലക്കെടുതികളിൽ നിന്ന് സംരക്ഷിക്കാൻ കൃത്രിമ ബുദ്ധിയും ജനകീയ പങ്കാളിത്തവും.
          </p>

          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            From the tea valleys of Munnar and Wayanad ghats to the palm-fringed backwaters of Alappuzha,
            connecting citizen distress alerts to municipal war rooms and flood-resilient pavement designs.
          </p>

          {/* Interactive Action Row */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/citizen/report"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-950 hover:from-emerald-400 hover:to-teal-600 transition transform hover:-translate-y-0.5 border border-emerald-400/30"
            >
              <Camera className="h-4 w-4" />
              <span>റോഡ് തകർച്ച റിപ്പോർട്ട് ചെയ്യാം</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-[#0a261f]/80 px-8 py-4 text-sm font-bold text-amber-300 hover:bg-amber-500/20 hover:text-white transition shadow-lg"
            >
              <Navigation className="h-4 w-4 text-amber-400" />
              <span>PWD War Room Console</span>
            </Link>
          </div>

          {/* Hostinger-Style Instant Search Box */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-emerald-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search corridors (e.g. NH 66, MC Road, Wayanad Churam, Paver Blocks, Alappuzha)..."
                className="w-full rounded-2xl border border-emerald-900/80 bg-[#09221b]/90 py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-400 shadow-2xl backdrop-blur-xl focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Kerala Geography 3-Zone Telemetry Bar (Malanad, Idanad, Theeram) */}
      <section className="border-y border-emerald-950 bg-[#051a14] py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Malanad */}
          <div className="flex items-center gap-4 rounded-2xl border border-emerald-900/60 bg-[#07221a]/70 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 text-2xl">
              ⛰️
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                മലനാട് • Malanad (Highlands)
              </div>
              <div className="text-lg font-extrabold text-white">
                Wayanad &amp; Idukki Passes
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                IRC:58 M-40 Rigid Hill Pavement for steep runoff gradients
              </div>
            </div>
          </div>

          {/* Idanad */}
          <div className="flex items-center gap-4 rounded-2xl border border-amber-900/60 bg-[#07221a]/70 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 text-2xl">
              🌿
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                ഇടനാട് • Idanad (Midlands)
              </div>
              <div className="text-lg font-extrabold text-white">
                MC Road &amp; Laterite Ridges
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Laterite stabilized subgrades &amp; Polymer Modified Bitumen (PMB)
              </div>
            </div>
          </div>

          {/* Theeram */}
          <div className="flex items-center gap-4 rounded-2xl border border-teal-900/60 bg-[#07221a]/70 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 text-2xl">
              🌊
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-400">
                തീരദേശം • Theeram (Coastlands)
              </div>
              <div className="text-lg font-extrabold text-white">
                Alappuzha &amp; Coastal NH 66
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                IRC:SP:63 Interlocking Concrete Paver Blocks &amp; French Drains
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Showcase Category Filter Pills & Tourism Card Grid */}
      <section id="showcase" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
              സമഗ്ര സേവനങ്ങൾ • Comprehensive Portals
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Kerala Road Infrastructure System Modules
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "എല്ലാം (All)" },
              { key: "citizen", label: "പൗരന്മാർ (Citizen)" },
              { key: "admin", label: "കൺട്രോൾ റൂം (War Room)" },
              { key: "geotech", label: "ഭൂസാങ്കേതികം (Geotech)" },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeCategory === cat.key
                    ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
                    : "border border-emerald-900/80 bg-[#08241c] text-slate-300 hover:text-white hover:bg-emerald-900/40"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Showcase Grid of Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-emerald-900/80 bg-[#07221a]/60 backdrop-blur-md transition-all duration-300 hover:border-amber-400/60 hover:bg-[#07261d] hover:shadow-2xl hover:shadow-emerald-950"
            >
              {/* Photo Header */}
              <div className="relative h-52 w-full overflow-hidden bg-slate-900">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07221a] via-[#07221a]/40 to-transparent"></div>

                {/* Location Pill */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md border border-emerald-600/40">
                  <MapPin className="h-3 w-3 text-amber-400" />
                  <span>{item.locationTag}</span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-6">
                <div className="text-[11px] font-bold text-amber-400 mb-0.5">
                  {item.malayalamTitle}
                </div>
                <h3 className="text-lg font-extrabold text-white mb-1 group-hover:text-emerald-300 transition">
                  {item.title}
                </h3>
                <div className="text-xs text-emerald-400/90 font-medium mb-3">
                  {item.subtitle}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4 flex-1">
                  {item.description}
                </p>

                {/* Features List */}
                <div className="space-y-1.5 border-t border-emerald-900/60 pt-3 mb-5 text-[11px] text-slate-300">
                  {item.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action Link */}
                <Link
                  href={item.href}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 px-4 py-3 text-xs font-bold text-white transition hover:from-amber-500 hover:to-amber-600 hover:text-slate-950 shadow-lg"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Kerala District-by-District Road Telemetry Radar (14 Districts) */}
      <section id="districts" className="border-t border-emerald-950 bg-[#051a14] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
              കേരളത്തിലെ 14 ജില്ലകൾ • All 14 Districts of Kerala
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Statewide Road Network Health Radar
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Select a district to review total PWD network length, active maintenance tickets, and geotechnical risk classification.
            </p>
          </div>

          {/* District Buttons Row */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {KERALA_DISTRICTS.map((d) => (
              <button
                key={d.name}
                onClick={() => setSelectedDistrict(d.name)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedDistrict === d.name
                    ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25"
                    : "border border-emerald-900/80 bg-[#08241c] text-slate-300 hover:text-white"
                }`}
              >
                <span>{d.name}</span>{" "}
                <span className="text-[10px] opacity-75">({d.mal})</span>
              </button>
            ))}
          </div>

          {/* Active District Highlight Card */}
          <div className="max-w-4xl mx-auto rounded-3xl border border-amber-500/30 bg-[#07241c]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-emerald-900/60">
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  {activeDistrictData.zone} Kerala Zone • {activeDistrictData.mal}
                </div>
                <h3 className="text-2xl font-black text-white mt-1">
                  {activeDistrictData.name} District PWD Division
                </h3>
              </div>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
              >
                <span>Open in War Room Map</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-center">
              <div className="p-3 rounded-xl bg-black/30 border border-emerald-900/60">
                <div className="text-xl font-black text-white">{activeDistrictData.length}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                  Road Network Length
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-emerald-900/60">
                <div className="text-xl font-black text-amber-400">{activeDistrictData.count}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                  Active Monitored Defects
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-emerald-900/60">
                <div className="text-xl font-black text-emerald-400">&lt; 24h</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                  Critical SLA Target
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-emerald-900/60">
                <div className="text-xl font-black text-teal-400">96.8%</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                  Restoration Accuracy
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Deep-Dive: Kerala Monsoon Geotechnical AI Innovation */}
      <section id="geotech" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-emerald-950">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/40 bg-teal-950/40 px-3.5 py-1 text-xs font-semibold text-teal-300">
              <Mountain className="h-3.5 w-3.5 text-amber-400" />
              <span>കാലവർഷ പ്രതിരോധ നിർമ്മാണ രീതികൾ</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Kerala&apos;s High-Rainfall Pavement Challenge Solved by AI
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              With over 3,000 mm of torrential monsoon rain, saturated clay subgrades in lowland areas
              cause severe stripping of bituminous asphalt within 6 to 10 months. Our autonomous
              consultant synthesizes <strong>Copernicus DEM slope</strong>, <strong>ISRIC SoilGrids subgrade</strong>, and <strong>Open-Meteo hydrology</strong> to specify climate-proof solutions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl border border-emerald-900/80 bg-[#07221a]/80 p-4">
                <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
                  <Droplets className="h-4 w-4" />
                  <span>IRC:SP:63 Paver Blocks</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Mandatory on flat slopes (&lt;1.2%) with high clay (&gt;35%). Zero stripping, 12-year lifespan, integrated with French drains.
                </p>
              </div>

              <div className="rounded-2xl border border-teal-900/80 bg-[#07221a]/80 p-4">
                <div className="flex items-center gap-2 font-bold text-teal-300 mb-1">
                  <Mountain className="h-4 w-4" />
                  <span>IRC:58 Rigid Concrete</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Mandatory on Western Ghats mountain passes (&gt;5% slope). Resists high hydraulic shear from torrential runoff surges.
                </p>
              </div>
            </div>

            <div>
              <Link
                href="/admin/geotech"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:from-teal-500 hover:to-emerald-500 transition"
              >
                <span>Launch Geotechnical AI Engine</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-emerald-900/80 bg-[#08261e]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-900/60 mb-6 text-xs">
                <span className="font-bold text-amber-300">
                  ഭൂസാങ്കേതിക ടെലിമെട്രി • Geotechnical Live Telemetry
                </span>
                <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  REAL-TIME MODEL
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5">
                    <span>Slope Gradient (Copernicus DEM)</span>
                    <span className="font-bold text-amber-400">0.8% (Flat Floodplain Risk)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-amber-500 w-[16%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5">
                    <span>Clay Percentage (ISRIC SoilGrids)</span>
                    <span className="font-bold text-rose-400">38.5% (High Hydrostatic Pumping)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-rose-500 w-[77%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1.5">
                    <span>California Bearing Ratio (Inferred CBR)</span>
                    <span className="font-bold text-teal-300">3.8% (Sub-optimal Subgrade)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-teal-500 w-[38%]"></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-950/30 p-5 text-xs">
                <div className="font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Structural Material Recommendation</span>
                </div>
                <div className="text-slate-200 leading-relaxed">
                  Interlocking Concrete Paver Blocks (ICPB / IRC:SP:63) with 150mm Granular Sub-Base drainage blanket. Expected lifespan: <strong>12.0 years</strong> vs 7 months for conventional asphalt.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions (Accordion) */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-emerald-950">
        <div className="text-center mb-10">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
            സംശയങ്ങൾ • Information &amp; FAQ
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-emerald-900/60 bg-[#07241c]/60 overflow-hidden transition"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-white hover:text-amber-300 transition"
              >
                <div>
                  <div>{faq.q}</div>
                  <div className="text-xs text-emerald-400 font-normal mt-0.5">{faq.mal}</div>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-emerald-400 shrink-0 ml-4 transition-transform ${
                    openFaq === idx ? "rotate-180 text-amber-400" : ""
                  }`}
                />
              </button>

              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs leading-relaxed text-slate-300 border-t border-emerald-900/40 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. Bottom Civic Call to Action Banner */}
      <section className="border-t border-amber-500/40 bg-gradient-to-r from-[#04241c] via-[#064234] to-[#04241c] py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-3xl mb-2 inline-block">🌴</span>
          <h2 className="text-3xl font-black text-white tracking-tight">
            നമുക്കൊരുമിച്ച് കേരളത്തിന്റെ വഴികൾ സുരക്ഷിതമാക്കാം
          </h2>
          <p className="text-sm font-medium text-amber-300 mt-1">
            Let&apos;s Keep God&apos;s Own Country Safe &amp; Pristine Together
          </p>
          <p className="text-xs text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
            Spotted a pothole, caved edge, or flooded corridor? Capture a photo with your phone and file a report in under 30 seconds.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/citizen/report"
              className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 text-xs font-extrabold text-slate-950 shadow-xl hover:from-amber-300 hover:to-amber-400 transition"
            >
              റിപ്പോർട്ട് നൽകാം (File Report)
            </Link>
            <Link
              href="/citizen/track"
              className="rounded-xl border border-emerald-400/50 bg-[#07241c] px-6 py-3.5 text-xs font-extrabold text-white hover:bg-emerald-900/50 transition"
            >
              പരാതി അന്വേഷിക്കാം (Track Ticket)
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Cultural Footer with Kasavu Border */}
      <footer className="border-t border-emerald-950 bg-[#041611] px-4 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌴</span>
            <div>
              <div className="font-bold text-white text-sm">
                കേരള പൊതുമരാമത്ത് വകുപ്പ്
              </div>
              <div className="text-[11px] text-emerald-400 font-medium">
                Public Works Department • Government of Kerala
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300 font-medium">
            <Link href="/citizen/report" className="hover:text-amber-400 transition">
              പരാതി നൽകാം (Report)
            </Link>
            <Link href="/citizen/track" className="hover:text-amber-400 transition">
              അന്വേഷണം (Track)
            </Link>
            <Link href="/admin/dashboard" className="hover:text-amber-400 transition">
              കൺട്രോൾ റൂം (War Room)
            </Link>
            <Link href="/admin/geotech" className="hover:text-amber-400 transition">
              ഭൂസാങ്കേതികം (Geotech)
            </Link>
            <Link href="/auth/login?role=admin" className="hover:text-amber-400 transition">
              ഉദ്യോഗസ്ഥ ലോഗിൻ (Login)
            </Link>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500">
            © 2026 Kerala PWD. Designed with &quot;God&apos;s Own Country&quot; heritage.
          </div>
        </div>
      </footer>
    </div>
  );
}
