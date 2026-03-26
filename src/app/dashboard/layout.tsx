import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { QueryProvider } from "@/lib/query-provider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    id: session.user.id as string,
    name: session.user.name ?? "Unknown",
    role: (session.user as { role?: string }).role ?? "ATHLETE",
  };

  return (
    <QueryProvider>
      <DashboardShell user={user}>{children}</DashboardShell>
    </QueryProvider>
  );
}
