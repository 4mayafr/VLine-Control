import Link from "next/link";
import { ArrowUpRight, Bus, Clock, MapPin } from "lucide-react";
import { cx } from "@/components/ui";
import { SeverityChip, StatusChip } from "@/components/ui";
import { categoryLabel } from "@/lib/labels";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { DisruptionView } from "@/lib/types";

export function DisruptionNotice({
  disruption,
  showLine = true,
  compact = false,
}: {
  disruption: DisruptionView;
  showLine?: boolean;
  compact?: boolean;
}) {
  return (
    <article className="group border-b border-white/[0.06] px-4 py-3.5 last:border-0 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        {showLine ? (
          <Link
            href={`/lines/${disruption.line_slug}`}
            className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wide text-slate-300 uppercase hover:text-white"
          >
            <span
              className="h-2.5 w-1 rounded-full"
              style={{ backgroundColor: disruption.line_colour ?? "#8f5ae8" }}
            />
            {disruption.line_name ?? "Network-wide"}
          </Link>
        ) : null}
        <span className="text-[10px] text-slate-600">·</span>
        <span className="text-[10.5px] text-slate-500">{categoryLabel(disruption.category)}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <SeverityChip value={disruption.severity} />
          <StatusChip value={disruption.status} />
        </div>
      </div>

      <h3 className="mt-1.5 text-[13.5px] leading-snug font-semibold text-slate-100">
        <Link href={`/disruptions?line=${disruption.line_slug ?? ""}`} className="hover:text-brand-200">
          {disruption.title}
        </Link>
      </h3>

      {!compact ? (
        <p className="mt-1 line-clamp-3 text-[11.5px] leading-relaxed text-slate-400">
          {disruption.description}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={11} /> Started {formatDateTime(disruption.starts_at)}
        </span>
        {disruption.expected_resolution_at ? (
          <span className="inline-flex items-center gap-1.5">
            <ArrowUpRight size={11} /> Expected resolution {relativeTime(disruption.expected_resolution_at)}
          </span>
        ) : null}
        {disruption.station_count > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={11} /> {disruption.station_count} station
            {disruption.station_count === 1 ? "" : "s"} affected
          </span>
        ) : null}
        {disruption.replacement_transport ? (
          <span className="inline-flex items-center gap-1.5 text-amber-300/90">
            <Bus size={11} /> Replacement transport
          </span>
        ) : null}
      </div>

      {!compact && disruption.station_names.length > 0 ? (
        <p className={cx("mt-2 text-[10.5px] leading-relaxed text-slate-500")}>
          <span className="text-slate-400">Affected:</span>{" "}
          {disruption.station_names.slice(0, 8).join(", ")}
          {disruption.station_names.length > 8
            ? ` +${disruption.station_names.length - 8} more`
            : ""}
        </p>
      ) : null}
    </article>
  );
}
