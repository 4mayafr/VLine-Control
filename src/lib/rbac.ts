import type { Role } from "./types";

export type Permission =
  | "view"
  | "network.manage"
  | "station.manage"
  | "disruption.manage"
  | "integration.manage"
  | "inform.review"
  | "users.manage"
  | "system.manage"
  | "audit.view";

const ALL: Permission[] = [
  "view",
  "network.manage",
  "station.manage",
  "disruption.manage",
  "integration.manage",
  "inform.review",
  "users.manage",
  "system.manage",
  "audit.view",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL,
  administrator: [
    "view",
    "network.manage",
    "station.manage",
    "disruption.manage",
    "integration.manage",
    "inform.review",
    "audit.view",
  ],
  network_operator: ["view", "disruption.manage", "inform.review"],
  read_only: ["view"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`Your role does not have the "${permission}" permission.`);
    this.name = "ForbiddenError";
  }
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!can(role, permission)) throw new ForbiddenError(permission);
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  view: "View admin console",
  "network.manage": "Manage railway lines",
  "station.manage": "Manage stations",
  "disruption.manage": "Manage disruptions",
  "integration.manage": "Manage integrations",
  "inform.review": "Review Inform email",
  "users.manage": "Manage users",
  "system.manage": "Change system settings",
  "audit.view": "View audit log",
};
