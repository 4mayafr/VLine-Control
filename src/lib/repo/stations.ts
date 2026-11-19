import { all, one, run } from "../db";
import type { Disruption, Station, StationOnLine } from "../types";

export interface StationWithLines extends Station {
  line_names: string;
  line_ids: string;
}

export function searchStations(query = "", limit = 500): StationWithLines[] {
  const params: string[] = [];
  let sql = `SELECT st.*,
      COALESCE(GROUP_CONCAT(l.name, ' · '), '') AS line_names,
      COALESCE(GROUP_CONCAT(l.id, '|'), '') AS line_ids
    FROM stations st
    LEFT JOIN line_stations ls ON ls.station_id = st.id
    LEFT JOIN lines l ON l.id = ls.line_id
    WHERE st.is_active = 1`;
  if (query.trim()) {
    sql += ` AND (st.name LIKE ? OR st.suburb LIKE ?)`;
    const term = `%${query.trim()}%`;
    params.push(term, term);
  }
  sql += ` GROUP BY st.id ORDER BY st.name ASC LIMIT ?`;
  params.push(String(limit));
  return all<StationWithLines>(sql, params);
}

export function getStationBySlug(slug: string): Station | null {
  return one<Station>(`SELECT * FROM stations WHERE slug = ?`, [slug]);
}

export function getStationById(id: string): Station | null {
  return one<Station>(`SELECT * FROM stations WHERE id = ?`, [id]);
}

export function getStationByName(name: string): Station | null {
  return one<Station>(`SELECT * FROM stations WHERE name = ? COLLATE NOCASE`, [name]);
}

export function getStationsByIds(ids: string[]): Station[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  return all<Station>(`SELECT * FROM stations WHERE id IN (${placeholders})`, ids);
}

export function listActiveStations(): Station[] {
  return all<Station>(`SELECT * FROM stations WHERE is_active = 1 ORDER BY name ASC`);
}

/** Flat station-to-line relationships, used by the email parser. */
export function stationLinePairs(): { id: string; name: string; lineId: string }[] {
  return all<{ id: string; name: string; lineId: string }>(
    `SELECT ls.station_id AS id, st.name, ls.line_id AS lineId
       FROM line_stations ls JOIN stations st ON st.id = ls.station_id
      WHERE st.is_active = 1`,
  );
}

/** Stations belonging to a line, with their position along the corridor. */
export function listStationsForLine(lineId: string): StationOnLine[] {
  return all<StationOnLine>(
    `SELECT st.*, ls.position, ls.is_terminus, l.id AS line_id, l.name AS line_name,
            l.colour AS line_colour, l.slug AS line_slug
       FROM line_stations ls
       JOIN stations st ON st.id = ls.station_id
       JOIN lines l ON l.id = ls.line_id
      WHERE ls.line_id = ? ORDER BY ls.position ASC`,
    [lineId],
  );
}

export interface StationInput {
  name: string;
  suburb: string;
  latitude: number;
  longitude: number;
  platforms: string | null;
  facilities: string | null;
  connectingTransport: string | null;
  lineIds: string[];
}

export function createStation(id: string, slug: string, input: StationInput): void {
  const now = new Date().toISOString();
  run(
    `INSERT INTO stations (id, slug, name, suburb, latitude, longitude, platforms, facilities,
       connecting_transport, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      slug,
      input.name,
      input.suburb,
      input.latitude,
      input.longitude,
      input.platforms,
      input.facilities,
      input.connectingTransport,
      now,
      now,
    ],
  );
  syncStationLines(id, input.lineIds);
}

export function updateStation(
  id: string,
  values: Omit<StationInput, "lineIds">,
  lineIds: string[] | null,
): void {
  run(
    `UPDATE stations SET name = ?, suburb = ?, latitude = ?, longitude = ?, platforms = ?,
       facilities = ?, connecting_transport = ?, updated_at = ? WHERE id = ?`,
    [
      values.name,
      values.suburb,
      values.latitude,
      values.longitude,
      values.platforms,
      values.facilities,
      values.connectingTransport,
      new Date().toISOString(),
      id,
    ],
  );
  if (lineIds) syncStationLines(id, lineIds);
}

function syncStationLines(stationId: string, lineIds: string[]): void {
  run(`DELETE FROM line_stations WHERE station_id = ?`, [stationId]);
  lineIds.forEach((lineId, index) => {
    run(
      `INSERT OR IGNORE INTO line_stations (line_id, station_id, position, is_terminus)
       VALUES (?, ?, ?, 0)`,
      [lineId, stationId, 1000 + index],
    );
  });
}

export function deleteStation(id: string): void {
  run(`DELETE FROM stations WHERE id = ?`, [id]);
}

export function stationCountOnLine(lineId: string): number {
  const row = one<{ count: number }>(
    `SELECT COUNT(*) AS count FROM line_stations WHERE line_id = ?`,
    [lineId],
  );
  return row?.count ?? 0;
}

export function disruptionsForStation(stationId: string): Disruption[] {
  return all<Disruption>(
    `SELECT * FROM disruptions
      WHERE affected_stations LIKE ?
      ORDER BY starts_at DESC LIMIT 20`,
    [`%${stationId}%`],
  );
}
