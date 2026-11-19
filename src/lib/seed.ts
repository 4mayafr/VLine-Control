import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./password";
import { SEED_LINES } from "./seed-data";

/**
 * First-run dataset.
 *
 * Only reference data is seeded: the rail corridors, their stations and one
 * administrator account. No disruptions, updates, notifications or inbound
 * email are created — those records come from real use of the console.
 */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function seedDatabase(db: DatabaseSync): void {
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, role, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
  ).run(
    randomUUID(),
    "admin@vlinecontrol.au",
    "Administrator",
    hashPassword(process.env.SEED_ADMIN_PASSWORD ?? "admincontrol"),
    "super_admin",
    now,
  );

  const insertLine = db.prepare(
    `INSERT INTO lines (id, slug, name, code, colour, region, description, origin, destination,
       service_pattern, status, sort_order, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
  );
  const insertStation = db.prepare(
    `INSERT INTO stations (id, slug, name, suburb, latitude, longitude, platforms, facilities,
       connecting_transport, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
  );
  const insertLink = db.prepare(
    `INSERT INTO line_stations (line_id, station_id, position, is_terminus) VALUES (?, ?, ?, ?)`,
  );

  const stationIds = new Map<string, string>();

  SEED_LINES.forEach((line, lineIndex) => {
    const lineId = randomUUID();
    insertLine.run(
      lineId,
      line.slug,
      line.name,
      line.code,
      line.colour,
      line.region,
      line.description,
      line.origin,
      line.destination,
      line.servicePattern,
      line.status,
      lineIndex,
      now,
      now,
    );

    line.stations.forEach((station, position) => {
      let stationId = stationIds.get(station.name);
      if (!stationId) {
        stationId = randomUUID();
        stationIds.set(station.name, stationId);
        insertStation.run(
          stationId,
          slugify(station.name),
          station.name,
          station.suburb ?? "",
          station.lat,
          station.lng,
          station.platforms ?? null,
          station.facilities ?? null,
          station.connections ?? null,
          now,
          now,
        );
      }
      insertLink.run(
        lineId,
        stationId,
        position,
        position === 0 || position === line.stations.length - 1 ? 1 : 0,
      );
    });
  });

  const insertSetting = db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
  );
  const settings: [string, string][] = [
    ["network_name", "V/LINE CONTROL"],
    ["public_banner", "Independent regional rail monitoring — not an official V/Line service"],
    ["disruption_auto_publish", "false"],
    ["discord_dispatch_enabled", "true"],
    ["inform_integration_enabled", "true"],
    ["inform_retention_days", "90"],
    ["notice_contact", "operations@vlinecontrol.au"],
  ];
  for (const [key, value] of settings) {
    insertSetting.run(key, value, now);
  }

  db.prepare(
    `INSERT INTO audit_log (id, actor_id, actor_email, action, entity, entity_id, detail, ip, created_at)
     VALUES (?, NULL, ?, 'system.seed', 'database', NULL, ?, 'local', ?)`,
  ).run(
    randomUUID(),
    "system@vlinecontrol.au",
    `Database initialised with ${SEED_LINES.length} corridors and ${stationIds.size} stations. No operational records were seeded.`,
    now,
  );
}
