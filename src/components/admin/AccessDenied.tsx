import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Panel } from "@/components/ui";
import { PERMISSION_LABELS, ROLE_PERMISSIONS, type Permission } from "@/lib/rbac";
import { roleLabel } from "@/lib/labels";
import type { Role } from "@/lib/types";

export function AccessDenied({ role, permission }: { role: Role; permission: Permission }) {
  return (
    <div className="mx-auto max-w-xl py-10">
      <Panel className="p-6 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-400/25">
          <ShieldAlert size={19} />
        </span>
        <h1 className="mt-3 text-[15px] font-semibold text-white">Access restricted</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
          The <span className="text-slate-200">{roleLabel(role)}</span> role does not include the{" "}
          <span className="text-slate-200">{PERMISSION_LABELS[permission]}</span> permission.
        </p>
        <p className="mt-3 rounded-lg border border-white/[0.08] bg-navy-950/50 px-3 py-2 text-left text-[10.5px] text-slate-500">
          This role grants:{" "}
          {ROLE_PERMISSIONS[role].map((item) => PERMISSION_LABELS[item]).join(" · ")}
        </p>
        <Link href="/admin" className="btn btn-ghost mt-4">
          Return to overview
        </Link>
      </Panel>
    </div>
  );
}
