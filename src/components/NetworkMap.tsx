"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Info, MapPin } from "lucide-react";
import type { MapLine } from "@/lib/types";
import {
  REGION_LABELS,
  VICTORIA_BOUNDS,
  createProjector,
  polyline,
} from "@/lib/geo";
import { cx } from "@/components/ui";
import { lineStatusLabel, statusClass } from "@/components/ui-helpers";

const METRO_BOUNDS = { west: 144.55, east: 145.18, south: -38.06, north: -37.55 };

export function NetworkMap({
  lines,
  openByLine = {},
}: {
  lines: MapLine[];
  openByLine?: Record<string, number>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(lines[0]?.id ?? null);
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null);

  const projector = useMemo(() => createProjector(VICTORIA_BOUNDS, 1000), []);
  const metro = useMemo(() => createProjector(METRO_BOUNDS, 340), []);
  const selected = lines.find((line) => line.id === selectedId) ?? null;

  const gridLines = useMemo(() => {
    const verticals: { x: number; label: string }[] = [];
    for (let lng = 141; lng <= 150; lng += 1) {
      verticals.push({ x: projector.project(-37, lng).x, label: `${lng}°E` });
    }
    const horizontals: { y: number; label: string }[] = [];
    for (let lat = -39; lat <= -34; lat += 1) {
      horizontals.push({ y: projector.project(lat, 145).y, label: `${Math.abs(lat)}°S` });
    }
    return { verticals, horizontals };
  }, [projector]);

  const metroLines = useMemo(
    () =>
      lines
        .map((line) => ({
          ...line,
          stations: line.stations.filter(
            (station) =>
              station.lng >= METRO_BOUNDS.west &&
              station.lng <= METRO_BOUNDS.east &&
              station.lat >= METRO_BOUNDS.south &&
              station.lat <= METRO_BOUNDS.north,
          ),
        }))
        .filter((line) => line.stations.length > 0),
    [lines],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
            <div>
              <p className="micro">Victorian regional corridors</p>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {lines.length} monitored lines · {lines.reduce((sum, line) => sum + line.stations.length, 0)} station references
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-[9.5px] font-semibold text-amber-200">
              <span className="size-1.5 rounded-full bg-brand-300" /> SCHEMATIC · APPROXIMATE
            </span>
          </div>

          <div className="relative bg-[#050a12]">
            <svg
              viewBox={`0 0 ${projector.width} ${projector.height}`}
              className="h-auto w-full"
              role="img"
              aria-label="Schematic map of Victorian regional railway corridors"
            >
              <defs>
                <radialGradient id="map-glow" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="#8f5ae8" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#050a12" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width={projector.width} height={projector.height} fill="#050a12" />
              <rect width={projector.width} height={projector.height} fill="url(#map-glow)" />

              {gridLines.verticals.map((line) => (
                <g key={line.label}>
                  <line
                    x1={line.x}
                    x2={line.x}
                    y1={0}
                    y2={projector.height}
                    stroke="rgba(148,163,184,0.07)"
                    strokeWidth={1}
                  />
                  <text x={line.x + 5} y={projector.height - 8} fill="#334155" fontSize="9" fontFamily="monospace">
                    {line.label}
                  </text>
                </g>
              ))}
              {gridLines.horizontals.map((line) => (
                <g key={line.label}>
                  <line
                    x1={0}
                    x2={projector.width}
                    y1={line.y}
                    y2={line.y}
                    stroke="rgba(148,163,184,0.07)"
                    strokeWidth={1}
                  />
                  <text x={8} y={line.y - 5} fill="#334155" fontSize="9" fontFamily="monospace">
                    {line.label}
                  </text>
                </g>
              ))}

              {REGION_LABELS.map((region) => {
                const point = projector.project(region.lat, region.lng);
                return (
                  <text
                    key={region.name}
                    x={point.x}
                    y={point.y}
                    fill="rgba(148,163,184,0.22)"
                    fontSize="11"
                    letterSpacing="3"
                    textAnchor="middle"
                  >
                    {region.name}
                  </text>
                );
              })}

              {lines.map((line) => {
                const points = line.stations.map((station) =>
                  projector.project(station.lat, station.lng),
                );
                const isSelected = line.id === selectedId;
                const dimmed = selectedId !== null && !isSelected;
                return (
                  <g key={line.id} opacity={dimmed ? 0.22 : 1}>
                    {isSelected ? (
                      <polyline
                        points={polyline(points)}
                        fill="none"
                        stroke={line.colour}
                        strokeWidth={9}
                        strokeOpacity={0.16}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    ) : null}
                    <polyline
                      points={polyline(points)}
                      fill="none"
                      stroke={line.colour}
                      strokeWidth={isSelected ? 2.6 : 1.9}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      className="cursor-pointer transition-all"
                      onClick={() => setSelectedId(line.id)}
                    />
                    {line.stations.map((station) => {
                      const point = projector.project(station.lat, station.lng);
                      return (
                        <circle
                          key={`${line.id}-${station.id}`}
                          cx={point.x}
                          cy={point.y}
                          r={isSelected && station.isTerminus ? 4.2 : isSelected ? 2.8 : 2.2}
                          fill={station.isTerminus ? "#ffffff" : line.colour}
                          stroke="#050a12"
                          strokeWidth={1}
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHover({ label: station.name, x: point.x, y: point.y })}
                          onMouseLeave={() => setHover(null)}
                          onClick={() => setSelectedId(line.id)}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {hover ? (
                <g pointerEvents="none">
                  <rect
                    x={Math.min(Math.max(hover.x - 60, 4), projector.width - 130)}
                    y={Math.max(hover.y - 34, 4)}
                    width={126}
                    height={22}
                    rx={4}
                    fill="rgba(8,13,24,0.95)"
                    stroke="rgba(168,120,247,0.4)"
                  />
                  <text
                    x={Math.min(Math.max(hover.x - 52, 12), projector.width - 122)}
                    y={Math.max(hover.y - 19, 19)}
                    fill="#e2e8f0"
                    fontSize="10"
                  >
                    {hover.label}
                  </text>
                </g>
              ) : null}
            </svg>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#050a12] to-transparent" />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md border border-white/10 bg-navy-950/80 px-2 py-1 text-[9.5px] text-slate-400 backdrop-blur">
              <Info size={10} /> Schematic corridor view — not to scale for navigation
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5">
              <p className="micro">Melbourne area detail</p>
              <p className="text-[10px] text-slate-500">144.55–145.18°E</p>
            </div>
            <svg
              viewBox={`0 0 ${metro.width} ${metro.height}`}
              className="h-auto w-full max-w-[520px]"
              role="img"
              aria-label="Enlarged view of railway corridors around Melbourne"
            >
              <rect width={metro.width} height={metro.height} fill="#050a12" />
              {metroLines.map((line) => {
                const points = line.stations.map((station) => metro.project(station.lat, station.lng));
                const dimmed = selectedId !== null && line.id !== selectedId;
                return (
                  <g key={line.id} opacity={dimmed ? 0.3 : 1}>
                    <polyline
                      points={polyline(points)}
                      fill="none"
                      stroke={line.colour}
                      strokeWidth={1.8}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {line.stations.map((station) => {
                      const point = metro.project(station.lat, station.lng);
                      return <circle key={station.id} cx={point.x} cy={point.y} r={2.2} fill={line.colour} />;
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="panel p-4">
            <p className="micro mb-2">Legend</p>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="size-2 rounded-full bg-white" /> Terminus station
              </li>
              <li className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="size-2 rounded-full bg-brand-400" /> Intermediate station
              </li>
              <li className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="h-0.5 w-4 bg-brand-400" /> Corridor alignment
              </li>
              <li className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="size-2 rounded-full bg-brand-300" /> Selected corridor
              </li>
            </ul>
            <p className="mt-3 border-t border-white/[0.07] pt-3 text-[10px] leading-relaxed text-slate-500">
              Station positions are approximate and provided for orientation only. No train
              positions are shown.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="panel overflow-hidden">
          <div className="border-b border-white/[0.07] px-4 py-3">
            <p className="micro">Corridors</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Select a line to inspect it</p>
          </div>
          <ul className="max-h-[300px] divide-y divide-white/[0.05] overflow-y-auto">
            {lines.map((line) => {
              const open = openByLine[line.id] ?? 0;
              return (
                <li key={line.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(line.id)}
                    className={cx(
                      "flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition",
                      line.id === selectedId ? "bg-brand-500/10" : "hover:bg-white/[0.04]",
                    )}
                  >
                    <span className="h-4 w-1 rounded-full" style={{ backgroundColor: line.colour }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-slate-200">
                        {line.name}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {line.stations.length} stops
                        {open > 0 ? ` · ${open} open notice${open === 1 ? "" : "s"}` : ""}
                      </span>
                    </span>
                    <span
                      className={cx(
                        "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                        statusClass(line.status),
                      )}
                    >
                      {lineStatusLabel(line.status)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-white/[0.07] px-4 py-3">
            <p className="micro">Selected corridor</p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-white">
              {selected?.name ?? "All lines"}
            </p>
          </div>
          {selected ? (
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className={cx("rounded-full border px-2 py-0.5 text-[9.5px] font-semibold", statusClass(selected.status))}>
                  {lineStatusLabel(selected.status)}
                </span>
                <Link
                  href={`/lines/${selected.slug}`}
                  className="flex items-center gap-1 text-[10.5px] font-semibold text-brand-300 hover:text-brand-200"
                >
                  Line details <ArrowUpRight size={11} />
                </Link>
              </div>
              <ol className="mt-3 max-h-[260px] space-y-0 overflow-y-auto pr-1">
                {selected.stations.map((station, index) => (
                  <li key={station.id} className="relative flex gap-2 pb-2 last:pb-0">
                    <span className="relative flex w-3 shrink-0 justify-center">
                      <span
                        className={cx(
                          "z-10 mt-1 size-1.5 rounded-full",
                          station.isTerminus ? "bg-white" : "bg-brand-400",
                        )}
                      />
                      {index < selected.stations.length - 1 ? (
                        <span className="absolute top-2 bottom-0 w-px bg-white/12" />
                      ) : null}
                    </span>
                    <Link
                      href={`/stations/${station.slug}`}
                      className="group -mt-0.5 min-w-0 flex-1 truncate text-[11.5px] text-slate-300 transition hover:text-brand-200"
                    >
                      {station.name}
                    </Link>
                  </li>
                ))}
              </ol>
              <p className="mt-3 flex items-center gap-1.5 border-t border-white/[0.07] pt-2 text-[10px] text-slate-500">
                <MapPin size={10} /> {openByLine[selected.id] ?? 0} open disruption notice
                {(openByLine[selected.id] ?? 0) === 1 ? "" : "s"} on this corridor
              </p>
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-[11.5px] text-slate-500">
              Select a corridor on the map.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
