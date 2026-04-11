import * as repo from "./coach.repository";
import type { CoachInfo } from "./coach.types";

export type GetCoachResult =
  | { ok: true; coach: CoachInfo }
  | { ok: false; status: 404; error: string };

export async function getCoachForAthlete(athleteId: string): Promise<GetCoachResult> {
  const coach = await repo.findCoachByAthleteId(athleteId);

  if (!coach) {
    return { ok: false, status: 404, error: "No coach linked to this athlete" };
  }

  return { ok: true, coach };
}
