"use client";

import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DefectHeatmap } from "@/components/map/DefectHeatmap";
import { statusColours } from "@/config/endpoints";

interface WarRoomMapComponentProps {
  geoJsonData: any | null;
  heatPoints: Array<{ lat: number; lon: number; intensity?: number }>;
  showHeatmap: boolean;
  onSelectRoad?: (roadSegmentId: string) => void;
}

export const WarRoomMapComponent: React.FC<WarRoomMapComponentProps> = ({
  geoJsonData,
  heatPoints,
  showHeatmap,
  onSelectRoad,
}) => {
  const keralaCenter: [number, number] = [10.5, 76.3]; // Central Kerala

  const getStyle = (feature: any) => {
    const col = feature?.properties?.status_colour;
    const color = col === "red"
      ? statusColours.red
      : col === "yellow"
      ? statusColours.yellow
      : col === "green"
      ? statusColours.green
      : "#64748b";

    return {
      color,
      weight: col === "red" ? 7 : 5,
      opacity: 0.95,
      lineCap: "round" as const,
      lineJoin: "round" as const,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties || {};
    const roadName = props.road_name || "Unnamed Corridor";
    const status = props.status_colour || "default";

    layer.bindTooltip(
      `<strong>${roadName}</strong><br/>Status: <span style="text-transform:uppercase; font-weight:bold;">${status}</span><br/><small>Click to open inspector</small>`,
      { sticky: true, className: "custom-leaflet-tooltip" }
    );

    layer.on({
      click: () => {
        if (onSelectRoad && props.road_segment_id) {
          onSelectRoad(props.road_segment_id);
        }
      },
      mouseover: (e: any) => {
        const l = e.target;
        l.setStyle({ weight: 9, opacity: 1 });
      },
      mouseout: (e: any) => {
        const l = e.target;
        l.setStyle(getStyle(feature));
      },
    });
  };

  return (
    <MapContainer
      center={keralaCenter}
      zoom={8}
      className="w-full h-full"
      scrollWheelZoom={true}
    >
      {/* Free OpenStreetMap Tiles with Dark Theme Filter (Zero API Key Required) */}
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="dark-tile-filter"
      />

      {geoJsonData && (
        <GeoJSON
          data={geoJsonData}
          key={JSON.stringify(geoJsonData)}
          style={getStyle}
          onEachFeature={onEachFeature}
        />
      )}

      {showHeatmap && heatPoints.length > 0 && (
        <DefectHeatmap points={heatPoints} />
      )}
    </MapContainer>
  );
};

