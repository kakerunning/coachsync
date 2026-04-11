import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CoachOverview } from "@/components/dashboard/coach-overview";
import { AthleteOverview } from "@/components/dashboard/athlete-overview";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as { id?: string; name?: string; role?: string };
  const role = user.role ?? "ATHLETE";

  if (role === "COACH") {
    return <CoachOverview />;
  }

  return (
    <AthleteOverview
      userId={user.id ?? ""}
      userName={user.name ?? "Athlete"}
    />
  );
}
