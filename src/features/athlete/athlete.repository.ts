import { db } from "@/lib/db";
import type { AthleteRelation, AthleteUser } from "./athlete.types";

export async function findAthletesByCoachId(coachId: string): Promise<AthleteRelation[]> {
  return db.coachAthleteRelation.findMany({
    where: { coachId },
    include: {
      athlete: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findRelation(
  coachId: string,
  athleteId: string
): Promise<{ id: string } | null> {
  return db.coachAthleteRelation.findUnique({
    where: { coachId_athleteId: { coachId, athleteId } },
    select: { id: true },
  });
}

export async function findUserByEmail(email: string): Promise<AthleteUser & { role: string } | null> {
  return db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, createdAt: true, role: true },
  });
}

export async function createRelation(
  coachId: string,
  athleteId: string
): Promise<AthleteRelation> {
  return db.coachAthleteRelation.create({
    data: { coachId, athleteId },
    include: {
      athlete: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
  });
}

export async function deleteRelation(coachId: string, athleteId: string): Promise<void> {
  await db.coachAthleteRelation.delete({
    where: { coachId_athleteId: { coachId, athleteId } },
  });
}
