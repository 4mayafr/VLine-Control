-- ---------------------------------------------------------------------------
-- V/LINE CONTROL — PostgreSQL / Supabase schema
--
-- This mirrors the SQLite schema used by the bundled local data layer
-- (src/lib/schema.ts) so the application can be moved onto a hosted
-- Supabase/Postgres instance without changing the domain model.
--
-- Apply with: supabase db push    (or psql -f this file)
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- Enumerated values are kept as text with check constraints so that adding a
-- category or severity does not require a migration of a Postgres enum type.

create table if not exists users (
  id            text primary key default gen_random_uuid()::text,
  email         text not null unique,
  name          text not null,
  password_hash text not null,
  role          text not null default 'read_only'
                  check (role in ('super_admin','administrator','network_operator','read_only')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists lines (
  id              text primary key default gen_random_uuid()::text,
  slug            text not null unique,
  name            text not null,
  code            text not null,
  colour          text not null,
  region          text not null default '',
  description     text not null default '',
  origin          text not null default '',
  destination     text not null default '',
  service_pattern text not null default '',
  status          text not null default 'operational'
                    check (status in ('operational','minor_delay','major_delay','suspended','planned_closure')),
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists stations (
  id                   text primary key default gen_random_uuid()::text,
  slug                 text not null unique,
  name                 text not null,
  suburb               text not null default '',
  latitude             double precision not null check (latitude between -39.5 and -33.5),
  longitude            double precision not null check (longitude between 140.5 and 150.5),
  platforms            text,
  facilities           text,
  connecting_transport text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create unique index if not exists stations_name_unique on stations (lower(name));

create table if not exists line_stations (
  line_id     text not null references lines(id) on delete cascade,
  station_id  text not null references stations(id) on delete cascade,
  position    integer not null,
  is_terminus boolean not null default false,
  primary key (line_id, station_id)
);

create table if not exists disruptions (
  id                     text primary key default gen_random_uuid()::text,
  line_id                text references lines(id) on delete set null,
  title                  text not null,
  category               text not null check (category in ('delays','cancellations','signal_fault','track_fault','infrastructure','planned_works','replacement_buses','other')),
  severity               text not null check (severity in ('low','medium','high','critical')),
  description            text not null,
  affected_stations      jsonb not null default '[]'::jsonb,
  status                 text not null default 'active' check (status in ('active','monitoring','resolved')),
  starts_at              timestamptz not null,
  expected_resolution_at timestamptz,
  resolved_at            timestamptz,
  replacement_transport  text,
  source                 text not null default 'V/LINE CONTROL operations',
  is_published           boolean not null default false,
  is_demonstration       boolean not null default true,
  created_by             text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table if not exists service_updates (
  id               text primary key default gen_random_uuid()::text,
  line_id          text references lines(id) on delete set null,
  title            text not null,
  body             text not null,
  kind             text not null default 'notice' check (kind in ('notice','service','maintenance','community')),
  is_published     boolean not null default true,
  is_demonstration boolean not null default true,
  created_by       text,
  created_at       timestamptz not null default now()
);

create table if not exists webhooks (
  id             text primary key default gen_random_uuid()::text,
  name           text not null,
  url_encrypted  text not null,          -- AES-256-GCM sealed; never exposed to clients
  channel_hint   text not null default '',
  is_enabled     boolean not null default true,
  last_status    text,
  last_tested_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists webhook_rules (
  id                text primary key default gen_random_uuid()::text,
  webhook_id        text not null references webhooks(id) on delete cascade,
  line_id           text references lines(id) on delete cascade,
  categories        jsonb not null default '[]'::jsonb,
  min_severity      text not null default 'medium' check (min_severity in ('low','medium','high','critical')),
  notify_on_resolve boolean not null default true,
  is_enabled        boolean not null default true,
  created_at        timestamptz not null default now()
);

create table if not exists notification_log (
  id               text primary key default gen_random_uuid()::text,
  webhook_id       text,
  webhook_name     text not null,
  disruption_id    text,
  dedupe_key       text not null unique,
  status           text not null,
  http_status      integer,
  error            text,
  title            text not null default '',
  event            text not null default 'disruption',
  is_test          boolean not null default false,
  is_demonstration boolean not null default false,
  created_at       timestamptz not null default now()
);

create table if not exists inform_messages (
  id                      text primary key default gen_random_uuid()::text,
  received_at             timestamptz not null default now(),
  from_address            text not null,
  subject                 text not null,
  body                    text not null,
  status                  text not null default 'pending' check (status in ('pending','approved','rejected')),
  parsed_line_id          text,
  parsed_category         text,
  parsed_severity         text,
  parsed_title            text,
  parsed_description      text,
  parsed_stations         jsonb not null default '[]'::jsonb,
  parsed_effective_at     text,
  parse_confidence        double precision not null default 0,
  reviewed_by             text,
  reviewed_at             timestamptz,
  published_disruption_id text,
  discord_forwarded       boolean not null default false,
  is_demonstration        boolean not null default true,
  created_at              timestamptz not null default now()
);

create table if not exists audit_log (
  id          text primary key default gen_random_uuid()::text,
  actor_id    text,
  actor_email text not null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  detail      text not null default '',
  ip          text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_line_stations_line on line_stations (line_id, position);
create index if not exists idx_line_stations_station on line_stations (station_id);
create index if not exists idx_disruptions_status on disruptions (status, is_published);
create index if not exists idx_disruptions_line on disruptions (line_id);
create index if not exists idx_updates_created on service_updates (created_at desc);
create index if not exists idx_notification_created on notification_log (created_at desc);
create index if not exists idx_audit_created on audit_log (created_at desc);
create index if not exists idx_inform_status on inform_messages (status, received_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
--
-- The application performs all reads and writes from the server using a
-- privileged connection, and enforces authorisation in the application layer
-- (session cookie + role permissions). If you expose these tables through the
-- Supabase anon key, enable RLS and add explicit policies first — the default
-- below denies all anonymous access.
-- ---------------------------------------------------------------------------

alter table users            enable row level security;
alter table lines            enable row level security;
alter table stations         enable row level security;
alter table line_stations    enable row level security;
alter table disruptions      enable row level security;
alter table service_updates  enable row level security;
alter table webhooks         enable row level security;
alter table webhook_rules    enable row level security;
alter table notification_log enable row level security;
alter table inform_messages  enable row level security;
alter table audit_log        enable row level security;
alter table settings         enable row level security;

-- Public read access is limited to published, non-secret content.
create policy "public can read active lines" on lines
  for select using (is_active = true);
create policy "public can read active stations" on stations
  for select using (is_active = true);
create policy "public can read line stations" on line_stations
  for select using (true);
create policy "public can read published disruptions" on disruptions
  for select using (is_published = true);
create policy "public can read published updates" on service_updates
  for select using (is_published = true);
