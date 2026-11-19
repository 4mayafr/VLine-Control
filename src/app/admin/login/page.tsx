import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Activity, Bell, ShieldCheck, Train } from "lucide-react";
import { LoginForm } from "@/components/forms/LoginForm";
import { loginAction } from "./actions";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.07] p-10 lg:flex">
        <div className="absolute inset-0 grid-lines opacity-40" />
        <div className="absolute -top-32 -left-24 size-[420px] rounded-full bg-brand-600/20 blur-[120px]" />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 font-mono text-sm font-bold text-white shadow-lg shadow-brand-900/50">
              V/
            </span>
            <div>
              <p className="text-[13px] font-semibold tracking-wide text-white">V/LINE CONTROL</p>
              <p className="text-[9.5px] tracking-[0.18em] text-brand-300/80 uppercase">
                Network operations console
              </p>
            </div>
          </div>

          <h1 className="mt-14 max-w-md text-4xl leading-[1.1] font-semibold tracking-tight text-white">
            Connecting Victoria.
            <br />
            <span className="text-brand-300">Monitoring the Network.</span>
          </h1>
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-slate-400">
            A control-centre view of regional rail corridors, disruptions, notification delivery
            and reviewed service updates.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              { icon: <Train size={14} />, text: "12 regional corridors with recorded station data" },
              { icon: <Bell size={14} />, text: "Per-line Discord routing with deduplicated delivery" },
              { icon: <Activity size={14} />, text: "Audited operational changes and review workflow" },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-2.5 text-[11.5px] text-slate-400">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-white/[0.05] text-brand-300 ring-1 ring-inset ring-white/10">
                  {item.icon}
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
          <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-300">
            <ShieldCheck size={12} className="text-brand-300" /> Independent platform
          </p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-slate-500">
            V/LINE CONTROL is not affiliated with V/Line or the Department of Transport and
            Planning. Operational records are maintained by administrators of this instance.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-6 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 font-mono text-sm font-bold text-white">
              V/
            </span>
            <p className="mt-2 text-[13px] font-semibold text-white">V/LINE CONTROL</p>
          </div>

          <h2 className="text-lg font-semibold tracking-tight text-white">Operations sign in</h2>
          <p className="mt-1 text-[11.5px] text-slate-400">
            Authorised staff only. Sessions expire after 8 hours.
          </p>

          <div className="mt-5">
            <LoginForm action={loginAction} />
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
            <p className="micro mb-1.5">Administrator access</p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Sign in with the account name{" "}
              <code className="rounded bg-navy-950/70 px-1.5 py-0.5 font-mono text-[10.5px] text-brand-200">
                admin
              </code>{" "}
              and the administrator password configured for this deployment.
            </p>
            <p className="mt-2 border-t border-white/[0.06] pt-2 text-[9.5px] leading-relaxed text-slate-500">
              Additional accounts, roles and passwords are managed in the console under Users &
              roles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
