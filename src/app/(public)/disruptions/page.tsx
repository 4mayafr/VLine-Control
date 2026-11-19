import Link from "next/link";
import type { Metadata } from "next";
import { Inbox, ShieldAlert } from "lucide-react";
import { EmptyState, Panel, Pill, SectionHeading } from "@/components/ui";
import { DisruptionNotice } from "@/components/public/DisruptionNotice";
import { listLines } from "@/lib/repo/lines";
import { listDisruptions } from "@/lib/repo/disruptions";
import { CATEGORIES, SEVERITIES } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Service status" };

export default async function DisruptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ line?: string; severity?: string; category?: string; status?: string }>;
}) {
  const filters = await searchParams;
  const lines = listLines();
  const selectedLine = lines.find((line) => line.slug === filters.line);

  const disruptions = listDisruptions({
    publishedOnly: true,
    lineId: selectedLine?.id,
    severity: filters.severity,
    category: filters.category,
    status: filters.status,
    limit: 100,
  });

  const open = disruptions.filter((item) => item.status !== "resolved");
  const closed = disruptions.filter((item) => item.status === "resolved");
  const activeCount = open.filter((item) => item.status === "active").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <SectionHeading
        eyebrow="Service status"
        title="Published disruption notices"
        description="Every notice below is published from the operations console by this instance's operators. They are not official V/Line information."
        action={
          <div className="flex items-center gap-2">
            <Pill tone={activeCount > 0 ? "danger" : "ok"} dot>
              {activeCount} active
            </Pill>
          </div>
        }
      />

      <Panel className="mt-5 p-3">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className="min-w-[180px] flex-1 space-y-1">
            <label htmlFor="line" className="block text-[10px] tracking-wide text-slate-500 uppercase">
              Railway line
            </label>
            <select id="line" name="line" className="field" defaultValue={filters.line ?? ""}>
              <option value="">All corridors</option>
              {lines.map((line) => (
                <option key={line.id} value={line.slug}>
                  {line.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px] flex-1 space-y-1">
            <label htmlFor="severity" className="block text-[10px] tracking-wide text-slate-500 uppercase">
              Severity
            </label>
            <select id="severity" name="severity" className="field" defaultValue={filters.severity ?? ""}>
              <option value="">Any severity</option>
              {SEVERITIES.map((severity) => (
                <option key={severity.value} value={severity.value}>
                  {severity.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px] flex-1 space-y-1">
            <label htmlFor="category" className="block text-[10px] tracking-wide text-slate-500 uppercase">
              Category
            </label>
            <select id="category" name="category" className="field" defaultValue={filters.category ?? ""}>
              <option value="">Any category</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[130px] space-y-1">
            <label htmlFor="status" className="block text-[10px] tracking-wide text-slate-500 uppercase">
              Status
            </label>
            <select id="status" name="status" className="field" defaultValue={filters.status ?? ""}>
              <option value="">Open & resolved</option>
              <option value="active">Active</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
          <Link href="/disruptions" className="btn btn-ghost">
            Reset
          </Link>
        </form>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5">
            <p className="text-[11.5px] font-semibold text-slate-300">
              {open.length} open · {closed.length} resolved
            </p>
            {selectedLine ? (
              <Link
                href={`/lines/${selectedLine.slug}`}
                className="text-[10.5px] font-semibold text-brand-300 hover:text-brand-200"
              >
                {selectedLine.name} details
              </Link>
            ) : null}
          </div>
          {disruptions.length === 0 ? (
            <EmptyState
              title="No published notices"
              description="No published notice matches these filters. Notices appear here as soon as an operator publishes one."
              icon={<Inbox size={18} />}
            />
          ) : (
            <>
              {open.map((disruption) => (
                <DisruptionNotice key={disruption.id} disruption={disruption} />
              ))}
              {closed.length > 0 ? (
                <>
                  <p className="micro border-y border-white/[0.07] bg-navy-950/40 px-4 py-2">
                    Recently resolved
                  </p>
                  {closed.slice(0, 6).map((disruption) => (
                    <DisruptionNotice key={disruption.id} disruption={disruption} compact />
                  ))}
                </>
              ) : null}
            </>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel className="p-4">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-200">
              <ShieldAlert size={13} className="text-amber-300" /> Important
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              V/LINE CONTROL is an independent project. Notices published here may be incomplete or
              out of date. Check official V/Line information before you travel.
            </p>
            <a
              href="https://www.vline.com.au"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 block rounded-lg border border-white/10 bg-navy-950/40 px-3 py-2 text-center text-[11.5px] font-semibold text-slate-300 hover:border-brand-400/30 hover:text-white"
            >
              Official V/Line website
            </a>
          </Panel>

          <Panel className="p-4">
            <p className="micro mb-2">By corridor</p>
            <ul className="space-y-1">
              {lines.map((line) => {
                const count = listDisruptions({
                  publishedOnly: true,
                  lineId: line.id,
                  limit: 100,
                }).filter((item) => item.status !== "resolved").length;
                return (
                  <li key={line.id}>
                    <Link
                      href={`/disruptions?line=${line.slug}`}
                      className="flex items-center gap-2 rounded px-1.5 py-1 text-[11px] text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                    >
                      <span className="h-2.5 w-1 rounded-full" style={{ backgroundColor: line.colour }} />
                      <span className="flex-1 truncate">{line.name}</span>
                      <span className="font-mono text-[10px] text-slate-600">{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
