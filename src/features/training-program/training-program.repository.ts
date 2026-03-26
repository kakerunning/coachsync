import { db } from "@/lib/db";
import type { TrainingProgram } from "./training-program.types";

export async function findProgramsByCoachId(coachId: string): Promise<TrainingProgram[]> {
  return db.trainingProgram.findMany({
    where: { coachId },
    orderBy: { createdAt: "desc" },
  });
}

export async function findProgramsByAthleteId(athleteId: string): Promise<TrainingProgram[]> {
  return db.trainingProgram.findMany({
    where: { athleteId },
    orderBy: { createdAt: "desc" },
  });
}

export async function findProgramById(id: string): Promise<TrainingProgram | null> {
  return db.trainingProgram.findUnique({ where: { id } });
}

export async function createProgram(data: {
  title: string;
  description?: string;
  coachId: string;
  athleteId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<TrainingProgram> {
  return db.trainingProgram.create({ data });
}

export async function updateProgram(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    athleteId?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
  }
): Promise<TrainingProgram> {
  return db.trainingProgram.update({ where: { id }, data });
}

export async function deleteProgram(id: string): Promise<void> {
  await db.trainingProgram.delete({ where: { id } });
}
