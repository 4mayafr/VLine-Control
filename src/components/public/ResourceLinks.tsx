import { ExternalLink, Globe, MapPin, Train } from "lucide-react";
import { cx } from "@/components/ui";
import type { ResourceLink } from "@/lib/resources";

const ICONS = {
  official: Train,
  reference: Globe,
  map: MapPin,
};

export function ResourceLinks({
  links,
  title = "Official resources & references",
  subtitle,
}: {
  links: ResourceLink[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="border-b border-white/[0.07] px-4 py-3">
        <p className="text-[12.5px] font-semibold text-slate-100">{title}</p>
        {subtitle ? <p className="mt-0.5 text-[10.5px] text-slate-500">{subtitle}</p> : null}
      </div>
      <ul className="divide-y divide-white/[0.05]">
        {links.map((link) => {
          const Icon = ICONS[link.kind];
          return (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-start gap-2.5 px-4 py-2.5 transition hover:bg-white/[0.03]"
              >
                <span
                  className={cx(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md ring-1 ring-inset",
                    link.kind === "official"
                      ? "bg-brand-500/12 text-brand-300 ring-brand-400/20"
                      : "bg-white/[0.04] text-slate-400 ring-white/10",
                  )}
                >
                  <Icon size={12} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-[11.5px] font-medium text-slate-200 group-hover:text-white">
                    <span className="truncate">{link.label}</span>
                    <ExternalLink size={10} className="shrink-0 text-slate-600" />
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">
                    {link.description}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-white/[0.06] px-4 py-2 text-[9.5px] leading-relaxed text-slate-600">
        External links open the provider&apos;s website. V/LINE CONTROL is independent and is not
        responsible for their content or accuracy.
      </p>
    </div>
  );
}
