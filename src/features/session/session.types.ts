// Zod schemas for validating session POST bodies, and TypeScript types for
// API responses. The schema layer lives here so both API routes and the service
// can import validation without creating a circular dependency.
import { z } from "zod";

// ── Zod validation schema ────────────────────────────────────────────────────

const lapSchema = z.object({
  order: z.number().int(),
  distance: z.string().min(1),
  timeSeconds: z.number().optional(),
  note: z.string().optional(),
});

const setSchema = z.object({
  order: z.number().int(),
  abandoned: z.boolean(),
  note: z.string().optional(),
  laps: z.array(lapSchema),
});

const warmupItemSchema = z.object({
  order: z.number().int(),
  name: z.string().min(1),
  detail: z.string().optional(),
});

const drillSchema = z.object({
  order: z.number().int(),
  name: z.string().min(1),
});

const incidentSchema = z.object({
  type: z.enum(["NONE", "CRAMP", "PAIN", "EARLY_FATIGUE"]),
  bodyPart: z.string().optional(),
  severity: z.number().int().min(1).max(5).optional(),
  detail: z.string().optional(),
});

const feedbackSchema = z.object({
  fatigue: z.number().int().min(1).max(5),   // 1 = minimal fatigue, 5 = complete exhaustion
  rpe: z.number().int().min(1).max(10),      // Borg CR10: 1 = very light, 10 = maximal effort
  note: z.string().optional(),               // Free-text note to coach; optional because RPE/fatigue alone is useful data
  incidents: z.array(incidentSchema),
});

export const sessionPayloadSchema = z.object({
  date: z.string(),
  title: z.string().min(1),
  durationMin: z.number().int().positive().optional(),
  types: z.array(
    z.enum(["SPEED", "ENDURANCE", "VOLUME", "TECHNIQUE", "HILLS", "HURDLES", "GYM", "RECOVERY"])
  ),
  warmupItems: z.array(warmupItemSchema),
  sets: z.array(setSchema),
  drills: z.array(drillSchema),
  feedback: feedbackSchema,
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

// ── API response types ───────────────────────────────────────────────────────
// These are the shapes returned by API routes, not Prisma models directly.
// They are intentionally narrower than the DB model to avoid leaking internal fields.

export type SessionListItem = {
  id: string;
  date: Date;
  title: string;
  durationMin: number | null;
  types: { type: string }[];
  feedback: { fatigue: number; rpe: number } | null;
};

// Extended list item used in the coach's view of an athlete's session log.
// Includes the athlete's note so coaches can preview it without opening each session.
export type AthleteSessionListItem = {
  id: string;
  date: Date;
  title: string;
  durationMin: number | null;
  types: { type: string }[];
  feedback: { fatigue: number; rpe: number; note: string | null } | null;
};

export type SessionDetail = {
  id: string;
  date: Date;
  title: string;
  durationMin: number | null;
  athleteId: string;
  coachId: string | null;
  athlete: { id: string; name: string; email: string };
  coach: { id: string; name: string } | null;
  types: { id: string; type: string }[];
  warmupItems: { id: string; order: number; name: string; detail: string | null }[];
  sets: {
    id: string;
    order: number;
    abandoned: boolean;
    note: string | null;
    laps: { id: string; order: number; distance: string; timeSeconds: number | null; note: string | null }[];
  }[];
  drills: { id: string; order: number; name: string }[];
  feedback: {
    id: string;
    fatigue: number;
    rpe: number;
    note: string | null;
    noteTranslated: string | null;
    noteSourceLang: string | null;
    noteTargetLang: string | null;
    incidents: { id: string; type: string; bodyPart: string | null; severity: number | null; detail: string | null }[];
  } | null;
};

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
};
