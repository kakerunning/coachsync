"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchLoggedSessions } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionListItem } from "@/features/session/session.types";

const TEAL = "#1D9E75";
const BORDER = "0.5px solid #e5e5e5";

function fatigueColor(v: number) {
  if (v <= 2) return TEAL;
  if (v === 3) return "#BA7517";
  return "#E24B4A";
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function SessionsListView() {
  const { data: sessions = [], isLoading, error } = useQuery<SessionListItem[]>({
    queryKey: ["sessions"],
    queryFn: () => fetchLoggedSessions(),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load sessions: {(error as Error).message}</p>;
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
        <p className="text-sm text-gray-500">No sessions logged yet.</p>
        <p className="mt-1 text-sm text-gray-400">
          <Link href="/dashboard/sessions/new" style={{ color: TEAL }}>Log your first session</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <Link key={s.id} href={`/dashboard/sessions/${s.id}`} className="block">
          <div
            style={{ border: BORDER, borderRadius: 12, padding: "12px 16px", backgroundColor: "white" }}
            className="hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(s.date)}</p>
                {s.types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.types.map((t, i) => (
                      <span key={i} style={{ backgroundColor: "#E8F7F2", color: TEAL, fontSize: 11, padding: "1px 7px", borderRadius: 10, fontWeight: 500 }}>
                        {t.type.charAt(0) + t.type.slice(1).toLowerCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {s.feedback && (
                <div className="flex gap-4 text-xs shrink-0 ml-4">
                  <div className="text-center">
                    <p className="text-gray-400">Fatigue</p>
                    <p className="font-semibold" style={{ color: fatigueColor(s.feedback.fatigue) }}>{s.feedback.fatigue}/5</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">RPE</p>
                    <p className="font-semibold" style={{ color: fatigueColor(Math.ceil(s.feedback.rpe / 2)) }}>{s.feedback.rpe}/10</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
