"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice, cx } from "@/components/ui";
import { CATEGORIES, DISRUPTION_STATUSES, SEVERITIES } from "@/lib/labels";
import { isoForDateTimeLocal } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";
import type { DisruptionView, Line } from "@/lib/types";

export function DisruptionForm({
  action,
  lines,
  stations,
  disruption,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  lines: Line[];
  stations: { id: string; name: string; line_ids: string }[];
  disruption?: DisruptionView | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: false });
  const [lineId, setLineId] = useState(disruption?.line_id ?? lines[0]?.id ?? "");
  const initialStations = disruption
    ? (JSON.parse(disruption.affected_stations) as string[])
    : [];
  const [selectedStations, setSelectedStations] = useState<string[]>(initialStations);
  const [published, setPublished] = useState(disruption ? disruption.is_published === 1 : false);
  const [status, setStatus] = useState(disruption?.status ?? "active");
  const [severity, setSeverity] = useState(disruption?.severity ?? "medium");
  const [category, setCategory] = useState(disruption?.category ?? "delays");

  const visibleStations = stations.filter((station) =>
    lineId ? station.line_ids.split("|").includes(lineId) : true,
  );

  const toggleStation = (id: string) => {
    setSelectedStations((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={disruption?.id ?? ""} />
      {selectedStations.map((id) => (
        <input key={id} type="hidden" name="affectedStations" value={id} />
      ))}

      {state.message ? (
        <Notice tone={state.ok ? "ok" : "error"}>
          <span className="flex items-start gap-2">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            {state.message}
          </span>
        </Notice>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Railway line" htmlFor="lineId" error={state.errors?.lineId} className="md:col-span-2">
          <select
            id="lineId"
            name="lineId"
            className="field"
            value={lineId}
            onChange={(event) => {
              setLineId(event.target.value);
              setSelectedStations([]);
            }}
          >
            <option value="">Network-wide</option>
            {lines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title" htmlFor="title" error={state.errors?.title} className="md:col-span-2">
          <input
            id="title"
            name="title"
            className="field"
            defaultValue={disruption?.title ?? ""}
            placeholder="e.g. Signal fault at North Geelong"
            maxLength={160}
            required
          />
        </Field>

        <Field label="Category" htmlFor="category" error={state.errors?.category}>
          <select
            id="category"
            name="category"
            className="field"
            value={category}
            onChange={(event) => setCategory(event.target.value as typeof category)}
          >
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Severity" htmlFor="severity" error={state.errors?.severity}>
          <select
            id="severity"
            name="severity"
            className="field"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as typeof severity)}
          >
            {SEVERITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} — {option.description}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          error={state.errors?.description}
          hint="Shown on the public site and in Discord embeds. Describe impact and what passengers should do."
          className="md:col-span-2"
        >
          <textarea
            id="description"
            name="description"
            className="field min-h-[120px]"
            defaultValue={disruption?.description ?? ""}
            required
          />
        </Field>

        <Field label="Start time" htmlFor="startsAt" error={state.errors?.startsAt}>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            className="field"
            defaultValue={
              isoForDateTimeLocal(disruption?.starts_at) || isoForDateTimeLocal(new Date().toISOString())
            }
            required
          />
        </Field>

        <Field
          label="Expected resolution"
          htmlFor="expectedResolutionAt"
          error={state.errors?.expectedResolutionAt}
          hint="Optional. Used for the public estimate and Discord relative timestamp."
        >
          <input
            id="expectedResolutionAt"
            name="expectedResolutionAt"
            type="datetime-local"
            className="field"
            defaultValue={isoForDateTimeLocal(disruption?.expected_resolution_at)}
          />
        </Field>

        <Field
          label="Replacement transport"
          htmlFor="replacementTransport"
          error={state.errors?.replacementTransport}
          hint="Optional. Bus/coach arrangements, stops and expected extra travel time."
          className="md:col-span-2"
        >
          <textarea
            id="replacementTransport"
            name="replacementTransport"
            className="field"
            defaultValue={disruption?.replacement_transport ?? ""}
          />
        </Field>

        <Field label="Status" htmlFor="status" error={state.errors?.status}>
          <select
            id="status"
            name="status"
            className="field"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            {DISRUPTION_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="space-y-1.5">
          <span className="block text-[11.5px] font-semibold text-slate-300">Visibility</span>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 bg-navy-950/40 px-3 py-2.5">
            <input
              type="checkbox"
              name="isPublished"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              className="mt-0.5 size-4 accent-brand-500"
            />
            <span>
              <span className="block text-[12px] font-medium text-slate-200">
                Publish to the public site
              </span>
              <span className="block text-[10.5px] text-slate-500">
                Also triggers matching Discord notifications.
              </span>
            </span>
          </label>
        </div>
      </div>

      {published ? (
        <input type="hidden" name="isPublished" value="on" />
      ) : null}

      <div className="rounded-lg border border-white/[0.08] bg-navy-950/40">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-3 py-2">
          <p className="text-[11.5px] font-semibold text-slate-300">
            Affected stations
            <span className="ml-2 font-mono text-[10.5px] font-normal text-slate-500">
              {selectedStations.length} selected
            </span>
          </p>
          <button
            type="button"
            className="text-[10.5px] font-semibold text-brand-300 hover:text-brand-200"
            onClick={() => setSelectedStations([])}
          >
            Clear selection
          </button>
        </div>
        <div className="max-h-[220px] overflow-y-auto p-2 sm:grid sm:grid-cols-2 sm:gap-1 lg:grid-cols-3">
          {visibleStations.length === 0 ? (
            <p className="px-2 py-3 text-[11.5px] text-slate-500">
              No stations are assigned to this line yet.{" "}
              <Link href="/admin/stations" className="text-brand-300 underline">
                Add stations
              </Link>
              .
            </p>
          ) : (
            visibleStations.map((station) => (
              <label
                key={station.id}
                className={cx(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] transition",
                  selectedStations.includes(station.id)
                    ? "bg-brand-500/10 text-brand-100"
                    : "text-slate-400 hover:bg-white/[0.04]",
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedStations.includes(station.id)}
                  onChange={() => toggleStation(station.id)}
                  className="size-3.5 accent-brand-500"
                />
                {station.name}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.07] pt-4">
        <Link href="/admin/disruptions" className="btn btn-ghost">
          Cancel
        </Link>
        <SubmitButton pendingLabel="Saving disruption…">
          {disruption ? "Save changes" : "Create disruption"}
        </SubmitButton>
      </div>
    </form>
  );
}
