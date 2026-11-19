import Link from "next/link";
import { ChevronDown, Plus, Route } from "lucide-react";
import { Notice, Panel, Pill, SectionHeading, StatusChip } from "@/components/ui";
import { LineForm } from "@/components/forms/LineForm";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { countLineStations, listAllLines } from "@/lib/repo/lines";
import { lineHealth } from "@/lib/repo/system";
import { lineStatusLabel } from "@/lib/labels";
import { saveLineAction } from "@/app/admin/lines/actions";

export const dynamic = "force-dynamic";

export default async function AdminLinesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireUser();
  const { notice } = await searchParams;
  const lines = listAllLines();
  const health = lineHealth();
  const editable = can(user.role, "network.manage");

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Network"
        title="Railway line management"
        description="Corridor descriptions, service patterns and editorial status. Status changes are recorded in the audit log."
        action={
          <div className="flex items-center gap-2">
            <Pill tone="brand">{lines.length} corridors</Pill>
            {editable ? (
              <a href="#new-line" className="btn btn-primary">
                <Plus size={14} /> Add corridor
              </a>
            ) : null}
          </div>
        }
      />

      {notice ? <Notice tone="ok">{notice}</Notice> : null}
      {!editable ? (
        <Notice tone="info">
          Your role has read-only access to railway line configuration.
        </Notice>
      ) : null}

      <div className="space-y-2.5">
        {lines.map((line) => {
          const open = health.find((item) => item.id === line.id)?.open ?? 0;
          const stationCount = countLineStations(line.id);
          return (
            <Panel key={line.id} className="overflow-hidden">
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 transition hover:bg-white/[0.02]">
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: line.colour }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-slate-100">{line.name}</p>
                      <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                        {line.code}
                      </span>
                      <StatusChip value={line.status} label={lineStatusLabel(line.status)} />
                    </div>
                    <p className="mt-0.5 truncate text-[10.5px] text-slate-500">
                      {line.origin} → {line.destination} · {stationCount} stops · {line.region}
                      {open > 0 ? ` · ${open} open notice${open === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <ChevronDown
                    size={15}
                    className="shrink-0 text-slate-500 transition group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-white/[0.07] px-4 py-4">
                  {editable ? (
                    <LineForm action={saveLineAction} line={line} />
                  ) : (
                    <div className="space-y-2 text-[11.5px] leading-relaxed text-slate-400">
                      <p>{line.description || "No description recorded."}</p>
                      <p className="text-slate-500">{line.service_pattern || "No service pattern recorded."}</p>
                      <Link href={`/lines/${line.slug}`} className="font-semibold text-brand-300">
                        View public line page
                      </Link>
                    </div>
                  )}
                </div>
              </details>
            </Panel>
          );
        })}
      </div>

      {editable ? (
        <Panel className="overflow-hidden" >
          <div id="new-line" className="border-b border-white/[0.07] px-4 py-3">
            <p className="text-[12.5px] font-semibold text-slate-100">Add a corridor</p>
            <p className="mt-0.5 text-[10.5px] text-slate-500">
              New corridors start with no stations. Assign stops from the station directory.
            </p>
          </div>
          <div className="p-4">
            <LineForm action={saveLineAction} />
          </div>
        </Panel>
      ) : null}

      <Panel className="flex items-start gap-2.5 p-4">
        <Route size={14} className="mt-0.5 shrink-0 text-brand-300" />
        <div>
          <p className="text-[11.5px] font-semibold text-slate-200">Status definitions</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-slate-500">
            Operational · Minor delays · Major delays · Suspended · Planned closure. Statuses are
            editorial records maintained here — they are never derived from an automated feed.
          </p>
        </div>
      </Panel>
    </div>
  );
}
