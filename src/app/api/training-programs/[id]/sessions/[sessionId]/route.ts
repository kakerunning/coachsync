import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type {
  ApiResponse,
  TrainingSession,
  UpdateTrainingSessionInput,
} from "@/features/training-session/training-session.types";
import * as service from "@/features/training-session/training-session.service";

type SessionUser = { id?: string; role?: string };
type RouteContext = { params: Promise<{ id: string; sessionId: string }> };

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<TrainingSession>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  const { id: programId, sessionId } = await params;

  try {
    const result = await service.getSession(programId, sessionId, user.id, user.role);
    if (!result.ok) {
      return NextResponse.json(
        { data: null, error: result.error, meta: null },
        { status: result.status }
      );
    }
    return NextResponse.json({ data: result.session, error: null, meta: null });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

  const { id: programId, sessionId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: "Invalid JSON body", meta: null },
      { status: 400 }
    );
  }

  try {
    const result = await service.updateSession(
      programId,
      sessionId,
      user.id,
      body as UpdateTrainingSessionInput
    );
    if (!result.ok) {
      return NextResponse.json(
        { data: null, error: result.error, meta: null },
        { status: result.status }
      );
    }
    return NextResponse.json({ data: result.session, error: null, meta: null });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<null>>> {
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

  const { id: programId, sessionId } = await params;

  try {
    const result = await service.deleteSession(programId, sessionId, user.id);
    if (!result.ok) {
      return NextResponse.json(
        { data: null, error: result.error, meta: null },
        { status: result.status }
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}
