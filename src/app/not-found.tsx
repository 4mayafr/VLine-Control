import Link from "next/link";
import { Route } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="panel w-full max-w-md p-7 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-inset ring-brand-400/25">
          <Route size={19} />
        </span>
        <p className="mt-3 font-mono text-[11px] tracking-[0.2em] text-slate-500">404 · NO SERVICE</p>
        <h1 className="mt-1 text-lg font-semibold text-white">This platform could not be found</h1>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
          The page or record you requested does not exist, or the station or corridor has been
          removed from the directory.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/" className="btn btn-primary">
            Public site
          </Link>
          <Link href="/network" className="btn btn-ghost">
            Network map
          </Link>
        </div>
      </div>
    </div>
  );
}
