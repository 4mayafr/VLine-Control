import { all, one, run } from "../db";
import type { AuditEntry, NetworkStats, ServiceUpdate } from "../types";
import { deliveryStats } from "./webhooks";
import { pendingInformCount } from "./inform";

export function getSettings(): Record<string, string> {
  const rows = all<{ key: string; value: string }>(`SELECT key, value FROM settings`);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function getSetting(key: string, fallback = ""): string {
  return (
    one<{ value: string }>(`SELECT value FROM settings WHERE key = ?`, [key])?.value ?? fallback
  );
}

export function setSetting(key: string, value: string): void {
  run(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, new Date().toISOString()],
  );
}

export function listAudit(limit = 150): AuditEntry[] {
  return all<AuditEntry>(
    `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
}

export function writeAudit(entry: {
  actorId: string | null;
  actorEmail: string;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string;
  ip?: string;
}): void {
  run(
    `INSERT INTO audit_log (id, actor_id, actor_email, action, entity, entity_id, detail, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      entry.actorId,
      entry.actorEmail,
      entry.action,
      entry.entity,
      entry.entityId ?? null,
      entry.detail ?? "",
      entry.ip ?? "",
      new Date().toISOString(),
    ],
  );
}

export function listUpdates(options: { publishedOnly?: boolean; limit?: number } = {}): ServiceUpdate[] {
  return all<ServiceUpdate>(
    `SELECT u.*, l.name AS line_name, l.colour AS line_colour
       FROM service_updates u LEFT JOIN lines l ON l.id = u.line_id
       ${options.publishedOnly ? "WHERE u.is_published = 1" : ""}
      ORDER BY u.created_at DESC LIMIT ?`,
    [options.limit ?? 50],
  );
}

export function createUpdate(
  values: {
    lineId: string | null;
    title: string;
    body: string;
    kind: string;
    isPublished: boolean;
  },
  actorEmail: string,
): string {
  const id = crypto.randomUUID();
  run(
    `INSERT INTO service_updates (id, line_id, title, body, kind, is_published,
       is_demonstration, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      id,
      values.lineId,
      values.title,
      values.body,
      values.kind,
      values.isPublished ? 1 : 0,
      actorEmail,
      new Date().toISOString(),
    ],
  );
  return id;
}

export function deleteUpdate(id: string): void {
  run(`DELETE FROM service_updates WHERE id = ?`, [id]);
}

export function networkStats(): NetworkStats {
  const counts = one<{
    lines: number;
    stations: number;
    active: number;
    resolved: number;
    updates: number;
    delays: number;
    cancellations: number;
    buses: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM lines WHERE is_active = 1) AS lines,
       (SELECT COUNT(*) FROM stations WHERE is_active = 1) AS stations,
       (SELECT COUNT(*) FROM disruptions WHERE status = 'active') AS active,
       (SELECT COUNT(*) FROM disruptions WHERE status = 'resolved') AS resolved,
       (SELECT COUNT(*) FROM service_updates WHERE is_published = 1) AS updates,
       (SELECT COUNT(*) FROM disruptions WHERE status != 'resolved' AND category = 'delays') AS delays,
       (SELECT COUNT(*) FROM disruptions WHERE status != 'resolved' AND category = 'cancellations') AS cancellations,
       (SELECT COUNT(*) FROM disruptions WHERE status != 'resolved' AND category = 'replacement_buses') AS buses`,
  )!;

  const delivery = deliveryStats();
  return {
    lineCount: counts.lines,
    stationCount: counts.stations,
    activeDisruptions: counts.active,
    resolvedDisruptions: counts.resolved,
    pendingInform: pendingInformCount(),
    publishedUpdates: counts.updates,
    cancellations: counts.cancellations,
    delays: counts.delays,
    replacementBus: counts.buses,
    deliverySuccess: delivery.delivered,
    deliveryTotal: delivery.total,
  };
}

/** Disruption counts per day for the last `days` days, oldest first. */
export function disruptionTrend(days = 14): { date: string; count: number }[] {
  const rows = all<{ date: string; count: number }>(
    `SELECT substr(starts_at, 1, 10) AS date, COUNT(*) AS count FROM disruptions
      WHERE starts_at >= ? GROUP BY date ORDER BY date ASC`,
    [new Date(Date.now() - days * 86_400_000).toISOString()],
  );
  const map = new Map(rows.map((row) => [row.date, row.count]));
  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    result.push({ date, count: map.get(date) ?? 0 });
  }
  return result;
}

export function lineHealth(): {
  id: string;
  name: string;
  colour: string;
  status: string;
  open: number;
}[] {
  return all(
    `SELECT l.id, l.name, l.colour, l.status,
       (SELECT COUNT(*) FROM disruptions d WHERE d.line_id = l.id AND d.status != 'resolved') AS open
       FROM lines l WHERE l.is_active = 1 ORDER BY l.sort_order ASC`,
  );
}
