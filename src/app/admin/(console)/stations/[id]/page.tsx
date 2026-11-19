import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Panel, SectionHeading } from "@/components/ui";
import { StationForm } from "@/components/forms/StationForm";
import { requirePermission } from "@/lib/auth";
import { listAllLines, getLinesForStation } from "@/lib/repo/lines";
import { getStationById } from "@/lib/repo/stations";
import { saveStationAction } from "@/app/admin/stations/actions";

export const dynamic = "force-dynamic";

export default async function EditStationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("station.manage");
  const { id } = await params;
  const station = getStationById(id);
  if (!station) notFound();

  const lines = listAllLines();
  const stationLines = getLinesForStation(station.id).map((line) => line.id);

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
        title={station.name}
        description="Update station details, coordinates and corridor assignments."
      />
      <Panel className="p-4 sm:p-5">
        <StationForm
          action={saveStationAction}
          lines={lines}
          station={station}
          stationLineIds={stationLines}
        />
      </Panel>
    </div>
  );
}
