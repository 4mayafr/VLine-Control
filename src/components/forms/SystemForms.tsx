"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice } from "@/components/ui";
import { UPDATE_KINDS } from "@/lib/labels";
import type { ActionState } from "@/lib/action-state";
import type { Line } from "@/lib/types";

export function SettingsForm({
  action,
  settings,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  settings: Record<string, string>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: false });

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? <Notice tone={state.ok ? "ok" : "error"}>{state.message}</Notice> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Platform name" htmlFor="networkName" error={state.errors?.networkName}>
          <input
            id="networkName"
            name="networkName"
            className="field"
            defaultValue={settings.network_name ?? "V/LINE CONTROL"}
          />
        </Field>
        <Field
          label="Operations contact"
          htmlFor="contact"
          error={state.errors?.contact}
          hint="Displayed internally for escalation."
        >
          <input
            id="contact"
            name="contact"
            className="field"
            defaultValue={settings.notice_contact ?? ""}
          />
        </Field>
        <Field
          label="Public banner text"
          htmlFor="publicBanner"
          error={state.errors?.publicBanner}
          hint="Shown on the public site to describe the data source."
          className="md:col-span-2"
        >
          <input
            id="publicBanner"
            name="publicBanner"
            className="field"
            defaultValue={settings.public_banner ?? ""}
          />
        </Field>
        <Field
          label="Inform message retention (days)"
          htmlFor="retentionDays"
          error={state.errors?.retentionDays}
        >
          <input
            id="retentionDays"
            name="retentionDays"
            type="number"
            min={1}
            max={3650}
            className="field font-mono"
            defaultValue={settings.inform_retention_days ?? "90"}
          />
        </Field>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          {
            name: "autoPublish",
            label: "Auto-publish approved Inform updates",
            description: "Skips the manual publish step after approval.",
            checked: settings.disruption_auto_publish === "true",
          },
          {
            name: "discordDispatch",
            label: "Deliver Discord notifications",
            description: "Global switch for outbound Discord delivery.",
            checked: settings.discord_dispatch_enabled !== "false",
          },
          {
            name: "informEnabled",
            label: "Accept Inform email",
            description: "Allow the inbound ingestion endpoint to store messages.",
            checked: settings.inform_integration_enabled !== "false",
          },
        ].map((item) => (
          <label
            key={item.name}
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 bg-navy-950/40 px-3 py-2.5"
          >
            <input
              type="checkbox"
              name={item.name}
              defaultChecked={item.checked}
              className="mt-0.5 size-4 accent-brand-500"
            />
            <span>
              <span className="block text-[11.5px] font-medium text-slate-200">{item.label}</span>
              <span className="block text-[10px] text-slate-500">{item.description}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving settings…">Save settings</SubmitButton>
      </div>
    </form>
  );
}

export function UpdateForm({
  action,
  lines,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  lines: Line[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: false });

  return (
    <form action={formAction} className="space-y-3">
      {state.message ? <Notice tone={state.ok ? "ok" : "error"}>{state.message}</Notice> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Railway line" htmlFor="update-line">
          <select id="update-line" name="lineId" className="field" defaultValue="">
            <option value="">Network-wide</option>
            {lines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Update type" htmlFor="update-kind">
          <select id="update-kind" name="kind" className="field" defaultValue="notice">
            {UPDATE_KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title" htmlFor="update-title" error={state.errors?.title} className="sm:col-span-2">
          <input id="update-title" name="title" className="field" required />
        </Field>
        <Field label="Content" htmlFor="update-body" error={state.errors?.body} className="sm:col-span-2">
          <textarea id="update-body" name="body" className="field" rows={3} required />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-[11.5px] text-slate-300">
          <input type="checkbox" name="isPublished" defaultChecked className="size-4 accent-brand-500" />
          Publish immediately
        </label>
        <SubmitButton pendingLabel="Posting…">Post update</SubmitButton>
      </div>
    </form>
  );
}
