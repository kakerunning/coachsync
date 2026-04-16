// Coach-comment repository — Prisma queries for coach-to-athlete session feedback.
// Comments are always returned with coach name so the UI can attribute them without
// a separate user lookup.
import { db } from "@/lib/db";
import type { CoachComment } from "./coach-comment.types";

// Shared select keeps coach projection consistent across all queries in this file.
const coachSelect = { id: true, name: true };

export async function findCommentsBySession(sessionId: string): Promise<CoachComment[]> {
  return db.coachComment.findMany({
    where: { sessionId },
    include: { coach: { select: coachSelect } },
    orderBy: { createdAt: "asc" },
  });
}

export async function findCommentById(id: string): Promise<CoachComment | null> {
  return db.coachComment.findUnique({
    where: { id },
    include: { coach: { select: coachSelect } },
  });
}

export async function createComment(
  sessionId: string,
  coachId: string,
  text: string
): Promise<CoachComment> {
  return db.coachComment.create({
    data: { sessionId, coachId, text },
    include: { coach: { select: coachSelect } },
  });
}

export async function deleteComment(id: string): Promise<void> {
  await db.coachComment.delete({ where: { id } });
}
