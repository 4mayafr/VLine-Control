"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice } from "@/components/ui";
import { LINE_STATUSES } from "@/lib/labels";
import type { ActionState } from "@/lib/action-state";
import type { Line } from "@/lib/types";

export function LineForm({
  action,
  line,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  line?: Line | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: false });
  const creating = !line;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="lineId" value={line?.id ?? "new"} />
      {state.message ? (
        <Notice tone={state.ok ? "ok" : "error"}>{state.message}</Notice>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Line name" htmlFor={`name-${line?.id ?? "new"}`} error={state.errors?.name}>
          <input
            id={`name-${line?.id ?? "new"}`}
            name="name"
            className="field"
            defaultValue={line?.name ?? ""}
            placeholder="e.g. Geelong Line"
            required
          />
        </Field>
        <Field label="Region" htmlFor={`region-${line?.id ?? "new"}`} error={state.errors?.region}>
          <input
            id={`region-${line?.id ?? "new"}`}
            name="region"
            className="field"
            defaultValue={line?.region ?? ""}
            placeholder="e.g. Barwon"
          />
        </Field>
        {creating ? (
          <>
            <Field label="Origin terminus" htmlFor="origin">
              <input id="origin" name="origin" className="field" placeholder="Southern Cross" />
            </Field>
            <Field label="Destination terminus" htmlFor="destination">
              <input id="destination" name="destination" className="field" placeholder="Waurn Ponds" />
            </Field>
          </>
        ) : null}
        <Field label="Status" htmlFor={`status-${line?.id ?? "new"}`} error={state.errors?.status}>
          <select
            id={`status-${line?.id ?? "new"}`}
            name="status"
            className="field"
            defaultValue={line?.status ?? "operational"}
          >
            {LINE_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Line colour"
          htmlFor={`colour-${line?.id ?? "new"}`}
          error={state.errors?.colour}
          hint="Six-digit hex, used on the map."
        >
          <input
            id={`colour-${line?.id ?? "new"}`}
            name="colour"
            className="field font-mono"
            defaultValue={line?.colour ?? "#8f5ae8"}
            pattern="^#[0-9a-fA-F]{6}$"
            required
          />
        </Field>
        <Field
          label="Description"
          htmlFor={`description-${line?.id ?? "new"}`}
          error={state.errors?.description}
          className="md:col-span-2"
        >
          <textarea
            id={`description-${line?.id ?? "new"}`}
            name="description"
            className="field"
            defaultValue={line?.description ?? ""}
            rows={3}
          />
        </Field>
        <Field
          label="Service pattern"
          htmlFor={`pattern-${line?.id ?? "new"}`}
          error={state.errors?.servicePattern}
          hint="Frequency and timetable notes shown on the public line page."
          className="md:col-span-2"
        >
          <textarea
            id={`pattern-${line?.id ?? "new"}`}
            name="servicePattern"
            className="field"
            defaultValue={line?.service_pattern ?? ""}
            rows={2}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving line…">
          {creating ? "Create line" : "Save line"}
        </SubmitButton>
      </div>
    </form>
  );
}
