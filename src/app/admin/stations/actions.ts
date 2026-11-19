"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { currentRequestIp } from "@/lib/session";
import { writeAudit } from "@/lib/repo/system";
import {
  createStation,
  deleteStation,
  getStationById,
  getStationByName,
  updateStation,
} from "@/lib/repo/stations";
import { fieldErrors, nullableStr, stationSchema, str } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function refresh(slug?: string): void {
  revalidatePath("/admin/stations");
  revalidatePath("/stations");
  revalidatePath("/network");
  if (slug) revalidatePath(`/stations/${slug}`);
}

export async function saveStationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requirePermission("station.manage");
  const id = str(formData, "id");
  const existing = id ? getStationById(id) : null;

  const parsed = stationSchema.safeParse({
    name: str(formData, "name"),
    suburb: str(formData, "suburb"),
    latitude: str(formData, "latitude"),
    longitude: str(formData, "longitude"),
    platforms: nullableStr(formData, "platforms"),
    facilities: nullableStr(formData, "facilities"),
    connectingTransport: nullableStr(formData, "connectingTransport"),
    lineIds: formData.getAll("lineIds").map(String).filter(Boolean),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Some fields need attention.",
      errors: fieldErrors(parsed.error),
    };
  }

  if (parsed.data.lineIds.length === 0) {
    return {
      ok: false,
      message: "Assign the station to at least one railway line.",
      errors: { lineIds: "Select at least one line." },
    };
  }

  const conflict = (() => {
    try {
      const row = getStationByName(parsed.data.name);
      return row && row.id !== existing?.id ? row : null;
    } catch {
      return null;
    }
  })();
  if (conflict) {
    return {
      ok: false,
      message: "Another station already uses that name.",
      errors: { name: "Station names must be unique." },
    };
  }

  try {
    if (existing) {
      updateStation(
        existing.id,
        {
          name: parsed.data.name,
          suburb: parsed.data.suburb,
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
          platforms: parsed.data.platforms,
          facilities: parsed.data.facilities,
          connectingTransport: parsed.data.connectingTransport,
        },
        parsed.data.lineIds,
      );
    } else {
      const newId = randomUUID();
      createStation(newId, slugify(parsed.data.name), {
        ...parsed.data,
      });
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The station could not be saved.",
    };
  }

  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: existing ? "station.update" : "station.create",
    entity: "station",
    entityId: existing?.id ?? parsed.data.name,
    detail: parsed.data.name,
    ip: await currentRequestIp(),
  });

  refresh(existing?.slug ?? slugify(parsed.data.name));
  redirect(
    `/admin/stations?notice=${encodeURIComponent(existing ? "Station updated." : "Station created.")}`,
  );
}

export async function deleteStationAction(formData: FormData): Promise<void> {
  const user = await requirePermission("station.manage");
  const id = str(formData, "id");
  const station = getStationById(id);
  if (station) {
    deleteStation(id);
    writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "station.delete",
      entity: "station",
      entityId: id,
      detail: station.name,
      ip: await currentRequestIp(),
    });
  }
  refresh();
  redirect("/admin/stations?notice=Station%20deleted.");
}
