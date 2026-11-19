"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice } from "@/components/ui";
import { CATEGORIES, SEVERITIES } from "@/lib/labels";
import type { ActionState } from "@/lib/action-state";
import type { Line, Webhook } from "@/lib/types";

export function WebhookForm({
  action,
  webhook,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  webhook?: Webhook | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: false });

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={webhook?.id ?? ""} />
      {state.message ? <Notice tone={state.ok ? "ok" : "error"}>{state.message}</Notice> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Destination name" htmlFor={`wname-${webhook?.id ?? "new"}`} error={state.errors?.name}>
          <input
            id={`wname-${webhook?.id ?? "new"}`}
            name="name"
            className="field"
            defaultValue={webhook?.name ?? ""}
            placeholder="e.g. Geelong line alerts"
            required
          />
        </Field>
        <Field label="Channel hint" htmlFor={`hint-${webhook?.id ?? "new"}`} hint="Optional label such as #network-alerts">
          <input
            id={`hint-${webhook?.id ?? "new"}`}
            name="channelHint"
            className="field"
            defaultValue={webhook?.channel_hint ?? ""}
            placeholder="#network-alerts"
          />
        </Field>
        <Field
          label={webhook ? "Replace webhook URL" : "Webhook URL"}
          htmlFor={`url-${webhook?.id ?? "new"}`}
          error={state.errors?.url}
          hint={
            webhook
              ? "Leave blank to keep the stored URL. Values are encrypted at rest and never returned to the browser."
              : "https://discord.com/api/webhooks/<id>/<token> — encrypted at rest."
          }
          className="sm:col-span-2"
        >
          <input
            id={`url-${webhook?.id ?? "new"}`}
            name="url"
            type="password"
            autoComplete="off"
            className="field font-mono"
            placeholder={webhook ? "•••••••• (unchanged)" : "https://discord.com/api/webhooks/…"}
          />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-navy-950/40 px-3 py-2">
        <input
          type="checkbox"
          name="isEnabled"
          defaultChecked={webhook ? webhook.is_enabled === 1 : true}
          className="size-4 accent-brand-500"
        />
        <span className="text-[11.5px] text-slate-300">
          Enable delivery for this destination
        </span>
      </label>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving destination…">
          {webhook ? "Save destination" : "Add destination"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function RuleForm({
  action,
  webhooks,
  lines,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  webhooks: Webhook[];
  lines: Line[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: false });

  return (
    <form action={formAction} className="space-y-3">
      {state.message ? <Notice tone={state.ok ? "ok" : "error"}>{state.message}</Notice> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Send to" htmlFor="rule-webhook" error={state.errors?.webhookId}>
          <select id="rule-webhook" name="webhookId" className="field" required>
            <option value="">Select a destination…</option>
            {webhooks.map((webhook) => (
              <option key={webhook.id} value={webhook.id}>
                {webhook.name}
                {webhook.is_enabled === 1 ? "" : " (disabled)"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Railway line" htmlFor="rule-line" error={state.errors?.lineId}>
          <select id="rule-line" name="lineId" className="field">
            <option value="">All lines</option>
            {lines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Minimum severity"
          htmlFor="rule-severity"
          error={state.errors?.minSeverity}
          hint="Only disruptions at or above this level are sent."
        >
          <select id="rule-severity" name="minSeverity" className="field" defaultValue="medium">
            {SEVERITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-navy-950/40 px-3 py-2">
            <input
              type="checkbox"
              name="notifyOnResolve"
              defaultChecked
              className="size-4 accent-brand-500"
            />
            <span className="text-[11.5px] text-slate-300">Notify when resolved</span>
          </label>
        </div>
      </div>

      <fieldset className="rounded-lg border border-white/[0.08] bg-navy-950/40 p-3">
        <legend className="px-1 text-[10px] tracking-[0.12em] text-slate-500 uppercase">
          Trigger categories
        </legend>
        <p className="mb-2 text-[10.5px] text-slate-500">
          Leave every box clear to include all categories.
        </p>
        <div className="grid gap-1 sm:grid-cols-2">
          {CATEGORIES.map((category) => (
            <label
              key={category.value}
              className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[11.5px] text-slate-300 hover:bg-white/[0.04]"
            >
              <input
                type="checkbox"
                name="categories"
                value={category.value}
                className="size-3.5 accent-brand-500"
              />
              {category.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <KeyRound size={10} /> Rules apply to published disruptions only.
        </p>
        <SubmitButton pendingLabel="Adding rule…">Add routing rule</SubmitButton>
      </div>
    </form>
  );
}
