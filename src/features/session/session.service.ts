import * as repo from "./session.repository";
import { sessionPayloadSchema } from "./session.types";
import type { SessionPayload, SessionListItem, SessionDetail } from "./session.types";

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

  const isOwner = session.athleteId === requesterId;
  const isCoach = requesterRole === "COACH" && session.coachId === requesterId;
  if (!isOwner && !isCoach) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, session: session as SessionDetail };
}

export type ListSessionsResult =
  | { ok: true; sessions: SessionListItem[] }
  | { ok: false; status: 500; error: string };

export async function listSessions(
  athleteId: string,
  week?: string
): Promise<ListSessionsResult> {
  try {
    const sessions = await repo.listSessionsByAthlete(athleteId, week);
    return { ok: true, sessions: sessions as SessionListItem[] };
  } catch {
    return { ok: false, status: 500, error: "Failed to list sessions" };
  }
}

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

  try {
    await repo.updateFeedback(sessionId, note);
    return { ok: true };
  } catch {
    return { ok: false, status: 500, error: "Failed to update feedback" };
  }
}

export async function getChartData(
  athleteId: string,
  distance: string
): Promise<{ date: Date; minTime: number }[]> {
  return repo.getChartData(athleteId, distance);
}

export function buildSessionPayload(payload: SessionPayload): SessionPayload {
  return payload;
}
