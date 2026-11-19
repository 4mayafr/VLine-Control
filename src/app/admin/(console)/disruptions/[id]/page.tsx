import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Notice, Panel, SectionHeading, StatusChip } from "@/components/ui";
import { DisruptionForm } from "@/components/forms/DisruptionForm";
import { ConfirmForm } from "@/components/forms/AdminConfirm";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getDisruption } from "@/lib/repo/disruptions";
import { listAllLines } from "@/lib/repo/lines";
import { searchStations } from "@/lib/repo/stations";
import { formatDateTime } from "@/lib/format";
import {
  deleteDisruptionAction,
  publishDisruptionAction,
  resolveDisruptionAction,
  saveDisruptionAction,
} from "@/app/admin/disruptions/actions";

export const dynamic = "force-dynamic";

export default async function EditDisruptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { notice } = await searchParams;
  const disruption = getDisruption(id);
  if (!disruption) notFound();

  const editable = can(user.role, "disruption.manage");
  const lines = listAllLines();
  const stations = searchStations("", 600).map((station) => ({
    id: station.id,
    name: station.name,
    line_ids: station.line_ids,
  }));

  return (
    <div className="space-y-5">
      <Link
        href="/admin/disruptions"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft size={12} /> Disruption management
      </Link>

      <SectionHeading
        eyebrow={disruption.line_name ?? "Network-wide"}
        title={disruption.title}
        description={`Last updated ${formatDateTime(disruption.updated_at)} · Source: ${disruption.source}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip value={disruption.status} />
            <StatusChip
              value={disruption.is_published === 1 ? "approved" : "rejected"}
              label={disruption.is_published === 1 ? "Published" : "Draft"}
            />
          </div>
        }
      />

      {notice ? <Notice tone="ok">{notice}</Notice> : null}

      {editable ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {disruption.status !== "resolved" ? (
              <ConfirmForm
                action={resolveDisruptionAction}
                fields={{ id: disruption.id }}
                label="Resolve disruption"
                confirmText="Resolve this disruption and notify matching Discord rules?"
              />
            ) : null}
            <ConfirmForm
              action={publishDisruptionAction}
              fields={{ id: disruption.id, value: disruption.is_published === 1 ? "false" : "true" }}
              label={disruption.is_published === 1 ? "Unpublish" : "Publish"}
            />
            <ConfirmForm
              action={deleteDisruptionAction}
              fields={{ id: disruption.id }}
              label="Delete"
              variant="danger"
              confirmText="Permanently delete this disruption?"
            />
          </div>

          <Panel className="p-4 sm:p-5">
            <DisruptionForm
              action={saveDisruptionAction}
              lines={lines}
              stations={stations}
              disruption={disruption}
            />
          </Panel>
        </>
      ) : (
        <Panel className="space-y-3 p-5">
          <p className="text-[11.5px] leading-relaxed text-slate-300">{disruption.description}</p>
          {disruption.replacement_transport ? (
            <p className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 text-[11px] text-amber-100/80">
              <span className="font-semibold">Replacement transport:</span>{" "}
              {disruption.replacement_transport}
            </p>
          ) : null}
          <p className="text-[10.5px] text-slate-500">
            Your role has read-only access to this notice.
          </p>
        </Panel>
      )}
    </div>
  );
}
