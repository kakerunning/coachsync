import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AthleteSessionsView } from "@/components/athletes/athlete-sessions-view";

type PageProps = { params: Promise<{ athleteId: string }> };

export default async function AthleteSessionsPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; role?: string };
  if (user.role !== "COACH") redirect("/dashboard");

  const { athleteId } = await params;

  // Verify coach-athlete relationship and get athlete name for the heading
  const relation = await db.coachAthleteRelation.findUnique({
    where: { coachId_athleteId: { coachId: user.id!, athleteId } },
    include: { athlete: { select: { name: true } } },
  });

  if (!relation) redirect("/dashboard/athletes");

  return (
    <div className="px-2 py-4">
      <AthleteSessionsView
        athleteId={athleteId}
        athleteName={relation.athlete.name ?? "Athlete"}
      />
    </div>
  );
}
