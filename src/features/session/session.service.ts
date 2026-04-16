// Business logic for training sessions: validation, ownership checks,
// pagination, and auto-translation of athlete feedback notes for coaches.
// All functions return discriminated unions { ok: true, ... } | { ok: false, status, error }
// so API routes can map errors to HTTP status codes without try/catch.
import * as repo from "./session.repository";
import * as athleteRepo from "@/features/athlete/athlete.repository";
import { sessionPayloadSchema } from "./session.types";
import type { SessionPayload, SessionListItem, SessionDetail, AthleteSessionListItem } from "./session.types";
import { db } from "@/lib/db";
import { translateText, DEEPL_LANG_MAP } from "@/lib/deepl";

// create a new session for an athlete (validates with Zod before writing)
export type CreateSessionResult =
  | { ok: true; id: string }
  | { ok: false; status: 400 | 500; error: string };

export async function createSession(
  athleteId: string,
  body: unknown
): Promise<CreateSessionResult> {
  const parsed = sessionPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, status: 400, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const session = await repo.createSession(athleteId, parsed.data);
    return { ok: true, id: session.id };
  } catch {
    return { ok: false, status: 500, error: "Failed to create session" };
  }
}

// get a session by id (includes ownership checks)
export type GetSessionResult =
  | { ok: true; session: SessionDetail }
  | { ok: false; status: 403 | 404; error: string };

export async function getSession(
  id: string,
  requesterId: string,
  requesterRole: string
): Promise<GetSessionResult> {
  const session = await repo.getSessionById(id);
  if (!session) return { ok: false, status: 404, error: "Session not found" };

  // Two valid access paths: the athlete who owns the session, or the coach
  // explicitly assigned to it (coachId must match — roster membership alone isn't enough).
  const isOwner = session.athleteId === requesterId;
  const isCoach = requesterRole === "COACH" && session.coachId === requesterId;
  if (!isOwner && !isCoach) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, session: session as SessionDetail };
}

// find all sessions by athlete id (includes pagination)
export type ListSessionsResult =
  | { ok: true; sessions: SessionListItem[]; total: number }
  | { ok: false; status: 500; error: string };

export async function listSessions(
  athleteId: string,
  week?: string,
  page = 1,
  limit = 20
): Promise<ListSessionsResult> {
  try {
    // When filtering by week, return all (week has ~7 entries max)
    const skip = week ? undefined : (page - 1) * limit;
    const take = week ? undefined : limit;
    const { items, total } = await repo.listSessionsByAthlete(athleteId, week, skip, take);
    return { ok: true, sessions: items as SessionListItem[], total };
  } catch {
    return { ok: false, status: 500, error: "Failed to list sessions" };
  }
}

// update the feedback note for a session (includes ownership checks)
export type UpdateFeedbackResult =
  | { ok: true }
  | { ok: false; status: 400 | 403 | 404 | 500; error: string };

export async function updateFeedbackNote(
  sessionId: string,
  requesterId: string,
  note: string
): Promise<UpdateFeedbackResult> {
  const session = await repo.getSessionById(sessionId);
  if (!session) return { ok: false, status: 404, error: "Session not found" };
  if (session.athleteId !== requesterId) return { ok: false, status: 403, error: "Forbidden" };
  if (!session.feedback) return { ok: false, status: 404, error: "Feedback not found" };

  // Auto-translate for the coach — never block submission if translation fails
  let noteTranslated: string | null = null;
  let noteSourceLang: string | null = null;
  let noteTargetLang: string | null = null;

  if (note.trim() && session.coachId) {
    try {
      const coach = await db.user.findUnique({
        where: { id: session.coachId },
        select: { language: true },
      });
      const coachLang = coach?.language ?? "en";
      const deeplTarget = DEEPL_LANG_MAP[coachLang.toLowerCase()] ?? coachLang.toUpperCase();
      const result = await translateText(note, deeplTarget);
      noteTranslated = result.translatedText;
      noteSourceLang = result.detectedSourceLang;
      noteTargetLang = deeplTarget;
    } catch {
      // Translation failed — store original only, do not block
    }
  }

  try {
    await repo.updateFeedback(sessionId, note, noteTranslated, noteSourceLang, noteTargetLang);
    return { ok: true };
  } catch {
    return { ok: false, status: 500, error: "Failed to update feedback" };
  }
}

// find the best lap time for a given distance (pass-through)
export async function getChartData(
  athleteId: string,
  distance: string
): Promise<{ date: Date; minTime: number }[]> {
  return repo.getChartData(athleteId, distance);
}

export function buildSessionPayload(payload: SessionPayload): SessionPayload {
  return payload;
}

// list an athlete's sessions for a coach (validates coach-athlete relationship)
export type ListAthleteSessionsForCoachResult =
  | { ok: true; sessions: AthleteSessionListItem[]; total: number }
  | { ok: false; status: 403 | 500; error: string };

export async function listAthleteSessionsForCoach(
  coachId: string,
  athleteId: string,
  page = 1,
  limit = 20
): Promise<ListAthleteSessionsForCoachResult> {
  // Guard: the coach must have an active roster relationship with the athlete.
  // This prevents a coach from accessing sessions of athletes they don't manage.
  const relation = await athleteRepo.findRelation(coachId, athleteId);
  if (!relation) {
    return { ok: false, status: 403, error: "Forbidden: athlete not on your roster" };
  }

  try {
    const skip = (page - 1) * limit;
    const { items, total } = await repo.listSessionsByAthleteForCoach(athleteId, skip, limit);
    return { ok: true, sessions: items as AthleteSessionListItem[], total };
  } catch {
    return { ok: false, status: 500, error: "Failed to list sessions" };
  }
}
