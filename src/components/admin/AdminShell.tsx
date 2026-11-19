"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Route,
  ScrollText,
  Settings,
  TriangleAlert,
  Users,
  Webhook,
  X,
} from "lucide-react";
import { cx } from "@/components/ui";
import { logoutAction } from "@/app/admin/login/actions";
import { roleLabel } from "@/lib/labels";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: number;
  exact?: boolean;
  permission?: string;
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Operations overview", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: "Network",
    items: [
      { href: "/admin/lines", label: "Railway lines", icon: Route, permission: "network.manage" },
      { href: "/admin/stations", label: "Station directory", icon: MapPin, permission: "station.manage" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/disruptions", label: "Disruptions", icon: TriangleAlert, permission: "disruption.manage" },
      { href: "/admin/discord", label: "Discord notifications", icon: Webhook, permission: "integration.manage" },
      { href: "/admin/inform", label: "Inform email", icon: Mail, permission: "inform.review" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/users", label: "Users & roles", icon: Users, permission: "users.manage" },
      { href: "/admin/audit", label: "Audit log", icon: ScrollText, permission: "audit.view" },
      { href: "/admin/settings", label: "System settings", icon: Settings, permission: "system.manage" },
    ],
  },
];

export function AdminShell({
  user,
  children,
  pendingInform,
  activeDisruptions,
}: {
  user: { name: string; email: string; role: Role };
  children: React.ReactNode;
  pendingInform: number;
  activeDisruptions: number;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("vline-sidebar-collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat("en-AU", {
          timeZone: "Australia/Melbourne",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggle = () => {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("vline-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/-/g, " "));

  const badgeFor = (item: NavItem) => {
    if (item.href === "/admin/inform") return pendingInform;
    if (item.href === "/admin/disruptions") return activeDisruptions;
    return 0;
  };

  return (
    <div className="app-bg min-h-screen">
      <div className="flex min-h-screen">
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-navy-950/80 backdrop-blur-sm lg:hidden"
          />
        ) : null}

        <aside
          className={cx(
            "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.07] bg-navy-900/95 backdrop-blur-xl transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
            collapsed ? "w-[74px]" : "w-[248px]",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.07] px-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 font-mono text-[13px] font-bold text-white shadow-lg shadow-brand-900/40">
              V/
            </span>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-semibold tracking-wide text-white">
                  V/LINE CONTROL
                </p>
                <p className="truncate text-[9.5px] tracking-[0.1em] text-brand-300/80 uppercase">
                  Network operations
                </p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded-md p-1 text-slate-400 hover:bg-white/5 lg:hidden"
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2.5 py-3">
            {SECTIONS.map((section) => (
              <div key={section.title} className="mb-4">
                {!collapsed ? (
                  <p className="micro px-2.5 pb-1.5 text-[9px]">{section.title}</p>
                ) : (
                  <div className="mx-2 mb-2 h-px bg-white/[0.07]" />
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item);
                    const badge = badgeFor(item);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          className={cx(
                            "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition",
                            active
                              ? "bg-brand-500/15 text-white ring-1 ring-inset ring-brand-400/25"
                              : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100",
                            collapsed && "justify-center px-0",
                          )}
                        >
                          <Icon
                            size={16}
                            strokeWidth={1.9}
                            className={active ? "text-brand-300" : "text-slate-500 group-hover:text-slate-300"}
                          />
                          {!collapsed ? (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              {badge > 0 ? (
                                <span className="rounded-full bg-rose-400/15 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-rose-300">
                                  {badge}
                                </span>
                              ) : null}
                            </>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/[0.07] p-2.5">
            {!collapsed ? (
              <div className="mb-2 rounded-lg bg-white/[0.03] px-2.5 py-2">
                <p className="truncate text-[11.5px] font-semibold text-slate-200">{user.name}</p>
                <p className="truncate text-[10px] text-brand-300/90">{roleLabel(user.role)}</p>
              </div>
            ) : null}
            <Link
              href="/"
              className={cx(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] text-slate-400 transition hover:bg-white/5 hover:text-slate-200",
                collapsed && "justify-center px-0",
              )}
              title="Open public site"
            >
              <ExternalLink size={14} />
              {!collapsed ? "Public site" : null}
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className={cx(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300",
                  collapsed && "justify-center px-0",
                )}
                title="Sign out"
              >
                <LogOut size={14} />
                {!collapsed ? "Sign out" : null}
              </button>
            </form>
            <button
              type="button"
              onClick={toggle}
              className={cx(
                "mt-1 hidden w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-500 transition hover:bg-white/5 hover:text-slate-300 lg:flex",
                collapsed && "justify-center px-0",
              )}
            >
              <ChevronLeft size={14} className={cx("transition", collapsed && "rotate-180")} />
              {!collapsed ? "Collapse sidebar" : null}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/[0.07] bg-navy-950/80 px-4 backdrop-blur-xl sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-slate-300 hover:bg-white/5 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-slate-500 uppercase">
                <span>Console</span>
                {breadcrumbs.slice(1).map((crumb) => (
                  <span key={crumb} className="flex items-center gap-1.5">
                    <span className="text-slate-600">/</span>
                    <span className="text-slate-400">{crumb}</span>
                  </span>
                ))}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="live-dot" /> NETWORK MONITORING
                </span>
                <span className="hidden text-slate-600 sm:inline">·</span>
                <span className="hidden sm:inline">Independent platform · not an official V/Line service</span>
              </p>
            </div>
            <div className="hidden items-center gap-4 text-right sm:flex">
              <div>
                <p className="micro text-[8.5px]">Melbourne</p>
                <p className="font-mono text-[12.5px] text-slate-200" suppressHydrationWarning>
                  {clock || "--:--:--"}
                </p>
              </div>
              <div className="h-7 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-brand-500/15 text-[11px] font-semibold text-brand-200 ring-1 ring-inset ring-brand-400/25">
                  {user.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div className="hidden text-left md:block">
                  <p className="max-w-[140px] truncate text-[11.5px] font-medium text-slate-200">
                    {user.name}
                  </p>
                  <p className="text-[9.5px] text-slate-500">{roleLabel(user.role)}</p>
                </div>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[9.5px] font-semibold text-emerald-300">
              <Activity size={11} /> SYSTEM OK
            </span>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
