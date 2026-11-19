import { ScrollText } from "lucide-react";
import { EmptyState, Panel, PanelHeader, Pill, SectionHeading } from "@/components/ui";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listAudit } from "@/lib/repo/system";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function toneFor(action: string): string {
  if (action.includes("delete") || action.includes("failed")) return "text-rose-300";
  if (action.includes("create") || action.includes("publish")) return "text-emerald-300";
  if (action.includes("resolve")) return "text-sky-300";
  if (action.includes("login")) return "text-brand-300";
  return "text-slate-300";
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>;
}) {
  const user = await requireUser();
  if (!can(user.role, "audit.view")) {
    return <AccessDenied role={user.role} permission="audit.view" />;
  }

  const { entity } = await searchParams;
  const entries = listAudit(250);
  const filtered = entity ? entries.filter((entry) => entry.entity === entity) : entries;
  const entities = [...new Set(entries.map((entry) => entry.entity))].sort();

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="System"
        title="Audit log"
        description="Immutable record of authentication, disruption, station, integration and settings changes."
        action={<Pill tone="slate">{filtered.length} entries</Pill>}
      />

      <div className="flex flex-wrap gap-1.5">
        <a
          href="/admin/audit"
          className={`rounded-full border px-2.5 py-1 text-[10.5px] font-medium ${
            !entity
              ? "border-brand-400/40 bg-brand-500/15 text-brand-200"
              : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
          }`}
        >
          All entities
        </a>
        {entities.map((item) => (
          <a
            key={item}
            href={`/admin/audit?entity=${encodeURIComponent(item)}`}
            className={`rounded-full border px-2.5 py-1 text-[10.5px] font-medium ${
              entity === item
                ? "border-brand-400/40 bg-brand-500/15 text-brand-200"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
            }`}
          >
            {item}
          </a>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader title="Events" subtitle="Newest first" icon={<ScrollText size={15} />} />
        {filtered.length === 0 ? (
          <EmptyState title="No audit entries" description="Actions performed in the console will be recorded here." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="hidden sm:table-cell">Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th className="hidden md:table-cell">Entity</th>
                  <th>Detail</th>
                  <th className="hidden lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id}>
                    <td className="hidden font-mono text-[10px] whitespace-nowrap text-slate-500 sm:table-cell">
                      {formatDateTime(entry.created_at)}
                    </td>
                    <td>
                      <span className={`font-mono text-[10.5px] ${toneFor(entry.action)}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="text-[10.5px] text-slate-400">{entry.actor_email}</td>
                    <td className="hidden text-[10px] text-slate-500 md:table-cell">
                      {entry.entity}
                      {entry.entity_id ? (
                        <span className="ml-1 font-mono text-[9px] text-slate-600">
                          {entry.entity_id.slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-[340px] text-[10.5px] text-slate-400">
                      <span className="line-clamp-2">{entry.detail || "—"}</span>
                    </td>
                    <td className="hidden font-mono text-[9.5px] text-slate-600 lg:table-cell">
                      {entry.ip || "—"}
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
