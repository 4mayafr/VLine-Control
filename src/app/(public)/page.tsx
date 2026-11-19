import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  Bus,
  ExternalLink,
  Inbox,
  MapPin,
  Radio,
  Route,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { EmptyState, Kpi, Panel, PanelHeader, Pill } from "@/components/ui";
import { DisruptionNotice } from "@/components/public/DisruptionNotice";
import { listLines, getMapLines } from "@/lib/repo/lines";
import { listDisruptions } from "@/lib/repo/disruptions";
import { listUpdates, networkStats } from "@/lib/repo/system";
import { lineStatusLabel } from "@/lib/labels";
import { statusClass } from "@/lib/labels";
import { relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const stats = networkStats();
  const lines = listLines();
  const active = listDisruptions({ publishedOnly: true, status: "active", limit: 4 });
  const monitoring = listDisruptions({ publishedOnly: true, status: "monitoring", limit: 2 });
  const updates = listUpdates({ publishedOnly: true, limit: 4 });
  const mapLines = getMapLines();
  const operational = lines.filter((line) => line.status === "operational").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="animate-fade-up">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="brand" dot>
              Independent railway monitor
            </Pill>
          </div>
          <h1 className="mt-4 text-3xl leading-[1.1] font-semibold tracking-tight text-white sm:text-[42px]">
            Connecting Victoria.
            <br />
            <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-sky-300 bg-clip-text text-transparent">
              Monitoring the Network.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-slate-400">
            V/LINE CONTROL is an independent operations platform for Victoria&apos;s regional rail
            corridors — bringing line status, disruptions, station information and notification
            delivery into one control-centre view.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Link href="/network" className="btn btn-primary">
              <Route size={15} /> Explore the network
            </Link>
            <Link href="/disruptions" className="btn btn-ghost">
              <TriangleAlert size={15} /> Current service status
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.07] pt-4 text-[10.5px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-brand-400" /> {lines.length} monitored corridors
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={12} className="text-brand-400" /> {stats.stationCount} stations recorded
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bell size={12} className="text-brand-400" /> Discord notification pipeline
            </span>
          </div>
        </div>

        <Panel className="animate-fade-up overflow-hidden">
          <PanelHeader
            title="Network snapshot"
            subtitle="Aggregate view across monitored corridors"
            icon={<Activity size={15} />}
            action={<Pill tone="slate">OPS</Pill>}
          />
          <div className="grid grid-cols-2 divide-x divide-white/[0.06] border-b border-white/[0.06]">
            <div className="p-4">
              <p className="micro">Lines operational</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-emerald-300">
                {operational}
                <span className="text-sm text-slate-500">/{lines.length}</span>
              </p>
            </div>
            <div className="p-4">
              <p className="micro">Active disruptions</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-rose-300">
                {stats.activeDisruptions}
              </p>
            </div>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {lines.slice(0, 4).map((line) => (
              <li key={line.id}>
                <Link
                  href={`/lines/${line.slug}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 transition hover:bg-white/[0.03]"
                >
                  <span className="h-4 w-1 rounded-full" style={{ backgroundColor: line.colour }} />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-slate-300">
                    {line.name}
                  </span>
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${statusClass(line.status)}`}
                  >
                    {lineStatusLabel(line.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/[0.06] px-4 py-2.5">
            <Link
              href="/network"
              className="flex items-center justify-between text-[11px] font-semibold text-brand-300 hover:text-brand-200"
            >
              All {lines.length} corridors <ArrowRight size={12} />
            </Link>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Monitored lines"
          value={stats.lineCount}
          hint={`${operational} fully operational`}
          icon={<Route size={14} />}
        />
        <Kpi
          label="Active disruptions"
          value={stats.activeDisruptions}
          hint={`${stats.resolvedDisruptions} resolved recently`}
          accent="danger"
          icon={<TriangleAlert size={14} />}
        />
        <Kpi
          label="Delays / cancellations"
          value={`${stats.delays} / ${stats.cancellations}`}
          hint="Open notices by category"
          accent="warn"
          icon={<Radio size={14} />}
        />
        <Kpi
          label="Notification deliveries"
          value={stats.deliveryTotal}
          hint={`${stats.deliverySuccess} delivered successfully`}
          accent="info"
          icon={<Bell size={14} />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Current disruptions"
            subtitle="Published notices affecting monitored corridors"
            icon={<TriangleAlert size={15} />}
            action={
              <Link href="/disruptions" className="btn btn-ghost btn-sm">
                View all
              </Link>
            }
          />
          {active.length === 0 && monitoring.length === 0 ? (
            <EmptyState
              title="No published disruptions"
              description="There are currently no published disruption notices. Notices appear here as soon as an operator publishes one."
              icon={<Inbox size={18} />}
            />
          ) : (
            <div>
              {[...active, ...monitoring].map((disruption) => (
                <DisruptionNotice key={disruption.id} disruption={disruption} compact />
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <PanelHeader title="Recent network updates" icon={<Bell size={15} />} />
            {updates.length === 0 ? (
              <EmptyState title="No updates yet" description="Published network updates will appear here." />
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {updates.map((update) => (
                  <li key={update.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {update.line_name ? (
                        <span
                          className="h-2.5 w-1 rounded-full"
                          style={{ backgroundColor: update.line_colour ?? "#8f5ae8" }}
                        />
                      ) : null}
                      <p className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-slate-200">
                        {update.title}
                      </p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-slate-500">
                      {update.body}
                    </p>
                    <p className="mt-1 text-[9.5px] text-slate-600">
                      {update.line_name ?? "Network-wide"} · {relativeTime(update.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel className="p-4">
            <p className="micro">Official channels</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">
              This platform is independent and unverified. For travel decisions, always use
              official V/Line information.
            </p>
            <div className="mt-3 space-y-1.5">
              <a
                href="https://www.vline.com.au"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center justify-between rounded-lg border border-white/10 bg-navy-950/40 px-3 py-2 text-[11.5px] text-slate-300 hover:border-brand-400/30 hover:text-white"
              >
                V/Line website <ExternalLink size={12} />
              </a>
              <a
                href="https://www.ptv.vic.gov.au/disruptions/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center justify-between rounded-lg border border-white/10 bg-navy-950/40 px-3 py-2 text-[11.5px] text-slate-300 hover:border-brand-400/30 hover:text-white"
              >
                PTV disruptions <ExternalLink size={12} />
              </a>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="micro">Network</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Monitored corridors</h2>
          </div>
          <Link href="/network" className="flex items-center gap-1 text-[11.5px] font-semibold text-brand-300">
            Open interactive map <ArrowRight size={12} />
          </Link>
        </div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {lines.map((line) => {
            const mapLine = mapLines.find((item) => item.id === line.id);
            return (
              <Link
                key={line.id}
                href={`/lines/${line.slug}`}
                className="panel group flex items-start gap-3 p-3.5 transition hover:border-brand-400/30"
              >
                <span
                  className="mt-0.5 h-8 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: line.colour }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12.5px] font-semibold text-slate-100 group-hover:text-white">
                      {line.name}
                    </p>
                    <span
                      className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8.5px] font-semibold ${statusClass(line.status)}`}
                    >
                      {lineStatusLabel(line.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[10.5px] text-slate-500">
                    {line.origin} → {line.destination}
                  </p>
                  <p className="mt-1 text-[9.5px] text-slate-600">
                    {mapLine?.stations.length ?? 0} stops · {line.region}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {[
          {
            icon: <Radio size={15} />,
            title: "Monitoring",
            body: "Corridor status, disruptions and station records are tracked in one operational dataset with a full audit trail.",
          },
          {
            icon: <Bell size={15} />,
            title: "Notification",
            body: "Per-line Discord routing rules deliver rich embeds for published disruptions, with deduplication and delivery history.",
          },
          {
            icon: <Bus size={15} />,
            title: "Review",
            body: "Inbound Inform-style emails are parsed into draft updates, reviewed by an operator, then published.",
          },
        ].map((feature) => (
          <div key={feature.title} className="panel p-4">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-500/12 text-brand-300 ring-1 ring-inset ring-brand-400/20">
              {feature.icon}
            </span>
            <p className="mt-2.5 text-[12.5px] font-semibold text-slate-100">{feature.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{feature.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
        <p className="flex items-center gap-2 text-[11.5px] font-semibold text-amber-200">
          <ShieldCheck size={13} /> Independence & data notice
        </p>
        <p className="mt-1.5 max-w-4xl text-[11px] leading-relaxed text-amber-100/70">
          V/LINE CONTROL is not an official V/Line product and is not connected to V/Line systems.
          It does not display live train positions. Disruption notices are entered and maintained
          by this instance&apos;s operators — always confirm travel details through official V/Line
          channels before travelling.
        </p>
      </div>
    </div>
  );
}
