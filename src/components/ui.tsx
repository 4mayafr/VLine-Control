import Link from "next/link";
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { severityLabel, statusClass, statusLabelOf } from "./ui-helpers";

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export function Panel({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return <Tag className={cx("panel", className)}>{children}</Tag>;
}

export function PanelHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid size-8 place-items-center rounded-lg bg-brand-500/12 text-brand-300 ring-1 ring-inset ring-brand-400/20">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-[13.5px] font-semibold tracking-tight text-slate-100">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[11.5px] text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Pill({
  children,
  tone = "slate",
  dot,
}: {
  children: ReactNode;
  tone?: "slate" | "brand" | "ok" | "warn" | "danger" | "info";
  dot?: boolean;
}) {
  const tones: Record<string, string> = {
    slate: "border-slate-400/25 bg-slate-400/10 text-slate-300",
    brand: "border-brand-400/30 bg-brand-500/12 text-brand-200",
    ok: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    warn: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    danger: "border-rose-400/25 bg-rose-400/10 text-rose-300",
    info: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold tracking-wide",
        tones[tone],
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function StatusChip({ value, label }: { value: string; label?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold",
        statusClass(value),
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? statusLabelOf(value)}
    </span>
  );
}

export function SeverityChip({ value }: { value: string }) {
  return <StatusChip value={value} label={severityLabel(value)} />;
}

export function Kpi({
  label,
  value,
  hint,
  icon,
  accent = "brand",
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: "brand" | "ok" | "warn" | "danger" | "info";
  trend?: string;
}) {
  const accents: Record<string, string> = {
    brand: "text-brand-300 bg-brand-500/10 ring-brand-400/20",
    ok: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20",
    warn: "text-amber-300 bg-amber-400/10 ring-amber-400/20",
    danger: "text-rose-300 bg-rose-400/10 ring-rose-400/20",
    info: "text-sky-300 bg-sky-400/10 ring-sky-400/20",
  };
  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="micro">{label}</p>
        {icon ? (
          <span className={cx("grid size-7 place-items-center rounded-lg ring-1 ring-inset", accents[accent])}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2.5 font-mono text-2xl leading-none font-semibold tracking-tight text-white">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {trend ? (
          <span className="text-[10.5px] font-semibold text-brand-300">{trend}</span>
        ) : null}
        {hint ? <span className="text-[10.5px] text-slate-400">{hint}</span> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <span className="grid size-10 place-items-center rounded-xl bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-white/10">
        {icon ?? <Inbox size={18} />}
      </span>
      <p className="text-[13px] font-semibold text-slate-200">{title}</p>
      <p className="max-w-sm text-[11.5px] leading-relaxed text-slate-400">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "ok" | "error" | "info" | "warn";
  children: ReactNode;
}) {
  const tones = {
    ok: "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200",
    error: "border-rose-400/30 bg-rose-400/[0.08] text-rose-200",
    info: "border-sky-400/25 bg-sky-400/[0.07] text-sky-200",
    warn: "border-amber-400/25 bg-amber-400/[0.07] text-amber-200",
  };
  return (
    <div
      role="status"
      className={cx("rounded-lg border px-3 py-2 text-[12px] leading-relaxed", tones[tone])}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="micro">{eyebrow}</p> : null}
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:text-[22px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-slate-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cx("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[11.5px] font-semibold text-slate-300">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[10.5px] font-medium text-rose-300">{error}</p>
      ) : hint ? (
        <p className="text-[10.5px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function TopLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      className="text-[11.5px] font-semibold text-brand-300 transition hover:text-brand-200"
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      {children}
    </Link>
  );
}

export function MiniBar({
  value,
  max,
  colour = "#a878f7",
}: {
  value: number;
  max: number;
  colour?: string;
}) {
  const width = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${width}%`, backgroundColor: colour }}
      />
    </div>
  );
}
