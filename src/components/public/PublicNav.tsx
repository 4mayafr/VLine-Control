"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Menu, ShieldCheck, X } from "lucide-react";
import { cx } from "@/components/ui";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/network", label: "Network map" },
  { href: "/stations", label: "Stations" },
  { href: "/disruptions", label: "Service status" },
];

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-navy-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 font-mono text-[13px] font-bold text-white shadow-lg shadow-brand-900/40">
            V/
          </span>
          <span className="hidden sm:block">
            <span className="block text-[12.5px] font-semibold tracking-wide text-white">
              V/LINE CONTROL
            </span>
            <span className="block text-[9px] tracking-[0.16em] text-brand-300/80 uppercase">
              Connecting Victoria
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cx(
                "rounded-lg px-3 py-1.5 text-[12px] font-medium transition",
                isActive(link.href)
                  ? "bg-white/[0.06] text-white"
                  : "text-slate-400 hover:text-slate-100",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <a
            href="https://www.vline.com.au"
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-ghost hidden sm:inline-flex"
          >
            Official V/Line <ExternalLink size={12} />
          </a>
          <Link href="/admin" className="btn btn-primary">
            <ShieldCheck size={14} /> <span className="hidden sm:inline">Console</span>
          </Link>
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-300 hover:bg-white/5 md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-white/[0.07] px-4 py-2 md:hidden" aria-label="Mobile">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cx(
                "block rounded-lg px-3 py-2 text-[13px]",
                isActive(link.href) ? "bg-white/[0.06] text-white" : "text-slate-400",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
