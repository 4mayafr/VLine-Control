import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Role, SessionUser } from "./types";
import { authSecret } from "./crypto";

const COOKIE_NAME = "vline_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function key(): Uint8Array {
  return new TextEncoder().encode(authSecret());
}

export interface SessionPayload extends SessionUser {
  iat?: number;
  exp?: number;
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("vline-control")
    .setAudience("vline-control-admin")
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(key());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key(), {
      issuer: "vline-control",
      audience: "vline-control-admin",
    });
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      id: String(payload.sub),
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : payload.email,
      role: (payload.role as Role) ?? "read_only",
    };
  } catch {
    return null;
  }
}

export async function currentRequestIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headerStore.get("x-real-ip") ?? "local";
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
