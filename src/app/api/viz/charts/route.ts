/**
 * POST /api/viz/charts
 *
 * Body: { type: "volume-trend" | "performance-trend" | "fatigue-timeline" | "volume-heatmap", ...payload }
 *
 * The route:
 *  1. Authenticates the user
 *  2. Fetches raw session/event data from DB for that user
 *  3. Forwards a clean payload to the Python viz service
 *  4. Returns the Plotly JSON figure back to the client
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  VIZ_AVAILABLE,
  getVolumeTrendChart,
  getPerformanceTrendChart,
  getFatigueTimelineChart,
  getVolumeHeatmapChart,
} from "@/lib/viz";

type SessionUser = { id?: string; role?: string };

type ChartType =
  | "volume-trend"
  | "performance-trend"
  | "fatigue-timeline"
  | "volume-heatmap";

// ── DB helpers ────────────────────────────────────────────────────────────────

async function fetchSessionsForViz(userId: string, role: string, athleteId?: string) {
  const targetId =
    role === "COACH" && athleteId ? athleteId : userId;

  return db.session.findMany({
    where: { athleteId: targetId },
    orderBy: { date: "asc" },
    include: {
      types: true,
      sets: { include: { laps: true } },
      feedback: { include: { incidents: true } },
    },
  });
}

function shapeSessions(sessions: Awaited<ReturnType<typeof fetchSessionsForViz>>) {
  return sessions.map((s) => ({
    id: s.id,
    date: s.date.toISOString().slice(0, 10),
    title: s.title,
    durationMin: s.durationMin,
    types: s.types.map((t) => t.type),
    sets: s.sets.map((st) => ({
      order: st.order,
      abandoned: st.abandoned,
      laps: st.laps.map((l) => ({
        distance: l.distance,
        timeSeconds: l.timeSeconds,
      })),
    })),
    feedback: s.feedback
      ? {
          rpe: s.feedback.rpe,
          fatigue: s.feedback.fatigue,
          note: s.feedback.note,
        }
      : null,
    incidents: s.feedback?.incidents.map((i) => ({
      type: i.type,
      bodyPart: i.bodyPart,
      severity: i.severity,
    })) ?? [],
  }));
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type as ChartType | undefined;
  if (!type) {
    return NextResponse.json({ error: "Missing chart type" }, { status: 400 });
  }

  if (!VIZ_AVAILABLE) {
    return NextResponse.json({ unavailable: true, error: "Analytics service is not configured in this environment" }, { status: 503 });
  }

  const athleteId = typeof body.athleteId === "string" ? body.athleteId : undefined;

  try {
    const rawSessions = await fetchSessionsForViz(user.id, user.role, athleteId);
    const sessions = shapeSessions(rawSessions);

    let figure: object;

    switch (type) {
      case "volume-trend":
        figure = await getVolumeTrendChart({ sessions, weeks: body.weeks ?? 12 });
        break;

      case "performance-trend": {
        const distance = typeof body.distance === "string" ? body.distance : "400m";
        figure = await getPerformanceTrendChart({ distance, sessions });
        break;
      }

      case "fatigue-timeline":
        figure = await getFatigueTimelineChart({ sessions });
        break;

      case "volume-heatmap": {
        const year = typeof body.year === "number" ? body.year : new Date().getFullYear();
        figure = await getVolumeHeatmapChart({ year, sessions });
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown chart type" }, { status: 400 });
    }

    return NextResponse.json(figure);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[viz/charts]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
