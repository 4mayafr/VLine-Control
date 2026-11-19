import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, SectionHeading } from "@/components/ui";
import { StationForm } from "@/components/forms/StationForm";
import { requirePermission } from "@/lib/auth";
import { listAllLines } from "@/lib/repo/lines";
import { saveStationAction } from "@/app/admin/stations/actions";

export const dynamic = "force-dynamic";

export default async function NewStationPage() {
  await requirePermission("station.manage");
  const lines = listAllLines();

  return (
    <div className="space-y-5">
      <Link
        href="/admin/stations"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft size={12} /> Station directory
      </Link>
      <SectionHeading
        eyebrow="Station management"
        title="Add a station"
        description="Station names must be unique. Coordinates are approximate positions used for the schematic map."
      />
      <Panel className="p-4 sm:p-5">
        <StationForm action={saveStationAction} lines={lines} />
      </Panel>
    </div>
  );
}
