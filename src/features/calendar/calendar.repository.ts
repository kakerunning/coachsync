import { db } from "@/lib/db";

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
    // Show sessions belonging to all athletes linked to this coach
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
