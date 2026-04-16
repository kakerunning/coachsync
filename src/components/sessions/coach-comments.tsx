// CoachComments — displays coach-to-athlete feedback on a session.
// Athletes can read and translate comments; only coaches can post or delete.
// Translations are cached in component state so toggling hide/show does not
// trigger a second API call.
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchComments, postComment, deleteComment, translate, fetchProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Languages } from "lucide-react";
import type { CoachComment } from "@/features/coach-comment/coach-comment.types";

const TEAL = "#1D9E75";
const BORDER = "0.5px solid #e5e5e5";

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CommentItem({
  comment,
  isOwner,
  userLang,
  onDelete,
  isDeleting,
}: {
  comment: CoachComment;
  isOwner: boolean;
  userLang: string;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [translation, setTranslation] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const translateMutation = useMutation({
    mutationFn: () => translate(comment.text, userLang),
    onSuccess: (data) => {
      setTranslation(data.translatedText);
      setShowTranslation(true);
    },
  });

  function handleTranslate() {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    if (translation) {
      setShowTranslation(true);
      return;
    }
    translateMutation.mutate();
  }

  return (
    <div style={{ borderBottom: "0.5px solid #f3f4f6", paddingBottom: 12 }}>
      <div className="flex gap-3">
        {/* Avatar initial */}
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: TEAL }}
        >
          {comment.coach.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-gray-700">{comment.coach.name}</span>
            <span className="text-xs text-gray-400 shrink-0">{formatTime(comment.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{comment.text}</p>

          {/* Translation */}
          {showTranslation && translation && (
            <div
              className="mt-2 rounded-lg px-3 py-2 text-sm text-gray-700"
              style={{ backgroundColor: "#f0fdf8", border: "0.5px solid #5DCAA5" }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: TEAL }}>Translation</p>
              <p className="whitespace-pre-wrap">{translation}</p>
            </div>
          )}

          {/* Translate button */}
          <button
            onClick={handleTranslate}
            disabled={translateMutation.isPending}
            className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <Languages className="h-3 w-3" />
            {translateMutation.isPending
              ? "Translating…"
              : showTranslation
              ? "Hide translation"
              : "Translate"}
          </button>
        </div>

        {/* Delete (own comment only) */}
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 self-start text-gray-300 hover:text-red-500"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function CoachComments({
  sessionId,
  isCoach,
  currentUserId,
}: {
  sessionId: string;
  isCoach: boolean;
  currentUserId: string;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<CoachComment[]>({
    queryKey: ["comments", sessionId],
    queryFn: () => fetchComments(sessionId),
  });

  // Fetch the current user's language preference to use as the DeepL target
  // when translating coach comments. Falls back to "en" if the profile is unavailable.
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });
  const userLang = profile?.language ?? "en";

  const addMutation = useMutation({
    mutationFn: (t: string) => postComment(sessionId, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", sessionId] });
      setText("");
      setError("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(sessionId, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", sessionId] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!text.trim()) { setError("Comment cannot be empty."); return; }
    addMutation.mutate(text);
  }

  return (
    <div
      style={{ border: BORDER, borderRadius: 12, overflow: "hidden", backgroundColor: "white", marginBottom: 12 }}
    >
      {/* Header */}
      <div style={{ backgroundColor: "#f7f7f7", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: TEAL, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Coach feedback</span>
      </div>

      <div style={{ padding: 16 }}>
        {isLoading && <p className="text-sm text-gray-400">Loading…</p>}

        {!isLoading && comments.length === 0 && (
          <p className="text-sm text-gray-400 mb-3">No coach feedback yet.</p>
        )}

        {comments.length > 0 && (
          <div className="space-y-3 mb-4">
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                isOwner={isCoach && c.coachId === currentUserId}
                userLang={userLang}
                onDelete={() => deleteMutation.mutate(c.id)}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Input (coach only) */}
        {isCoach && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Leave feedback for the athlete…"
              rows={3}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button
              type="submit"
              size="sm"
              disabled={addMutation.isPending}
              style={{ backgroundColor: TEAL, color: "white" }}
            >
              {addMutation.isPending ? "Posting…" : "Post feedback"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
