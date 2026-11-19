import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Bus, Info, MapPin, Train } from "lucide-react";
import { Panel, PanelHeader, SectionHeading } from "@/components/ui";
import { DisruptionNotice } from "@/components/public/DisruptionNotice";
import { ResourceLinks } from "@/components/public/ResourceLinks";
import { stationResources } from "@/lib/resources";
import { getStationBySlug, listStationsForLine } from "@/lib/repo/stations";
import { getLinesForStation } from "@/lib/repo/lines";
import { listDisruptions } from "@/lib/repo/disruptions";
import { boundsAround, createProjector } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const station = getStationBySlug(slug);
  return { title: station ? station.name : "Station not found" };
}

export default async function StationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const station = getStationBySlug(slug);
  if (!station) notFound();

  const lines = getLinesForStation(station.id);
  const published = listDisruptions({ publishedOnly: true, limit: 200 });
  const notices = published.filter((disruption) => {
    try {
      return (JSON.parse(disruption.affected_stations) as string[]).includes(station.id);
    } catch {
      return false;
    }
  });

  const nearby = lines.flatMap((line) =>
    listStationsForLine(line.id).filter((item) => item.id !== station.id),
  );
  const nearbyUnique = [...new Map(nearby.map((item) => [item.id, item])).values()]
    .map((item) => ({
      ...item,
      distance: Math.hypot(item.latitude - station.latitude, item.longitude - station.longitude),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  const projector = createProjector(boundsAround(station.latitude, station.longitude, 0.08), 320);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/stations"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft size={12} /> Station directory
      </Link>

      <div className="mt-4">
        <SectionHeading
          eyebrow={station.suburb || "Victoria"}
          title={station.name}
          description={`Recorded stop on ${lines.map((line) => line.name).join(" and ") || "no assigned corridor"}.`}
          action={
            <div className="flex flex-wrap gap-1.5">
              {lines.map((line) => (
                <Link
                  key={line.id}
                  href={`/lines/${line.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-2 py-1 text-[10px] text-slate-300 hover:border-brand-400/40"
                >
                  <span className="h-2 w-1 rounded-full" style={{ backgroundColor: line.colour }} />
                  {line.name}
                </Link>
              ))}
            </div>
          }
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Current service notices"
              subtitle="Published notices that include this station"
              icon={<Info size={15} />}
            />
            {notices.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[12px] font-medium text-slate-300">No current notices</p>
                <p className="mx-auto mt-1 max-w-sm text-[11px] text-slate-500">
                  No published disruption currently lists this station as affected.
                </p>
              </div>
            ) : (
              notices.map((disruption) => (
                <DisruptionNotice key={disruption.id} disruption={disruption} />
              ))
            )}
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader title="Station information" icon={<Train size={15} />} />
            <dl className="divide-y divide-white/[0.05] text-[11.5px]">
              <InfoRow label="Platforms" value={station.platforms ?? "Not recorded"} />
              <InfoRow label="Facilities" value={station.facilities ?? "Not recorded"} />
              <InfoRow
                label="Connecting transport"
                value={station.connecting_transport ?? "Not recorded"}
                icon={<Bus size={11} />}
              />
              <InfoRow
                label="Coordinates"
                value={`${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}`}
                mono
              />
            </dl>
            <p className="border-t border-white/[0.06] px-4 py-2.5 text-[10px] leading-relaxed text-slate-500">
              Facility and platform details are only recorded where the operations team has
              verified them. Coordinates are approximate.
            </p>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <PanelHeader title="Location" subtitle="Approximate position" icon={<MapPin size={15} />} />
            <svg
              viewBox={`0 0 ${projector.width} ${projector.height}`}
              className="h-auto w-full bg-[#050a12]"
              role="img"
              aria-label={`Approximate location of ${station.name}`}
            >
              <rect width={projector.width} height={projector.height} fill="#050a12" />
              {Array.from({ length: 7 }).map((_, index) => {
                const x = (projector.width / 7) * index;
                const y = (projector.height / 7) * index;
                return (
                  <g key={index}>
                    <line x1={x} x2={x} y1={0} y2={projector.height} stroke="rgba(148,163,184,0.07)" />
                    <line x1={0} x2={projector.width} y1={y} y2={y} stroke="rgba(148,163,184,0.07)" />
                  </g>
                );
              })}
              {nearbyUnique.map((item) => {
                const point = projector.project(item.latitude, item.longitude);
                return (
                  <g key={item.id}>
                    <line
                      x1={projector.width / 2}
                      y1={projector.height / 2}
                      x2={point.x}
                      y2={point.y}
                      stroke={item.line_colour}
                      strokeOpacity={0.3}
                      strokeWidth={1}
                    />
                    <circle cx={point.x} cy={point.y} r={2.4} fill={item.line_colour} />
                    <text x={point.x + 5} y={point.y + 3} fontSize="7" fill="#64748b">
                      {item.name}
                    </text>
                  </g>
                );
              })}
              <circle cx={projector.width / 2} cy={projector.height / 2} r={5} fill="#ffffff" />
              <circle cx={projector.width / 2} cy={projector.height / 2} r={9} fill="none" stroke="#a878f7" strokeWidth={1.5} />
            </svg>
            <p className="border-t border-white/[0.06] px-4 py-2 text-[10px] text-slate-500">
              Nearby recorded stops on the same corridors.
            </p>
          </Panel>

          <Panel className="overflow-hidden">
            <ResourceLinks
              links={stationResources(station)}
              subtitle={`Official information, maps and references for ${station.name}`}
            />
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader title="Nearby stations" icon={<MapPin size={15} />} />
            <ul className="divide-y divide-white/[0.05]">
              {nearbyUnique.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/stations/${item.slug}`}
                    className="flex items-center gap-2 px-4 py-2 text-[11.5px] text-slate-300 hover:bg-white/[0.03] hover:text-white"
                  >
                    <span className="h-3 w-1 rounded-full" style={{ backgroundColor: item.line_colour }} />
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="font-mono text-[9.5px] text-slate-600">
                      {item.distance.toFixed(2)}°
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className={`max-w-[62%] text-right text-slate-300 ${mono ? "font-mono text-[10.5px]" : ""}`}>
        {icon ? <span className="mr-1 inline-flex align-middle text-slate-500">{icon}</span> : null}
        {value}
      </dd>
    </div>
  );
}
