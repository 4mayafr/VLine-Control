"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check, MailX, Sparkles } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Notice, Pill, cx } from "@/components/ui";
import { CATEGORIES, SEVERITIES } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";
import type { InformMessage, Line } from "@/lib/types";

export function InformReviewCard({
  action,
  message,
  lines,
  stations,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  message: InformMessage;
  lines: Line[];
  stations: { id: string; name: string; line_ids: string }[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: false });
  const [lineId, setLineId] = useState(message.parsed_line_id ?? "");
  const parsedStations = (() => {
    try {
      return JSON.parse(message.parsed_stations) as string[];
    } catch {
      return [];
    }
  })();
  const [selected, setSelected] = useState<string[]>(parsedStations);
  const visibleStations = stations.filter((station) =>
    lineId ? station.line_ids.split("|").includes(lineId) : true,
  );
  const confidence = Math.round(message.parse_confidence * 100);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="messageId" value={message.id} />
      {selected.map((id) => (
        <input key={id} type="hidden" name="stationIds" value={id} />
      ))}
      <input type="hidden" name="forwardToDiscord" value="true" />

      {state.message ? <Notice tone={state.ok ? "ok" : "error"}>{state.message}</Notice> : null}

      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/[0.07] pb-3">
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold text-slate-100">{message.subject}</p>
          <p className="mt-0.5 text-[10.5px] text-slate-500">
            From {message.from_address} · received {formatDateTime(message.received_at)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Pill tone={confidence >= 75 ? "ok" : confidence >= 50 ? "warn" : "slate"}>
            <Sparkles size={9} /> {confidence}% parsed
          </Pill>
        </div>
      </div>

      <details className="rounded-lg border border-white/[0.07] bg-navy-950/40">
        <summary className="cursor-pointer px-3 py-2 text-[10.5px] text-slate-400 hover:text-slate-200">
          View original message
        </summary>
        <p className="border-t border-white/[0.07] px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap text-slate-400">
          {message.body}
        </p>
      </details>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Railway line" htmlFor={`line-${message.id}`} error={state.errors?.lineId}>
          <select
            id={`line-${message.id}`}
            name="lineId"
            className="field"
            value={lineId}
            onChange={(event) => setLineId(event.target.value)}
          >
            <option value="">Network-wide</option>
            {lines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category" htmlFor={`cat-${message.id}`} error={state.errors?.category}>
          <select
            id={`cat-${message.id}`}
            name="category"
            className="field"
            defaultValue={message.parsed_category ?? "other"}
          >
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Severity" htmlFor={`sev-${message.id}`} error={state.errors?.severity}>
          <select
            id={`sev-${message.id}`}
            name="severity"
            className="field"
            defaultValue={message.parsed_severity ?? "medium"}
          >
            {SEVERITIES.map((severity) => (
              <option key={severity.value} value={severity.value}>
                {severity.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title" htmlFor={`title-${message.id}`} error={state.errors?.title}>
          <input
            id={`title-${message.id}`}
            name="title"
            className="field"
            defaultValue={message.parsed_title ?? ""}
            required
          />
        </Field>
        <Field
          label="Published description"
          htmlFor={`desc-${message.id}`}
          error={state.errors?.description}
          className="md:col-span-2"
        >
          <textarea
            id={`desc-${message.id}`}
            name="description"
            className="field"
            defaultValue={message.parsed_description ?? ""}
            rows={3}
            required
          />
        </Field>
      </div>

      <div className="rounded-lg border border-white/[0.08] bg-navy-950/40 p-2.5">
        <p className="mb-1.5 text-[11px] font-semibold text-slate-300">
          Affected stations{" "}
          <span className="font-mono text-[10px] font-normal text-slate-500">
            {selected.length} selected
          </span>
        </p>
        <div className="max-h-[150px] overflow-y-auto sm:grid sm:grid-cols-3 sm:gap-0.5">
          {visibleStations.map((station) => (
            <label
              key={station.id}
              className={cx(
                "flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 text-[11px]",
                selected.includes(station.id) ? "text-brand-200" : "text-slate-400 hover:bg-white/[0.04]",
              )}
            >
              <input
                type="checkbox"
                checked={selected.includes(station.id)}
                onChange={() =>
                  setSelected((current) =>
                    current.includes(station.id)
                      ? current.filter((value) => value !== station.id)
                      : [...current, station.id],
                  )
                }
                className="size-3.5 accent-brand-500"
              />
              {station.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
        <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <AlertCircle size={10} /> Approving publishes a public disruption and forwards to Discord if a rule matches.
        </p>
        <div className="flex items-center gap-2">
          <SubmitButton
            variant="danger"
            name="decision"
            value="reject"
            pendingLabel="Rejecting…"
            className="disabled:opacity-50"
          >
            <MailX size={13} /> Reject
          </SubmitButton>
          <SubmitButton name="decision" value="approve" pendingLabel="Publishing…">
            <Check size={13} /> Approve & publish
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
