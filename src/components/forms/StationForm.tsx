"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice } from "@/components/ui";
import type { ActionState } from "@/lib/action-state";
import type { Line, Station } from "@/lib/types";

export function StationForm({
  action,
  lines,
  station,
  stationLineIds,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  lines: Line[];
  station?: Station | null;
  stationLineIds?: string[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: false });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={station?.id ?? ""} />
      {state.message ? <Notice tone={state.ok ? "ok" : "error"}>{state.message}</Notice> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Station name" htmlFor="name" error={state.errors?.name}>
          <input
            id="name"
            name="name"
            className="field"
            defaultValue={station?.name ?? ""}
            placeholder="e.g. Kyneton"
            required
          />
        </Field>
        <Field label="Suburb / locality" htmlFor="suburb" error={state.errors?.suburb}>
          <input id="suburb" name="suburb" className="field" defaultValue={station?.suburb ?? ""} />
        </Field>
        <Field
          label="Latitude"
          htmlFor="latitude"
          error={state.errors?.latitude}
          hint="Decimal degrees, e.g. -37.2444"
        >
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="0.0001"
            className="field font-mono"
            defaultValue={station?.latitude ?? ""}
            required
          />
        </Field>
        <Field
          label="Longitude"
          htmlFor="longitude"
          error={state.errors?.longitude}
          hint="Decimal degrees, e.g. 144.4531"
        >
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="0.0001"
            className="field font-mono"
            defaultValue={station?.longitude ?? ""}
            required
          />
        </Field>
        <Field label="Platforms" htmlFor="platforms" error={state.errors?.platforms} hint="Optional">
          <input
            id="platforms"
            name="platforms"
            className="field"
            defaultValue={station?.platforms ?? ""}
            placeholder="e.g. Platforms 1–2"
          />
        </Field>
        <Field
          label="Facilities"
          htmlFor="facilities"
          error={state.errors?.facilities}
          hint="Optional. Leave blank where details are not recorded."
        >
          <input
            id="facilities"
            name="facilities"
            className="field"
            defaultValue={station?.facilities ?? ""}
            placeholder="Staffed · Toilets · Parking"
          />
        </Field>
        <Field
          label="Connecting transport"
          htmlFor="connectingTransport"
          error={state.errors?.connectingTransport}
          hint="Optional. Local bus routes, coach connections, tram or metro."
          className="md:col-span-2"
        >
          <input
            id="connectingTransport"
            name="connectingTransport"
            className="field"
            defaultValue={station?.connecting_transport ?? ""}
          />
        </Field>
      </div>

      <div className="rounded-lg border border-white/[0.08] bg-navy-950/40 p-3">
        <p className="mb-2 text-[11.5px] font-semibold text-slate-300">
          Railway lines serving this station
        </p>
        {state.errors?.lineIds ? (
          <p className="mb-2 text-[10.5px] text-rose-300">{state.errors.lineIds}</p>
        ) : null}
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {lines.map((line) => (
            <label
              key={line.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] text-slate-300 hover:bg-white/[0.04]"
            >
              <input
                type="checkbox"
                name="lineIds"
                value={line.id}
                defaultChecked={stationLineIds?.includes(line.id)}
                className="size-3.5 accent-brand-500"
              />
              <span className="h-3 w-1 rounded-full" style={{ backgroundColor: line.colour }} />
              {line.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.07] pt-4">
        <Link href="/admin/stations" className="btn btn-ghost">
          Cancel
        </Link>
        <SubmitButton pendingLabel="Saving station…">
          {station ? "Save station" : "Create station"}
        </SubmitButton>
      </div>
    </form>
  );
}
