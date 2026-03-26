import { db } from "@/lib/db";
import type { TrainingSession } from "./training-session.types";

export async function findSessionsByProgramId(programId: string): Promise<TrainingSession[]> {
  return db.trainingSession.findMany({
    where: { programId },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function findSessionById(id: string): Promise<TrainingSession | null> {
  return db.trainingSession.findUnique({ where: { id } });
}

export async function createSession(data: {
  programId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  durationMin?: number;
  notes?: string;
}): Promise<TrainingSession> {
  return db.trainingSession.create({ data });
}

export async function updateSession(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    scheduledAt?: Date;
    durationMin?: number | null;
    notes?: string | null;
  }
): Promise<TrainingSession> {
  return db.trainingSession.update({ where: { id }, data });
}

export async function deleteSession(id: string): Promise<void> {
  await db.trainingSession.delete({ where: { id } });
}
