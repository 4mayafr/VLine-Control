import Link from "next/link";
import { MapPin, Plus, Search } from "lucide-react";
import { EmptyState, Notice, Panel, Pill, SectionHeading } from "@/components/ui";
import { ConfirmForm } from "@/components/forms/AdminConfirm";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { searchStations } from "@/lib/repo/stations";
import { formatDateTime } from "@/lib/format";
import { deleteStationAction } from "@/app/admin/stations/actions";

export const dynamic = "force-dynamic";

export default async function AdminStationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; notice?: string }>;
}) {
  const user = await requireUser();
  const { q = "", notice } = await searchParams;
  const stations = searchStations(q);
  const editable = can(user.role, "station.manage");

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Network"
        title="Station directory"
        description="Search, add and maintain station records across every monitored corridor."
        action={
          <div className="flex items-center gap-2">
            <Pill tone="brand">{stations.length} shown</Pill>
            {editable ? (
              <Link href="/admin/stations/new" className="btn btn-primary">
                <Plus size={14} /> Add station
              </Link>
            ) : null}
          </div>
        }
      />

      {notice ? <Notice tone="ok">{notice}</Notice> : null}
      {!editable ? (
        <Notice tone="info">Your role has read-only access to station records.</Notice>
      ) : null}

      <form method="get" className="flex flex-wrap items-end gap-2">
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
            placeholder="Search station or suburb…"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
        {q ? (
          <Link href="/admin/stations" className="btn btn-ghost">
            Clear
          </Link>
        ) : null}
      </form>

      <Panel className="overflow-hidden">
        {stations.length === 0 ? (
          <EmptyState
            title="No stations found"
            description="No records match this search. Add a station to build out the directory."
            icon={<MapPin size={18} />}
            action={
              editable ? (
                <Link href="/admin/stations/new" className="btn btn-primary btn-sm">
                  Add station
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Corridors</th>
                  <th className="hidden md:table-cell">Coordinates</th>
                  <th className="hidden lg:table-cell">Updated</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => (
                  <tr key={station.id}>
                    <td>
                      <p className="font-medium text-slate-100">{station.name}</p>
                      <p className="text-[10px] text-slate-500">{station.suburb || "—"}</p>
                    </td>
                    <td className="max-w-[220px]">
                      <p className="truncate text-[10.5px] text-slate-400">
                        {station.line_names || "Unassigned"}
                      </p>
                    </td>
                    <td className="hidden font-mono text-[10.5px] text-slate-500 md:table-cell">
                      {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                    </td>
                    <td className="hidden text-[10.5px] text-slate-500 lg:table-cell">
                      {formatDateTime(station.updated_at)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/stations/${station.slug}`}
                          className="btn btn-ghost btn-sm"
                          title="Public station page"
                        >
                          View
                        </Link>
                        {editable ? (
                          <>
                            <Link
                              href={`/admin/stations/${station.id}`}
                              className="btn btn-ghost btn-sm"
                            >
                              Edit
                            </Link>
                            <ConfirmForm
                              action={deleteStationAction}
                              fields={{ id: station.id }}
                              label="Delete"
                              variant="danger"
                              confirmText={`Delete ${station.name}? This also removes its corridor assignments.`}
                            />
                          </>
                        ) : null}
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
