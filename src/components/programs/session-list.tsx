"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSessions, deleteSession } from "@/lib/api";
import { CreateSessionDialog } from "./create-session-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarDays, Trash2 } from "lucide-react";

function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SessionList({ programId, role }: { programId: string; role: string }) {
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ["sessions", programId],
    queryFn: () => fetchSessions(programId),
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => deleteSession(programId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", programId] });
    },
  });

  const upcoming = sessions.filter((s) => new Date(s.scheduledAt) >= new Date());
  const past = sessions.filter((s) => new Date(s.scheduledAt) < new Date());

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load sessions: {error.message}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
        {role === "COACH" && <CreateSessionDialog programId={programId} />}
      </div>

      {sessions.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">
          <p className="text-sm text-gray-500">No sessions scheduled yet.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Upcoming
          </p>
          <ul className="space-y-2">
            {upcoming.map((session) => (
              <li
                key={session.id}
                className="flex items-start justify-between rounded-lg border bg-white p-4"
              >
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{session.title}</p>
                  {session.description && (
                    <p className="text-sm text-gray-500">{session.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDateTime(session.scheduledAt)}
                    </span>
                    {session.durationMin && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.durationMin} min
                      </span>
                    )}
                  </div>
                </div>
                {role === "COACH" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500 shrink-0"
                    onClick={() => deleteMutation.mutate(session.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Past
          </p>
          <ul className="space-y-2">
            {past.map((session) => (
              <li
                key={session.id}
                className="flex items-start justify-between rounded-lg border bg-gray-50 p-4 opacity-70"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-700">{session.title}</p>
                    <Badge variant="outline" className="text-xs">Past</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDateTime(session.scheduledAt)}
                    </span>
                    {session.durationMin && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.durationMin} min
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
