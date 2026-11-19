export {
  categoryLabel,
  severityLabel,
  statusClass,
  lineStatusLabel,
  roleLabel,
} from "@/lib/labels";

const FALLBACK: Record<string, string> = {
  operational: "Operational",
  minor_delay: "Minor delays",
  major_delay: "Major delays",
  suspended: "Suspended",
  planned_closure: "Planned closure",
  active: "Active",
  monitoring: "Monitoring",
  resolved: "Resolved",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  sent: "Sent",
  delivered: "Delivered",
  failed: "Failed",
  blocked: "Blocked",
  duplicate: "Duplicate",
  queued: "Queued",
};

export function statusLabelOf(value: string): string {
  return (
    FALLBACK[value] ??
    value
      .replace(/_/g, " ")
      .replace(/^\w/, (character) => character.toUpperCase())
  );
}
