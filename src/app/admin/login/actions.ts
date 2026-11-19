"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, currentRequestIp } from "@/lib/session";
import { getUserForAuth, touchLogin } from "@/lib/repo/users";
import { verifyPassword } from "@/lib/password";
import { fieldErrors, loginSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/repo/system";
import type { Role } from "@/lib/types";
import type { ActionState } from "@/lib/action-state";

const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function tooManyAttempts(key: string): boolean {
  const record = attempts.get(key);
  if (!record) return false;
  if (Date.now() - record.first > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const record = attempts.get(key);
  if (!record || Date.now() - record.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: Date.now() });
    return;
  }
  record.count += 1;
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), message: "Check the form and try again." };
  }

  const ip = await currentRequestIp();
  const key = `${parsed.data.email.toLowerCase()}|${ip}`;
  if (tooManyAttempts(key)) {
    return {
      ok: false,
      message: "Too many sign-in attempts. Wait 10 minutes before trying again.",
    };
  }

  const account = getUserForAuth(parsed.data.email);
  const valid = account ? verifyPassword(parsed.data.password, account.password_hash) : false;

  if (!account || !valid) {
    recordFailure(key);
    writeAudit({
      actorId: account?.id ?? null,
      actorEmail: parsed.data.email,
      action: "auth.login_failed",
      entity: "session",
      detail: "Invalid email or password.",
      ip,
    });
    return { ok: false, message: "Those credentials were not accepted." };
  }

  if (account.is_active !== 1) {
    recordFailure(key);
    return { ok: false, message: "This account has been deactivated. Contact a super administrator." };
  }

  attempts.delete(key);
  await createSession({
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role as Role,
  });
  touchLogin(account.id);
  writeAudit({
    actorId: account.id,
    actorEmail: account.email,
    action: "auth.login",
    entity: "session",
    detail: `Signed in as ${account.role}.`,
    ip,
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const ip = await currentRequestIp();
  writeAudit({
    actorId: null,
    actorEmail: "session",
    action: "auth.logout",
    entity: "session",
    detail: "Session ended by user.",
    ip,
  });
  await destroySession();
  redirect("/admin/login");
}
