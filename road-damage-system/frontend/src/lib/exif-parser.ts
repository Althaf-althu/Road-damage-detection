import exifr from "exifr";

export interface ParsedExifData {
  latitude: number | null;
  longitude: number | null;
  timestamp: Date | null;
}

/**
 * Extracts GPS coordinates and capture timestamp from image EXIF metadata client-side.
 */
export async function extractExifGPS(file: File): Promise<ParsedExifData> {
  try {
    const output = await exifr.parse(file, {
      pick: ["latitude", "longitude", "DateTimeOriginal", "CreateDate"],
    });

    if (!output) {
      return { latitude: null, longitude: null, timestamp: null };
    }

    const latitude = typeof output.latitude === "number" ? output.latitude : null;
    const longitude = typeof output.longitude === "number" ? output.longitude : null;
    const rawDate = output.DateTimeOriginal || output.CreateDate;
    const timestamp = rawDate ? new Date(rawDate) : null;

    return {
      latitude,
      longitude,
      timestamp,
    };
  } catch (error) {
    console.warn("Failed to extract EXIF data:", error);
    return { latitude: null, longitude: null, timestamp: null };
  }
}

