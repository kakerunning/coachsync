// GET  /api/athletes — list the coach's current roster (coach-only).
// POST /api/athletes — add an athlete to the coach's roster by email address.
//   Looks up the user by email and creates a CoachAthleteRelation; the athlete
//   must already have a CoachSync account.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { ApiResponse, AthleteRelation } from "@/features/athlete/athlete.types";
import * as service from "@/features/athlete/athlete.service";

type SessionUser = { id?: string; role?: string };

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<AthleteRelation[]>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  if (user.role !== "COACH") {
    return NextResponse.json(
      { data: null, error: "Forbidden: coaches only", meta: null },
      { status: 403 }
    );
  }

  try {
    const athletes = await service.listAthletes(user.id);
    return NextResponse.json({ data: athletes, error: null, meta: null });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<AthleteRelation>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  if (user.role !== "COACH") {
    return NextResponse.json(
      { data: null, error: "Forbidden: coaches only", meta: null },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: "Invalid JSON body", meta: null },
      { status: 400 }
    );
  }

  const { email } = (body ?? {}) as Record<string, unknown>;
  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { data: null, error: "email is required", meta: null },
      { status: 400 }
    );
  }

  try {
    const result = await service.addAthleteByEmail(user.id, email);
    if (!result.ok) {
      return NextResponse.json(
        { data: null, error: result.error, meta: null },
        { status: result.status }
      );
    }
    return NextResponse.json({ data: result.relation, error: null, meta: null }, { status: 201 });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}
