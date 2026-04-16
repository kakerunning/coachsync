// Coach repository — lookup of the coach assigned to a given athlete.
// Note: uses findFirst, so if an athlete belongs to multiple coaches only the
// first relation (by insertion order) is returned. The UI assumes one coach per athlete.
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
