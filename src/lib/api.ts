import type { AthleteRelation } from "@/features/athlete/athlete.types";
import type { SessionPayload, SessionListItem, SessionDetail } from "@/features/session/session.types";
import type { UserProfile, UpdateProfileInput } from "@/features/profile/profile.types";
import type { CoachEvent, CreateEventInput } from "@/features/event/event.types";
import type { CalendarItem } from "@/features/calendar/calendar.types";
import type { PersonalRecord, CreateRecordInput } from "@/features/record/record.types";
import type { CoachComment } from "@/features/coach-comment/coach-comment.types";

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = { items: T[]; meta: PaginationMeta };

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: "include" });
  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }

  return json.data as T;
}

async function apiFetchPaginated<T>(url: string): Promise<Paginated<T>> {
  const res = await fetch(url, { credentials: "include" });
  const json = (await res.json()) as ApiResponse<T[]>;

  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }

  return {
    items: json.data as T[],
    meta: json.meta as PaginationMeta,
  };
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

export function fetchLoggedSessions(week?: string, page = 1): Promise<Paginated<SessionListItem> | SessionListItem[]> {
  if (week) {
    // Week-filtered: returns plain array (no pagination needed)
    return apiFetch<SessionListItem[]>(`/api/sessions?week=${encodeURIComponent(week)}`);
  }
  return apiFetchPaginated<SessionListItem>(`/api/sessions?page=${page}`);
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

// ── Translation ───────────────────────────────────────────────────────────────

export function translate(
  text: string,
  targetLang: string
): Promise<{ translatedText: string; detectedSourceLang: string }> {
  return apiFetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLang }),
  });
}

// ── Coach Comments ────────────────────────────────────────────────────────────

export function fetchComments(sessionId: string): Promise<CoachComment[]> {
  return apiFetch<CoachComment[]>(`/api/sessions/${sessionId}/comments`);
}

export function postComment(sessionId: string, text: string): Promise<CoachComment> {
  return apiFetch<CoachComment>(`/api/sessions/${sessionId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function deleteComment(sessionId: string, commentId: string): Promise<void> {
  return apiFetch<void>(`/api/sessions/${sessionId}/comments/${commentId}`, { method: "DELETE" });
}

// ── Personal Records ──────────────────────────────────────────────────────────

export function fetchRecords(athleteId?: string): Promise<PersonalRecord[]> {
  const url = athleteId ? `/api/records?athleteId=${athleteId}` : "/api/records";
  return apiFetch<PersonalRecord[]>(url);
}

export function createRecord(input: CreateRecordInput): Promise<PersonalRecord> {
  return apiFetch<PersonalRecord>("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteRecord(id: string): Promise<void> {
  return apiFetch<void>(`/api/records/${id}`, { method: "DELETE" });
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export function fetchCalendarItems(from: string, to: string): Promise<CalendarItem[]> {
  return apiFetch<CalendarItem[]>(
    `/api/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────

export function fetchProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/profile");
}

export function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// ── Events ────────────────────────────────────────────────────────────────────

export function fetchEvents(page = 1): Promise<Paginated<CoachEvent>> {
  return apiFetchPaginated<CoachEvent>(`/api/events?page=${page}`);
}

export function createEvent(input: CreateEventInput): Promise<CoachEvent> {
  return apiFetch<CoachEvent>("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteEvent(id: string): Promise<void> {
  return apiFetch<void>(`/api/events/${id}`, { method: "DELETE" });
}

// ── Invites ───────────────────────────────────────────────────────────────────

export function createInvite(): Promise<{ token: string; expiresAt: string }> {
  return apiFetch<{ token: string; expiresAt: string }>("/api/invite", { method: "POST" });
}
