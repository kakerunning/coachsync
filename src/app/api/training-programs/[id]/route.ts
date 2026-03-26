import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type {
  ApiResponse,
  TrainingProgram,
  UpdateTrainingProgramInput,
} from "@/features/training-program/training-program.types";
import * as service from "@/features/training-program/training-program.service";

type SessionUser = { id?: string; role?: string };
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<TrainingProgram>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  const { id } = await params;

  try {
    const program = await service.getProgram(id, user.id, user.role);
    if (!program) {
      return NextResponse.json({ data: null, error: "Not found", meta: null }, { status: 404 });
    }
    return NextResponse.json({ data: program, error: null, meta: null });
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
): Promise<NextResponse<ApiResponse<TrainingProgram>>> {
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

  const { id } = await params;

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
    const program = await service.updateProgram(id, user.id, body as UpdateTrainingProgramInput);
    if (!program) {
      return NextResponse.json(
        { data: null, error: "Not found or forbidden", meta: null },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: program, error: null, meta: null });
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

  const { id } = await params;

  try {
    const deleted = await service.deleteProgram(id, user.id);
    if (!deleted) {
      return NextResponse.json(
        { data: null, error: "Not found or forbidden", meta: null },
        { status: 404 }
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
