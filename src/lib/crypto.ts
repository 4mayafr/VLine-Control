import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

/**
 * Server-only secret handling.
 *
 * AUTH_SECRET is used to derive AES-256-GCM keys for values that must be stored
 * at rest (Discord webhook URLs). A development-only fallback keeps the app
 * bootable locally; production deployments must set AUTH_SECRET.
 */
import { sessionSecret } from "./secret";

export const authSecret = sessionSecret;

function key(): Buffer {
  return createHash("sha256").update(authSecret()).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSecret(blob: string): string {
  const [version, ivPart, tagPart, dataPart] = blob.split(".");
  if (version !== "v1" || !ivPart || !tagPart || !dataPart) {
    throw new Error("Stored secret is not in a readable format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** Redacted display form of a webhook URL. Never exposes the token. */
export function maskWebhookUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 2] ?? "";
    const tail = id ? `${id.slice(0, 4)}…${id.slice(-4)}` : "••••";
    return `${parsed.protocol}//${parsed.host}/api/webhooks/${tail}/••••••••`;
  } catch {
    return "••••••••";
  }
}

export function isValidDiscordWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostOk =
      parsed.hostname === "discord.com" ||
      parsed.hostname === "discordapp.com" ||
      parsed.hostname.endsWith(".discord.com");
    return (
      parsed.protocol === "https:" &&
      hostOk &&
      /^\/api\/webhooks\/\d+\/[\w-]+$/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}
