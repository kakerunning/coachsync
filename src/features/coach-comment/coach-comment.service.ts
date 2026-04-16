// Business logic for coach comments on training sessions.
// Reading comments is open to both the athlete (their session) and any coach on
// their roster. Writing is coach-only and requires an active roster relationship.
// Push notifications are sent to the athlete fire-and-forget after a comment is saved.
import { db } from "@/lib/db";
import * as repo from "./coach-comment.repository";
import { notifyUser } from "@/lib/push";
import type { CoachComment } from "./coach-comment.types";

// Read access is intentionally broader than session detail access: any coach who has
// the athlete on their roster can read comments, even if they are not the session's
// assigned coachId. This allows assistant coaches or multi-coach setups to review feedback.
async function canAccessSession(
  sessionId: string,
  requesterId: string,
  requesterRole: string
): Promise<boolean> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { athleteId: true, coachId: true },
  });
  if (!session) return false;
  if (session.athleteId === requesterId) return true;
  if (requesterRole === "COACH") {
    const relation = await db.coachAthleteRelation.findUnique({
      where: { coachId_athleteId: { coachId: requesterId, athleteId: session.athleteId } },
    });
    return !!relation;
  }
  return false;
}

export type ListCommentsResult =
  | { ok: true; comments: CoachComment[] }
  | { ok: false; status: 403 | 404; error: string };

// list all comments for a session (includes ownership checks)
export async function listComments(
  sessionId: string,
  requesterId: string,
  requesterRole: string
): Promise<ListCommentsResult> {
  const allowed = await canAccessSession(sessionId, requesterId, requesterRole);
  if (!allowed) return { ok: false, status: 403, error: "Forbidden" };

  const comments = await repo.findCommentsBySession(sessionId);
  return { ok: true, comments };
}

export type CreateCommentResult =
  | { ok: true; comment: CoachComment }
  | { ok: false; status: 400 | 403; error: string };

export async function createComment(
  sessionId: string,
  coachId: string,
  requesterRole: string,
  text: string
): Promise<CreateCommentResult> {
  if (requesterRole !== "COACH") {
    return { ok: false, status: 403, error: "Only coaches can leave comments" };
  }
  if (!text.trim()) {
    return { ok: false, status: 400, error: "Comment text is required" };
  }

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { athleteId: true },
  });
  if (!session) return { ok: false, status: 403, error: "Session not found" };

  const relation = await db.coachAthleteRelation.findUnique({
    where: { coachId_athleteId: { coachId, athleteId: session.athleteId } },
  });
  if (!relation) return { ok: false, status: 403, error: "Athlete not on your roster" };

  const comment = await repo.createComment(sessionId, coachId, text.trim());

  // Notify athlete fire-and-forget — a failed push must never roll back a saved comment.
  // .catch(() => {}) silences the rejection so the promise doesn't surface as an unhandled error.
  notifyUser(session.athleteId, {
    title: "New coach feedback",
    body: `${comment.coach.name}: ${text.trim().slice(0, 100)}`,
    url: `/dashboard/sessions/${sessionId}`,
  }).catch(() => {});

  return { ok: true, comment };
}

export type DeleteCommentResult =
  | { ok: true }
  | { ok: false; status: 403 | 404; error: string };

export async function deleteComment(
  commentId: string,
  coachId: string
): Promise<DeleteCommentResult> {
  const comment = await repo.findCommentById(commentId);
  if (!comment) return { ok: false, status: 404, error: "Comment not found" };
  if (comment.coachId !== coachId) return { ok: false, status: 403, error: "Forbidden" };

  await repo.deleteComment(commentId);
  return { ok: true };
}
