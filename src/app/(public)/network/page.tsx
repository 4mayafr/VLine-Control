import type { Metadata } from "next";
import { Info, Route } from "lucide-react";
import { NetworkMap } from "@/components/NetworkMap";
import { Panel, PanelHeader, Pill, SectionHeading } from "@/components/ui";
import { getMapLines, listLines } from "@/lib/repo/lines";
import { listDisruptions } from "@/lib/repo/disruptions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Network map" };

export default function NetworkPage() {
  const mapLines = getMapLines();
  const lines = listLines();
  const open = listDisruptions({ publishedOnly: true, limit: 200 }).filter(
    (disruption) => disruption.status !== "resolved",
  );
  const openByLine = open.reduce<Record<string, number>>((acc, disruption) => {
    if (disruption.line_id) acc[disruption.line_id] = (acc[disruption.line_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <SectionHeading
        eyebrow="Network overview"
        title="Victorian regional corridor map"
        description="Twelve monitored regional corridors, shown with their recorded station locations. Select a corridor to inspect its stops and current notices."
        action={
          <div className="flex items-center gap-2">
            <Pill tone="brand" dot>
              {lines.length} corridors
            </Pill>
            <Pill tone="warn">Schematic</Pill>
          </div>
        }
      />

      <div className="mt-5">
        <NetworkMap lines={mapLines} openByLine={openByLine} />
      </div>

      <Panel className="mt-4 overflow-hidden">
        <PanelHeader
          title="How to read this map"
          subtitle="Corridor alignment and data limitations"
          icon={<Info size={15} />}
        />
        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-200">Station positions</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Stations are plotted at approximate latitude and longitude. Interchange stations
              shared by several corridors appear once, with each corridor passing through them.
            </p>
          </div>
          <div>
            <p className="text-[11.5px] font-semibold text-slate-200">No live tracking</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              The map deliberately does not show train positions or predicted arrival times. No
              live operational feed is connected in this environment.
            </p>
          </div>
          <div>
            <p className="text-[11.5px] font-semibold text-slate-200">Corridor status</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Status flags are editorial records maintained in the operations console, not
              automatic feeds. They are entered by this instance&apos;s operators.
            </p>
          </div>
        </div>
      </Panel>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {lines.map((line) => (
          <div key={line.id} className="panel p-3.5">
            <div className="flex items-center gap-2">
              <Route size={12} style={{ color: line.colour }} />
              <p className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-slate-200">
                {line.name}
              </p>
            </div>
            <p className="mt-1 truncate text-[10px] text-slate-500">
              {line.origin} → {line.destination}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
