export type Role = "super_admin" | "administrator" | "network_operator" | "read_only";

export type Severity = "low" | "medium" | "high" | "critical";

export type Category =
  | "delays"
  | "cancellations"
  | "signal_fault"
  | "track_fault"
  | "infrastructure"
  | "planned_works"
  | "replacement_buses"
  | "other";

export type DisruptionStatus = "active" | "monitoring" | "resolved";

export type LineStatus =
  | "operational"
  | "minor_delay"
  | "major_delay"
  | "suspended"
  | "planned_closure";

export type UpdateKind = "notice" | "service" | "maintenance" | "community";

export type InformStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_active: number;
  created_at: string;
  last_login_at: string | null;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Line {
  id: string;
  slug: string;
  name: string;
  code: string;
  colour: string;
  region: string;
  description: string;
  origin: string;
  destination: string;
  service_pattern: string;
  status: LineStatus;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Station {
  id: string;
  slug: string;
  name: string;
  suburb: string;
  latitude: number;
  longitude: number;
  platforms: string | null;
  facilities: string | null;
  connecting_transport: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface StationOnLine extends Station {
  position: number;
  is_terminus: number;
  line_id: string;
  line_name: string;
  line_colour: string;
  line_slug: string;
}

export interface Disruption {
  id: string;
  line_id: string | null;
  title: string;
  category: Category;
  severity: Severity;
  description: string;
  affected_stations: string;
  status: DisruptionStatus;
  starts_at: string;
  expected_resolution_at: string | null;
  resolved_at: string | null;
  replacement_transport: string | null;
  source: string;
  is_published: number;
  is_demonstration: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisruptionView extends Disruption {
  line_name: string | null;
  line_colour: string | null;
  line_slug: string | null;
  station_names: string[];
  station_count: number;
}

export interface ServiceUpdate {
  id: string;
  line_id: string | null;
  title: string;
  body: string;
  kind: UpdateKind;
  is_published: number;
  is_demonstration: number;
  created_by: string | null;
  created_at: string;
  line_name?: string | null;
  line_colour?: string | null;
}

export interface Webhook {
  id: string;
  name: string;
  channel_hint: string;
  is_enabled: number;
  last_status: string | null;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
  rule_count?: number;
}

export interface WebhookRule {
  id: string;
  webhook_id: string;
  line_id: string | null;
  categories: string;
  min_severity: Severity;
  notify_on_resolve: number;
  is_enabled: number;
  created_at: string;
  line_name?: string | null;
  webhook_name?: string;
}

export interface NotificationLogEntry {
  id: string;
  webhook_id: string | null;
  webhook_name: string;
  disruption_id: string | null;
  dedupe_key: string;
  status: string;
  http_status: number | null;
  error: string | null;
  title: string;
  event: string;
  is_test: number;
  is_demonstration: number;
  created_at: string;
}

export interface InformMessage {
  id: string;
  received_at: string;
  from_address: string;
  subject: string;
  body: string;
  status: InformStatus;
  parsed_line_id: string | null;
  parsed_category: Category | null;
  parsed_severity: Severity | null;
  parsed_title: string | null;
  parsed_description: string | null;
  parsed_stations: string;
  parsed_effective_at: string | null;
  parse_confidence: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_disruption_id: string | null;
  discord_forwarded: number;
  is_demonstration: number;
  line_name?: string | null;
}

export interface AuditEntry {
  id: string;
  actor_id: string | null;
  actor_email: string;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: string;
  ip: string;
  created_at: string;
}

export interface NetworkStats {
  lineCount: number;
  stationCount: number;
  activeDisruptions: number;
  resolvedDisruptions: number;
  pendingInform: number;
  publishedUpdates: number;
  cancellations: number;
  delays: number;
  replacementBus: number;
  deliverySuccess: number;
  deliveryTotal: number;
}

export interface MapLine {
  id: string;
  slug: string;
  name: string;
  colour: string;
  status: LineStatus;
  stations: { id: string; name: string; slug: string; lat: number; lng: number; isTerminus: boolean }[];
}
