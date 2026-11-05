"use client";

import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface DefectPoint {
  lat: number;
  lon: number;
  intensity?: number; // 0.0 to 1.0
}

interface DefectHeatmapProps {
  points: DefectPoint[];
}

export const DefectHeatmap: React.FC<DefectHeatmapProps> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    // Check if L.heatLayer is available; if not, use lightweight circle layer fallback
    let heatLayer: any = null;

    try {
      if ((L as any).heatLayer) {
        const heatData = points.map((p) => [p.lat, p.lon, p.intensity || 0.8]);
        heatLayer = (L as any).heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.2: "#3b82f6",
            0.4: "#10b981",
            0.6: "#f59e0b",
            0.8: "#ef4444",
            1.0: "#dc2626",
          },
        }).addTo(map);
      } else {
        // Fallback: render pulsating circle markers for defect clusters
        const layerGroup = L.layerGroup();
        points.forEach((p) => {
          const circle = L.circleMarker([p.lat, p.lon], {
            radius: 8,
            fillColor: "#ef4444",
            color: "#ffffff",
            weight: 1.5,
            opacity: 0.9,
            fillOpacity: 0.7,
          });
          layerGroup.addLayer(circle);
        });
        layerGroup.addTo(map);
        heatLayer = layerGroup;
      }
    } catch (e) {
      console.warn("Could not mount heatmap layer:", e);
    }

    return () => {
      if (heatLayer && map) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);

  return null;
};

