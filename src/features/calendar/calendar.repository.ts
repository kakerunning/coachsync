// Prisma queries for the calendar feed.
// Two data sources are merged at the service layer: scheduled events and training sessions.
import { db } from "@/lib/db";

// Answers: "what events fall in this date range for this user?"
// Coaches filter by coachId (all events they created); athletes filter by athleteId
// (only events assigned to them). The WHERE clause differs because of the dual-ownership
// model on Event (see schema comments).
export async function findEventsInRange(userId: string, role: string, from: Date, to: Date) {
  const where =
    role === "COACH"
      ? { coachId: userId, date: { gte: from, lte: to } }
      : { athleteId: userId, date: { gte: from, lte: to } };

  return db.event.findMany({
    where,
    select: {
      id: true,
      title: true,
      type: true,
      testType: true,
      date: true,
      athlete: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });
}

export async function findStandaloneSessionsInRange(
  userId: string,
  role: string,
  from: Date,
  to: Date
) {
  if (role === "COACH") {
    // Two-step fan-out: first collect all athlete IDs on this coach's roster,
    // then query sessions for those athletes. Prisma doesn't support a direct
    // join through the relation table in a single findMany with a date filter.
    const relations = await db.coachAthleteRelation.findMany({
      where: { coachId: userId },
      select: { athleteId: true },
    });
    const athleteIds = relations.map((r) => r.athleteId);

    return db.session.findMany({
      where: { athleteId: { in: athleteIds }, date: { gte: from, lte: to } },
      select: {
        id: true,
        title: true,
        date: true,
        athlete: { select: { name: true } },
      },
      orderBy: { date: "asc" },
    });
  }

  return db.session.findMany({
    where: { athleteId: userId, date: { gte: from, lte: to } },
    select: {
      id: true,
      title: true,
      date: true,
      athlete: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });
}
