"use client";

import React, { useState, useRef } from "react";
import { extractExifGPS } from "@/lib/exif-parser";
import { formatCoordinates } from "@/lib/geo-utils";

interface MediaDropzoneProps {
  onMediaSelect: (file: File, coords: [number, number] | null) => void;
  onCoordinatesFound: (coords: [number, number], source: "exif" | "device" | "manual") => void;
}

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({
  onMediaSelect,
  onCoordinatesFound,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"checking" | "found" | "missing" | null>(null);
  const [extractedCoords, setExtractedCoords] = useState<[number, number] | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setGpsStatus("checking");

    // Preview
    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Client-side EXIF GPS extraction
    const exifData = await extractExifGPS(selectedFile);

    if (exifData.latitude !== null && exifData.longitude !== null) {
      const coords: [number, number] = [exifData.latitude, exifData.longitude];
      setExtractedCoords(coords);
      setGpsStatus("found");
      onMediaSelect(selectedFile, coords);
      onCoordinatesFound(coords, "exif");
    } else {
      setExtractedCoords(null);
      setGpsStatus("missing");
      onMediaSelect(selectedFile, null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUseDeviceGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLoading(false);
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setExtractedCoords(coords);
        setGpsStatus("found");
        onCoordinatesFound(coords, "device");
      },
      (err) => {
        setGeoLoading(false);
        alert(`Unable to retrieve GPS: ${err.message}. You can tap the map to set location.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearSelection = () => {
    setFile(null);
    setPreviewUrl(null);
    setGpsStatus(null);
    setExtractedCoords(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full space-y-4">
      {/* Dropzone Container */}
      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer ${
            dragActive
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4"
            onChange={handleChange}
            className="hidden"
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700/80 mb-3 text-3xl">
            📸
          </div>
          <p className="text-base font-semibold text-white">
            Upload Road Distress Media
          </p>
          <p className="mt-1 text-xs text-slate-400 text-center max-w-sm">
            Drag &amp; drop high-resolution photo or short video clip (.jpg, .png, .mp4).
            GPS coordinates are automatically extracted from EXIF metadata.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            Auto-EXIF Geotagging Enabled
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-xl">
          <div className="flex items-start gap-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Defect preview"
                className="h-28 w-28 rounded-xl object-cover border border-slate-700"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-slate-700 text-4xl">
                🎥
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type || "Media file"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-lg bg-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-red-500 hover:text-white transition-colors"
                >
                  Change
                </button>
              </div>

              {/* GPS Status Indicator */}
              {gpsStatus === "checking" && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Reading EXIF GPS coordinates...
                </div>
              )}

              {gpsStatus === "found" && extractedCoords && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-xs text-emerald-400 flex items-center justify-between">
                  <span>📍 GPS Extracted: {formatCoordinates(extractedCoords[0], extractedCoords[1])}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              )}

              {gpsStatus === "missing" && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-300 space-y-1.5">
                  <p className="font-semibold">⚠️ Photo lacks embedded GPS tags</p>
                  <p className="text-[11px] text-slate-400">
                    Your photo metadata has been stripped. Please select an option:
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleUseDeviceGps}
                      disabled={geoLoading}
                      className="rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold px-2.5 py-1 transition-all"
                    >
                      {geoLoading ? "Acquiring GPS..." : "📍 Use My Current Location"}
                    </button>
                    <span className="text-[11px] text-slate-400 self-center">or tap on map below</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

