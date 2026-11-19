import { all, one, run } from "../db";
import type { Category, Disruption, DisruptionStatus, DisruptionView, Severity } from "../types";

export interface DisruptionFilters {
  lineId?: string;
  severity?: string;
  category?: string;
  status?: string;
  publishedOnly?: boolean;
  search?: string;
  limit?: number;
}

function hydrate(rows: Disruption[]): DisruptionView[] {
  if (rows.length === 0) return [];
  const ids = new Set<string>();
  for (const row of rows) {
    try {
      for (const id of JSON.parse(row.affected_stations) as string[]) ids.add(id);
    } catch {
      // ignore malformed payloads
    }
  }
  const stationMap = new Map<string, string>();
  if (ids.size > 0) {
    const list = [...ids];
    const placeholders = list.map(() => "?").join(",");
    const stations = all<{ id: string; name: string }>(
      `SELECT id, name FROM stations WHERE id IN (${placeholders})`,
      list,
    );
    for (const station of stations) stationMap.set(station.id, station.name);
  }

  return rows.map((row) => {
    let names: string[] = [];
    try {
      names = (JSON.parse(row.affected_stations) as string[])
        .map((id) => stationMap.get(id))
        .filter((name): name is string => Boolean(name));
    } catch {
      names = [];
    }
    const line = row.line_id
      ? one<{ name: string; colour: string; slug: string }>(
          `SELECT name, colour, slug FROM lines WHERE id = ?`,
          [row.line_id],
        )
      : null;
    return {
      ...row,
      line_name: line?.name ?? null,
      line_colour: line?.colour ?? null,
      line_slug: line?.slug ?? null,
      station_names: names,
      station_count: names.length,
    };
  });
}

export function listDisruptions(filters: DisruptionFilters = {}): DisruptionView[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (filters.lineId) {
    clauses.push("line_id = ?");
    params.push(filters.lineId);
  }
  if (filters.severity) {
    clauses.push("severity = ?");
    params.push(filters.severity);
  }
  if (filters.category) {
    clauses.push("category = ?");
    params.push(filters.category);
  }
  if (filters.status) {
    clauses.push("status = ?");
    params.push(filters.status);
  }
  if (filters.publishedOnly) {
    clauses.push("is_published = 1");
  }
  if (filters.search?.trim()) {
    clauses.push("(title LIKE ? OR description LIKE ?)");
    const term = `%${filters.search.trim()}%`;
    params.push(term, term);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  params.push(filters.limit ?? 200);
  const rows = all<Disruption>(
    `SELECT * FROM disruptions ${where}
      ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'monitoring' THEN 1 ELSE 2 END,
               starts_at DESC LIMIT ?`,
    params,
  );
  return hydrate(rows);
}

export function getDisruption(id: string): DisruptionView | null {
  const row = one<Disruption>(`SELECT * FROM disruptions WHERE id = ?`, [id]);
  if (!row) return null;
  return hydrate([row])[0];
}

export interface DisruptionInput {
  lineId: string | null;
  title: string;
  category: Category;
  severity: Severity;
  description: string;
  affectedStations: string[];
  status: DisruptionStatus;
  startsAt: string;
  expectedResolutionAt: string | null;
  resolvedAt: string | null;
  replacementTransport: string | null;
  isPublished: boolean;
}

export function createDisruption(
  id: string,
  input: DisruptionInput,
  actorEmail: string,
): void {
  const now = new Date().toISOString();
  run(
    `INSERT INTO disruptions (id, line_id, title, category, severity, description,
       affected_stations, status, starts_at, expected_resolution_at, resolved_at,
       replacement_transport, source, is_published, is_demonstration, created_by,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [
      id,
      input.lineId,
      input.title,
      input.category,
      input.severity,
      input.description,
      JSON.stringify(input.affectedStations),
      input.status,
      input.startsAt,
      input.expectedResolutionAt,
      input.resolvedAt,
      input.replacementTransport,
      `V/LINE CONTROL · ${actorEmail}`,
      input.isPublished ? 1 : 0,
      actorEmail,
      now,
      now,
    ],
  );
}

export function updateDisruption(id: string, input: DisruptionInput): void {
  run(
    `UPDATE disruptions SET line_id = ?, title = ?, category = ?, severity = ?, description = ?,
       affected_stations = ?, status = ?, starts_at = ?, expected_resolution_at = ?,
       resolved_at = ?, replacement_transport = ?, is_published = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.lineId,
      input.title,
      input.category,
      input.severity,
      input.description,
      JSON.stringify(input.affectedStations),
      input.status,
      input.startsAt,
      input.expectedResolutionAt,
      input.resolvedAt,
      input.replacementTransport,
      input.isPublished ? 1 : 0,
      new Date().toISOString(),
      id,
    ],
  );
}

export function resolveDisruption(id: string, actorEmail: string): void {
  const now = new Date().toISOString();
  run(
    `UPDATE disruptions SET status = 'resolved', resolved_at = ?, expected_resolution_at = ?,
       updated_at = ?, source = ? WHERE id = ?`,
    [now, now, now, `V/LINE CONTROL · ${actorEmail}`, id],
  );
}

export function setPublished(id: string, published: boolean): void {
  run(`UPDATE disruptions SET is_published = ?, updated_at = ? WHERE id = ?`, [
    published ? 1 : 0,
    new Date().toISOString(),
    id,
  ]);
}

export function deleteDisruption(id: string): void {
  run(`DELETE FROM disruptions WHERE id = ?`, [id]);
}

export function countActiveDisruptions(): number {
  return (
    one<{ count: number }>(
      `SELECT COUNT(*) AS count FROM disruptions WHERE status = 'active'`,
    )?.count ?? 0
  );
}

export function disruptionCounts(): {
  active: number;
  monitoring: number;
  resolved: number;
  byCategory: { category: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
} {
  const rows = all<{ status: string; count: number }>(
    `SELECT status, COUNT(*) AS count FROM disruptions GROUP BY status`,
  );
  const find = (status: string) => rows.find((row) => row.status === status)?.count ?? 0;
  return {
    active: find("active"),
    monitoring: find("monitoring"),
    resolved: find("resolved"),
    byCategory: all<{ category: string; count: number }>(
      `SELECT category, COUNT(*) AS count FROM disruptions
        WHERE status != 'resolved' GROUP BY category ORDER BY count DESC`,
    ),
    bySeverity: all<{ severity: string; count: number }>(
      `SELECT severity, COUNT(*) AS count FROM disruptions
        WHERE status != 'resolved' GROUP BY severity`,
    ),
  };
}

export function recentDisruptionTitles(limit = 6): { id: string; title: string; severity: string; status: string; created_at: string }[] {
  return all(
    `SELECT id, title, severity, status, created_at FROM disruptions
      ORDER BY updated_at DESC LIMIT ?`,
    [limit],
  );
}
