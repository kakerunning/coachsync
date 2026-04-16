// Business logic for scheduled events (matches, camps, tests, etc.).
// Both coaches and athletes can create and delete their own events.
// When an athlete creates an event, coachId is set to their own userId in the API route
// so the dual-ownership delete rule works uniformly for both roles.
import * as repo from "./event.repository";
import { notifyUser } from "@/lib/push";
import type { CoachEvent, CreateEventInput } from "./event.types";

// list all events for a user (coach or athlete)
export async function listEvents(
  userId: string,
  role: string,
  page: number,
  limit: number
): Promise<{ items: CoachEvent[]; total: number }> {
  const skip = (page - 1) * limit;
  if (role === "COACH") return repo.findEventsByCoach(userId, skip, limit);
  return repo.findEventsByAthlete(userId, skip, limit);
}

export type CreateEventResult =
  | { ok: true; event: CoachEvent }
  | { ok: false; status: 400; error: string };

// create a new event (validates with Zod before writing)
export async function createEvent(
  coachId: string,
  input: CreateEventInput
): Promise<CreateEventResult> {
  if (!input.title.trim()) {
    return { ok: false, status: 400, error: "Title is required" };
  }
  if (!input.date) {
    return { ok: false, status: 400, error: "Date is required" };
  }
  if (input.type === "TEST" && !input.testType) {
    return { ok: false, status: 400, error: "Test type is required for TEST events" };
  }

  const event = await repo.createEvent(coachId, input);

  // Notify the athlete fire-and-forget — push failure must not roll back the saved event.
  if (input.athleteId) {
    notifyUser(input.athleteId, {
      title: "New event scheduled",
      body: `${event.title} — ${new Date(event.date).toLocaleDateString()}`,
      url: `/dashboard/events`,
    }).catch(() => {});
  }

  return { ok: true, event };
}

export type DeleteEventResult =
  | { ok: true }
  | { ok: false; status: 403 | 404; error: string };

export async function deleteEvent(
  userId: string,
  eventId: string
): Promise<DeleteEventResult> {
  const event = await repo.findEventById(eventId);
  if (!event) return { ok: false, status: 404, error: "Event not found" };
  // Either the creating coach or the assigned athlete can delete the event —
  // athletes need this so they can remove events they scheduled for themselves.
  if (event.coachId !== userId && event.athleteId !== userId) return { ok: false, status: 403, error: "Forbidden" };

  await repo.deleteEvent(eventId);
  return { ok: true };
}
