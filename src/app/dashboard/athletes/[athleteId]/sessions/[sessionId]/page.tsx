import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { SessionDetailView } from "@/components/sessions/session-detail-view";

type PageProps = { params: Promise<{ athleteId: string; sessionId: string }> };

export default async function AthleteSessionDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; role?: string };
  if (user.role !== "COACH") redirect("/dashboard");

  const { athleteId, sessionId } = await params;

  // Verify coach-athlete relationship
  const relation = await db.coachAthleteRelation.findUnique({
    where: { coachId_athleteId: { coachId: user.id!, athleteId } },
    include: { athlete: { select: { name: true } } },
  });

  if (!relation) redirect("/dashboard/athletes");

  return (
    <div className="px-2 py-4">
      <Link
        href={`/dashboard/athletes/${athleteId}/sessions`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        {relation.athlete.name ?? "Athlete"}&apos;s sessions
      </Link>

      <SessionDetailView
        sessionId={sessionId}
        isCoach={true}
        currentUserId={user.id ?? ""}
      />
    </div>
  );
}
