import { Bell, Database, Megaphone, Settings, Trash2 } from "lucide-react";
import {
  EmptyState,
  Notice,
  Panel,
  PanelHeader,
  Pill,
  SectionHeading,
  StatusChip,
} from "@/components/ui";
import { SettingsForm, UpdateForm } from "@/components/forms/SystemForms";
import { ConfirmForm } from "@/components/forms/AdminConfirm";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getSettings, listUpdates, networkStats } from "@/lib/repo/system";
import { listAllLines } from "@/lib/repo/lines";
import { formatDateTime } from "@/lib/format";
import { updateKindLabel } from "@/lib/labels";
import { createUpdateAction, deleteUpdateAction, saveSettingsAction } from "@/app/admin/settings/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireUser();
  if (!can(user.role, "system.manage")) {
    return <AccessDenied role={user.role} permission="system.manage" />;
  }

  const { notice } = await searchParams;
  const settings = getSettings();
  const lines = listAllLines();
  const updates = listUpdates({ limit: 20 });
  const stats = networkStats();

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="System"
        title="System settings"
        description="Platform identity, integration switches and public network updates."
        action={<Pill tone="brand">Operator maintained</Pill>}
      />

      {notice ? <Notice tone="ok">{notice}</Notice> : null}

      <Panel className="overflow-hidden">
        <PanelHeader title="Platform configuration" icon={<Settings size={15} />} />
        <div className="p-4 sm:p-5">
          <SettingsForm action={saveSettingsAction} settings={settings} />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Network updates"
            subtitle="Short notices shown on the public site"
            icon={<Megaphone size={15} />}
            action={<Pill tone="slate">{updates.length}</Pill>}
          />
          {updates.length === 0 ? (
            <EmptyState title="No updates published" description="Post an update to inform visitors about network changes." />
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {updates.map((update) => (
                <li key={update.id} className="flex items-start gap-2.5 px-4 py-2.5">
                  <span
                    className="mt-1 h-4 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: update.line_colour ?? "#8f5ae8" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-[11.5px] font-semibold text-slate-200">{update.title}</p>
                      {update.is_published === 0 ? (
                        <span className="rounded bg-slate-500/15 px-1 py-0.5 text-[8px] text-slate-400 uppercase">
                          draft
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                      {update.body}
                    </p>
                    <p className="mt-0.5 text-[9.5px] text-slate-600">
                      {update.line_name ?? "Network-wide"} · {updateKindLabel(update.kind)} ·{" "}
                      {formatDateTime(update.created_at)}
                    </p>
                  </div>
                  <ConfirmForm
                    action={deleteUpdateAction}
                    fields={{ id: update.id }}
                    label="Delete"
                    variant="danger"
                    confirmText="Delete this network update?"
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <PanelHeader title="Post an update" icon={<Bell size={15} />} />
            <div className="p-4">
              <UpdateForm action={createUpdateAction} lines={lines} />
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader title="Environment" subtitle="Read-only runtime state" icon={<Database size={15} />} />
            <dl className="divide-y divide-white/[0.05] text-[11px]">
              <Row label="Runtime" value={process.env.NODE_ENV ?? "development"} />
              <Row
                label="AUTH_SECRET"
                value={process.env.AUTH_SECRET ? "configured" : "development fallback in use"}
                alert={!process.env.AUTH_SECRET}
              />
              <Row
                label="INFORM_INGEST_TOKEN"
                value={process.env.INFORM_INGEST_TOKEN ? "configured" : "not configured"}
                alert={!process.env.INFORM_INGEST_TOKEN}
              />
              <Row label="Database" value={process.env.DATABASE_FILE ?? "./data/vline.db"} mono />
              <Row label="Records" value={`${stats.stationCount} stations · ${stats.lineCount} lines`} />
              <Row
                label="Discord delivery"
                value={settings.discord_dispatch_enabled === "false" ? "paused" : "enabled"}
              />
            </dl>
          </Panel>

          <Panel className="p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-300">
              <Trash2 size={12} /> Data retention
            </p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-slate-400">
              Inform messages are retained for {settings.inform_retention_days ?? "90"} days. This
              build does not run an automatic purge job; trim records through the Inform review
              screen or your database tooling.
            </p>
          </Panel>
        </div>
      </div>

      <Panel className="p-4">
        <p className="micro mb-1.5">About this build</p>
        <p className="max-w-3xl text-[10.5px] leading-relaxed text-slate-400">
          V/LINE CONTROL is an independent monitoring project and is not affiliated with V/Line.
          Operational records are entered by this instance&apos;s operators and must not be treated
          as official service information. Mutations are validated server-side, authorised against
          the caller&apos;s role and recorded in the audit log.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <StatusChip value="approved" label="Server-side validation" />
          <StatusChip value="approved" label="RBAC enforced" />
          <StatusChip value="approved" label="Secrets server-only" />
        </div>
      </Panel>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  alert,
}: {
  label: string;
  value: string;
  mono?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`max-w-[60%] truncate text-right ${mono ? "font-mono text-[10px]" : ""} ${
          alert ? "text-amber-300" : "text-slate-300"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
