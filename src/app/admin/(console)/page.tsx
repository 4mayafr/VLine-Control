import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  Bus,
  Plus,
  Radio,
  Route,
  ScrollText,
  TriangleAlert,
} from "lucide-react";
import {
  EmptyState,
  Kpi,
  MiniBar,
  Panel,
  PanelHeader,
  Pill,
  SectionHeading,
  SeverityChip,
  StatusChip,
} from "@/components/ui";
import { DeliveryMeter, Donut, StatusBars, TrendBars } from "@/components/Charts";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listDisruptions, disruptionCounts } from "@/lib/repo/disruptions";
import {
  disruptionTrend,
  lineHealth,
  listAudit,
  networkStats,
} from "@/lib/repo/system";
import { deliveryStats, listNotificationLog } from "@/lib/repo/webhooks";
import { categoryLabel, lineStatusLabel } from "@/lib/labels";
import { formatDateTime, percent, relativeTime, sinceMinutes } from "@/lib/format";

export const dynamic = "force-dynamic";

const CATEGORY_COLOURS: Record<string, string> = {
  delays: "#38bdf8",
  cancellations: "#fb7185",
  signal_fault: "#a878f7",
  track_fault: "#fb923c",
  infrastructure: "#fbbf24",
  planned_works: "#c084fc",
  replacement_buses: "#34d399",
  other: "#94a3b8",
};

export default async function AdminDashboardPage() {
  const user = await requireUser();
  const stats = networkStats();
  const trend = disruptionTrend(14);
  const counts = disruptionCounts();
  const health = lineHealth();
  const recent = listDisruptions({ limit: 6 });
  const audit = listAudit(7);
  const deliveries = listNotificationLog(5);
  const delivery = deliveryStats();

  const severityRows = ["critical", "high", "medium", "low"].map((severity) => ({
    label: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: counts.bySeverity.find((row) => row.severity === severity)?.count ?? 0,
    colour:
      severity === "critical"
        ? "#fb7185"
        : severity === "high"
          ? "#fb923c"
          : severity === "medium"
            ? "#fbbf24"
            : "#38bdf8",
  }));

  const categorySegments = counts.byCategory.slice(0, 5).map((row) => ({
    label: categoryLabel(row.category),
    value: row.count,
    colour: CATEGORY_COLOURS[row.category] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Operations overview"
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}`}
        description="Network status, disruption load and notification delivery across all monitored regional corridors."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {can(user.role, "disruption.manage") ? (
              <Link href="/admin/disruptions/new" className="btn btn-primary">
                <Plus size={14} /> New disruption
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi
          label="Monitored lines"
          value={stats.lineCount}
          hint={`${health.filter((line) => line.status === "operational").length} operational`}
          icon={<Route size={14} />}
        />
        <Kpi
          label="Active disruptions"
          value={stats.activeDisruptions}
          hint={`${counts.monitoring} monitoring`}
          accent="danger"
          icon={<TriangleAlert size={14} />}
        />
        <Kpi
          label="Delays / cancellations"
          value={`${stats.delays} / ${stats.cancellations}`}
          hint="Open notices"
          accent="warn"
          icon={<Radio size={14} />}
        />
        <Kpi
          label="Replacement buses"
          value={stats.replacementBus}
          hint="Active bus substitutions"
          accent="info"
          icon={<Bus size={14} />}
        />
        <Kpi
          label="Notification delivery"
          value={`${percent(delivery.delivered, delivery.total)}%`}
          hint={`${delivery.delivered}/${delivery.total} delivered`}
          accent={delivery.failed > 0 ? "warn" : "ok"}
          icon={<Bell size={14} />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Disruption reports — last 14 days"
            subtitle="Notices by start date, all statuses"
            icon={<Activity size={15} />}
            action={<Pill tone="slate">{trend.reduce((sum, day) => sum + day.count, 0)} total</Pill>}
          />
          <div className="p-4">
            <TrendBars data={trend} />
            <div className="mt-4 grid gap-3 border-t border-white/[0.06] pt-3 sm:grid-cols-2">
              <div>
                <p className="micro mb-2">Open notices by severity</p>
                <StatusBars rows={severityRows} />
              </div>
              <div>
                <p className="micro mb-2">Queue health</p>
                <div className="space-y-2">
                  <QueueRow label="Pending Inform review" value={stats.pendingInform} href="/admin/inform" />
                  <QueueRow label="Published updates" value={stats.publishedUpdates} href="/admin/settings" />
                  <QueueRow
                    label="Resolved notices"
                    value={stats.resolvedDisruptions}
                    href="/admin/disruptions?status=resolved"
                  />
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Open disruptions by category"
            subtitle="Excludes resolved notices"
            icon={<TriangleAlert size={15} />}
          />
          <div className="p-4">
            {categorySegments.length === 0 ? (
              <EmptyState
                title="No open disruptions"
                description="Nothing is currently active or under monitoring."
              />
            ) : (
              <Donut
                segments={categorySegments}
                centreLabel="open notices"
                centreValue={String(counts.active + counts.monitoring)}
              />
            )}
            <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
              <p className="micro">Notification delivery status</p>
              <DeliveryMeter
                delivered={delivery.delivered}
                failed={delivery.failed}
                total={delivery.total}
              />
              <Link
                href="/admin/discord"
                className="flex items-center justify-between text-[10.5px] font-semibold text-brand-300 hover:text-brand-200"
              >
                Open notification settings <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Corridor status"
            subtitle="Live editorial status per line"
            icon={<Route size={15} />}
            action={
              <Link href="/admin/lines" className="text-[10.5px] font-semibold text-brand-300">
                Manage
              </Link>
            }
          />
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Corridor</th>
                  <th>Status</th>
                  <th className="text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {health.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3.5 w-1 rounded-full"
                          style={{ backgroundColor: line.colour }}
                        />
                        <span className="text-[12px] text-slate-200">{line.name}</span>
                      </span>
                    </td>
                    <td>
                      <StatusChip value={line.status} label={lineStatusLabel(line.status)} />
                    </td>
                    <td className="text-right font-mono text-[11.5px]">
                      <span className={line.open > 0 ? "text-rose-300" : "text-slate-500"}>
                        {line.open}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Recent disruption activity"
            subtitle="Latest created or updated notices"
            icon={<TriangleAlert size={15} />}
            action={
              <Link href="/admin/disruptions" className="text-[10.5px] font-semibold text-brand-300">
                All disruptions
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState title="No disruptions recorded" description="Created notices appear here." />
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {recent.map((disruption) => (
                <li key={disruption.id} className="px-4 py-2.5">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-3.5 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: disruption.line_colour ?? "#8f5ae8" }}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/disruptions/${disruption.id}`}
                        className="block truncate text-[12px] font-medium text-slate-200 hover:text-white"
                      >
                        {disruption.title}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                        {disruption.line_name ?? "Network-wide"} · {categoryLabel(disruption.category)} ·{" "}
                        {sinceMinutes(disruption.updated_at)}
                        {disruption.is_published === 0 ? (
                          <span className="rounded bg-slate-500/15 px-1 py-0.5 text-[8.5px] font-semibold text-slate-400 uppercase">
                            draft
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <SeverityChip value={disruption.severity} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Latest system activity"
            subtitle="Audited operator actions"
            icon={<ScrollText size={15} />}
            action={
              <Link href="/admin/audit" className="text-[10.5px] font-semibold text-brand-300">
                Audit log
              </Link>
            }
          />
          <ul className="divide-y divide-white/[0.05]">
            {audit.map((entry) => (
              <li key={entry.id} className="flex items-start gap-2.5 px-4 py-2.5">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-400/70" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] text-slate-300">
                    <span className="font-mono text-[10px] text-brand-300">{entry.action}</span>{" "}
                    <span className="text-slate-500">·</span> {entry.detail || entry.entity}
                  </p>
                  <p className="text-[9.5px] text-slate-500">
                    {entry.actor_email} · {formatDateTime(entry.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Notification delivery status"
            subtitle="Most recent Discord delivery attempts"
            icon={<Bell size={15} />}
            action={
              <Link href="/admin/discord" className="text-[10.5px] font-semibold text-brand-300">
                Manage
              </Link>
            }
          />
          {deliveries.length === 0 ? (
            <EmptyState
              title="No delivery attempts"
              description="Configure a Discord webhook and routing rule to begin delivering notifications."
            />
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {deliveries.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                  <StatusChip value={entry.status === "queued" ? "blocked" : entry.status} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] text-slate-300">{entry.title}</p>
                    <p className="truncate text-[9.5px] text-slate-500">
                      {entry.webhook_name} · {relativeTime(entry.created_at)}
                      {entry.error ? ` · ${entry.error}` : ""}
                    </p>
                  </div>
                  <span className="font-mono text-[9.5px] text-slate-600">
                    {entry.http_status ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-white/[0.06] px-4 py-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Deduplication active</span>
              <span className="font-mono">
                {delivery.total - delivery.delivered - delivery.failed} queued
              </span>
            </div>
            <MiniBar
              value={delivery.delivered}
              max={Math.max(delivery.total, 1)}
              colour="#34d399"
            />
          </div>
        </Panel>
      </div>

      <p className="text-center text-[10px] text-slate-600">
        Snapshot generated {formatDateTime(new Date().toISOString())} · All operational records
        require operator review
      </p>
    </div>
  );
}

function QueueRow({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md border border-white/[0.07] bg-navy-950/40 px-2.5 py-1.5 text-[11px] text-slate-400 hover:border-brand-400/30 hover:text-slate-200"
    >
      {label}
      <span className="font-mono text-[11px] text-slate-200">{value}</span>
    </Link>
  );
}
