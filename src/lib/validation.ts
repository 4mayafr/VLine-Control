import { z } from "zod";

export const categoryEnum = z.enum([
  "delays",
  "cancellations",
  "signal_fault",
  "track_fault",
  "infrastructure",
  "planned_works",
  "replacement_buses",
  "other",
]);

export const severityEnum = z.enum(["low", "medium", "high", "critical"]);
export const statusEnum = z.enum(["active", "monitoring", "resolved"]);
export const roleEnum = z.enum([
  "super_admin",
  "administrator",
  "network_operator",
  "read_only",
]);
export const lineStatusEnum = z.enum([
  "operational",
  "minor_delay",
  "major_delay",
  "suspended",
  "planned_closure",
]);
export const updateKindEnum = z.enum(["notice", "service", "maintenance", "community"]);

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your account name or email."),
  password: z.string().min(1, "Enter your password."),
});

export const disruptionSchema = z.object({
  lineId: z.string().trim().min(1, "Select a railway line.").nullable(),
  title: z.string().trim().min(6, "Give the disruption a clear title.").max(160),
  category: categoryEnum,
  severity: severityEnum,
  description: z.string().trim().min(20, "Describe the disruption in at least 20 characters.").max(4000),
  affectedStations: z.array(z.string()).max(200),
  status: statusEnum,
  startsAt: z.string().min(1, "Set a start time."),
  expectedResolutionAt: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  replacementTransport: z.string().trim().max(1000).nullable(),
  isPublished: z.boolean(),
});

export const stationSchema = z.object({
  name: z.string().trim().min(2, "Station name is required.").max(120),
  suburb: z.string().trim().max(120),
  latitude: z.coerce
    .number()
    .min(-39.5, "Latitude must be within Victoria.")
    .max(-33.5, "Latitude must be within Victoria."),
  longitude: z.coerce
    .number()
    .min(140.5, "Longitude must be within Victoria.")
    .max(150.5, "Longitude must be within Victoria."),
  platforms: z.string().trim().max(300).nullable(),
  facilities: z.string().trim().max(2000).nullable(),
  connectingTransport: z.string().trim().max(2000).nullable(),
  lineIds: z.array(z.string()).max(30),
});

export const webhookSchema = z.object({
  name: z.string().trim().min(3, "Name the destination.").max(120),
  url: z.string().trim().url("Enter a valid webhook URL."),
  channelHint: z.string().trim().max(120),
  isEnabled: z.boolean(),
});

export const ruleSchema = z.object({
  webhookId: z.string().trim().min(1, "Select a webhook."),
  lineId: z.string().trim().nullable(),
  categories: z.array(categoryEnum).max(8),
  minSeverity: severityEnum,
  notifyOnResolve: z.boolean(),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter the user's name.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  role: roleEnum,
  password: z.string().min(10, "Use at least 10 characters.").max(200),
});

export const userUpdateSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  role: roleEnum,
  isActive: z.boolean(),
});

export const passwordResetSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(10, "Use at least 10 characters.").max(200),
});

export const lineSchema = z.object({
  lineId: z.string().min(1),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000),
  servicePattern: z.string().trim().max(2000),
  status: lineStatusEnum,
  colour: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex colour."),
  region: z.string().trim().max(120),
});

export const updateSchema = z.object({
  lineId: z.string().nullable(),
  title: z.string().trim().min(4, "Add a short title.").max(160),
  body: z.string().trim().min(10, "Write the update content.").max(4000),
  kind: updateKindEnum,
  isPublished: z.boolean(),
});

export const settingsSchema = z.object({
  networkName: z.string().trim().min(2).max(80),
  publicBanner: z.string().trim().max(200),
  contact: z.string().trim().max(120),
  autoPublish: z.boolean(),
  discordDispatch: z.boolean(),
  informEnabled: z.boolean(),
  retentionDays: z.coerce.number().int().min(1).max(3650),
});

export const informReviewSchema = z.object({
  messageId: z.string().min(1),
  lineId: z.string().nullable(),
  category: categoryEnum,
  severity: severityEnum,
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().min(10).max(4000),
  stationIds: z.array(z.string()).max(200),
});

export const informIngestSchema = z.object({
  from: z.string().trim().max(320).optional(),
  subject: z.string().trim().min(1, "A subject is required.").max(500),
  text: z.string().trim().min(1, "An email body is required.").max(20000),
});

/** Flatten zod issues into a { field: message } map for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export function parseList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function checkbox(formData: FormData, name: string): boolean {
  const value = formData.get(name);
  return value === "on" || value === "true" || value === "1";
}

export function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function nullableStr(formData: FormData, name: string): string | null {
  const value = str(formData, name).trim();
  return value.length > 0 ? value : null;
}

/** Convert a datetime-local input value to an ISO string. */
export function toIso(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}
