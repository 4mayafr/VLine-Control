import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Bell, Bus, Clock, MapPin, Route } from "lucide-react";
import { EmptyState, Panel, PanelHeader, Pill, SectionHeading } from "@/components/ui";
import { DisruptionNotice } from "@/components/public/DisruptionNotice";
import { ResourceLinks } from "@/components/public/ResourceLinks";
import { lineResources } from "@/lib/resources";
import { getLineBySlug, getLineStations, listLines } from "@/lib/repo/lines";
import { listDisruptions } from "@/lib/repo/disruptions";
import { listUpdates } from "@/lib/repo/system";
import { lineStatusLabel, statusClass } from "@/lib/labels";
import { relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const line = getLineBySlug(slug);
  return { title: line ? line.name : "Line not found" };
}

export default async function LinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const line = getLineBySlug(slug);
  if (!line) notFound();

  const stations = getLineStations(line.id);
  const disruptions = listDisruptions({
    lineId: line.id,
    publishedOnly: true,
    limit: 30,
  }).filter((disruption) => disruption.status !== "resolved");
  const resolved = listDisruptions({ lineId: line.id, publishedOnly: true, limit: 30 }).filter(
    (disruption) => disruption.status === "resolved",
  );
  const updates = listUpdates({ publishedOnly: true, limit: 30 }).filter(
    (update) => update.line_id === line.id || update.line_id === null,
  );
  const allLines = listLines();
  const index = allLines.findIndex((item) => item.id === line.id);
  const previous = allLines[(index - 1 + allLines.length) % allLines.length];
  const next = allLines[(index + 1) % allLines.length];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/network"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft size={12} /> Network map
      </Link>

      <div className="mt-4">
        <SectionHeading
          eyebrow={line.region}
          title={line.name}
          description={line.description}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold ${statusClass(line.status)}`}
              >
                {lineStatusLabel(line.status)}
              </span>
              <Pill tone="slate">{line.code}</Pill>
            </div>
          }
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Stations along the corridor"
              subtitle={`${stations.length} recorded stops · ${line.origin} to ${line.destination}`}
              icon={<Route size={15} />}
            />
            <div className="grid gap-x-6 gap-y-0 p-4 sm:grid-cols-2">
              <ol>
                {stations.slice(0, Math.ceil(stations.length / 2)).map((station, position) => (
                  <StationRow key={station.id} station={station} position={position} colour={line.colour} />
                ))}
              </ol>
              <ol>
                {stations.slice(Math.ceil(stations.length / 2)).map((station, position) => (
                  <StationRow
                    key={station.id}
                    station={station}
                    position={position + Math.ceil(stations.length / 2)}
                    colour={line.colour}
                  />
                ))}
              </ol>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              title="Current reported disruptions"
              subtitle="Published notices on this corridor"
              icon={<Clock size={15} />}
            />
            {disruptions.length === 0 ? (
              <EmptyState
                title="No open disruption notices"
                description="There are no published open notices for this corridor. Notices appear here as soon as an operator publishes one."
              />
            ) : (
              disruptions.map((disruption) => (
                <DisruptionNotice key={disruption.id} disruption={disruption} showLine={false} />
              ))
            )}
          </Panel>

          {resolved.length > 0 ? (
            <Panel className="overflow-hidden">
              <PanelHeader title="Recently resolved" icon={<Clock size={15} />} />
              {resolved.slice(0, 3).map((disruption) => (
                <DisruptionNotice key={disruption.id} disruption={disruption} showLine={false} compact />
              ))}
            </Panel>
          ) : null}
        </div>

        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <PanelHeader title="Service information" icon={<MapPin size={15} />} />
            <dl className="divide-y divide-white/[0.05] text-[11.5px]">
              <Row label="Corridor" value={`${line.origin} ↔ ${line.destination}`} />
              <Row label="Region" value={line.region || "Not recorded"} />
              <Row label="Recorded stops" value={String(stations.length)} />
              <Row label="Open notices" value={String(disruptions.length)} />
            </dl>
            <div className="border-t border-white/[0.06] p-4">
              <p className="micro mb-1">Service pattern</p>
              <p className="text-[11px] leading-relaxed text-slate-400">
                {line.service_pattern || "No service pattern has been recorded for this corridor."}
              </p>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <ResourceLinks
              links={lineResources(line)}
              subtitle={`Official timetables, service changes and reference material for the ${line.name}`}
            />
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              title="Latest updates"
              subtitle="Corridor and network-wide notices"
              icon={<Bell size={15} />}
            />
            {updates.length === 0 ? (
              <EmptyState title="No updates" description="Published updates will appear here." />
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {updates.slice(0, 4).map((update) => (
                  <li key={update.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 text-[11.5px] font-semibold text-slate-200">
                        {update.title}
                      </p>
                    </div>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-slate-500">
                      {update.body}
                    </p>
                    <p className="mt-1 text-[9.5px] text-slate-600">{relativeTime(update.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {disruptions.some((disruption) => disruption.replacement_transport) ? (
            <Panel className="p-4">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-amber-200">
                <Bus size={13} /> Replacement transport in place
              </p>
              <ul className="mt-2 space-y-2">
                {disruptions
                  .filter((disruption) => disruption.replacement_transport)
                  .map((disruption) => (
                    <li key={disruption.id} className="text-[10.5px] leading-relaxed text-slate-400">
                      <span className="font-semibold text-slate-300">{disruption.title}:</span>{" "}
                      {disruption.replacement_transport}
                    </li>
                  ))}
              </ul>
            </Panel>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <Link href={`/lines/${previous.slug}`} className="btn btn-ghost btn-sm">
              <ArrowLeft size={12} /> {previous.code}
            </Link>
            <Link href={`/lines/${next.slug}`} className="btn btn-ghost btn-sm">
              {next.code} <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StationRow({
  station,
  position,
  colour,
}: {
  station: {
    id: string;
    name: string;
    slug: string;
    is_terminus: number;
    connecting_transport: string | null;
  };
  position: number;
  colour: string;
}) {
  return (
    <li className="relative flex gap-2.5 pb-2.5 last:pb-0">
      <span className="relative flex w-4 shrink-0 justify-center">
        <span
          className={`z-10 mt-1 size-2 rounded-full ${station.is_terminus === 1 ? "bg-white" : ""}`}
          style={station.is_terminus === 1 ? undefined : { backgroundColor: colour }}
        />
        <span className="absolute top-3 bottom-0 w-px bg-white/12" />
      </span>
      <div className="-mt-0.5 min-w-0 flex-1">
        <Link
          href={`/stations/${station.slug}`}
          className="truncate text-[11.5px] text-slate-300 hover:text-brand-200"
        >
          <span className="mr-1.5 font-mono text-[9.5px] text-slate-600">
            {String(position + 1).padStart(2, "0")}
          </span>
          {station.name}
          {station.is_terminus === 1 ? (
            <span className="ml-1.5 text-[9px] text-slate-500 uppercase">terminus</span>
          ) : null}
        </Link>
        {station.connecting_transport ? (
          <p className="truncate text-[9.5px] text-slate-600">{station.connecting_transport}</p>
        ) : null}
      </div>
    </li>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[60%] text-right text-slate-300">{value}</dd>
    </div>
  );
}
