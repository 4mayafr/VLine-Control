import { NextResponse, type NextRequest } from "next/server";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { informIngestSchema } from "@/lib/validation";
import { parseInformEmail } from "@/lib/inform-parser";
import { createInformMessage } from "@/lib/repo/inform";
import { listAllLines } from "@/lib/repo/lines";
import { stationLinePairs } from "@/lib/repo/stations";
import { getSetting, writeAudit } from "@/lib/repo/system";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenMatches(provided: string): boolean {
  const expected = process.env.INFORM_INGEST_TOKEN ?? "";
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readPayload(request: NextRequest): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      from: typeof body.from === "string" ? body.from : "",
      subject: typeof body.subject === "string" ? body.subject : "",
      text:
        typeof body.text === "string"
          ? body.text
          : typeof body.body === "string"
            ? body.body
            : typeof body["body-plain"] === "string"
              ? String(body["body-plain"])
              : "",
    };
  }
  const form = await request.formData();
  return {
    from: String(form.get("from") ?? form.get("sender") ?? ""),
    subject: String(form.get("subject") ?? ""),
    text: String(form.get("text") ?? form.get("body") ?? form.get("body-plain") ?? form.get("stripped-text") ?? ""),
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (process.env.INFORM_INGEST_ENABLED !== "true") {
    return NextResponse.json(
      { ok: false, error: "Inbound email ingestion is disabled (INFORM_INGEST_ENABLED is not true)." },
      { status: 503 },
    );
  }
  if (getSetting("inform_integration_enabled", "true") !== "true") {
    return NextResponse.json(
      { ok: false, error: "Inbound email ingestion is paused in system settings." },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const provided = bearer || request.nextUrl.searchParams.get("token") || "";
  if (!tokenMatches(provided)) {
    return NextResponse.json({ ok: false, error: "Unauthorised." }, { status: 401 });
  }

  let payload: Record<string, string>;
  try {
    payload = await readPayload(request);
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read request body." }, { status: 400 });
  }

  const parsed = informIngestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid payload.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  }

  const lines = listAllLines().map((line) => ({ id: line.id, name: line.name, code: line.code }));
  const pairs = stationLinePairs();
  const stationMap = new Map<string, { id: string; name: string; lineIds: string[] }>();
  for (const pair of pairs) {
    const existing = stationMap.get(pair.id);
    if (existing) existing.lineIds.push(pair.lineId);
    else stationMap.set(pair.id, { id: pair.id, name: pair.name, lineIds: [pair.lineId] });
  }

  const result = parseInformEmail(
    { subject: parsed.data.subject, body: parsed.data.text, from: parsed.data.from },
    { lines, stations: [...stationMap.values()] },
  );

  const id = randomUUID();
  try {
    createInformMessage(id, {
      receivedAt: new Date().toISOString(),
      from: parsed.data.from ?? "unknown@sender",
      subject: parsed.data.subject,
      body: parsed.data.text,
      lineId: result.lineId,
      category: result.category,
      severity: result.severity,
      title: result.title,
      description: result.description,
      stations: result.stationIds,
      effectiveAt: result.effectiveAt,
      confidence: result.confidence,
      isDemonstration: false,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not store message." },
      { status: 500 },
    );
  }

  writeAudit({
    actorId: null,
    actorEmail: parsed.data.from ?? "inform-ingest",
    action: "inform.receive",
    entity: "inform_message",
    entityId: id,
    detail: `Inbound email stored for review: ${parsed.data.subject}`,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "ingest",
  });

  return NextResponse.json(
    {
      ok: true,
      id,
      status: "pending_review",
      parsed: {
        lineId: result.lineId,
        category: result.category,
        severity: result.severity,
        confidence: result.confidence,
        stationCount: result.stationIds.length,
      },
      message:
        "Stored for operator review. Nothing has been published or forwarded automatically.",
    },
    { status: 202 },
  );
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: "Use POST with a bearer token to submit an email for review.",
    },
    { status: 405 },
  );
}
