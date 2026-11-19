# V/LINE CONTROL

**Connecting Victoria. Monitoring the Network.**

An independent railway monitoring and information platform for Victoria's regional rail
corridors, combining a public information site, a private operations console, disruption
management, Discord notification routing and a reviewed email-ingestion workflow.

> **This is an unofficial, independent project.** It is not affiliated with, endorsed by or
> operated by V/Line or the Department of Transport and Planning. It does not display live train
> positions or real-time running information. Disruptions and updates are entered by operators of
> the instance; every line and station links out to official V/Line and reference material.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19, TypeScript strict |
| Styling | Tailwind CSS v4 (`@theme` design tokens in `globals.css`) |
| Mutations | Server Actions — zod validated, session + role checked, audited |
| Data | SQLite through Node's built-in `node:sqlite` (`DatabaseSync`) |
| Auth | Email + password (scrypt), signed httpOnly JWT session (`jose`), edge middleware guard |
| Integrations | Discord webhooks (AES-256-GCM sealed at rest), inbound email HTTP endpoint |
| Icons | lucide-react |

No database server, no native modules and no external services are required to run it.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # set a real AUTH_SECRET
npm run dev                    # http://localhost:3001
```

The database is created and seeded automatically at `./data/vline.db` on first request. It seeds
**reference data only**: 12 corridors, 84 stations and one administrator account. There are no
pre-filled disruptions, updates, webhooks, notifications or inbound email — every operational
record comes from real use of the console.

Generate a session secret with:

```bash
openssl rand -base64 48
```

### Administrator account

| Account name | Email | Password |
| --- | --- | --- |
| `admin` | `admin@vlinecontrol.au` | `admincontrol` |

The sign-in field accepts either the account name (`admin`) or the full email address. Override
the initial password with `SEED_ADMIN_PASSWORD` before the first run. Create any additional users
(and change this password) in **Users & roles**.

Reset the local dataset at any time with `npm run db:reset` and restart the server.

---

## Architecture

```
src/
  middleware.ts                 Edge guard for /admin/* (JWT verification, redirect to login)
  app/
    (public)/                   Public site: overview, network map, lines, stations, service status
    admin/
      login/                    Sign-in (server action, rate limited)
      (console)/                Authenticated console sharing AdminShell
        page.tsx                Operations overview
        lines/ stations/ disruptions/ discord/ inform/ users/ audit/ settings/
      */actions.ts              Domain server actions (create/update/delete/test/approve…)
    api/inform/ingest/route.ts  Token-authenticated inbound email endpoint
    api/health/route.ts         Liveness + record counts
  components/
    ui.tsx Charts.tsx           Design-system primitives and SVG charts (no chart dependency)
    NetworkMap.tsx              Interactive corridor map (two projections + metro inset)
    admin/AdminShell.tsx        Collapsible sidebar, responsive drawer, session chip, clock
    forms/*                     Client forms bound to server actions via useActionState
    public/*                    Public navigation and disruption notices
  lib/
    db.ts schema.ts seed*.ts    Connection, schema, dataset
    repo/*                      Typed queries per domain (no SQL in components)
    session.ts auth.ts rbac.ts  Session cookie, guards, permission matrix
    discord.ts                  Embed builder, routing, dispatch, dedupe, test sends
    crypto.ts secret.ts         AES-GCM secret storage, edge-safe secret access
    inform-parser.ts            Heuristic email → structured update parser
    validation.ts               zod schemas + FormData helpers
supabase/migrations/0001_init.sql   Postgres mirror of the schema (hosted migration path)
```

**Permission matrix** (`src/lib/rbac.ts`)

| Permission | Super Admin | Administrator | Network Operator | Read Only |
| --- | :-: | :-: | :-: | :-: |
| View console | ✓ | ✓ | ✓ | ✓ |
| Manage lines / stations | ✓ | ✓ | | |
| Manage disruptions | ✓ | ✓ | ✓ | |
| Review Inform email | ✓ | ✓ | ✓ | |
| Manage integrations | ✓ | ✓ | | |
| Manage users | ✓ | | | |
| System settings | ✓ | | | |
| Audit log | ✓ | ✓ | | |

Permissions are enforced in three places: middleware (session presence), page guards (UI), and
every server action (authoritative check before touching the database).

---

## Security model

- **Passwords** — scrypt with a per-user 16-byte salt, constant-time comparison.
- **Sessions** — HS256 JWT in an `httpOnly`, `sameSite=lax`, `secure`-in-production cookie; 8-hour
  expiry; issuer/audience verified on every request.
- **CSRF** — mutations run through Next.js server actions, which reject cross-origin submissions.
- **Validation** — every mutation re-parses raw `FormData` with zod on the server; client-side
  attributes are only a convenience.
- **Rate limiting** — 8 failed sign-in attempts per email+IP per 10 minutes.
- **Secrets** — Discord webhook URLs are sealed with AES-256-GCM using a key derived from
  `AUTH_SECRET`. They are never selected into list queries, never serialised to the browser and
  never rendered; the UI shows only a redacted hint.
- **Auditing** — sign-ins, failures, creates, updates, publishes, resolves, deletes, webhook tests,
  reviews and settings changes are appended to `audit_log` with actor, IP and timestamp.
- **Privacy** — `robots: noindex` on the whole application.

### Required production configuration

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Session signing + webhook encryption key (32+ chars). **Required.** |
| `DATABASE_FILE` | SQLite file path (e.g. a mounted volume). |
| `INFORM_INGEST_ENABLED` | `true` to accept inbound email. |
| `INFORM_INGEST_TOKEN` | Bearer token checked by `/api/inform/ingest`. |

---

## Discord notifications

1. In Discord: **Channel → Edit Channel → Integrations → Webhooks → New Webhook → Copy URL**.
2. Console → **Discord notifications → Add destination**, paste the URL, enable it.
3. Add a **routing rule**: destination, line (or *All lines*), optional category filter, minimum
   severity, and whether resolutions are announced.
4. Send a **test** to verify the channel, then publish a disruption.

Delivery behaviour:

- Only **published** disruptions are dispatched.
- Routing requires an enabled webhook **and** a matching rule (line, category, severity).
- Embeds contain the corridor, title, description, severity, status, category, expected resolution,
  affected stations, replacement transport, last-updated timestamp and source.
- **Deduplication** uses a `UNIQUE` key over webhook + disruption + event + content hash. Repeating
  an identical dispatch inserts nothing and sends nothing.
- Every attempt is written to `notification_log` with HTTP status and error detail; failures are
  surfaced on the dashboard and in the delivery history.
- Failed sends retain Discord's HTTP status and error message for diagnosis.

No webhook URL, token or key is ever included in client JavaScript, page HTML or error messages.

---

## V/Line Inform email integration

`POST /api/inform/ingest` accepts an email payload from a provider you control and stores it as a
**pending review item**. It never publishes anything automatically.

```bash
curl -X POST "$APP_URL/api/inform/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INFORM_INGEST_TOKEN" \
  -d '{
    "from": "inform@example.com",
    "subject": "Geelong Line — signalling fault at North Geelong",
    "text": "Delays of up to 20 minutes between Lara and Geelong. Replacement coaches on standby."
  }'
```

The parser extracts a corridor (line-name matching), category and severity (keyword rules),
affected stations (station-name matching), a suggested title and description, plus a confidence
score. The response returns the parsed summary and `status: "pending_review"`.

In the console (**Inform email**), an operator can correct every field, adjust affected stations,
then **approve** (publishes a real disruption and optionally forwards it to Discord) or **reject**.
Both decisions are audited.

### Limitations (by design)

- No private V/Line API, mailbox or credential is used or assumed. You must forward email through
  your own provider to this endpoint.
- Parsing is heuristic — line names, keywords and station names. Every message requires human
  review before publication.
- Only plain-text bodies are parsed; HTML-only bodies and attachments are ignored.
- There is no automatic retention purge in this build; the retention setting is informational.
- The endpoint is disabled unless `INFORM_INGEST_ENABLED=true` and the system setting is enabled.

---

## Data model

`users` · `lines` · `stations` · `line_stations` (ordered corridor membership) · `disruptions` ·
`service_updates` · `webhooks` · `webhook_rules` · `notification_log` · `inform_messages` ·
`audit_log` · `settings`

Only reference data is seeded; all operational records are created through the console. The
`is_demonstration` columns remain in the schema for provenance reporting but no seeded records
exist, so nothing is pre-populated.

Station coordinates are approximate geographic positions of real stop locations, suitable for a
state-scale schematic map. They are **not** survey data and must not be used for navigation.

## Official resource links

Every corridor and station carries outbound links to real, stable destinations
(`src/lib/resources.ts`):

- **Lines** — V/Line train & coach timetables, V/Line planned service changes, the V/Line
  stations & stops finder, PTV disruptions, and a Wikipedia reference search.
- **Stations** — the V/Line stations & stops finder pre-filtered by the station's town, V/Line
  journey planning, a Wikipedia reference search, plus Google Maps and OpenStreetMap at the
  station's coordinates.

Links are rendered by `components/public/ResourceLinks.tsx` on the public line and station pages
and marked as external; the destination provider's content is not reproduced or verified here.

---

## Deployment

### Self-hosted Node (recommended for this data layer)

```bash
npm run build
AUTH_SECRET=... DATABASE_FILE=/var/lib/vline/vline.db npm run start
```

Run behind TLS. Back up the SQLite file (and its `-wal` shard) on a schedule.

### Vercel

The application builds for Vercel, but **serverless functions do not provide a durable filesystem**.
A SQLite file on Vercel is ephemeral and per-instance, so use it for evaluation only. For a durable
deployment, move the data layer to a hosted Postgres/Supabase database:

1. Create a Supabase project and apply `supabase/migrations/0001_init.sql` (Supabase CLI:
   `supabase db push`, or paste it into the SQL editor).
2. Seed `lines`, `stations`, `line_stations`, `settings` and your first `users` row. The seed
   functions in `src/lib/seed.ts` are the reference dataset.
3. Replace the query module bodies in `src/lib/repo/*` with `@supabase/supabase-js` calls using the
   **service-role key on the server only** (never `NEXT_PUBLIC_*`). Repository functions are already
   the only place SQL lives, so components and actions do not change.
4. Set `AUTH_SECRET`, the Supabase URL/keys and (optionally) the Inform variables in the Vercel
   project settings.

The Postgres schema already includes RLS enabled on every table and public read policies limited to
published content.

---

## Verification performed

- `npx tsc --noEmit` — clean.
- `npx next build` — all 23 routes compiled and type-checked.
- Dev server started, seed executed, `/` returned 200, `/api/health` returned record counts, and
  unauthenticated `/admin` redirected to `/admin/login`.
- Browser: sign-in with `admin`, create + delete of a disruption, and a sweep of all 11 console
  screens.
- `/api/inform/ingest`: 401 without a token, 202 with a token (parsed corridor, category and
  stations), stored as pending review.

Known gaps: no automated test suite; the Discord and email integrations require your own webhook
URL and inbound-email provider to exercise end to end.
