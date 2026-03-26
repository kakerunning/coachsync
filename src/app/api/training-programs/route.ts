import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type {
  ApiResponse,
  TrainingProgram,
  CreateTrainingProgramInput,
} from "@/features/training-program/training-program.types";
import * as service from "@/features/training-program/training-program.service";

type SessionUser = { id?: string; role?: string };

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<TrainingProgram[]>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  try {
    const programs = await service.listPrograms(user.id, user.role);
    return NextResponse.json({ data: programs, error: null, meta: null });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: "Invalid JSON body", meta: null },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { data: null, error: "Invalid request body", meta: null },
      { status: 400 }
    );
  }

  const { title } = body as Record<string, unknown>;
  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { data: null, error: "title is required", meta: null },
      { status: 400 }
    );
  }

  try {
    const program = await service.createProgram(user.id, body as CreateTrainingProgramInput);
    return NextResponse.json({ data: program, error: null, meta: null }, { status: 201 });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}
