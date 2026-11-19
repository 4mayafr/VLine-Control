"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { currentRequestIp } from "@/lib/session";
import { writeAudit } from "@/lib/repo/system";
import { createLine, getLineById, lineExists, updateLine } from "@/lib/repo/lines";
import { fieldErrors, lineSchema, str } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function saveLineAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("network.manage");
  const lineId = str(formData, "lineId");
  const creating = lineId === "new";

  const parsed = lineSchema.safeParse({
    lineId: lineId || "new",
    name: str(formData, "name"),
    description: str(formData, "description"),
    servicePattern: str(formData, "servicePattern"),
    status: str(formData, "status"),
    colour: str(formData, "colour"),
    region: str(formData, "region"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  const slug = slugify(parsed.data.name.replace(/\s+line$/i, ""));

  try {
    if (creating) {
      if (lineExists(slug)) {
        return { ok: false, message: "A line with that slug already exists.", errors: { name: "Choose a different name." } };
      }
      createLine({
        id: randomUUID(),
        slug,
        name: parsed.data.name,
        code: slug.slice(0, 3).toUpperCase(),
        colour: parsed.data.colour,
        region: parsed.data.region,
        description: parsed.data.description,
        origin: str(formData, "origin"),
        destination: str(formData, "destination"),
        servicePattern: parsed.data.servicePattern,
        status: parsed.data.status,
      });
    } else {
      const existing = getLineById(parsed.data.lineId);
      if (!existing) return { ok: false, message: "That line no longer exists." };
      updateLine(existing.id, {
        name: parsed.data.name,
        description: parsed.data.description,
        service_pattern: parsed.data.servicePattern,
        status: parsed.data.status,
        colour: parsed.data.colour,
        region: parsed.data.region,
      });
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The line could not be saved.",
    };
  }

  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: creating ? "line.create" : "line.update",
    entity: "line",
    entityId: parsed.data.lineId,
    detail: `${parsed.data.name} set to ${parsed.data.status}.`,
    ip: await currentRequestIp(),
  });

  revalidatePath("/admin/lines");
  revalidatePath("/admin");
  revalidatePath("/network");
  revalidatePath("/");
  redirect(`/admin/lines?notice=${encodeURIComponent(creating ? "Line created." : "Line updated.")}`);
}
