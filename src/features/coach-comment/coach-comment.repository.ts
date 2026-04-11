import { db } from "@/lib/db";
import type { CoachComment } from "./coach-comment.types";

const coachSelect = { id: true, name: true };

// find all comments by session id (ordered by createdAt ascending)
export async function findCommentsBySession(sessionId: string): Promise<CoachComment[]> {
  return db.coachComment.findMany({
    where: { sessionId },
    include: { coach: { select: coachSelect } },
    orderBy: { createdAt: "asc" },
  });
}

// find a comment by id (includes coach select)
export async function findCommentById(id: string): Promise<CoachComment | null> {
  return db.coachComment.findUnique({
    where: { id },
    include: { coach: { select: coachSelect } },
  });
}

// create a new comment (includes coach select)
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
