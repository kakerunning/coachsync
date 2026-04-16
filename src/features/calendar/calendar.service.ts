// Builds the unified calendar feed by merging scheduled events and training sessions
// into a single sorted list. Role-aware: coaches see all their athletes' items;
// athletes see only their own.
import * as repo from "./calendar.repository";
import type { CalendarItem } from "./calendar.types";

// Calendar dot colours per event type — matches the design token palette used in the UI.
const EVENT_COLORS: Record<string, string> = {
  MATCH: "#E24B4A",
  CAMP: "#378ADD",
  TEST: "#1D9E75",
  OTHER: "#888780",
};

const TEST_LABELS: Record<string, string> = {
  VO2MAX: "VO2Max",
  LACTIC_TOLERANCE: "Lactic Tolerance",
  TIME_TRIAL: "Time Trial",
  FIELD_TEST: "Field Test",
};

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getCalendarItems(
  userId: string,
  role: string,
  from: Date,
  to: Date
): Promise<CalendarItem[]> {
  const [events, sessions] = await Promise.all([
    repo.findEventsInRange(userId, role, from, to),
    repo.findStandaloneSessionsInRange(userId, role, from, to),
  ]);

  const eventItems: CalendarItem[] = events.map((e) => ({
    id: e.id,
    kind: "EVENT",
    title: e.title,
    date: toDateStr(e.date),
    color: EVENT_COLORS[e.type] ?? "#888780",
    subLabel: e.testType ? TEST_LABELS[e.testType] : e.athlete.name,
    url: "/dashboard/events",
  }));

  // Sessions use a fixed purple — there is no per-session "type" colour on the calendar.
  const sessionItems: CalendarItem[] = sessions.map((s) => ({
    id: s.id,
    kind: "SESSION",
    title: s.title,
    date: toDateStr(s.date),
    color: "#7C3AED",
    subLabel: s.athlete.name,
    url: `/dashboard/sessions/${s.id}`,
  }));

  // Merge and sort chronologically so the UI receives a single ordered list
  // regardless of which data source each item came from.
  return [...eventItems, ...sessionItems].sort((a, b) => a.date.localeCompare(b.date));
}
