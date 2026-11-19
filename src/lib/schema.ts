/**
 * Database schema (SQLite dialect).
 *
 * The same structure is provided in Postgres form at
 * supabase/migrations/0001_init.sql for a hosted Supabase/Postgres target.
 */
export const SCHEMA_VERSION = 1;

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'read_only',
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS lines (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  code            TEXT NOT NULL,
  colour          TEXT NOT NULL,
  region          TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  origin          TEXT NOT NULL DEFAULT '',
  destination     TEXT NOT NULL DEFAULT '',
  service_pattern TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'operational',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stations (
  id                   TEXT PRIMARY KEY,
  slug                 TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  suburb               TEXT NOT NULL DEFAULT '',
  latitude             REAL NOT NULL,
  longitude            REAL NOT NULL,
  platforms            TEXT,
  facilities           TEXT,
  connecting_transport TEXT,
  is_active            INTEGER NOT NULL DEFAULT 1,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS line_stations (
  line_id     TEXT NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
  station_id  TEXT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  is_terminus INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (line_id, station_id)
);

CREATE TABLE IF NOT EXISTS disruptions (
  id                     TEXT PRIMARY KEY,
  line_id                TEXT REFERENCES lines(id) ON DELETE SET NULL,
  title                  TEXT NOT NULL,
  category               TEXT NOT NULL,
  severity               TEXT NOT NULL,
  description            TEXT NOT NULL,
  affected_stations      TEXT NOT NULL DEFAULT '[]',
  status                 TEXT NOT NULL DEFAULT 'active',
  starts_at              TEXT NOT NULL,
  expected_resolution_at TEXT,
  resolved_at            TEXT,
  replacement_transport  TEXT,
  source                 TEXT NOT NULL DEFAULT 'V/LINE CONTROL operations',
  is_published           INTEGER NOT NULL DEFAULT 0,
  is_demonstration       INTEGER NOT NULL DEFAULT 1,
  created_by             TEXT,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS service_updates (
  id               TEXT PRIMARY KEY,
  line_id          TEXT REFERENCES lines(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  kind             TEXT NOT NULL DEFAULT 'notice',
  is_published     INTEGER NOT NULL DEFAULT 1,
  is_demonstration INTEGER NOT NULL DEFAULT 1,
  created_by       TEXT,
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhooks (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  url_encrypted  TEXT NOT NULL,
  channel_hint   TEXT NOT NULL DEFAULT '',
  is_enabled     INTEGER NOT NULL DEFAULT 1,
  last_status    TEXT,
  last_tested_at TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_rules (
  id                TEXT PRIMARY KEY,
  webhook_id        TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  line_id           TEXT REFERENCES lines(id) ON DELETE CASCADE,
  categories        TEXT NOT NULL DEFAULT '[]',
  min_severity      TEXT NOT NULL DEFAULT 'medium',
  notify_on_resolve INTEGER NOT NULL DEFAULT 1,
  is_enabled        INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_log (
  id               TEXT PRIMARY KEY,
  webhook_id       TEXT,
  webhook_name     TEXT NOT NULL,
  disruption_id    TEXT,
  dedupe_key       TEXT NOT NULL UNIQUE,
  status           TEXT NOT NULL,
  http_status      INTEGER,
  error            TEXT,
  title            TEXT NOT NULL DEFAULT '',
  event            TEXT NOT NULL DEFAULT 'disruption',
  is_test          INTEGER NOT NULL DEFAULT 0,
  is_demonstration INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inform_messages (
  id                        TEXT PRIMARY KEY,
  received_at               TEXT NOT NULL,
  from_address              TEXT NOT NULL,
  subject                   TEXT NOT NULL,
  body                      TEXT NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'pending',
  parsed_line_id            TEXT,
  parsed_category           TEXT,
  parsed_severity           TEXT,
  parsed_title              TEXT,
  parsed_description        TEXT,
  parsed_stations           TEXT NOT NULL DEFAULT '[]',
  parsed_effective_at       TEXT,
  parse_confidence          REAL NOT NULL DEFAULT 0,
  reviewed_by               TEXT,
  reviewed_at               TEXT,
  published_disruption_id   TEXT,
  discord_forwarded         INTEGER NOT NULL DEFAULT 0,
  is_demonstration          INTEGER NOT NULL DEFAULT 1,
  created_at                TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT,
  actor_email TEXT NOT NULL,
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   TEXT,
  detail      TEXT NOT NULL DEFAULT '',
  ip          TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_line_stations_line ON line_stations(line_id, position);
CREATE INDEX IF NOT EXISTS idx_line_stations_station ON line_stations(station_id);
CREATE INDEX IF NOT EXISTS idx_disruptions_status ON disruptions(status, is_published);
CREATE INDEX IF NOT EXISTS idx_disruptions_line ON disruptions(line_id);
CREATE INDEX IF NOT EXISTS idx_updates_created ON service_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_created ON notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inform_status ON inform_messages(status, received_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stations_name ON stations(name COLLATE NOCASE);
`;
