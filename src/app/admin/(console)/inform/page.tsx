import { CheckCircle2, Copy, Inbox, Mail, ShieldAlert } from "lucide-react";
import {
  EmptyState,
  Notice,
  Panel,
  PanelHeader,
  Pill,
  SectionHeading,
  StatusChip,
} from "@/components/ui";
import { InformReviewCard } from "@/components/forms/InformReviewCard";
import { ConfirmForm } from "@/components/forms/AdminConfirm";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listInformMessages } from "@/lib/repo/inform";
import { listAllLines } from "@/lib/repo/lines";
import { searchStations } from "@/lib/repo/stations";
import { getSetting } from "@/lib/repo/system";
import { categoryLabel, severityLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { deleteInformAction, reviewInformAction } from "@/app/admin/inform/actions";

export const dynamic = "force-dynamic";

export default async function InformPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireUser();
  if (!can(user.role, "inform.review")) {
    return <AccessDenied role={user.role} permission="inform.review" />;
  }

  const { notice } = await searchParams;
  const messages = listInformMessages();
  const pending = messages.filter((message) => message.status === "pending");
  const reviewed = messages.filter((message) => message.status !== "pending");
  const lines = listAllLines();
  const stations = searchStations("", 600).map((station) => ({
    id: station.id,
    name: station.name,
    line_ids: station.line_ids,
  }));

  const tokenConfigured = Boolean(process.env.INFORM_INGEST_TOKEN);
  const integrationEnabled = getSetting("inform_integration_enabled", "true") === "true";

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Integrations"
        title="V/Line Inform email"
        description="Inbound service notification emails are parsed into draft disruptions, reviewed by an operator, then published."
        action={
          <div className="flex items-center gap-2">
            <Pill tone={tokenConfigured ? "ok" : "warn"} dot>
              {tokenConfigured ? "Token configured" : "Token not set"}
            </Pill>
            <Pill tone="brand">{pending.length} pending</Pill>
          </div>
        }
      />

      {notice ? <Notice tone="ok">{notice}</Notice> : null}

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Integration endpoint"
          subtitle="Point a mail provider's inbound webhook at this URL"
          icon={<Mail size={15} />}
          action={
            <StatusChip
              value={integrationEnabled ? "approved" : "rejected"}
              label={integrationEnabled ? "Accepting" : "Paused"}
            />
          }
        />
        <div className="space-y-3 p-4">
          <div className="rounded-lg border border-white/[0.08] bg-navy-950/60 p-3">
            <p className="micro mb-1.5">Endpoint</p>
            <code className="block overflow-x-auto font-mono text-[11px] text-brand-200">
              POST /api/inform/ingest
            </code>
            <p className="mt-2 micro mb-1">Payload format</p>
            <pre className="overflow-x-auto rounded bg-black/40 p-2.5 font-mono text-[10px] leading-relaxed text-slate-400">
{`curl -X POST "$APP_URL/api/inform/ingest" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $INFORM_INGEST_TOKEN" \\
  -d '{"from":"notice@your-domain.com","subject":"Geelong Line - delay",
       "text":"Signalling fault at North Geelong..."}'`}
            </pre>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
              <p className="text-[11px] font-semibold text-slate-200">Authentication</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-slate-400">
                The endpoint requires a bearer token matching <code className="font-mono text-brand-200">INFORM_INGEST_TOKEN</code>.
                Providers that cannot set headers may pass <code className="font-mono text-brand-200">?token=</code>.
                Requests are rejected when the token is unset.
              </p>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
              <p className="text-[11px] font-semibold text-slate-200">What is parsed</p>
              <ul className="mt-1 space-y-0.5 text-[10.5px] leading-relaxed text-slate-400">
                <li className="flex items-start gap-1.5"><CheckCircle2 size={10} className="mt-0.5 text-emerald-400" /> Corridor from line names</li>
                <li className="flex items-start gap-1.5"><CheckCircle2 size={10} className="mt-0.5 text-emerald-400" /> Category and severity keywords</li>
                <li className="flex items-start gap-1.5"><CheckCircle2 size={10} className="mt-0.5 text-emerald-400" /> Affected stations by name match</li>
                <li className="flex items-start gap-1.5"><CheckCircle2 size={10} className="mt-0.5 text-emerald-400" /> Suggested title and description</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-3">
            <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-amber-200">
              <ShieldAlert size={11} /> Limitations
            </p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-amber-100/70">
              No private V/Line API or mailbox is assumed or accessed. This endpoint only accepts
              email content that an authorised operator forwards to it. Parsing is heuristic: every
              message must be human-reviewed before publication. Attachments and HTML-only bodies are
              not processed.
            </p>
          </div>
        </div>
      </Panel>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-slate-200">
            Review queue <span className="font-mono text-[11px] text-slate-500">({pending.length})</span>
          </h2>
          <p className="text-[10px] text-slate-500">Approve to publish · Reject to discard</p>
        </div>

        {pending.length === 0 ? (
          <Panel>
            <EmptyState
              title="Queue is clear"
              description="No inbound messages are awaiting review. Approved and rejected messages remain in the history below."
              icon={<Inbox size={18} />}
            />
          </Panel>
        ) : (
          <div className="space-y-3">
            {pending.map((message) => (
              <Panel key={message.id} className="p-4">
                <InformReviewCard
                  action={reviewInformAction}
                  message={message}
                  lines={lines}
                  stations={stations}
                />
              </Panel>
            ))}
          </div>
        )}
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Reviewed messages"
          subtitle="Audit trail of operator decisions"
          icon={<Copy size={15} />}
        />
        {reviewed.length === 0 ? (
          <EmptyState title="Nothing reviewed yet" description="Decisions appear here after review." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Decision</th>
                  <th className="hidden md:table-cell">Corridor</th>
                  <th className="hidden md:table-cell">Category</th>
                  <th className="hidden lg:table-cell">Reviewed</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((message) => (
                  <tr key={message.id}>
                    <td className="max-w-[280px]">
                      <p className="truncate text-[11.5px] text-slate-200">
                        {message.parsed_title ?? message.subject}
                      </p>
                      <p className="truncate text-[9.5px] text-slate-500">{message.subject}</p>
                    </td>
                    <td>
                      <StatusChip value={message.status} />
                    </td>
                    <td className="hidden text-[11px] text-slate-400 md:table-cell">
                      {message.line_name ?? "Network-wide"}
                    </td>
                    <td className="hidden text-[10.5px] text-slate-400 md:table-cell">
                      {message.parsed_category ? categoryLabel(message.parsed_category) : "—"}
                      {message.parsed_severity ? ` · ${severityLabel(message.parsed_severity)}` : ""}
                    </td>
                    <td className="hidden text-[10px] text-slate-500 lg:table-cell">
                      {formatDateTime(message.reviewed_at)} · {message.reviewed_by ?? "—"}
                    </td>
                    <td className="text-right">
                      <ConfirmForm
                        action={deleteInformAction}
                        fields={{ id: message.id }}
                        label="Remove"
                        variant="danger"
                        confirmText="Remove this message from the integration history?"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
