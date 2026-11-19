import { all, one, run } from "../db";
import type { Line, MapLine, StationOnLine } from "../types";

export function listLines(): Line[] {
  return all<Line>(
    `SELECT * FROM lines WHERE is_active = 1 ORDER BY sort_order ASC, name ASC`,
  );
}

export function listAllLines(): Line[] {
  return all<Line>(`SELECT * FROM lines ORDER BY sort_order ASC, name ASC`);
}

export function getLineBySlug(slug: string): Line | null {
  return one<Line>(`SELECT * FROM lines WHERE slug = ?`, [slug]);
}

export function getLineById(id: string): Line | null {
  return one<Line>(`SELECT * FROM lines WHERE id = ?`, [id]);
}

export function getLineStations(lineId: string): StationOnLine[] {
  return all<StationOnLine>(
    `SELECT st.*, ls.position, ls.is_terminus, l.id AS line_id, l.name AS line_name,
            l.colour AS line_colour, l.slug AS line_slug
       FROM line_stations ls
       JOIN stations st ON st.id = ls.station_id
       JOIN lines l ON l.id = ls.line_id
      WHERE ls.line_id = ?
      ORDER BY ls.position ASC`,
    [lineId],
  );
}

export function getLinesForStation(stationId: string): Line[] {
  return all<Line>(
    `SELECT l.* FROM line_stations ls JOIN lines l ON l.id = ls.line_id
      WHERE ls.station_id = ? ORDER BY l.sort_order ASC`,
    [stationId],
  );
}

/** All corridors with their ordered stops, used by the interactive map. */
export function getMapLines(): MapLine[] {
  const lines = listLines();
  const links = all<{
    line_id: string;
    id: string;
    name: string;
    slug: string;
    latitude: number;
    longitude: number;
    is_terminus: number;
  }>(
    `SELECT ls.line_id, st.id, st.name, st.slug, st.latitude, st.longitude, ls.is_terminus
       FROM line_stations ls JOIN stations st ON st.id = ls.station_id
       JOIN lines l ON l.id = ls.line_id
      WHERE l.is_active = 1
      ORDER BY ls.position ASC`,
  );

  return lines.map((line) => ({
    id: line.id,
    slug: line.slug,
    name: line.name,
    colour: line.colour,
    status: line.status,
    stations: links
      .filter((link) => link.line_id === line.id)
      .map((link) => ({
        id: link.id,
        name: link.name,
        slug: link.slug,
        lat: link.latitude,
        lng: link.longitude,
        isTerminus: link.is_terminus === 1,
      })),
  }));
}

export function countLineStations(lineId: string): number {
  const row = one<{ count: number }>(
    `SELECT COUNT(*) AS count FROM line_stations WHERE line_id = ?`,
    [lineId],
  );
  return row?.count ?? 0;
}

export function updateLine(
  id: string,
  values: {
    name: string;
    description: string;
    service_pattern: string;
    status: string;
    colour: string;
    region: string;
  },
): void {
  run(
    `UPDATE lines SET name = ?, description = ?, service_pattern = ?, status = ?, colour = ?,
       region = ?, updated_at = ? WHERE id = ?`,
    [
      values.name,
      values.description,
      values.service_pattern,
      values.status,
      values.colour,
      values.region,
      new Date().toISOString(),
      id,
    ],
  );
}

export function createLine(values: {
  id: string;
  slug: string;
  name: string;
  code: string;
  colour: string;
  region: string;
  description: string;
  origin: string;
  destination: string;
  servicePattern: string;
  status: string;
}): void {
  const now = new Date().toISOString();
  run(
    `INSERT INTO lines (id, slug, name, code, colour, region, description, origin, destination,
       service_pattern, status, sort_order, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      values.id,
      values.slug,
      values.name,
      values.code,
      values.colour,
      values.region,
      values.description,
      values.origin,
      values.destination,
      values.servicePattern,
      values.status,
      999,
      now,
      now,
    ],
  );
}

export function lineExists(slug: string): boolean {
  return one<{ id: string }>(`SELECT id FROM lines WHERE slug = ?`, [slug]) !== null;
}
