import { findProgramById } from "@/features/training-program/training-program.repository";
import * as repo from "./training-session.repository";
import type {
  TrainingSession,
  CreateTrainingSessionInput,
  UpdateTrainingSessionInput,
} from "./training-session.types";

type ProgramAccessResult =
  | { ok: true }
  | { ok: false; status: 403 | 404; error: string };

async function checkProgramAccess(
  programId: string,
  userId: string,
  role: string
): Promise<ProgramAccessResult> {
  const program = await findProgramById(programId);
  if (!program) return { ok: false, status: 404, error: "Program not found" };

  if (role === "COACH" && program.coachId !== userId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  if (role === "ATHLETE" && program.athleteId !== userId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true };
}

export async function listSessions(
  programId: string,
  userId: string,
  role: string
): Promise<{ ok: true; sessions: TrainingSession[] } | { ok: false; status: 403 | 404; error: string }> {
  const access = await checkProgramAccess(programId, userId, role);
  if (!access.ok) return access;

  const sessions = await repo.findSessionsByProgramId(programId);
  return { ok: true, sessions };
}

export async function getSession(
  programId: string,
  sessionId: string,
  userId: string,
  role: string
): Promise<{ ok: true; session: TrainingSession } | { ok: false; status: 403 | 404; error: string }> {
  const access = await checkProgramAccess(programId, userId, role);
  if (!access.ok) return access;

  const session = await repo.findSessionById(sessionId);
  if (!session || session.programId !== programId) {
    return { ok: false, status: 404, error: "Session not found" };
  }

  return { ok: true, session };
}

export async function createSession(
  programId: string,
  coachId: string,
  input: CreateTrainingSessionInput
): Promise<{ ok: true; session: TrainingSession } | { ok: false; status: 403 | 404; error: string }> {
  const access = await checkProgramAccess(programId, coachId, "COACH");
  if (!access.ok) return access;

  const session = await repo.createSession({
    programId,
    title: input.title,
    description: input.description,
    scheduledAt: new Date(input.scheduledAt),
    durationMin: input.durationMin,
    notes: input.notes,
  });

  return { ok: true, session };
}

export async function updateSession(
  programId: string,
  sessionId: string,
  coachId: string,
  input: UpdateTrainingSessionInput
): Promise<{ ok: true; session: TrainingSession } | { ok: false; status: 403 | 404; error: string }> {
  const access = await checkProgramAccess(programId, coachId, "COACH");
  if (!access.ok) return access;

  const existing = await repo.findSessionById(sessionId);
  if (!existing || existing.programId !== programId) {
    return { ok: false, status: 404, error: "Session not found" };
  }

  const session = await repo.updateSession(sessionId, {
    title: input.title,
    description: input.description,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    durationMin: input.durationMin,
    notes: input.notes,
  });

  return { ok: true, session };
}

export async function deleteSession(
  programId: string,
  sessionId: string,
  coachId: string
): Promise<{ ok: true } | { ok: false; status: 403 | 404; error: string }> {
  const access = await checkProgramAccess(programId, coachId, "COACH");
  if (!access.ok) return access;

  const existing = await repo.findSessionById(sessionId);
  if (!existing || existing.programId !== programId) {
    return { ok: false, status: 404, error: "Session not found" };
  }

  await repo.deleteSession(sessionId);
  return { ok: true };
}
