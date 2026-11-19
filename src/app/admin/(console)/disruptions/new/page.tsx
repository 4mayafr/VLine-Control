import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, SectionHeading } from "@/components/ui";
import { DisruptionForm } from "@/components/forms/DisruptionForm";
import { requirePermission } from "@/lib/auth";
import { listAllLines } from "@/lib/repo/lines";
import { searchStations } from "@/lib/repo/stations";
import { saveDisruptionAction } from "@/app/admin/disruptions/actions";

export const dynamic = "force-dynamic";

export default async function NewDisruptionPage() {
  await requirePermission("disruption.manage");
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
        eyebrow="New notice"
        title="Create disruption"
        description="Records created here are stored as operator entries and appear in the audit log."
      />
      <Panel className="p-4 sm:p-5">
        <DisruptionForm action={saveDisruptionAction} lines={lines} stations={stations} />
      </Panel>
    </div>
  );
}
