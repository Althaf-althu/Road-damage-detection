"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, GeoJSON, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mapConfig } from "@/config/endpoints";

interface InspectorMapComponentProps {
  snappedCoords: [number, number];
  rawCoords: [number, number];
  roadGeoJson: any | null;
  haloColor: string;
  roadName: string;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 17, { duration: 1.0 });
  }, [center, map]);
  return null;
}

const defectPinIcon = L.divIcon({
  className: "inspector-defect-pin",
  html: `<div style="
    background: radial-gradient(circle, #ef4444 30%, #991b1b 100%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 3px solid #ffffff;
    box-shadow: 0 0 16px rgba(239, 68, 68, 1);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export const InspectorMapComponent: React.FC<InspectorMapComponentProps> = ({
  snappedCoords,
  rawCoords,
  roadGeoJson,
  haloColor,
  roadName,
}) => {
  return (
    <div className="relative w-full h-full">
      {/* Map Overlay Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700 text-xs shadow-xl">
        <span className="text-[10px] text-slate-400 uppercase font-semibold block">30m Spatial Deduplication Radius</span>
        <span className="text-white font-bold">{roadName}</span>
      </div>

      <MapContainer
        center={snappedCoords}
        zoom={17}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <ChangeView center={snappedCoords} />

        {/* Dynamic Map Tiles: CARTO Dark Matter with key or OpenStreetMap */}
        <TileLayer
          attribution={mapConfig.tileAttribution}
          url={mapConfig.tileUrl}
          className={mapConfig.hasCustomKey ? undefined : "dark-tile-filter"}
        />

        {/* 30-Meter Deduplication Radius Circle */}
        <Circle
          center={snappedCoords}
          radius={30}
          pathOptions={{
            color: "#38bdf8",
            fillColor: "#38bdf8",
            fillOpacity: 0.12,
            weight: 2,
            dashArray: "4, 6",
          }}
        />

        {/* Snapped Road Polyline with Priority Halo */}
        {roadGeoJson && (
          <GeoJSON
            data={roadGeoJson}
            key={JSON.stringify(roadGeoJson) + haloColor}
            style={() => ({
              color: haloColor,
              weight: 8,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            })}
          />
        )}

        {/* Defect Point Marker */}
        <Marker icon={defectPinIcon} position={snappedCoords} />
      </MapContainer>
    </div>
  );
};

