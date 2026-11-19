"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { Notice } from "@/components/ui";
import type { ActionState } from "@/lib/action-state";

export function LoginForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: false });
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="space-y-3.5">
      {state.message ? <Notice tone="error">{state.message}</Notice> : null}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-[11.5px] font-semibold text-slate-300">
          Account name or email
        </label>
        <div className="relative">
          <Mail size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
          <input
            id="email"
            name="email"
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            className="field pl-9"
            placeholder="admin"
          />
        </div>
        {state.errors?.email ? (
          <p className="text-[10.5px] text-rose-300">{state.errors.email}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-[11.5px] font-semibold text-slate-300">
          Password
        </label>
        <div className="relative">
          <Lock size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500" />
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="field pr-10 pl-9"
            placeholder="••••••••••"
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-300"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {state.errors?.password ? (
          <p className="text-[10.5px] text-rose-300">{state.errors.password}</p>
        ) : null}
      </div>

      <SubmitButton className="w-full justify-center" pendingLabel="Authenticating…">
        Sign in to console
      </SubmitButton>
    </form>
  );
}
