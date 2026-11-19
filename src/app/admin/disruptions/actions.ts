"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { currentRequestIp } from "@/lib/session";
import { writeAudit } from "@/lib/repo/system";
import {
  createDisruption,
  deleteDisruption,
  getDisruption,
  resolveDisruption,
  setPublished,
  updateDisruption,
} from "@/lib/repo/disruptions";
import { checkbox, disruptionSchema, fieldErrors, nullableStr, str, toIso } from "@/lib/validation";
import { dispatchDisruption } from "@/lib/discord";
import type { ActionState } from "@/lib/action-state";

function refresh(id?: string): void {
  revalidatePath("/admin");
  revalidatePath("/admin/disruptions");
  revalidatePath("/disruptions");
  revalidatePath("/");
  if (id) revalidatePath(`/admin/disruptions/${id}`);
}

export async function saveDisruptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("disruption.manage");
  const id = str(formData, "id");
  const existing = id ? getDisruption(id) : null;

  const parsed = disruptionSchema.safeParse({
    lineId: nullableStr(formData, "lineId"),
    title: str(formData, "title"),
    category: str(formData, "category"),
    severity: str(formData, "severity"),
    description: str(formData, "description"),
    affectedStations: formData.getAll("affectedStations").map(String).filter(Boolean),
    status: str(formData, "status"),
    startsAt: str(formData, "startsAt"),
    expectedResolutionAt: toIso(nullableStr(formData, "expectedResolutionAt")),
    resolvedAt: null,
    replacementTransport: nullableStr(formData, "replacementTransport"),
    isPublished: checkbox(formData, "isPublished"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Some fields need attention.",
      errors: fieldErrors(parsed.error),
    };
  }

  if (!existing && !parsed.data.isPublished && parsed.data.status === "active") {
    // Allowed: drafts can be active internally, they simply are not public.
  }

  const startsAtIso = toIso(parsed.data.startsAt);
  if (!startsAtIso) {
    return { ok: false, errors: { startsAt: "Enter a valid start date and time." }, message: "Check the start time." };
  }

  const resolvedAt =
    parsed.data.status === "resolved"
      ? existing?.resolved_at ?? new Date().toISOString()
      : null;

  const values = {
    ...parsed.data,
    startsAt: startsAtIso,
    resolvedAt,
  };

  let disruptionId = id;
  try {
    if (existing) {
      updateDisruption(existing.id, values);
    } else {
      disruptionId = randomUUID();
      createDisruption(disruptionId, values, user.email);
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The disruption could not be saved.",
    };
  }

  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: existing ? "disruption.update" : "disruption.create",
    entity: "disruption",
    entityId: disruptionId,
    detail: `${parsed.data.title} (${parsed.data.severity}, ${parsed.data.status}${parsed.data.isPublished ? ", published" : ", draft"})`,
    ip: await currentRequestIp(),
  });

  let message = existing ? "Disruption updated." : "Disruption created.";
  if (parsed.data.isPublished) {
    const summary = await dispatchDisruption(
      disruptionId,
      parsed.data.status === "resolved" ? "resolved" : existing ? "updated" : "created",
    );
    if (summary.delivered > 0) message += ` ${summary.delivered} Discord notification(s) delivered.`;
    if (summary.failed > 0) message += ` ${summary.failed} notification(s) failed — see delivery history.`;
    if (summary.attempted === 0) message += " No Discord routing rule matched this disruption.";
  }

  refresh(disruptionId);
  redirect(`/admin/disruptions?notice=${encodeURIComponent(message)}`);
}

export async function resolveDisruptionAction(formData: FormData): Promise<void> {
  const user = await requirePermission("disruption.manage");
  const id = str(formData, "id");
  const disruption = getDisruption(id);
  if (!disruption) redirect("/admin/disruptions?notice=Disruption%20not%20found.");

  resolveDisruption(id, user.email);
  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "disruption.resolve",
    entity: "disruption",
    entityId: id,
    detail: disruption.title,
    ip: await currentRequestIp(),
  });

  let message = "Disruption resolved.";
  if (disruption.is_published === 1) {
    const summary = await dispatchDisruption(id, "resolved");
    if (summary.delivered > 0) message += ` ${summary.delivered} resolution notification(s) sent.`;
  }
  refresh(id);
  redirect(`/admin/disruptions?notice=${encodeURIComponent(message)}`);
}

export async function publishDisruptionAction(formData: FormData): Promise<void> {
  const user = await requirePermission("disruption.manage");
  const id = str(formData, "id");
  const publish = str(formData, "value") === "true";
  const disruption = getDisruption(id);
  if (!disruption) redirect("/admin/disruptions?notice=Disruption%20not%20found.");

  setPublished(id, publish);
  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: publish ? "disruption.publish" : "disruption.unpublish",
    entity: "disruption",
    entityId: id,
    detail: disruption.title,
    ip: await currentRequestIp(),
  });

  let message = publish ? "Disruption published to the public site." : "Disruption unpublished.";
  if (publish) {
    const summary = await dispatchDisruption(id, "created");
    if (summary.delivered > 0) message += ` ${summary.delivered} Discord notification(s) delivered.`;
    if (summary.failed > 0) message += ` ${summary.failed} notification(s) failed.`;
  }
  refresh(id);
  redirect(`/admin/disruptions?notice=${encodeURIComponent(message)}`);
}

export async function deleteDisruptionAction(formData: FormData): Promise<void> {
  const user = await requirePermission("disruption.manage");
  const id = str(formData, "id");
  const disruption = getDisruption(id);
  if (disruption) {
    deleteDisruption(id);
    writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "disruption.delete",
      entity: "disruption",
      entityId: id,
      detail: disruption.title,
      ip: await currentRequestIp(),
    });
  }
  refresh();
  redirect("/admin/disruptions?notice=Disruption%20deleted.");
}
