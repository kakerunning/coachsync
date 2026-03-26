import * as repo from "./athlete.repository";
import type { AthleteRelation } from "./athlete.types";

export async function listAthletes(coachId: string): Promise<AthleteRelation[]> {
  return repo.findAthletesByCoachId(coachId);
}

export type AddAthleteResult =
  | { ok: true; relation: AthleteRelation }
  | { ok: false; status: 400 | 404 | 409; error: string };

export async function addAthleteByEmail(
  coachId: string,
  email: string
): Promise<AddAthleteResult> {
  const user = await repo.findUserByEmail(email);

  if (!user) {
    return { ok: false, status: 404, error: "No user found with that email" };
  }

  if (user.role !== "ATHLETE") {
    return { ok: false, status: 400, error: "User is not an athlete" };
  }

  if (user.id === coachId) {
    return { ok: false, status: 400, error: "Cannot add yourself as an athlete" };
  }

  const existing = await repo.findRelation(coachId, user.id);
  if (existing) {
    return { ok: false, status: 409, error: "Athlete already linked" };
  }

  const relation = await repo.createRelation(coachId, user.id);
  return { ok: true, relation };
}

export type RemoveAthleteResult =
  | { ok: true }
  | { ok: false; status: 404; error: string };

export async function removeAthlete(
  coachId: string,
  athleteId: string
): Promise<RemoveAthleteResult> {
  const existing = await repo.findRelation(coachId, athleteId);
  if (!existing) {
    return { ok: false, status: 404, error: "Relation not found" };
  }

  await repo.deleteRelation(coachId, athleteId);
  return { ok: true };
}
