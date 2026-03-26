import type { TrainingProgram, CreateTrainingProgramInput, UpdateTrainingProgramInput } from "@/features/training-program/training-program.types";
import type { TrainingSession, CreateTrainingSessionInput } from "@/features/training-session/training-session.types";
import type { AthleteRelation } from "@/features/athlete/athlete.types";
import type { SessionPayload, SessionListItem, SessionDetail } from "@/features/session/session.types";

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
};

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: "include" });
  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }

  return json.data as T;
}

// ── Training Programs ─────────────────────────────────────────────────────────

export function fetchPrograms(): Promise<TrainingProgram[]> {
  return apiFetch<TrainingProgram[]>("/api/training-programs");
}

export function fetchProgram(id: string): Promise<TrainingProgram> {
  return apiFetch<TrainingProgram>(`/api/training-programs/${id}`);
}

export function createProgram(input: CreateTrainingProgramInput): Promise<TrainingProgram> {
  return apiFetch<TrainingProgram>("/api/training-programs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateProgram(id: string, input: UpdateTrainingProgramInput): Promise<TrainingProgram> {
  return apiFetch<TrainingProgram>(`/api/training-programs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteProgram(id: string): Promise<void> {
  return apiFetch<void>(`/api/training-programs/${id}`, { method: "DELETE" });
}

// ── Training Sessions ─────────────────────────────────────────────────────────

export function fetchSessions(programId: string): Promise<TrainingSession[]> {
  return apiFetch<TrainingSession[]>(`/api/training-programs/${programId}/sessions`);
}

export function createSession(programId: string, input: CreateTrainingSessionInput): Promise<TrainingSession> {
  return apiFetch<TrainingSession>(`/api/training-programs/${programId}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteSession(programId: string, sessionId: string): Promise<void> {
  return apiFetch<void>(`/api/training-programs/${programId}/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

// ── Athletes ──────────────────────────────────────────────────────────────────

export function fetchAthletes(): Promise<AthleteRelation[]> {
  return apiFetch<AthleteRelation[]>("/api/athletes");
}

export function addAthlete(email: string): Promise<AthleteRelation> {
  return apiFetch<AthleteRelation>("/api/athletes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function removeAthlete(athleteId: string): Promise<void> {
  return apiFetch<void>(`/api/athletes/${athleteId}`, { method: "DELETE" });
}

// ── Athlete Sessions (Session log) ────────────────────────────────────────────

export function fetchLoggedSessions(week?: string): Promise<SessionListItem[]> {
  const url = week ? `/api/sessions?week=${encodeURIComponent(week)}` : "/api/sessions";
  return apiFetch<SessionListItem[]>(url);
}

export function fetchLoggedSession(id: string): Promise<SessionDetail> {
  return apiFetch<SessionDetail>(`/api/sessions/${id}`);
}

export function logSession(payload: SessionPayload): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateFeedbackNote(sessionId: string, note: string): Promise<void> {
  return apiFetch<void>(`/api/sessions/${sessionId}/feedback`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
}

export function fetchChartData(
  distance: string
): Promise<{ date: string; minTime: number }[]> {
  return apiFetch<{ date: string; minTime: number }[]>(
    `/api/sessions/chart?distance=${encodeURIComponent(distance)}`
  );
}

// ── Invites ───────────────────────────────────────────────────────────────────

export function createInvite(): Promise<{ token: string; expiresAt: string }> {
  return apiFetch<{ token: string; expiresAt: string }>("/api/invite", { method: "POST" });
}
