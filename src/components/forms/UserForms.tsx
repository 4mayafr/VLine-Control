"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice } from "@/components/ui";
import { ROLES } from "@/lib/labels";
import type { ActionState } from "@/lib/action-state";
import type { Role, User } from "@/lib/types";

export function UserCreateForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: false });
  return (
    <form action={formAction} className="space-y-3">
      {state.message ? <Notice tone={state.ok ? "ok" : "error"}>{state.message}</Notice> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" htmlFor="new-name" error={state.errors?.name}>
          <input id="new-name" name="name" className="field" required />
        </Field>
        <Field label="Email" htmlFor="new-email" error={state.errors?.email}>
          <input id="new-email" name="email" type="email" className="field" required />
        </Field>
        <Field label="Role" htmlFor="new-role" error={state.errors?.role}>
          <select id="new-role" name="role" className="field" defaultValue="read_only">
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Initial password"
          htmlFor="new-password"
          error={state.errors?.password}
          hint="At least 10 characters. Share it through a secure channel."
        >
          <input id="new-password" name="password" type="password" className="field" required minLength={10} />
        </Field>
      </div>
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Creating user…">Create user</SubmitButton>
      </div>
    </form>
  );
}

export function UserEditForm({
  action,
  passwordAction,
  user,
  isSelf,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  passwordAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  user: User;
  isSelf: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: false });
  const [passwordState, passwordFormAction] = useActionState<ActionState, FormData>(
    passwordAction,
    { ok: false },
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="userId" value={user.id} />
        {state.message ? <Notice tone={state.ok ? "ok" : "error"}>{state.message}</Notice> : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name" htmlFor={`name-${user.id}`} error={state.errors?.name}>
            <input id={`name-${user.id}`} name="name" className="field" defaultValue={user.name} />
          </Field>
          <Field label="Role" htmlFor={`role-${user.id}`} error={state.errors?.role}>
            <select
              id={`role-${user.id}`}
              name="role"
              className="field"
              defaultValue={user.role as Role}
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-navy-950/40 px-3 py-2">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={user.is_active === 1}
                className="size-4 accent-brand-500"
              />
              <span className="text-[11.5px] text-slate-300">Account active</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-slate-500">
            {isSelf ? "You cannot deactivate your own account." : `Created ${new Date(user.created_at).toLocaleDateString("en-AU")}`}
          </p>
          <SubmitButton pendingLabel="Saving…">Save user</SubmitButton>
        </div>
      </form>

      <form
        action={passwordFormAction}
        className="space-y-2 rounded-lg border border-white/[0.08] bg-navy-950/40 p-3"
      >
        <input type="hidden" name="userId" value={user.id} />
        <p className="text-[11px] font-semibold text-slate-300">Reset password</p>
        {passwordState.message ? (
          <Notice tone={passwordState.ok ? "ok" : "error"}>{passwordState.message}</Notice>
        ) : null}
        <div className="flex flex-wrap items-end gap-2">
          <Field
            label="New password"
            htmlFor={`pw-${user.id}`}
            error={passwordState.errors?.password}
            className="min-w-[220px] flex-1"
          >
            <input
              id={`pw-${user.id}`}
              name="password"
              type="password"
              minLength={10}
              className="field"
              required
            />
          </Field>
          <SubmitButton variant="ghost" pendingLabel="Updating…">
            Set password
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
