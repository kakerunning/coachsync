// Personal record repository — Prisma queries for athlete PB tracking.
import { db } from "@/lib/db";
import type { PersonalRecord, CreateRecordInput } from "./record.types";

export async function findRecordsByAthlete(athleteId: string): Promise<PersonalRecord[]> {
  // Order by discipline then performance so the UI gets a grouped PB list
  // without needing a client-side sort step.
  return db.personalRecord.findMany({
    where: { athleteId },
    orderBy: [{ discipline: "asc" }, { performance: "asc" }],
  });
}

export async function findRecordById(id: string): Promise<PersonalRecord | null> {
  return db.personalRecord.findUnique({ where: { id } });
}

export async function createRecord(
  loggedById: string,
  input: CreateRecordInput
): Promise<PersonalRecord> {
  return db.personalRecord.create({
    data: {
      athleteId: input.athleteId,
      discipline: input.discipline,
      performance: input.performance,
      unit: input.unit,
      wind: input.wind ?? null,
      date: new Date(input.date),
      competition: input.competition ?? null,
      location: input.location ?? null,
      // OUTDOOR is the default because most track PBs are set outdoors;
      // athletes must explicitly opt in to record indoor marks.
      surface: input.surface ?? "OUTDOOR",
      loggedById,
    },
  });
}

export async function deleteRecord(id: string): Promise<void> {
  await db.personalRecord.delete({ where: { id } });
}
