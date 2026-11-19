import type {
  Category,
  DisruptionStatus,
  LineStatus,
  Role,
  Severity,
  UpdateKind,
} from "./types";

export interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export const CATEGORIES: Option<Category>[] = [
  { value: "delays", label: "Delays", description: "Late running services" },
  { value: "cancellations", label: "Cancellations", description: "Services removed from the timetable" },
  { value: "signal_fault", label: "Signal faults", description: "Signalling or safeworking issues" },
  { value: "track_fault", label: "Track faults", description: "Track condition or defects" },
  { value: "infrastructure", label: "Infrastructure issues", description: "Stations, power, overhead or equipment" },
  { value: "planned_works", label: "Planned works", description: "Scheduled maintenance and projects" },
  { value: "replacement_buses", label: "Replacement buses", description: "Road coach substitution" },
  { value: "other", label: "Other service alterations", description: "Everything else" },
];

export const SEVERITIES: Option<Severity>[] = [
  { value: "low", label: "Low", description: "Minor impact, services still running" },
  { value: "medium", label: "Medium", description: "Noticeable delay or partial alteration" },
  { value: "high", label: "High", description: "Major delay, significant cancellations" },
  { value: "critical", label: "Critical", description: "Line suspended or network-wide impact" },
];

export const DISRUPTION_STATUSES: Option<DisruptionStatus>[] = [
  { value: "active", label: "Active" },
  { value: "monitoring", label: "Monitoring" },
  { value: "resolved", label: "Resolved" },
];

export const LINE_STATUSES: Option<LineStatus>[] = [
  { value: "operational", label: "Operational" },
  { value: "minor_delay", label: "Minor delays" },
  { value: "major_delay", label: "Major delays" },
  { value: "suspended", label: "Suspended" },
  { value: "planned_closure", label: "Planned closure" },
];

export const UPDATE_KINDS: Option<UpdateKind>[] = [
  { value: "notice", label: "Notice" },
  { value: "service", label: "Service update" },
  { value: "maintenance", label: "Maintenance" },
  { value: "community", label: "Community" },
];

export const ROLES: (Option<Role> & { summary: string })[] = [
  {
    value: "super_admin",
    label: "Super Administrator",
    summary: "Full access including user management, settings and audit logs.",
  },
  {
    value: "administrator",
    label: "Administrator",
    summary: "Manage the network, disruptions, stations and integrations.",
  },
  {
    value: "network_operator",
    label: "Network Operator",
    summary: "Publish and resolve disruptions, review Inform email.",
  },
  {
    value: "read_only",
    label: "Read Only",
    summary: "View dashboards and records without making changes.",
  },
];

export const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Other service alterations";
}

export function severityLabel(value: string): string {
  return SEVERITIES.find((s) => s.value === value)?.label ?? value;
}

export function lineStatusLabel(value: string): string {
  return LINE_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function roleLabel(value: string): string {
  return ROLES.find((r) => r.value === value)?.label ?? value;
}

export function updateKindLabel(value: string): string {
  return UPDATE_KINDS.find((k) => k.value === value)?.label ?? value;
}

export const SEVERITY_CLASS: Record<Severity, string> = {
  low: "text-sky-300 bg-sky-400/10 border-sky-400/25",
  medium: "text-amber-300 bg-amber-400/10 border-amber-400/25",
  high: "text-orange-300 bg-orange-400/10 border-orange-400/25",
  critical: "text-rose-300 bg-rose-400/10 border-rose-400/25",
};

export const STATUS_CLASS: Record<string, string> = {
  operational: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
  minor_delay: "text-amber-300 bg-amber-400/10 border-amber-400/25",
  major_delay: "text-orange-300 bg-orange-400/10 border-orange-400/25",
  suspended: "text-rose-300 bg-rose-400/10 border-rose-400/25",
  planned_closure: "text-violet-300 bg-violet-400/10 border-violet-400/25",
  active: "text-rose-300 bg-rose-400/10 border-rose-400/25",
  monitoring: "text-amber-300 bg-amber-400/10 border-amber-400/25",
  resolved: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
  pending: "text-amber-300 bg-amber-400/10 border-amber-400/25",
  approved: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
  rejected: "text-slate-300 bg-slate-400/10 border-slate-400/25",
  sent: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
  failed: "text-rose-300 bg-rose-400/10 border-rose-400/25",
  blocked: "text-slate-300 bg-slate-400/10 border-slate-400/25",
  duplicate: "text-slate-400 bg-slate-400/10 border-slate-400/25",
};

export function statusClass(value: string): string {
  return STATUS_CLASS[value] ?? "text-slate-300 bg-slate-400/10 border-slate-400/25";
}
