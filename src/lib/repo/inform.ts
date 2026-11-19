import { all, one, run } from "../db";
import type { InformMessage } from "../types";

export function listInformMessages(status?: string): (InformMessage & { line_name: string | null })[] {
  const params: string[] = [];
  let where = "";
  if (status) {
    where = "WHERE m.status = ?";
    params.push(status);
  }
  return all<InformMessage & { line_name: string | null }>(
    `SELECT m.*, l.name AS line_name FROM inform_messages m
       LEFT JOIN lines l ON l.id = m.parsed_line_id
       ${where}
      ORDER BY CASE m.status WHEN 'pending' THEN 0 ELSE 1 END, m.received_at DESC
      LIMIT 200`,
    params,
  );
}

export function getInformMessage(id: string): InformMessage | null {
  return one<InformMessage>(`SELECT * FROM inform_messages WHERE id = ?`, [id]);
}

export function createInformMessage(
  id: string,
  values: {
    receivedAt: string;
    from: string;
    subject: string;
    body: string;
    lineId: string | null;
    category: string;
    severity: string;
    title: string;
    description: string;
    stations: string[];
    effectiveAt: string | null;
    confidence: number;
    isDemonstration: boolean;
  },
): void {
  run(
    `INSERT INTO inform_messages (id, received_at, from_address, subject, body, status,
       parsed_line_id, parsed_category, parsed_severity, parsed_title, parsed_description,
       parsed_stations, parsed_effective_at, parse_confidence, is_demonstration, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      values.receivedAt,
      values.from,
      values.subject,
      values.body,
      values.lineId,
      values.category,
      values.severity,
      values.title,
      values.description,
      JSON.stringify(values.stations),
      values.effectiveAt,
      values.confidence,
      values.isDemonstration ? 1 : 0,
      new Date().toISOString(),
    ],
  );
}

export function updateInformParsed(
  id: string,
  values: {
    lineId: string | null;
    category: string;
    severity: string;
    title: string;
    description: string;
    stations: string[];
  },
): void {
  run(
    `UPDATE inform_messages SET parsed_line_id = ?, parsed_category = ?, parsed_severity = ?,
       parsed_title = ?, parsed_description = ?, parsed_stations = ? WHERE id = ?`,
    [
      values.lineId,
      values.category,
      values.severity,
      values.title,
      values.description,
      JSON.stringify(values.stations),
      id,
    ],
  );
}

export function markInformReviewed(
  id: string,
  status: "approved" | "rejected",
  reviewer: string,
  disruptionId: string | null,
  forwarded: boolean,
): void {
  run(
    `UPDATE inform_messages SET status = ?, reviewed_by = ?, reviewed_at = ?,
       published_disruption_id = ?, discord_forwarded = ? WHERE id = ?`,
    [status, reviewer, new Date().toISOString(), disruptionId, forwarded ? 1 : 0, id],
  );
}

export function pendingInformCount(): number {
  return (
    one<{ count: number }>(
      `SELECT COUNT(*) AS count FROM inform_messages WHERE status = 'pending'`,
    )?.count ?? 0
  );
}

export function deleteInformMessage(id: string): void {
  run(`DELETE FROM inform_messages WHERE id = ?`, [id]);
}
