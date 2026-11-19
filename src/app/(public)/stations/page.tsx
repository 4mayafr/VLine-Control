import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Search } from "lucide-react";
import { EmptyState, Panel, SectionHeading } from "@/components/ui";
import { searchStations } from "@/lib/repo/stations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Station directory" };

export default async function StationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const stations = searchStations(q);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <SectionHeading
        eyebrow="Station directory"
        title="Victorian regional stations"
        description="Search recorded stations across every monitored corridor. Facility details are maintained for staffed interchanges; other fields may be incomplete."
      />

      <form method="get" className="mt-5 flex flex-wrap items-end gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
          <label htmlFor="q" className="sr-only">
            Search stations
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            className="field pl-9"
            placeholder="Search by station or suburb…"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
        {q ? (
          <Link href="/stations" className="btn btn-ghost">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          {stations.length} station{stations.length === 1 ? "" : "s"}
          {q ? ` matching “${q}”` : " recorded"}
        </p>
      </div>

      <Panel className="mt-2 overflow-hidden">
        {stations.length === 0 ? (
          <EmptyState
            title="No matching stations"
            description="No station records match that search. Try a shorter search term or browse the network map."
            icon={<MapPin size={18} />}
          />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Corridors</th>
                  <th className="hidden sm:table-cell">Coordinates</th>
                  <th className="hidden md:table-cell">Facilities</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => {
                  const lineNames = station.line_names ? station.line_names.split(" · ") : [];
                  return (
                    <tr key={station.id}>
                      <td>
                        <Link
                          href={`/stations/${station.slug}`}
                          className="font-medium text-slate-100 hover:text-brand-200"
                        >
                          {station.name}
                        </Link>
                        {station.suburb ? (
                          <p className="text-[10px] text-slate-500">{station.suburb}</p>
                        ) : null}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {lineNames.slice(0, 3).map((name) => (
                            <span
                              key={name}
                              className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9.5px] text-slate-300"
                            >
                              {name}
                            </span>
                          ))}
                          {lineNames.length > 3 ? (
                            <span className="text-[9.5px] text-slate-500">+{lineNames.length - 3}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="hidden font-mono text-[10.5px] text-slate-500 sm:table-cell">
                        {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                      </td>
                      <td className="hidden max-w-[260px] truncate text-[11px] text-slate-400 md:table-cell">
                        {station.facilities ?? "Not recorded"}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/stations/${station.slug}`}
                          className="text-[10.5px] font-semibold text-brand-300 hover:text-brand-200"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
