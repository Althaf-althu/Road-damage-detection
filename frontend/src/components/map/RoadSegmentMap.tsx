"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mapConfig } from "@/config/endpoints";

interface RoadSegmentMapProps {
  defectCoords: [number, number]; // [lat, lng]
  roadGeoJson?: any | null;        // GeoJSON Feature/Geometry for snapped road
  roadName?: string;
  roadClass?: string;
  interactive?: boolean;
  onLocationSelect?: (coords: [number, number]) => void;
  statusColor?: string;            // '#10b981' (emerald) default, or status color
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16, { duration: 1.2 });
  }, [center, map]);
  return null;
}

function MapClickHandler({ onSelect }: { onSelect?: (coords: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      if (onSelect) {
        onSelect([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

const customDefectIcon = L.divIcon({
  className: "custom-defect-pin",
  html: `<div style="
    background: radial-gradient(circle, #ef4444 40%, #b91c1c 100%);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 3px solid #ffffff;
    box-shadow: 0 0 16px rgba(239, 68, 68, 1), 0 0 24px rgba(239, 68, 68, 0.6);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export const RoadSegmentMap: React.FC<RoadSegmentMapProps> = ({
  defectCoords,
  roadGeoJson,
  roadName,
  roadClass,
  interactive = false,
  onLocationSelect,
  statusColor = "#10b981", // Emerald illuminated corridor default
}) => {
  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl">
      {/* Dynamic Road Name Overlay Badge */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/80 shadow-xl text-white max-w-sm">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
          Identified Road Corridor
        </p>
        <p className="text-sm font-bold text-emerald-400 truncate">
          {roadName || "Locating nearest road..."}
        </p>
        {roadClass && (
          <span className="inline-block mt-1 text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Class: {roadClass}
          </span>
        )}
      </div>

      {interactive && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 shadow-md">
          💡 Tap anywhere on the map to adjust location
        </div>
      )}

      <MapContainer
        center={defectCoords}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
        zoom={16}
      >
        <ChangeView center={defectCoords} />
        {interactive && <MapClickHandler onSelect={onLocationSelect} />}

        {/* Dynamic Map Tiles: CARTO Dark Matter with key or OpenStreetMap */}
        <TileLayer
          attribution={mapConfig.tileAttribution}
          url={mapConfig.tileUrl}
          className={mapConfig.hasCustomKey ? undefined : "dark-tile-filter"}
        />

        {/* Snapped Road Polyline Highlight */}
        {roadGeoJson && (
          <GeoJSON
            data={roadGeoJson}
            key={JSON.stringify(roadGeoJson) + statusColor}
            style={() => ({
              color: statusColor,
              weight: 7,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            })}
          />
        )}

        {/* Glowing Red Defect Point Marker */}
        <Marker icon={customDefectIcon} position={defectCoords} />
      </MapContainer>
    </div>
  );
};

