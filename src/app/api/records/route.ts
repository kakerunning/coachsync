// GET  /api/records — list personal records for a given athlete.
//   Defaults to the authenticated user's own records; coaches may pass
//   ?athleteId= to view records for one of their roster athletes.
// POST /api/records — create a personal record. Athletes only; service enforces this.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { PersonalRecord, CreateRecordInput } from "@/features/record/record.types";
import * as service from "@/features/record/record.service";

type SessionUser = { id?: string; role?: string };
type ApiResponse<T> = { data: T | null; error: string | null; meta: null };

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PersonalRecord[]>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  const athleteId = req.nextUrl.searchParams.get("athleteId") ?? user.id;

  try {
    const result = await service.listRecords(user.id, user.role, athleteId);
    if (!result.ok) {
      return NextResponse.json({ data: null, error: result.error, meta: null }, { status: result.status });
    }
    return NextResponse.json({ data: result.records, error: null, meta: null });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", meta: null }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PersonalRecord>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body", meta: null }, { status: 400 });
  }

  try {
    const result = await service.createRecord(user.id, user.role, body as CreateRecordInput);
    if (!result.ok) {
      return NextResponse.json({ data: null, error: result.error, meta: null }, { status: result.status });
    }
    return NextResponse.json({ data: result.record, error: null, meta: null }, { status: 201 });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", meta: null }, { status: 500 });
  }
}
