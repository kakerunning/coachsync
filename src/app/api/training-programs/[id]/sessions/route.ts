import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type {
  ApiResponse,
  TrainingSession,
  CreateTrainingSessionInput,
} from "@/features/training-session/training-session.types";
import * as service from "@/features/training-session/training-session.service";

type SessionUser = { id?: string; role?: string };
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<TrainingSession[]>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  const { id: programId } = await params;

  try {
    const result = await service.listSessions(programId, user.id, user.role);
    if (!result.ok) {
      return NextResponse.json(
        { data: null, error: result.error, meta: null },
        { status: result.status }
      );
    }
    return NextResponse.json({ data: result.sessions, error: null, meta: null });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<TrainingSession>>> {
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

  const { id: programId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: "Invalid JSON body", meta: null },
      { status: 400 }
    );
  }

  const { title, scheduledAt } = (body ?? {}) as Record<string, unknown>;
  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { data: null, error: "title is required", meta: null },
      { status: 400 }
    );
  }
  if (!scheduledAt || typeof scheduledAt !== "string") {
    return NextResponse.json(
      { data: null, error: "scheduledAt is required (ISO string)", meta: null },
      { status: 400 }
    );
  }

  try {
    const result = await service.createSession(
      programId,
      user.id,
      body as CreateTrainingSessionInput
    );
    if (!result.ok) {
      return NextResponse.json(
        { data: null, error: result.error, meta: null },
        { status: result.status }
      );
    }
    return NextResponse.json({ data: result.session, error: null, meta: null }, { status: 201 });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}
