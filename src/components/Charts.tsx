import { formatDate } from "@/lib/format";

export function TrendBars({
  data,
  colour = "#a878f7",
  height = 120,
}: {
  data: { date: string; count: number }[];
  colour?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((point) => point.count));
  const barWidth = 100 / Math.max(data.length, 1);
  return (
    <div>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Disruption reports over the last 14 days"
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1="0"
            x2="100"
            y1={height * fraction}
            y2={height * fraction}
            stroke="rgba(148,163,184,0.12)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {data.map((point, index) => {
          const barHeight = (point.count / max) * (height - 12);
          return (
            <g key={point.date}>
              <rect
                x={index * barWidth + barWidth * 0.22}
                y={height - barHeight - 2}
                width={barWidth * 0.56}
                height={Math.max(barHeight, 1)}
                rx="1.2"
                fill={point.count === 0 ? "rgba(148,163,184,0.18)" : colour}
                opacity={point.count === 0 ? 1 : 0.85}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[9.5px] text-slate-500">
        <span>{formatDate(data[0]?.date)}</span>
        <span>{formatDate(data[data.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

export function Donut({
  segments,
  centreLabel,
  centreValue,
  size = 132,
}: {
  segments: { label: string; value: number; colour: string }[];
  centreLabel: string;
  centreValue: string;
  size?: number;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="11" />
          {total > 0 &&
            segments.map((segment) => {
              const length = (segment.value / total) * circumference;
              const circle = (
                <circle
                  key={segment.label}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={segment.colour}
                  strokeWidth="11"
                  strokeDasharray={`${Math.max(length - 1.5, 0)} ${circumference}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
              offset += length;
              return circle;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-semibold text-white">{centreValue}</span>
          <span className="micro mt-0.5 text-[8.5px]">{centreLabel}</span>
        </div>
      </div>
      <ul className="space-y-1.5">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-[11.5px] text-slate-300">
            <span className="size-2 rounded-sm" style={{ backgroundColor: segment.colour }} />
            <span className="min-w-0 flex-1 truncate">{segment.label}</span>
            <span className="font-mono text-[11px] text-slate-400">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DeliveryMeter({
  delivered,
  failed,
  total,
}: {
  delivered: number;
  failed: number;
  total: number;
}) {
  const deliveredPct = total > 0 ? (delivered / total) * 100 : 0;
  const failedPct = total > 0 ? (failed / total) * 100 : 0;
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full bg-emerald-400/80" style={{ width: `${deliveredPct}%` }} />
        <div className="h-full bg-rose-400/80" style={{ width: `${failedPct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10.5px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-400" /> {delivered} delivered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-rose-400" /> {failed} failed
        </span>
      </div>
    </div>
  );
}

export function StatusBars({
  rows,
}: {
  rows: { label: string; value: number; colour: string; hint?: string }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-[11.5px]">
            <span className="truncate text-slate-300">{row.label}</span>
            <span className="font-mono text-[11px] text-slate-400">{row.hint ?? row.value}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.colour }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
