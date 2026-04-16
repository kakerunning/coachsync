// Record service — access control for personal best tracking.
// Athletes own their records; coaches on the same roster can read and delete
// (e.g. to correct a data entry error) but cannot create records on behalf of athletes.
import { db } from "@/lib/db";
import * as repo from "./record.repository";
import type { PersonalRecord, CreateRecordInput } from "./record.types";

export async function listRecords(
  requesterId: string,
  requesterRole: string,
  athleteId: string
): Promise<{ ok: true; records: PersonalRecord[] } | { ok: false; status: 403; error: string }> {
  if (requesterRole === "ATHLETE" && requesterId !== athleteId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (requesterRole === "COACH") {
    const relation = await db.coachAthleteRelation.findUnique({
      where: { coachId_athleteId: { coachId: requesterId, athleteId } },
    });
    if (!relation) return { ok: false, status: 403, error: "Athlete not on your roster" };
  }

  const records = await repo.findRecordsByAthlete(athleteId);
  return { ok: true, records };
}

export type CreateRecordResult =
  | { ok: true; record: PersonalRecord }
  | { ok: false; status: 400 | 403; error: string };

export async function createRecord(
  requesterId: string,
  requesterRole: string,
  input: CreateRecordInput
): Promise<CreateRecordResult> {
  if (!input.discipline || input.performance == null || !input.date) {
    return { ok: false, status: 400, error: "discipline, performance, and date are required" };
  }

  if (requesterRole === "ATHLETE" && requesterId !== input.athleteId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (requesterRole === "COACH") {
    const relation = await db.coachAthleteRelation.findUnique({
      where: { coachId_athleteId: { coachId: requesterId, athleteId: input.athleteId } },
    });
    if (!relation) return { ok: false, status: 403, error: "Athlete not on your roster" };
  }

  const record = await repo.createRecord(requesterId, input);
  return { ok: true, record };
}

export type DeleteRecordResult =
  | { ok: true }
  | { ok: false; status: 403 | 404; error: string };

export async function deleteRecord(
  requesterId: string,
  requesterRole: string,
  recordId: string
): Promise<DeleteRecordResult> {
  const record = await repo.findRecordById(recordId);
  if (!record) return { ok: false, status: 404, error: "Record not found" };

  // loggedById covers the case where a coach originally created the record
  // on behalf of an athlete and should be able to delete their own entry.
  const isOwner = record.athleteId === requesterId || record.loggedById === requesterId;
  const isCoachOfAthlete =
    requesterRole === "COACH" &&
    !!(await db.coachAthleteRelation.findUnique({
      where: { coachId_athleteId: { coachId: requesterId, athleteId: record.athleteId } },
    }));

  if (!isOwner && !isCoachOfAthlete) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  await repo.deleteRecord(recordId);
  return { ok: true };
}
