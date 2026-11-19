import { createHash, randomUUID } from "node:crypto";
import { decryptSecret } from "./crypto";
import { SEVERITY_RANK, categoryLabel, severityLabel } from "./labels";
import type { DisruptionView, Severity, WebhookRule } from "./types";
import { getDisruption } from "./repo/disruptions";
import {
  getWebhookRecord,
  listEnabledWebhooks,
  listRulesForDispatch,
  logDelivery,
  touchWebhookStatus,
  updateDeliveryResult,
} from "./repo/webhooks";

export const DISCORD_EMBED_COLOURS: Record<Severity, number> = {
  low: 0x38bdf8,
  medium: 0xfbbf24,
  high: 0xfb923c,
  critical: 0xfb7185,
};

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description: string;
  colour: number;
  fields: DiscordEmbedField[];
  footer: { text: string };
  timestamp: string;
}

export interface DiscordPayload {
  username: string;
  avatar_url?: string;
  allowed_mentions: { parse: never[] };
  embeds: DiscordEmbed[];
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

const STATUS_ICON: Record<string, string> = {
  active: "🔴 Active",
  monitoring: "🟠 Monitoring",
  resolved: "🟢 Resolved",
};

export function buildDisruptionEmbed(disruption: DisruptionView): DiscordEmbed {
  const affected =
    disruption.station_names.length > 0
      ? truncate(disruption.station_names.slice(0, 10).join(", "), 1000) +
        (disruption.station_names.length > 10 ? ` +${disruption.station_names.length - 10} more` : "")
      : "Network-wide";

  const fields: DiscordEmbedField[] = [
    { name: "Railway line", value: disruption.line_name ?? "Network-wide", inline: true },
    { name: "Severity", value: severityLabel(disruption.severity), inline: true },
    { name: "Status", value: STATUS_ICON[disruption.status] ?? disruption.status, inline: true },
    { name: "Category", value: categoryLabel(disruption.category), inline: true },
    {
      name: "Expected resolution",
      value: disruption.expected_resolution_at
        ? `<t:${Math.floor(new Date(disruption.expected_resolution_at).getTime() / 1000)}:R>`
        : "Not yet confirmed",
      inline: true,
    },
    { name: "Affected stations", value: affected, inline: false },
  ];

  if (disruption.replacement_transport) {
    fields.push({
      name: "Replacement transport",
      value: truncate(disruption.replacement_transport, 1000),
      inline: false,
    });
  }

  fields.push({
    name: "Last updated",
    value: `<t:${Math.floor(new Date(disruption.updated_at).getTime() / 1000)}:f>`,
    inline: true,
  });
  fields.push({ name: "Source", value: truncate(disruption.source, 256), inline: false });

  return {
    title: truncate(disruption.title, 256),
    description: truncate(disruption.description, 3800),
    colour: DISCORD_EMBED_COLOURS[disruption.severity] ?? 0x8f5ae8,
    fields,
    footer: { text: "V/LINE CONTROL · Unofficial monitoring platform" },
    timestamp: disruption.updated_at,
  };
}

export function buildTestEmbed(webhookName: string): DiscordEmbed {
  return {
    title: "V/LINE CONTROL connection test",
    description:
      "This is a test notification confirming that V/LINE CONTROL can reach this channel. No real service information is included.",
    colour: 0x8f5ae8,
    fields: [
      { name: "Destination", value: webhookName, inline: true },
      { name: "Test result", value: "✅ Delivered", inline: true },
      { name: "Source", value: "V/LINE CONTROL · Notification settings", inline: false },
    ],
    footer: { text: "V/LINE CONTROL · Unofficial monitoring platform" },
    timestamp: new Date().toISOString(),
  };
}

export interface SendResult {
  ok: boolean;
  status: number | null;
  error: string | null;
}

export async function sendDiscordPayload(
  webhookUrl: string,
  payload: DiscordPayload,
): Promise<SendResult> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (response.ok) return { ok: true, status: response.status, error: null };
    let detail = "";
    try {
      const body = (await response.json()) as { message?: string; code?: number };
      detail = [body.message, body.code ? `(code ${body.code})` : ""].filter(Boolean).join(" ");
    } catch {
      detail = await response.text().catch(() => "");
    }
    return {
      ok: false,
      status: response.status,
      error: truncate(`Discord returned ${response.status}${detail ? `: ${detail}` : ""}`, 500),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "TimeoutError"
          ? "The request to Discord timed out after 10 seconds."
          : error.message
        : "Unknown network error while contacting Discord.";
    return { ok: false, status: null, error: truncate(message, 500) };
  }
}

function ruleMatches(rule: WebhookRule, disruption: DisruptionView, event: string): boolean {
  if (rule.line_id && rule.line_id !== disruption.line_id) return false;
  let categories: string[] = [];
  try {
    categories = JSON.parse(rule.categories) as string[];
  } catch {
    categories = [];
  }
  if (categories.length > 0 && !categories.includes(disruption.category)) return false;
  if (SEVERITY_RANK[disruption.severity] < SEVERITY_RANK[rule.min_severity]) return false;
  if (event === "resolved" && rule.notify_on_resolve === 0) return false;
  return true;
}

function contentHash(disruption: DisruptionView): string {
  return createHash("sha256")
    .update(
      [
        disruption.id,
        disruption.title,
        disruption.severity,
        disruption.status,
        disruption.description,
        disruption.expected_resolution_at ?? "",
        disruption.updated_at.slice(0, 16),
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 16);
}

export interface DispatchSummary {
  attempted: number;
  delivered: number;
  failed: number;
  duplicates: number;
  skipped: number;
  errors: string[];
}

/**
 * Fan a published disruption out to every webhook whose routing rules match.
 * Deduplication is enforced by a UNIQUE dedupe_key in notification_log, so a
 * repeated dispatch of identical content cannot send twice.
 */
export async function dispatchDisruption(
  disruptionId: string,
  event: "created" | "updated" | "resolved",
): Promise<DispatchSummary> {
  const summary: DispatchSummary = {
    attempted: 0,
    delivered: 0,
    failed: 0,
    duplicates: 0,
    skipped: 0,
    errors: [],
  };

  const disruption = getDisruption(disruptionId);
  if (!disruption) {
    summary.errors.push("Disruption not found.");
    return summary;
  }
  if (disruption.is_published !== 1) {
    summary.skipped += 1;
    return summary;
  }

  const webhooks = listEnabledWebhooks();
  if (webhooks.length === 0) {
    summary.errors.push("No enabled Discord webhooks are configured.");
    return summary;
  }

  const rules = listRulesForDispatch();
  const embed = buildDisruptionEmbed(disruption);
  const hash = contentHash(disruption);

  for (const webhook of webhooks) {
    const matching = rules.filter(
      (rule) => rule.webhook_id === webhook.id && ruleMatches(rule, disruption, event),
    );
    if (matching.length === 0) {
      summary.skipped += 1;
      continue;
    }

    summary.attempted += 1;
    const dedupeKey = `disruption:${webhook.id}:${disruption.id}:${event}:${hash}`;
    const inserted = logDelivery({
      id: randomUUID(),
      webhookId: webhook.id,
      webhookName: webhook.name,
      disruptionId: disruption.id,
      dedupeKey,
      status: "queued",
      httpStatus: null,
      error: null,
      title: disruption.title,
      event,
      isTest: false,
      isDemonstration: disruption.is_demonstration === 1,
    });
    if (!inserted) {
      summary.duplicates += 1;
      continue;
    }

    let url: string;
    try {
      url = decryptSecret(webhook.url_encrypted);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read webhook URL.";
      updateDeliveryResult(dedupeKey, "failed", null, message);
      touchWebhookStatus(webhook.id, "failed");
      summary.failed += 1;
      summary.errors.push(`${webhook.name}: ${message}`);
      continue;
    }

    const result = await sendDiscordPayload(url, {
      username: "V/LINE CONTROL",
      allowed_mentions: { parse: [] },
      embeds: [embed],
    });
    updateDeliveryResult(
      dedupeKey,
      result.ok ? "delivered" : "failed",
      result.status,
      result.error,
    );
    touchWebhookStatus(webhook.id, result.ok ? "delivered" : "failed");
    if (result.ok) summary.delivered += 1;
    else {
      summary.failed += 1;
      summary.errors.push(`${webhook.name}: ${result.error ?? "Unknown Discord error."}`);
    }
  }

  return summary;
}

export async function sendTestNotification(
  webhookId: string,
): Promise<{ ok: boolean; message: string }> {
  const webhook = getWebhookRecord(webhookId);
  if (!webhook) return { ok: false, message: "That webhook no longer exists." };

  let url: string;
  try {
    url = decryptSecret(webhook.url_encrypted);
  } catch {
    return { ok: false, message: "Stored webhook URL could not be decrypted. Re-enter it." };
  }

  const dedupeKey = `test:${webhook.id}:${Date.now()}`;
  logDelivery({
    id: randomUUID(),
    webhookId: webhook.id,
    webhookName: webhook.name,
    disruptionId: null,
    dedupeKey,
    status: "queued",
    httpStatus: null,
    error: null,
    title: "Connection test",
    event: "test",
    isTest: true,
  });

  const result = await sendDiscordPayload(url, {
    username: "V/LINE CONTROL",
    allowed_mentions: { parse: [] },
    embeds: [buildTestEmbed(webhook.name)],
  });

  updateDeliveryResult(dedupeKey, result.ok ? "delivered" : "failed", result.status, result.error);
  touchWebhookStatus(webhook.id, result.ok ? "delivered" : "failed");

  return result.ok
    ? { ok: true, message: `Test notification delivered to ${webhook.name}.` }
    : {
        ok: false,
        message: `${webhook.name}: ${result.error ?? "Discord rejected the test notification."}`,
      };
}
