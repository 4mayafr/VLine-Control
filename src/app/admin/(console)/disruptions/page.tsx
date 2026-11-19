import Link from "next/link";
import { Filter, Plus } from "lucide-react";
import {
  EmptyState,
  Notice,
  Panel,
  Pill,
  SectionHeading,
  SeverityChip,
  StatusChip,
} from "@/components/ui";
import { ConfirmForm } from "@/components/forms/AdminConfirm";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listDisruptions } from "@/lib/repo/disruptions";
import { listAllLines } from "@/lib/repo/lines";
import { CATEGORIES, DISRUPTION_STATUSES, SEVERITIES, categoryLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import {
  deleteDisruptionAction,
  publishDisruptionAction,
  resolveDisruptionAction,
} from "@/app/admin/disruptions/actions";

export const dynamic = "force-dynamic";

export default async function AdminDisruptionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    line?: string;
    severity?: string;
    category?: string;
    status?: string;
    q?: string;
    notice?: string;
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const lines = listAllLines();
  const selectedLine = lines.find((line) => line.slug === params.line);

  const disruptions = listDisruptions({
    lineId: selectedLine?.id,
    severity: params.severity,
    category: params.category,
    status: params.status,
    search: params.q,
    limit: 200,
  });
  const editable = can(user.role, "disruption.manage");

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Operations"
        title="Disruption management"
        description="Create, publish, update and resolve disruption notices. Publishing triggers Discord notifications for matching routing rules."
        action={
          <div className="flex items-center gap-2">
            <Pill tone="danger">{disruptions.filter((item) => item.status === "active").length} active</Pill>
            {editable ? (
              <Link href="/admin/disruptions/new" className="btn btn-primary">
                <Plus size={14} /> New disruption
              </Link>
            ) : null}
          </div>
        }
      />

      {params.notice ? <Notice tone="ok">{params.notice}</Notice> : null}
      {!editable ? (
        <Notice tone="info">
          Your role can view disruption records but cannot create or modify them.
        </Notice>
      ) : null}

      <Panel className="p-3">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className="min-w-[150px] flex-1 space-y-1">
            <label htmlFor="line" className="block text-[10px] tracking-wide text-slate-500 uppercase">
              Line
            </label>
            <select id="line" name="line" className="field" defaultValue={params.line ?? ""}>
              <option value="">All lines</option>
              {lines.map((line) => (
                <option key={line.id} value={line.slug}>
                  {line.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[130px] space-y-1">
            <label htmlFor="severity" className="block text-[10px] tracking-wide text-slate-500 uppercase">
              Severity
            </label>
            <select id="severity" name="severity" className="field" defaultValue={params.severity ?? ""}>
              <option value="">Any</option>
              {SEVERITIES.map((severity) => (
                <option key={severity.value} value={severity.value}>
                  {severity.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px] space-y-1">
            <label htmlFor="category" className="block text-[10px] tracking-wide text-slate-500 uppercase">
              Category
            </label>
            <select id="category" name="category" className="field" defaultValue={params.category ?? ""}>
              <option value="">Any</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[120px] space-y-1">
            <label htmlFor="status" className="block text-[10px] tracking-wide text-slate-500 uppercase">
              Status
            </label>
            <select id="status" name="status" className="field" defaultValue={params.status ?? ""}>
              <option value="">Any</option>
              {DISRUPTION_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px] flex-1 space-y-1">
            <label htmlFor="q" className="block text-[10px] tracking-wide text-slate-500 uppercase">
              Search
            </label>
            <input id="q" name="q" className="field" defaultValue={params.q ?? ""} placeholder="Title or description" />
          </div>
          <button type="submit" className="btn btn-ghost">
            <Filter size={13} /> Filter
          </button>
          <Link href="/admin/disruptions" className="btn btn-ghost">
            Reset
          </Link>
        </form>
      </Panel>

      <Panel className="overflow-hidden">
        {disruptions.length === 0 ? (
          <EmptyState
            title="No disruptions match these filters"
            description="Adjust the filters, or create a new disruption notice to begin tracking an incident."
            action={
              editable ? (
                <Link href="/admin/disruptions/new" className="btn btn-primary btn-sm">
                  New disruption
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Notice</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Public</th>
                  <th className="hidden lg:table-cell">Updated</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disruptions.map((disruption) => (
                  <tr key={disruption.id}>
                    <td className="max-w-[320px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/admin/disruptions/${disruption.id}`}
                          className="max-w-[260px] truncate font-medium text-slate-100 hover:text-brand-200"
                        >
                          {disruption.title}
                        </Link>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {disruption.line_name ?? "Network-wide"} · {disruption.station_count} stations ·{" "}
                        {disruption.source}
                      </p>
                    </td>
                    <td className="text-[11px] text-slate-400">{categoryLabel(disruption.category)}</td>
                    <td>
                      <SeverityChip value={disruption.severity} />
                    </td>
                    <td>
                      <StatusChip value={disruption.status} />
                    </td>
                    <td className="hidden sm:table-cell">
                      {disruption.is_published === 1 ? (
                        <span className="text-[10.5px] font-semibold text-emerald-300">Published</span>
                      ) : (
                        <span className="text-[10.5px] text-slate-500">Draft</span>
                      )}
                    </td>
                    <td className="hidden text-[10.5px] text-slate-500 lg:table-cell">
                      {formatDateTime(disruption.updated_at)}
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {editable ? (
                          <>
                            <Link href={`/admin/disruptions/${disruption.id}`} className="btn btn-ghost btn-sm">
                              Edit
                            </Link>
                            {disruption.status !== "resolved" ? (
                              <ConfirmForm
                                action={resolveDisruptionAction}
                                fields={{ id: disruption.id }}
                                label="Resolve"
                                confirmText={`Mark “${disruption.title}” as resolved and notify matching Discord rules?`}
                              />
                            ) : null}
                            <ConfirmForm
                              action={publishDisruptionAction}
                              fields={{
                                id: disruption.id,
                                value: disruption.is_published === 1 ? "false" : "true",
                              }}
                              label={disruption.is_published === 1 ? "Unpublish" : "Publish"}
                            />
                            <ConfirmForm
                              action={deleteDisruptionAction}
                              fields={{ id: disruption.id }}
                              label="Delete"
                              variant="danger"
                              confirmText={`Permanently delete “${disruption.title}”?`}
                            />
                          </>
                        ) : (
                          <Link href={`/admin/disruptions/${disruption.id}`} className="btn btn-ghost btn-sm">
                            View
                          </Link>
                        )}
                      </div>
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
