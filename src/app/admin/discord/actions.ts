"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { currentRequestIp } from "@/lib/session";
import { writeAudit } from "@/lib/repo/system";
import {
  createRule,
  createWebhook,
  deleteRule,
  deleteWebhook,
  getWebhookRecord,
  updateWebhook,
} from "@/lib/repo/webhooks";
import { encryptSecret, isValidDiscordWebhookUrl } from "@/lib/crypto";
import { sendTestNotification } from "@/lib/discord";
import { checkbox, fieldErrors, nullableStr, ruleSchema, str, webhookSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

function refresh(): void {
  revalidatePath("/admin/discord");
  revalidatePath("/admin");
}

export async function saveWebhookAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("integration.manage");
  const id = str(formData, "id");
  const existing = id ? getWebhookRecord(id) : null;
  const rawUrl = str(formData, "url").trim();

  const parsed = webhookSchema.safeParse({
    name: str(formData, "name"),
    url: rawUrl || "https://discord.com/api/webhooks/000000/unset",
    channelHint: str(formData, "channelHint"),
    isEnabled: checkbox(formData, "isEnabled"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  if (!existing && !rawUrl) {
    return {
      ok: false,
      message: "A webhook URL is required for a new destination.",
      errors: { url: "Paste the Discord webhook URL." },
    };
  }
  if (rawUrl && !isValidDiscordWebhookUrl(rawUrl)) {
    return {
      ok: false,
      message: "That does not look like a Discord webhook URL.",
      errors: { url: "Expected https://discord.com/api/webhooks/<id>/<token>" },
    };
  }

  try {
    if (existing) {
      updateWebhook(existing.id, {
        name: parsed.data.name,
        urlEncrypted: rawUrl ? encryptSecret(rawUrl) : null,
        channelHint: parsed.data.channelHint,
        isEnabled: parsed.data.isEnabled,
      });
    } else {
      createWebhook(randomUUID(), {
        name: parsed.data.name,
        urlEncrypted: encryptSecret(rawUrl),
        channelHint: parsed.data.channelHint,
        isEnabled: parsed.data.isEnabled,
      });
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The webhook could not be saved.",
    };
  }

  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: existing ? "webhook.update" : "webhook.create",
    entity: "webhook",
    entityId: existing?.id ?? null,
    detail: `${parsed.data.name}${parsed.data.isEnabled ? " (enabled)" : " (disabled)"}. URL ${rawUrl ? "updated" : "unchanged"}.`,
    ip: await currentRequestIp(),
  });

  refresh();
  redirect(`/admin/discord?notice=${encodeURIComponent(existing ? "Webhook updated." : "Webhook added.")}`);
}

export async function toggleWebhookAction(formData: FormData): Promise<void> {
  const user = await requirePermission("integration.manage");
  const id = str(formData, "id");
  const webhook = getWebhookRecord(id);
  if (!webhook) redirect("/admin/discord?notice=Webhook%20not%20found.");

  updateWebhook(webhook.id, {
    name: webhook.name,
    urlEncrypted: null,
    channelHint: webhook.channel_hint,
    isEnabled: webhook.is_enabled !== 1,
  });
  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "webhook.toggle",
    entity: "webhook",
    entityId: id,
    detail: `${webhook.name} ${webhook.is_enabled === 1 ? "disabled" : "enabled"}.`,
    ip: await currentRequestIp(),
  });
  refresh();
  redirect("/admin/discord?notice=Webhook%20status%20updated.");
}

export async function deleteWebhookAction(formData: FormData): Promise<void> {
  const user = await requirePermission("integration.manage");
  const id = str(formData, "id");
  const webhook = getWebhookRecord(id);
  if (webhook) {
    deleteWebhook(id);
    writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "webhook.delete",
      entity: "webhook",
      entityId: id,
      detail: `${webhook.name} and its routing rules were removed.`,
      ip: await currentRequestIp(),
    });
  }
  refresh();
  redirect("/admin/discord?notice=Webhook%20deleted.");
}

export async function testWebhookAction(formData: FormData): Promise<void> {
  const user = await requirePermission("integration.manage");
  const id = str(formData, "id");
  const result = await sendTestNotification(id);
  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "webhook.test",
    entity: "webhook",
    entityId: id,
    detail: result.ok ? "Test notification delivered." : `Test failed: ${result.message}`,
    ip: await currentRequestIp(),
  });
  refresh();
  redirect(`/admin/discord?notice=${encodeURIComponent(result.message)}&tone=${result.ok ? "ok" : "error"}`);
}

export async function saveRuleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("integration.manage");
  const parsed = ruleSchema.safeParse({
    webhookId: str(formData, "webhookId"),
    lineId: nullableStr(formData, "lineId"),
    categories: formData.getAll("categories").map(String).filter(Boolean),
    minSeverity: str(formData, "minSeverity"),
    notifyOnResolve: checkbox(formData, "notifyOnResolve"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  const webhook = getWebhookRecord(parsed.data.webhookId);
  if (!webhook) return { ok: false, message: "Select a webhook that exists." };

  createRule(randomUUID(), parsed.data);
  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "webhook.rule.create",
    entity: "webhook_rule",
    entityId: webhook.id,
    detail: `Routing rule for ${parsed.data.lineId ? "one line" : "all lines"} at ${parsed.data.minSeverity}+ severity.`,
    ip: await currentRequestIp(),
  });

  refresh();
  redirect("/admin/discord?notice=Routing%20rule%20added.");
}

export async function deleteRuleAction(formData: FormData): Promise<void> {
  const user = await requirePermission("integration.manage");
  const id = str(formData, "id");
  deleteRule(id);
  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "webhook.rule.delete",
    entity: "webhook_rule",
    entityId: id,
    detail: "Routing rule removed.",
    ip: await currentRequestIp(),
  });
  refresh();
  redirect("/admin/discord?notice=Routing%20rule%20removed.");
}
