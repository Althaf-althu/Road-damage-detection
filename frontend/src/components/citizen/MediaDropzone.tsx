"use client";

import React, { useState, useRef, useEffect } from "react";
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

  // Live in-browser Camera Capture states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [gpsLock, setGpsLock] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsLocking, setGpsLocking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Open in-app live camera modal with instant geolocation acquisition
  const openCameraModal = async () => {
    setIsCameraOpen(true);
    setCameraLoading(true);
    setCameraError(null);
    setGpsLock(null);
    setGpsAccuracy(null);
    setGpsLocking(true);

    // 1. Acquire real-time device GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setGpsLock(coords);
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          setGpsLocking(false);
        },
        (err) => {
          console.warn("GPS acquire note:", err);
          setGpsLocking(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setGpsLocking(false);
    }

    // 2. Request camera video stream
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser. Please use native file upload.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.warn("Live camera error:", err);
      setCameraError(err.message || "Camera access permission was denied or unavailable.");
      setCameraLoading(false);
    }
  };

  // Close live camera modal
  const closeCameraModal = () => {
    stopCamera();
    setIsCameraOpen(false);
    setCameraError(null);
  };

  // Capture video frame to canvas, create File, and attach locked GPS
  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File(
          [blob],
          `camera_geotagged_${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        stopCamera();
        setIsCameraOpen(false);

        setFile(capturedFile);
        const url = URL.createObjectURL(capturedFile);
        setPreviewUrl(url);

        if (gpsLock) {
          setExtractedCoords(gpsLock);
          setGpsStatus("found");
          onMediaSelect(capturedFile, gpsLock);
          onCoordinatesFound(gpsLock, "device");
        } else {
          setExtractedCoords(null);
          setGpsStatus("missing");
          onMediaSelect(capturedFile, null);
          // Try acquiring device GPS if not locked yet
          handleUseDeviceGps();
        }
      },
      "image/jpeg",
      0.92
    );
  };

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

  const handleNativeCamera = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const captured = e.target.files[0];
      // Automatically attempt device GPS acquisition
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setFile(captured);
            setPreviewUrl(URL.createObjectURL(captured));
            setExtractedCoords(coords);
            setGpsStatus("found");
            onMediaSelect(captured, coords);
            onCoordinatesFound(coords, "device");
          },
          () => {
            processFile(captured);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        processFile(captured);
      }
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
    if (nativeCameraRef.current) nativeCameraRef.current.value = "";
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4"
        onChange={handleChange}
        className="hidden"
      />
      <input
        ref={nativeCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeCamera}
        className="hidden"
      />

      {/* Live In-App Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-500/50 bg-slate-900 shadow-2xl">
            {/* Viewfinder Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Live Camera Geotagger
                </span>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Viewfinder Body */}
            <div className="relative aspect-[4/3] w-full bg-black overflow-hidden flex items-center justify-center">
              {cameraLoading && (
                <div className="text-center text-xs text-slate-400 space-y-2">
                  <div className="text-3xl animate-spin">📷</div>
                  <p>Starting high-resolution camera feed...</p>
                </div>
              )}

              {cameraError && (
                <div className="p-6 text-center space-y-3">
                  <div className="text-3xl">⚠️</div>
                  <p className="text-xs text-rose-300">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      closeCameraModal();
                      nativeCameraRef.current?.click();
                    }}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-500"
                  >
                    Open Device Camera Directly
                  </button>
                </div>
              )}

              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`h-full w-full object-cover ${cameraLoading || cameraError ? "hidden" : "block"}`}
              />

              {/* Viewfinder Reticle / Crosshair Overlay */}
              {!cameraLoading && !cameraError && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-32 w-32 border-2 border-dashed border-emerald-400/50 rounded-2xl"></div>
                </div>
              )}

              {/* Real-time GPS HUD Badge */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="rounded-lg bg-black/75 backdrop-blur-md px-3 py-1.5 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 shadow-lg">
                  {gpsLocking ? (
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                      Locking Satellite GPS...
                    </span>
                  ) : gpsLock ? (
                    <span className="flex items-center gap-1.5">
                      <span>📍</span>
                      {formatCoordinates(gpsLock[0], gpsLock[1])}
                      {gpsAccuracy && <span className="text-slate-400 font-sans">(&plusmn;{gpsAccuracy}m)</span>}
                    </span>
                  ) : (
                    <span className="text-slate-400">GPS location pending</span>
                  )}
                </div>
              </div>
            </div>

            {/* Viewfinder Controls */}
            <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-5 py-4">
              <button
                type="button"
                onClick={closeCameraModal}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={cameraLoading || !!cameraError}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-extrabold text-white shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition transform active:scale-95 disabled:opacity-50"
              >
                <span className="text-base">📸</span>
                <span>Snap &amp; Geotag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload / Capture Component */}
      {!file ? (
        <div className="space-y-3">
          {/* Action Row: Live Camera Button vs File Pick */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={openCameraModal}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/60 bg-gradient-to-r from-emerald-600/30 via-emerald-600/20 to-teal-600/30 p-3.5 text-xs font-bold text-emerald-300 shadow-lg shadow-emerald-950/40 hover:border-emerald-400 hover:bg-emerald-600/40 hover:text-white transition group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">📷</span>
              <div className="text-left">
                <p className="leading-tight">Capture Live Photo</p>
                <p className="text-[10px] text-emerald-400/80 font-normal">With automatic GPS Geotag</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => nativeCameraRef.current?.click()}
              className="sm:hidden flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/20 p-3.5 text-xs font-bold text-amber-300 hover:bg-amber-950/40 transition"
            >
              <span>📱</span>
              <span>Open Phone Camera</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 p-3.5 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:bg-slate-700 transition"
            >
              <span>📁</span>
              <div className="text-left">
                <p className="leading-tight">Choose File from Device</p>
                <p className="text-[10px] text-slate-400 font-normal">Extract GPS from photo EXIF</p>
              </div>
            </button>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all cursor-pointer ${
              dragActive
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-slate-700/80 bg-[#07241c]/40 hover:border-emerald-600/50 hover:bg-[#07241c]/70"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-600/30 mb-2 text-2xl text-emerald-300">
              📸
            </div>
            <p className="text-xs font-bold text-white text-center">
              Drag &amp; drop road distress media here
            </p>
            <p className="mt-1 text-[11px] text-slate-400 text-center max-w-sm">
              Supports JPEG, PNG, or MP4. GPS coordinates are extracted from EXIF metadata automatically.
            </p>
          </div>
        </div>
      ) : (
        /* Selected / Captured Media Preview Card */
        <div className="relative rounded-2xl border border-emerald-900/60 bg-[#07261d]/80 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-start gap-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Defect preview"
                className="h-28 w-28 rounded-xl object-cover border border-emerald-700/40 shadow-md"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-slate-800 text-4xl">
                🎥
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-white truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type || "Media file"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-rose-600 hover:text-white transition-colors"
                >
                  Retake / Change
                </button>
              </div>

              {/* GPS Status Indicator with Direct Google Maps Link */}
              {gpsStatus === "checking" && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Reading EXIF GPS coordinates...
                </div>
              )}

              {gpsStatus === "found" && extractedCoords && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">
                      📍 {formatCoordinates(extractedCoords[0], extractedCoords[1])}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Geotagged
                    </span>
                  </div>
                  <div>
                    <a
                      href={`https://www.google.com/maps?q=${extractedCoords[0]},${extractedCoords[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 hover:underline"
                    >
                      🗺️ Open Location in Google Maps ↗
                    </a>
                  </div>
                </div>
              )}

              {gpsStatus === "missing" && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-300 space-y-1.5">
                  <p className="font-semibold">⚠️ Photo lacks embedded GPS coordinates</p>
                  <p className="text-[11px] text-slate-400">
                    Select an option to pin the exact road location:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleUseDeviceGps}
                      disabled={geoLoading}
                      className="rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold px-2.5 py-1 transition-all"
                    >
                      {geoLoading ? "Acquiring GPS..." : "📍 Tag My Current Location"}
                    </button>
                    <span className="text-[11px] text-slate-400 self-center">or tap on map</span>
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

