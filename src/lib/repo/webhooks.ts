import { all, one, run } from "../db";
import type { NotificationLogEntry, Webhook, WebhookRule } from "../types";

export function listWebhooks(): Webhook[] {
  return all<Webhook>(
    `SELECT w.id, w.name, w.channel_hint, w.is_enabled, w.last_status, w.last_tested_at,
            w.created_at, w.updated_at,
            (SELECT COUNT(*) FROM webhook_rules r WHERE r.webhook_id = w.id) AS rule_count
       FROM webhooks w ORDER BY w.created_at ASC`,
  );
}

export function getWebhookRecord(
  id: string,
): (Webhook & { url_encrypted: string }) | null {
  return one<Webhook & { url_encrypted: string }>(
    `SELECT * FROM webhooks WHERE id = ?`,
    [id],
  );
}

export function listEnabledWebhooks(): (Webhook & { url_encrypted: string })[] {
  return all<Webhook & { url_encrypted: string }>(
    `SELECT * FROM webhooks WHERE is_enabled = 1`,
  );
}

export function createWebhook(
  id: string,
  values: { name: string; urlEncrypted: string; channelHint: string; isEnabled: boolean },
): void {
  const now = new Date().toISOString();
  run(
    `INSERT INTO webhooks (id, name, url_encrypted, channel_hint, is_enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, values.name, values.urlEncrypted, values.channelHint, values.isEnabled ? 1 : 0, now, now],
  );
}

export function updateWebhook(
  id: string,
  values: {
    name: string;
    urlEncrypted: string | null;
    channelHint: string;
    isEnabled: boolean;
  },
): void {
  const now = new Date().toISOString();
  if (values.urlEncrypted) {
    run(
      `UPDATE webhooks SET name = ?, url_encrypted = ?, channel_hint = ?, is_enabled = ?,
         updated_at = ? WHERE id = ?`,
      [values.name, values.urlEncrypted, values.channelHint, values.isEnabled ? 1 : 0, now, id],
    );
  } else {
    run(
      `UPDATE webhooks SET name = ?, channel_hint = ?, is_enabled = ?, updated_at = ?
        WHERE id = ?`,
      [values.name, values.channelHint, values.isEnabled ? 1 : 0, now, id],
    );
  }
}

export function touchWebhookStatus(id: string, status: string): void {
  run(`UPDATE webhooks SET last_status = ?, last_tested_at = ?, updated_at = ? WHERE id = ?`, [
    status,
    new Date().toISOString(),
    new Date().toISOString(),
    id,
  ]);
}

export function deleteWebhook(id: string): void {
  run(`DELETE FROM webhooks WHERE id = ?`, [id]);
}

export function listRules(): WebhookRule[] {
  return all<WebhookRule>(
    `SELECT r.*, l.name AS line_name, w.name AS webhook_name
       FROM webhook_rules r
       LEFT JOIN lines l ON l.id = r.line_id
       JOIN webhooks w ON w.id = r.webhook_id
      ORDER BY w.name ASC, l.sort_order ASC`,
  );
}

export function listRulesForDispatch(): WebhookRule[] {
  return all<WebhookRule>(
    `SELECT r.* FROM webhook_rules r JOIN webhooks w ON w.id = r.webhook_id
      WHERE r.is_enabled = 1 AND w.is_enabled = 1`,
  );
}

export function createRule(
  id: string,
  values: {
    webhookId: string;
    lineId: string | null;
    categories: string[];
    minSeverity: string;
    notifyOnResolve: boolean;
  },
): void {
  run(
    `INSERT INTO webhook_rules (id, webhook_id, line_id, categories, min_severity,
       notify_on_resolve, is_enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      id,
      values.webhookId,
      values.lineId,
      JSON.stringify(values.categories),
      values.minSeverity,
      values.notifyOnResolve ? 1 : 0,
      new Date().toISOString(),
    ],
  );
}

export function deleteRule(id: string): void {
  run(`DELETE FROM webhook_rules WHERE id = ?`, [id]);
}

export function listNotificationLog(limit = 100): NotificationLogEntry[] {
  return all<NotificationLogEntry>(
    `SELECT * FROM notification_log ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
}

export function logDelivery(entry: {
  id: string;
  webhookId: string | null;
  webhookName: string;
  disruptionId: string | null;
  dedupeKey: string;
  status: string;
  httpStatus: number | null;
  error: string | null;
  title: string;
  event: string;
  isTest: boolean;
  isDemonstration?: boolean;
}): boolean {
  const result = run(
    `INSERT INTO notification_log (id, webhook_id, webhook_name, disruption_id, dedupe_key,
       status, http_status, error, title, event, is_test, is_demonstration, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(dedupe_key) DO NOTHING`,
    [
      entry.id,
      entry.webhookId,
      entry.webhookName,
      entry.disruptionId,
      entry.dedupeKey,
      entry.status,
      entry.httpStatus,
      entry.error,
      entry.title,
      entry.event,
      entry.isTest ? 1 : 0,
      entry.isDemonstration ? 1 : 0,
      new Date().toISOString(),
    ],
  );
  return result.changes > 0;
}

export function updateDeliveryResult(
  dedupeKey: string,
  status: string,
  httpStatus: number | null,
  error: string | null,
): void {
  run(
    `UPDATE notification_log SET status = ?, http_status = ?, error = ? WHERE dedupe_key = ?`,
    [status, httpStatus, error, dedupeKey],
  );
}

export function deliveryStats(): { total: number; delivered: number; failed: number } {
  const rows = all<{ status: string; count: number }>(
    `SELECT status, COUNT(*) AS count FROM notification_log GROUP BY status`,
  );
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const delivered = rows.find((row) => row.status === "delivered")?.count ?? 0;
  const failed = rows.find((row) => row.status === "failed")?.count ?? 0;
  return { total, delivered, failed };
}
