"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { currentRequestIp } from "@/lib/session";
import { writeAudit } from "@/lib/repo/system";
import {
  countActiveSuperAdmins,
  createUser,
  getUserById,
  getUserForAuth,
  setPassword,
  updateUser,
} from "@/lib/repo/users";
import { hashPassword } from "@/lib/password";
import {
  checkbox,
  fieldErrors,
  passwordResetSchema,
  str,
  userCreateSchema,
  userUpdateSchema,
} from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

function refresh(): void {
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
}

export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("users.manage");
  const parsed = userCreateSchema.safeParse({
    name: str(formData, "name"),
    email: str(formData, "email").toLowerCase(),
    role: str(formData, "role"),
    password: str(formData, "password"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }
  if (getUserForAuth(parsed.data.email)) {
    return { ok: false, message: "An account with that email already exists.", errors: { email: "Already in use." } };
  }

  const id = randomUUID();
  createUser({
    id,
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    passwordHash: hashPassword(parsed.data.password),
  });
  writeAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "user.create",
    entity: "user",
    entityId: id,
    detail: `${parsed.data.email} created with role ${parsed.data.role}.`,
    ip: await currentRequestIp(),
  });

  refresh();
  redirect("/admin/users?notice=User%20created.");
}

export async function updateUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("users.manage");
  const parsed = userUpdateSchema.safeParse({
    userId: str(formData, "userId"),
    name: str(formData, "name"),
    role: str(formData, "role"),
    isActive: checkbox(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  const target = getUserById(parsed.data.userId);
  if (!target) return { ok: false, message: "That user no longer exists." };

  const losingSuperAdmin =
    target.role === "super_admin" &&
    (parsed.data.role !== "super_admin" || !parsed.data.isActive) &&
    countActiveSuperAdmins(target.id) === 0;
  if (losingSuperAdmin) {
    return {
      ok: false,
      message: "There must always be at least one active super administrator.",
    };
  }
  if (target.id === actor.id && !parsed.data.isActive) {
    return { ok: false, message: "You cannot deactivate your own account." };
  }

  updateUser(target.id, parsed.data);
  writeAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "user.update",
    entity: "user",
    entityId: target.id,
    detail: `${target.email} → ${parsed.data.role}${parsed.data.isActive ? "" : " (deactivated)"}.`,
    ip: await currentRequestIp(),
  });

  refresh();
  redirect("/admin/users?notice=User%20updated.");
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("users.manage");
  const parsed = passwordResetSchema.safeParse({
    userId: str(formData, "userId"),
    password: str(formData, "password"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }
  const target = getUserById(parsed.data.userId);
  if (!target) return { ok: false, message: "That user no longer exists." };

  setPassword(target.id, hashPassword(parsed.data.password));
  writeAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "user.password_reset",
    entity: "user",
    entityId: target.id,
    detail: `Password reset for ${target.email}.`,
    ip: await currentRequestIp(),
  });

  refresh();
  redirect("/admin/users?notice=Password%20updated.");
}
