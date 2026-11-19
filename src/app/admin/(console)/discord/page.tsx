import Link from "next/link";
import {
  Bell,
  ChevronDown,
  KeyRound,
  Plus,
  Send,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import {
  EmptyState,
  Notice,
  Panel,
  PanelHeader,
  Pill,
  SectionHeading,
  StatusChip,
} from "@/components/ui";
import { ConfirmForm } from "@/components/forms/AdminConfirm";
import { RuleForm, WebhookForm } from "@/components/forms/DiscordForms";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listNotificationLog, listRules, listWebhooks } from "@/lib/repo/webhooks";
import { listAllLines } from "@/lib/repo/lines";
import { getSetting } from "@/lib/repo/system";
import { categoryLabel, severityLabel } from "@/lib/labels";
import { formatDateTime, percent, relativeTime } from "@/lib/format";
import {
  deleteRuleAction,
  deleteWebhookAction,
  saveRuleAction,
  saveWebhookAction,
  testWebhookAction,
  toggleWebhookAction,
} from "@/app/admin/discord/actions";

export const dynamic = "force-dynamic";

export default async function DiscordPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; tone?: string }>;
}) {
  const user = await requireUser();
  if (!can(user.role, "integration.manage")) {
    return <AccessDenied role={user.role} permission="integration.manage" />;
  }

  const { notice, tone } = await searchParams;
  const webhooks = listWebhooks();
  const rules = listRules();
  const logs = listNotificationLog(40);
  const lines = listAllLines();
  const dispatchEnabled = getSetting("discord_dispatch_enabled", "true") === "true";
  const delivered = logs.filter((log) => log.status === "delivered").length;
  const failed = logs.filter((log) => log.status === "failed").length;

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Integrations"
        title="Discord notifications"
        description="Route published disruptions into Discord channels with per-line rules, severity thresholds and deduplicated delivery."
        action={
          <a href="#new-webhook" className="btn btn-primary">
            <Plus size={14} /> Add destination
          </a>
        }
      />

      {notice ? <Notice tone={tone === "error" ? "error" : "ok"}>{notice}</Notice> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Panel className="p-3.5">
          <p className="micro">Global delivery</p>
          <div className="mt-1.5 flex items-center gap-2">
            <StatusChip
              value={dispatchEnabled ? "approved" : "rejected"}
              label={dispatchEnabled ? "Enabled" : "Paused"}
            />
            <Link href="/admin/settings" className="text-[10px] text-brand-300">
              Change
            </Link>
          </div>
        </Panel>
        <Panel className="p-3.5">
          <p className="micro">Destinations</p>
          <p className="mt-1 font-mono text-xl font-semibold text-white">
            {webhooks.filter((webhook) => webhook.is_enabled === 1).length}
            <span className="text-sm text-slate-500">/{webhooks.length}</span>
          </p>
          <p className="text-[10px] text-slate-500">enabled webhooks</p>
        </Panel>
        <Panel className="p-3.5">
          <p className="micro">Routing rules</p>
          <p className="mt-1 font-mono text-xl font-semibold text-white">{rules.length}</p>
          <p className="text-[10px] text-slate-500">line and severity conditions</p>
        </Panel>
        <Panel className="p-3.5">
          <p className="micro">Recent delivery</p>
          <p className="mt-1 font-mono text-xl font-semibold text-white">
            {percent(delivered, delivered + failed)}%
          </p>
          <p className="text-[10px] text-slate-500">
            {delivered} delivered · {failed} failed
          </p>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Webhook destinations"
          subtitle="Stored URLs are encrypted at rest and never returned to the browser"
          icon={<Webhook size={15} />}
        />
        {webhooks.length === 0 ? (
          <EmptyState
            title="No destinations configured"
            description="Add a Discord webhook URL to begin delivering disruption notifications."
            icon={<Webhook size={18} />}
            action={
              <a href="#new-webhook" className="btn btn-primary btn-sm">
                Add destination
              </a>
            }
          />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {webhooks.map((webhook) => {
              const webhookRules = rules.filter((rule) => rule.webhook_id === webhook.id);
              return (
                <div key={webhook.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[12.5px] font-semibold text-slate-100">{webhook.name}</p>
                        <StatusChip
                          value={webhook.is_enabled === 1 ? "approved" : "rejected"}
                          label={webhook.is_enabled === 1 ? "Enabled" : "Disabled"}
                        />
                        {webhook.last_status ? (
                          <StatusChip
                            value={webhook.last_status === "delivered" ? "delivered" : "failed"}
                          />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {webhook.channel_hint || "No channel hint"} · {webhookRules.length} rule
                        {webhookRules.length === 1 ? "" : "s"} ·{" "}
                        {webhook.last_tested_at
                          ? `last attempt ${relativeTime(webhook.last_tested_at)}`
                          : "never tested"}{" "}
                        · URL <span className="font-mono">••••••••</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <form action={testWebhookAction}>
                        <input type="hidden" name="id" value={webhook.id} />
                        <button type="submit" className="btn btn-ghost btn-sm">
                          <Send size={12} /> Send test
                        </button>
                      </form>
                      <ConfirmForm
                        action={toggleWebhookAction}
                        fields={{ id: webhook.id }}
                        label={webhook.is_enabled === 1 ? "Disable" : "Enable"}
                      />
                      <ConfirmForm
                        action={deleteWebhookAction}
                        fields={{ id: webhook.id }}
                        label="Delete"
                        variant="danger"
                        confirmText={`Delete ${webhook.name} and its routing rules?`}
                      />
                    </div>
                  </div>

                  <details className="group mt-2">
                    <summary className="inline-flex cursor-pointer items-center gap-1 text-[10.5px] font-semibold text-brand-300 hover:text-brand-200">
                      <ChevronDown size={11} className="transition group-open:rotate-180" /> Edit destination
                    </summary>
                    <div className="mt-2 rounded-lg border border-white/[0.07] bg-navy-950/40 p-3">
                      <WebhookForm action={saveWebhookAction} webhook={webhook} />
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel className="overflow-hidden" >
        <div id="new-webhook" className="border-b border-white/[0.07] px-4 py-3">
          <p className="text-[12.5px] font-semibold text-slate-100">Add a destination</p>
          <p className="mt-0.5 text-[10.5px] text-slate-500">
            In Discord: Channel settings → Integrations → Webhooks → Copy webhook URL.
          </p>
        </div>
        <div className="p-4">
          <WebhookForm action={saveWebhookAction} />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Routing rules"
            subtitle="Which disruptions reach which destination"
            icon={<Bell size={15} />}
          />
          {rules.length === 0 ? (
            <EmptyState
              title="No routing rules"
              description="Without a rule, published disruptions will not be delivered anywhere."
            />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Destination</th>
                    <th>Line</th>
                    <th>Categories</th>
                    <th>Min severity</th>
                    <th className="text-right">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => {
                    let categories: string[] = [];
                    try {
                      categories = JSON.parse(rule.categories) as string[];
                    } catch {
                      categories = [];
                    }
                    return (
                      <tr key={rule.id}>
                        <td className="text-[11.5px] text-slate-200">{rule.webhook_name}</td>
                        <td className="text-[11px] text-slate-400">{rule.line_name ?? "All lines"}</td>
                        <td className="max-w-[200px] text-[10.5px] text-slate-400">
                          {categories.length === 0
                            ? "All categories"
                            : categories.map(categoryLabel).join(", ")}
                        </td>
                        <td>
                          <span className="text-[10.5px] text-slate-300">
                            {severityLabel(rule.min_severity)}
                          </span>
                          {rule.notify_on_resolve === 1 ? (
                            <span className="ml-1.5 text-[9px] text-emerald-300">+resolve</span>
                          ) : null}
                        </td>
                        <td className="text-right">
                          <ConfirmForm
                            action={deleteRuleAction}
                            fields={{ id: rule.id }}
                            label="Remove"
                            variant="danger"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Add routing rule" icon={<KeyRound size={15} />} />
          <div className="p-4">
            {webhooks.length === 0 ? (
              <p className="text-[11.5px] text-slate-500">
                Add a webhook destination first, then create a rule to bind it to a corridor.
              </p>
            ) : (
              <RuleForm action={saveRuleAction} webhooks={webhooks} lines={lines} />
            )}
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Delivery history"
          subtitle="Every attempted delivery, including deduplicated and failed sends"
          icon={<Send size={15} />}
          action={<Pill tone="slate">{logs.length} recent</Pill>}
        />
        {logs.length === 0 ? (
          <EmptyState title="No deliveries recorded" description="Send a test notification to verify your webhook." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Notification</th>
                  <th className="hidden sm:table-cell">Destination</th>
                  <th className="hidden md:table-cell">HTTP</th>
                  <th className="hidden lg:table-cell">Attempted</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <StatusChip value={log.status === "queued" ? "blocked" : log.status} />
                    </td>
                    <td className="max-w-[240px]">
                      <p className="truncate text-[11.5px] text-slate-200">{log.title || "—"}</p>
                      <p className="text-[9.5px] text-slate-500">
                        {log.event}
                        {log.is_test === 1 ? " · test" : ""}
                      </p>
                    </td>
                    <td className="hidden text-[10.5px] text-slate-400 sm:table-cell">
                      {log.webhook_name}
                    </td>
                    <td className="hidden font-mono text-[10.5px] text-slate-500 md:table-cell">
                      {log.http_status ?? "—"}
                    </td>
                    <td className="hidden text-[10px] text-slate-500 lg:table-cell">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="max-w-[260px] text-[10px] text-slate-500">
                      <span className="line-clamp-2">{log.error ?? "Delivered successfully."}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="p-4">
        <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-200">
          <ShieldCheck size={13} className="text-brand-300" /> How delivery works
        </p>
        <div className="mt-2 grid gap-3 text-[10.5px] leading-relaxed text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
          <p>
            <span className="font-semibold text-slate-300">Encrypted at rest.</span> Webhook URLs are
            sealed with AES-256-GCM using a key derived from AUTH_SECRET and are never sent to the
            browser.
          </p>
          <p>
            <span className="font-semibold text-slate-300">Deduplicated.</span> Each delivery is keyed
            on the webhook, disruption, event and content hash. A repeated dispatch cannot send twice.
          </p>
          <p>
            <span className="font-semibold text-slate-300">Rich embeds.</span> Notifications include the
            corridor, severity, affected stations, expected resolution, source and an updated timestamp.
          </p>
          <p>
            <span className="font-semibold text-slate-300">Traceable failures.</span> A rejected send
            keeps Discord&apos;s HTTP status and message so delivery problems can be diagnosed.
          </p>
        </div>
      </Panel>
    </div>
  );
}
