import { ChevronDown, UserPlus } from "lucide-react";
import { Panel, PanelHeader, Pill, SectionHeading, StatusChip } from "@/components/ui";
import { UserCreateForm, UserEditForm } from "@/components/forms/UserForms";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { requireUser } from "@/lib/auth";
import { can, ROLE_PERMISSIONS, PERMISSION_LABELS } from "@/lib/rbac";
import { listUsers } from "@/lib/repo/users";
import { roleLabel, ROLES } from "@/lib/labels";
import { formatDateTime, initials } from "@/lib/format";
import {
  createUserAction,
  resetPasswordAction,
  updateUserAction,
} from "@/app/admin/users/actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await requireUser();
  if (!can(user.role, "users.manage")) {
    return <AccessDenied role={user.role} permission="users.manage" />;
  }

  const users = listUsers();

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="System"
        title="Users & roles"
        description="Role-based access control. Every change to a user account is written to the audit log."
        action={<Pill tone="brand">{users.length} accounts</Pill>}
      />

      <Panel className="overflow-hidden">
        <PanelHeader title="Accounts" subtitle="Roles determine what each user can do" icon={<UserPlus size={15} />} />
        <div className="divide-y divide-white/[0.06]">
          {users.map((account) => (
            <div key={account.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-500/15 text-[10.5px] font-semibold text-brand-200 ring-1 ring-inset ring-brand-400/25">
                  {initials(account.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12.5px] font-semibold text-slate-100">{account.name}</p>
                    {account.id === user.id ? <Pill tone="brand">You</Pill> : null}
                    <StatusChip
                      value={account.is_active === 1 ? "approved" : "rejected"}
                      label={account.is_active === 1 ? "Active" : "Deactivated"}
                    />
                  </div>
                  <p className="mt-0.5 truncate text-[10.5px] text-slate-500">
                    {account.email} · {roleLabel(account.role)} ·{" "}
                    {account.last_login_at
                      ? `last sign-in ${formatDateTime(account.last_login_at)}`
                      : "never signed in"}
                  </p>
                </div>
                <details className="group">
                  <summary className="inline-flex cursor-pointer items-center gap-1 text-[10.5px] font-semibold text-brand-300 hover:text-brand-200">
                    <ChevronDown size={11} className="transition group-open:rotate-180" /> Manage
                  </summary>
                  <div className="mt-3 w-full rounded-lg border border-white/[0.07] bg-navy-950/40 p-3">
                    <UserEditForm
                      action={updateUserAction}
                      passwordAction={resetPasswordAction}
                      user={account}
                      isSelf={account.id === user.id}
                    />
                  </div>
                </details>
              </div>
              <p className="mt-1.5 text-[9.5px] leading-relaxed text-slate-600">
                Grants: {ROLE_PERMISSIONS[account.role].map((permission) => PERMISSION_LABELS[permission]).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel className="overflow-hidden">
          <PanelHeader title="Create a user" subtitle="Accounts are created with an initial password" />
          <div className="p-4">
            <UserCreateForm action={createUserAction} />
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Role definitions" subtitle="Least-privilege model" />
          <ul className="divide-y divide-white/[0.05]">
            {ROLES.map((role) => (
              <li key={role.value} className="px-4 py-2.5">
                <p className="text-[11.5px] font-semibold text-slate-200">{role.label}</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">{role.summary}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
