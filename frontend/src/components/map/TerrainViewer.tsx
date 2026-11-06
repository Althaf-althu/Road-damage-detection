"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface TerrainViewerProps {
  lat: number;
  lon: number;
  roadName: string;
  elevation: number;
  slope: number;
  soilType: string;
}

export const TerrainViewer: React.FC<TerrainViewerProps> = ({
  lat,
  lon,
  roadName,
  elevation,
  slope,
  soilType,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full min-h-[350px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-sm">
        Initializing Terrain Spatial Radar...
      </div>
    );
  }

  // Custom marker icon using divIcon
  const customIcon = L.divIcon({
    className: "custom-geotech-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: radial-gradient(circle, #38bdf8 0%, #0369a1 100%);
        border: 2px solid #e0f2fe;
        border-radius: 50%;
        box-shadow: 0 0 16px rgba(56, 189, 248, 0.6);
        color: white;
        font-size: 16px;
      ">
        ⛰️
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return (
    <div className="relative h-full w-full min-h-[350px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={[lat, lon]}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ minHeight: "350px" }}
      >
        {/* OpenTopoMap / CartoDB for Topography */}
        <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
          maxZoom={17}
        />

        <Circle
          center={[lat, lon]}
          radius={250}
          pathOptions={{
            color: "#0284c7",
            fillColor: "#38bdf8",
            fillOpacity: 0.15,
            dashArray: "4, 6",
          }}
        />

        <Marker position={[lat, lon]} icon={customIcon}>
          <Popup className="custom-popup">
            <div className="p-1 text-slate-900 font-sans text-xs">
              <strong className="block text-sm text-sky-900">{roadName}</strong>
              <div className="mt-1 space-y-0.5 text-slate-700">
                <div>📍 {lat.toFixed(5)}°N, {lon.toFixed(5)}°E</div>
                <div>⛰️ Elevation: <strong>{elevation} m</strong> MSL</div>
                <div>📐 Slope: <strong>{slope}%</strong></div>
                <div>🌱 Subgrade: <strong>{soilType}</strong></div>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Overlay HUD Badges */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-2">
        <div className="rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-md border border-slate-700/60 shadow-lg">
          <span className="text-sky-400">Copernicus DEM:</span> {elevation}m MSL
        </div>
        <div className="rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-md border border-slate-700/60 shadow-lg">
          <span className="text-amber-400">Slope:</span> {slope}% {slope < 1.2 ? "(Flat / Ponding Risk)" : slope > 5.0 ? "(Steep Runoff)" : "(Moderate)"}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-[1000]">
        <div className="rounded-lg bg-slate-900/90 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-md border border-slate-700/60 shadow-lg flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Topographic Contour Overlay Active
        </div>
      </div>
    </div>
  );
};
