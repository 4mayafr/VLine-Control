import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PublicNav } from "@/components/public/PublicNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>

      <footer className="mt-10 border-t border-white/[0.07] bg-navy-950/60">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 font-mono text-[11px] font-bold text-white">
                V/
              </span>
              <p className="text-[12.5px] font-semibold tracking-wide text-white">V/LINE CONTROL</p>
            </div>
            <p className="mt-2 max-w-md text-[11px] leading-relaxed text-slate-500">
              An independent, unofficial monitoring and information project covering Victorian
              regional rail corridors. V/LINE CONTROL is not affiliated with, endorsed by or
              operated by V/Line or the Department of Transport and Planning.
            </p>
            <p className="mt-2 text-[10.5px] text-slate-500">
              Notices are entered by this instance&apos;s operators. Always confirm travel
              arrangements with official V/Line channels.
            </p>
          </div>

          <div>
            <p className="micro mb-2">Platform</p>
            <ul className="space-y-1.5 text-[11.5px] text-slate-400">
              <li><Link href="/network" className="hover:text-slate-200">Network map</Link></li>
              <li><Link href="/stations" className="hover:text-slate-200">Station directory</Link></li>
              <li><Link href="/disruptions" className="hover:text-slate-200">Service status</Link></li>
              <li><Link href="/admin" className="hover:text-slate-200">Operations console</Link></li>
            </ul>
          </div>

          <div>
            <p className="micro mb-2">Official information</p>
            <ul className="space-y-1.5 text-[11.5px] text-slate-400">
              <li>
                <a href="https://www.vline.com.au" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-slate-200">
                  V/Line website <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a href="https://www.vline.com.au/Timetables" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-slate-200">
                  Timetables <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a href="https://www.ptv.vic.gov.au/disruptions/" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-slate-200">
                  Public Transport Victoria disruptions <ExternalLink size={10} />
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/[0.05] px-4 py-3 text-center text-[10px] text-slate-600">
          © {new Date().getFullYear()} V/LINE CONTROL · Independent monitoring project ·
          Station coordinates are approximate and for orientation only.
        </div>
      </footer>
    </div>
  );
}
