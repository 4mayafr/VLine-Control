export interface Bounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

/** Approximate bounding box of Victoria, used to frame the network map. */
export const VICTORIA_BOUNDS: Bounds = {
  west: 140.9,
  east: 150.05,
  south: -39.25,
  north: -33.85,
};

export interface Projector {
  project: (lat: number, lng: number) => { x: number; y: number };
  height: number;
  width: number;
}

/**
 * Equirectangular projection with latitude correction. Adequate for a
 * state-scale schematic map of station locations.
 */
export function createProjector(bounds: Bounds, width: number): Projector {
  const centreLat = (bounds.north + bounds.south) / 2;
  const cosLat = Math.cos((centreLat * Math.PI) / 180);
  const spanX = (bounds.east - bounds.west) * cosLat;
  const spanY = bounds.north - bounds.south;
  const scale = width / spanX;
  return {
    width,
    height: Math.round(spanY * scale),
    project: (lat: number, lng: number) => ({
      x: Number(((lng - bounds.west) * cosLat * scale).toFixed(2)),
      y: Number(((bounds.north - lat) * scale).toFixed(2)),
    }),
  };
}

export function boundsAround(lat: number, lng: number, degrees = 0.06): Bounds {
  return {
    west: lng - degrees,
    east: lng + degrees,
    south: lat - degrees,
    north: lat + degrees,
  };
}

export function polyline(points: { x: number; y: number }[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export const REGION_LABELS: { name: string; lat: number; lng: number }[] = [
  { name: "MALLEE", lat: -35.1, lng: 143.2 },
  { name: "WIMMERA", lat: -36.6, lng: 142.0 },
  { name: "GRAMPIANS", lat: -37.6, lng: 142.6 },
  { name: "LODDON", lat: -36.4, lng: 144.0 },
  { name: "HUME", lat: -36.8, lng: 145.9 },
  { name: "GIPPSLAND", lat: -37.9, lng: 147.2 },
  { name: "BARWON", lat: -38.3, lng: 143.9 },
  { name: "MELBOURNE", lat: -37.62, lng: 144.85 },
];
