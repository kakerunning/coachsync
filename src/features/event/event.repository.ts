import { db } from "@/lib/db";
import type { CoachEvent, CreateEventInput } from "./event.types";

const athleteSelect = { id: true, name: true };

// find all events by coach id (ordered by date ascending)
export async function findEventsByCoach(
  coachId: string,
  skip: number,
  take: number
): Promise<{ items: CoachEvent[]; total: number }> {
  const [items, total] = await Promise.all([
    db.event.findMany({ where: { coachId }, include: { athlete: { select: athleteSelect } }, orderBy: { date: "asc" }, skip, take }),
    db.event.count({ where: { coachId } }),
  ]);
  return { items, total };
}

// find all events by athlete id (ordered by date ascending)
export async function findEventsByAthlete(
  athleteId: string,
  skip: number,
  take: number
): Promise<{ items: CoachEvent[]; total: number }> {
  const [items, total] = await Promise.all([
    db.event.findMany({ where: { athleteId }, include: { athlete: { select: athleteSelect } }, orderBy: { date: "asc" }, skip, take }),
    db.event.count({ where: { athleteId } }),
  ]);
  return { items, total };
}

// find an event by id (includes athlete select)
export async function findEventById(id: string): Promise<CoachEvent | null> {
  return db.event.findUnique({
    where: { id },
    include: { athlete: { select: athleteSelect } },
  });
}

// create a new event (includes athlete select)
//if athleteId is not provided, it defaults to the coachId
export async function createEvent(
  coachId: string,
  input: CreateEventInput
): Promise<CoachEvent> {
  return db.event.create({
    data: {
      title: input.title,
      type: input.type,
      testType: input.testType ?? null,
      date: new Date(input.date),
      location: input.location ?? null,
      notes: input.notes ?? null,
      coachId,
      athleteId: input.athleteId ?? coachId,
    },
    include: { athlete: { select: athleteSelect } },
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await db.event.delete({ where: { id } });
}
