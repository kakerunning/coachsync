// Event repository — Prisma queries for coach and athlete calendar events.
// Events carry both coachId and athleteId; see event.service.ts for the
// self-event pattern used when athletes create their own events.
import { db } from "@/lib/db";
import type { CoachEvent, CreateEventInput } from "./event.types";

const athleteSelect = { id: true, name: true };

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

export async function findEventById(id: string): Promise<CoachEvent | null> {
  return db.event.findUnique({
    where: { id },
    include: { athlete: { select: athleteSelect } },
  });
}

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
      // When an athlete creates their own event, the service passes their id as both
      // coachId and athleteId (self-event pattern), so this fallback to coachId also
      // handles that case correctly.
      athleteId: input.athleteId ?? coachId,
    },
    include: { athlete: { select: athleteSelect } },
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await db.event.delete({ where: { id } });
}
