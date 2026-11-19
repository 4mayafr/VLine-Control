import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSessionUser } from "@/lib/auth";
import { countActiveDisruptions } from "@/lib/repo/disruptions";
import { pendingInformCount } from "@/lib/repo/inform";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  return (
    <AdminShell
      user={{ name: user.name, email: user.email, role: user.role }}
      pendingInform={pendingInformCount()}
      activeDisruptions={countActiveDisruptions()}
    >
      {children}
    </AdminShell>
  );
}
