import type { Category, Severity } from "./types";

export interface ParserLine {
  id: string;
  name: string;
  code: string;
}

export interface ParserStation {
  id: string;
  name: string;
  lineIds: string[];
}

export interface ParsedInform {
  lineId: string | null;
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  stationIds: string[];
  effectiveAt: string | null;
  confidence: number;
}

const CATEGORY_RULES: { category: Category; patterns: RegExp[] }[] = [
  {
    category: "replacement_buses",
    patterns: [/replacement (?:bus|coach)/i, /coach(?:es)? (?:replace|replacing)/i, /buses replace/i],
  },
  {
    category: "planned_works",
    patterns: [/\bplanned works?\b/i, /track works?/i, /\bmaintenance\b/i, /\bpossession\b/i],
  },
  {
    category: "signal_fault",
    patterns: [/\bsignal(?:ling)? (?:fault|failure|issue)/i, /\bsignal fault\b/i],
  },
  {
    category: "track_fault",
    patterns: [/\btrack (?:fault|defect|condition)\b/i, /\bbroken rail\b/i],
  },
  {
    category: "infrastructure",
    patterns: [
      /overhead (?:power|wiring|line)/i,
      /\bpower (?:fault|failure|outage)\b/i,
      /\binfrastructure (?:fault|issue|damage)\b/i,
      /\bequipment fault\b/i,
    ],
  },
  {
    category: "cancellations",
    patterns: [/\bcancel(?:led|lation|ing|s)\b/i, /\bnot (?:running|operating)\b/i],
  },
  {
    category: "delays",
    patterns: [/\bdelays?\b/i, /\blate running\b/i, /\bslow running\b/i],
  },
];

const SEVERITY_HIGH = /suspen|no service|all services|major delay|replacement (?:bus|coach)|do not travel/i;
const SEVERITY_CRITICAL = /\ball (?:services|lines)\b|network[- ]wide|emergency|evacuat/i;
const SEVERITY_LOW = /\bminor\b|\bslight\b|\bup to (?:5|10) minutes\b/i;

function normalise(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Extract a line reference from the subject or body of an inbound email. */
function matchLine(text: string, lines: ParserLine[]): ParserLine | null {
  const lower = text.toLowerCase();
  let best: { line: ParserLine; index: number } | null = null;
  for (const line of lines) {
    const candidates = [line.name.toLowerCase(), `${line.name.replace(/ line$/i, "")} line`];
    for (const candidate of candidates) {
      const index = lower.indexOf(candidate);
      if (index >= 0 && (!best || index < best.index)) {
        best = { line, index };
      }
    }
  }
  return best?.line ?? null;
}

export function parseInformEmail(
  input: { subject: string; body: string; from?: string },
  context: { lines: ParserLine[]; stations: ParserStation[] },
): ParsedInform {
  const subject = normalise(input.subject || "");
  const body = normalise(input.body || "");
  const haystack = `${subject}\n${body}`;

  const line = matchLine(subject, context.lines) ?? matchLine(body, context.lines);

  let category: Category = "other";
  let categoryMatched = false;
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      category = rule.category;
      categoryMatched = true;
      break;
    }
  }

  let severity: Severity = "medium";
  if (SEVERITY_CRITICAL.test(haystack)) severity = "critical";
  else if (SEVERITY_HIGH.test(haystack)) severity = "high";
  else if (SEVERITY_LOW.test(haystack)) severity = "low";

  // Stations belonging to the identified line (or all stations if no line).
  const eligible = line
    ? context.stations.filter((station) => station.lineIds.includes(line.id))
    : context.stations;
  const stationIds = eligible
    .filter((station) => haystack.toLowerCase().includes(station.name.toLowerCase()))
    .map((station) => station.id)
    .slice(0, 12);

  const tidySubject = subject
    .replace(/^(?:fw|fwd|re)\s*:\s*/gi, "")
    .replace(/\s*[—–-]\s*(?:service alteration|service update|notice|alert).*$/i, "")
    .trim();

  const title = (tidySubject || `${line?.name ?? "Network"} service notice`).slice(0, 140);
  const description = body.slice(0, 900) || subject.slice(0, 900);

  const confidence = Math.min(
    0.98,
    0.35 + (line ? 0.35 : 0) + (categoryMatched ? 0.2 : 0) + (stationIds.length > 0 ? 0.08 : 0),
  );

  const effectiveMatch = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(body);

  return {
    lineId: line?.id ?? null,
    category,
    severity,
    title,
    description,
    stationIds,
    effectiveAt: effectiveMatch ? effectiveMatch[0] : null,
    confidence: Number(confidence.toFixed(2)),
  };
}
