"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { currentRequestIp } from "@/lib/session";
import { createUpdate, deleteUpdate, setSetting, writeAudit } from "@/lib/repo/system";
import { checkbox, fieldErrors, settingsSchema, str, updateSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("system.manage");
  const parsed = settingsSchema.safeParse({
    networkName: str(formData, "networkName"),
    publicBanner: str(formData, "publicBanner"),
    contact: str(formData, "contact"),
    autoPublish: checkbox(formData, "autoPublish"),
    discordDispatch: checkbox(formData, "discordDispatch"),
    informEnabled: checkbox(formData, "informEnabled"),
    retentionDays: str(formData, "retentionDays"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  const values: Record<string, string> = {
    network_name: parsed.data.networkName,
    public_banner: parsed.data.publicBanner,
    notice_contact: parsed.data.contact,
    disruption_auto_publish: parsed.data.autoPublish ? "true" : "false",
    discord_dispatch_enabled: parsed.data.discordDispatch ? "true" : "false",
    inform_integration_enabled: parsed.data.informEnabled ? "true" : "false",
    inform_retention_days: String(parsed.data.retentionDays),
  };
  for (const [key, value] of Object.entries(values)) setSetting(key, value);

  writeAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "settings.update",
    entity: "settings",
    entityId: null,
    detail: `Updated ${Object.keys(values).length} settings.`,
    ip: await currentRequestIp(),
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin/settings?notice=Settings%20saved.");
}

export async function createUpdateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("disruption.manage");
  const parsed = updateSchema.safeParse({
    lineId: str(formData, "lineId") || null,
    title: str(formData, "title"),
    body: str(formData, "body"),
    kind: str(formData, "kind"),
    isPublished: checkbox(formData, "isPublished"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  const id = createUpdate(parsed.data, actor.email);
  writeAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "update.create",
    entity: "service_update",
    entityId: id,
    detail: parsed.data.title,
    ip: await currentRequestIp(),
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/settings?notice=Network%20update%20posted.");
}

export async function deleteUpdateAction(formData: FormData): Promise<void> {
  const actor = await requirePermission("disruption.manage");
  const id = str(formData, "id");
  deleteUpdate(id);
  writeAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "update.delete",
    entity: "service_update",
    entityId: id,
    detail: "Network update removed.",
    ip: await currentRequestIp(),
  });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  redirect("/admin/settings?notice=Network%20update%20removed.");
}
