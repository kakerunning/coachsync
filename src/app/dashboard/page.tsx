import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CoachOverview } from "@/components/dashboard/coach-overview";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role ?? "ATHLETE";

  if (role === "COACH") {
    return <CoachOverview />;
  }

  // Athlete overview — programs page serves their content for now
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
      <p className="text-gray-500">
        View your assigned training programs in the{" "}
        <a href="/dashboard/programs" className="text-blue-600 hover:underline">
          Programs
        </a>{" "}
        section.
      </p>
    </div>
  );
}
