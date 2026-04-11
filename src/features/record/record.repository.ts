import { db } from "@/lib/db";
import type { PersonalRecord, CreateRecordInput } from "./record.types";

// find all records by athlete id (ordered by discipline ascending and performance ascending)
export async function findRecordsByAthlete(athleteId: string): Promise<PersonalRecord[]> {
  return db.personalRecord.findMany({
    where: { athleteId },
    orderBy: [{ discipline: "asc" }, { performance: "asc" }],
  });
}

// find a record by id (includes athlete select)
export async function findRecordById(id: string): Promise<PersonalRecord | null> {
  return db.personalRecord.findUnique({ where: { id } });
}

// create a new record (includes athlete select)
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
      surface: input.surface ?? "OUTDOOR",
      loggedById,
    },
  });
}

export async function deleteRecord(id: string): Promise<void> {
  await db.personalRecord.delete({ where: { id } });
}
