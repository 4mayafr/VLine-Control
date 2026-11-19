"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { currentRequestIp } from "@/lib/session";
import { writeAudit } from "@/lib/repo/system";
import { createDisruption } from "@/lib/repo/disruptions";
import {
  deleteInformMessage,
  getInformMessage,
  markInformReviewed,
  updateInformParsed,
} from "@/lib/repo/inform";
import { dispatchDisruption } from "@/lib/discord";
import { fieldErrors, informReviewSchema, str } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

function refresh(): void {
  revalidatePath("/admin/inform");
  revalidatePath("/admin/disruptions");
  revalidatePath("/admin");
  revalidatePath("/disruptions");
  revalidatePath("/");
}

/**
 * Approve an inbound Inform email: apply the reviewed fields, publish a
 * disruption, optionally forward it to Discord, and record the decision.
 */
export async function reviewInformAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("inform.review");
  const decision = str(formData, "decision");
  const messageId = str(formData, "messageId");
  const message = getInformMessage(messageId);
  if (!message) return { ok: false, message: "That message no longer exists." };
  if (message.status !== "pending") {
    return { ok: false, message: "This message has already been reviewed." };
  }

  if (decision === "reject") {
    markInformReviewed(messageId, "rejected", user.email, null, false);
    writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "inform.reject",
      entity: "inform_message",
      entityId: messageId,
      detail: `Rejected: ${message.subject}`,
      ip: await currentRequestIp(),
    });
    refresh();
    redirect("/admin/inform?notice=Message%20rejected.");
  }

  const parsed = informReviewSchema.safeParse({
    messageId,
    lineId: str(formData, "lineId") || null,
    category: str(formData, "category"),
    severity: str(formData, "severity"),
    title: str(formData, "title"),
    description: str(formData, "description"),
    stationIds: formData.getAll("stationIds").map(String).filter(Boolean),
  });
  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  updateInformParsed(messageId, {
    lineId: parsed.data.lineId,
    category: parsed.data.category,
    severity: parsed.data.severity,
    title: parsed.data.title,
    description: parsed.data.description,
    stations: parsed.data.stationIds,
  });

  const disruptionId = randomUUID();
  const startsAt = new Date().toISOString();
  createDisruption(
    disruptionId,
    {
      lineId: parsed.data.lineId,
      title: parsed.data.title,
      category: parsed.data.category,
      severity: parsed.data.severity,
      description: parsed.data.description,
      affectedStations: parsed.data.stationIds,
      status: "active",
      startsAt,
      expectedResolutionAt: null,
      resolvedAt: null,
      replacementTransport: null,
      isPublished: true,
    },
    user.email,
  );

  let forwarded = false;
  const forward = str(formData, "forwardToDiscord") === "true";
  if (forward) {
    const summary = await dispatchDisruption(disruptionId, "created");
    forwarded = summary.delivered > 0;
  }

  markInformReviewed(messageId, "approved", user.email, disruptionId, forwarded);
  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "inform.approve",
    entity: "inform_message",
    entityId: messageId,
    detail: `Published as disruption ${disruptionId}${forwarded ? " and forwarded to Discord" : ""}.`,
    ip: await currentRequestIp(),
  });

  refresh();
  redirect(
    `/admin/inform?notice=${encodeURIComponent(
      `Approved and published.${forwarded ? " Discord notification delivered." : ""}`,
    )}`,
  );
}

export async function deleteInformAction(formData: FormData): Promise<void> {
  const user = await requirePermission("inform.review");
  const id = str(formData, "id");
  deleteInformMessage(id);
  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "inform.delete",
    entity: "inform_message",
    entityId: id,
    detail: "Inbound message removed.",
    ip: await currentRequestIp(),
  });
  refresh();
  redirect("/admin/inform?notice=Message%20removed.");
}
