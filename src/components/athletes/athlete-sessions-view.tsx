"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchAthleteSessionsForCoach } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Paginator } from "@/components/ui/paginator";
import { ArrowLeft } from "lucide-react";
import type { AthleteSessionListItem } from "@/features/session/session.types";
import type { Paginated } from "@/lib/api";

const TEAL = "#1D9E75";
const BORDER = "0.5px solid #e5e5e5";

function fatigueColor(v: number) {
  if (v <= 2) return TEAL;
  if (v === 3) return "#BA7517";
  return "#E24B4A";
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SessionCard({ s, athleteId }: { s: AthleteSessionListItem; athleteId: string }) {
  return (
    <Link href={`/dashboard/athletes/${athleteId}/sessions/${s.id}`} className="block">
      <div
        style={{ border: BORDER, borderRadius: 12, padding: "14px 16px", backgroundColor: "white" }}
        className="hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(s.date)}</p>

            {s.durationMin && (
              <p className="text-xs text-gray-500 mt-0.5">{s.durationMin} min</p>
            )}

            {s.types.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {s.types.map((t, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: "#E8F7F2",
                      color: TEAL,
                      fontSize: 11,
                      padding: "1px 7px",
                      borderRadius: 10,
                      fontWeight: 500,
                    }}
                  >
                    {t.type.charAt(0) + t.type.slice(1).toLowerCase()}
                  </span>
                ))}
              </div>
            )}

            {s.feedback?.note && (
              <p className="text-xs text-gray-500 mt-2 italic line-clamp-2">
                &ldquo;{s.feedback.note}&rdquo;
              </p>
            )}
          </div>

          {s.feedback && (
            <div className="flex gap-4 text-xs shrink-0">
              <div className="text-center">
                <p className="text-gray-400">Fatigue</p>
                <p className="font-semibold" style={{ color: fatigueColor(s.feedback.fatigue) }}>
                  {s.feedback.fatigue}/5
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">RPE</p>
                <p
                  className="font-semibold"
                  style={{ color: fatigueColor(Math.ceil(s.feedback.rpe / 2)) }}
                >
                  {s.feedback.rpe}/10
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function AthleteSessionsView({
  athleteId,
  athleteName,
}: {
  athleteId: string;
  athleteName: string;
}) {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<Paginated<AthleteSessionListItem>>({
    queryKey: ["athlete-sessions", athleteId, page],
    queryFn: () => fetchAthleteSessionsForCoach(athleteId, page),
  });

  const sessions = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/athletes"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Roster
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{athleteName}</h1>
      </div>

      <p className="text-sm text-gray-500 -mt-2">Session log</p>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">
          Failed to load sessions: {(error as Error).message}
        </p>
      )}

      {!isLoading && !error && sessions.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-500">No sessions logged yet by this athlete.</p>
        </div>
      )}

      {!isLoading && sessions.length > 0 && (
        <div className="space-y-2">
          {sessions.map((s) => (
            <SessionCard key={s.id} s={s} athleteId={athleteId} />
          ))}
        </div>
      )}

      {meta && <Paginator meta={meta} onPageChange={setPage} />}
    </div>
  );
}
