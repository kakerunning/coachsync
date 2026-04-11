import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AnalyticsView } from "@/components/analytics/analytics-view";

type SessionUser = { id?: string; name?: string; role?: string };

export default async function AnalyticsPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <AnalyticsView
        role={user.role}
        userId={user.id}
      />
    </div>
  );
}
