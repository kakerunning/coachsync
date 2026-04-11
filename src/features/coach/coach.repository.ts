import { db } from "@/lib/db";
import type { CoachInfo } from "./coach.types";

export async function findCoachByAthleteId(athleteId: string): Promise<CoachInfo | null> {
  const relation = await db.coachAthleteRelation.findFirst({
    where: { athleteId },
    select: {
      coach: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return relation?.coach ?? null;
}
