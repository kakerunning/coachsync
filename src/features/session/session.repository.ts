import { db } from "@/lib/db";
import type { SessionPayload } from "./session.types";

// create a new session for an athlete (prisma create)
export async function createSession(athleteId: string, payload: SessionPayload) {
  return db.session.create({
    data: {
      date: new Date(payload.date),
      title: payload.title,
      durationMin: payload.durationMin ?? null,
      athleteId,
      types: {
        create: payload.types.map((type) => ({ type: type as never })),
      },
      warmupItems: {
        create: payload.warmupItems,
      },
      sets: {
        create: payload.sets.map((s) => ({
          order: s.order,
          abandoned: s.abandoned,
          note: s.note ?? null,
          laps: {
            create: s.laps.map((l) => ({
              order: l.order,
              distance: l.distance,
              timeSeconds: l.timeSeconds ?? null,
              note: l.note ?? null,
            })),
          },
        })),
      },
      drills: {
        create: payload.drills,
      },
      feedback: payload.feedback
        ? {
            create: {
              fatigue: payload.feedback.fatigue,
              rpe: payload.feedback.rpe,
              note: payload.feedback.note ?? null,
              incidents: {
                create: payload.feedback.incidents.map((inc) => ({
                  type: inc.type as never,
                  bodyPart: inc.bodyPart ?? null,
                  severity: inc.severity ?? null,
                  detail: inc.detail ?? null,
                })),
              },
            },
          }
        : undefined,
    },
    select: { id: true },
  });
}

// find a session by id (prisma findUnique)
export async function getSessionById(id: string) {
  return db.session.findUnique({
    where: { id },
    include: {
      athlete: { select: { id: true, name: true, email: true } },
      coach: { select: { id: true, name: true } },
      types: true,
      warmupItems: { orderBy: { order: "asc" } },
      sets: {
        orderBy: { order: "asc" },
        include: { laps: { orderBy: { order: "asc" } } },
      },
      drills: { orderBy: { order: "asc" } },
      feedback: { include: { incidents: true } },
    },
  });
}

// find all sessions by athlete id (prisma findMany)
export async function listSessionsByAthlete(
  athleteId: string,
  week?: string,
  skip?: number,
  take?: number
): Promise<{ items: unknown[]; total: number }> {
  const where: { athleteId: string; date?: { gte: Date; lt: Date } } = { athleteId };

  if (week) {
    const { start, end } = parseISOWeek(week);
    where.date = { gte: start, lt: end };
  }

  const query = {
    where,
    orderBy: { date: "desc" } as const,
    include: {
      types: true,
      feedback: { select: { fatigue: true, rpe: true } },
    },
    ...(skip !== undefined && { skip }),
    ...(take !== undefined && { take }),
  };

  const [items, total] = await Promise.all([
    db.session.findMany(query),
    db.session.count({ where }),
  ]);

  return { items, total };
}

// list sessions by athlete for a coach view (includes feedback note)
export async function listSessionsByAthleteForCoach(
  athleteId: string,
  skip: number,
  take: number
): Promise<{ items: unknown[]; total: number }> {
  const where = { athleteId };

  const [items, total] = await Promise.all([
    db.session.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take,
      include: {
        types: true,
        feedback: { select: { fatigue: true, rpe: true, note: true } },
      },
    }),
    db.session.count({ where }),
  ]);

  return { items, total };
}

// find the best lap time for a given distance (prisma findMany)
export async function getChartData(athleteId: string, distance: string) {
  const sessions = await db.session.findMany({
    where: { athleteId },
    orderBy: { date: "asc" },
    take: 10,
    include: {
      sets: {
        include: {
          laps: {
            where: { distance },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  type LapWithTime = { timeSeconds: number | null };
  type SetWithLaps = { laps: LapWithTime[] };
  type SessionWithSets = { date: Date; sets: SetWithLaps[] };

  return (sessions as SessionWithSets[])
    .map((s) => {
      const times = s.sets
        .flatMap((set) => set.laps)
        .map((l) => l.timeSeconds)
        .filter((t): t is number => t !== null);
      if (times.length === 0) return null;
      return { date: s.date, minTime: Math.min(...times) };
    })
    .filter(Boolean) as { date: Date; minTime: number }[];
}

// update the feedback note for a session (prisma update)
export async function updateFeedback(
  sessionId: string,
  note: string
) {
  return db.sessionFeedback.update({
    where: { sessionId },
    data: { note },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseISOWeek(week: string): { start: Date; end: Date } {
  const [yearStr, weekStr] = week.split("-W");
  const year = parseInt(yearStr, 10);
  const weekNum = parseInt(weekStr, 10);

  // Jan 4 is always in ISO week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Mon=1 … Sun=7
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1);

  const start = new Date(monday);
  start.setDate(monday.getDate() + (weekNum - 1) * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end };
}
