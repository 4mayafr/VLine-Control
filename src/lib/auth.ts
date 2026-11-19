import { redirect } from "next/navigation";
import { cache } from "react";
import { readSession } from "./session";
import { can, assertPermission, type Permission } from "./rbac";
import type { SessionUser } from "./types";

/**
 * Reads the session from the signed, httpOnly cookie.
 * Cached per request so multiple components can call it freely.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await readSession();
  if (!session) return null;
  return {
    id: session.id,
    email: session.email,
    name: session.name,
    role: session.role,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    throw new Error(
      `Access denied: your role cannot perform this action (${permission}).`,
    );
  }
  return user;
}

export function guard(permission: Permission, user: SessionUser): void {
  assertPermission(user.role, permission);
}
