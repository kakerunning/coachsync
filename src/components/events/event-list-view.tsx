"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEvents, deleteEvent } from "@/lib/api";
import { Paginator } from "@/components/ui/paginator";
import { CreateEventDialog } from "./create-event-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, MapPin } from "lucide-react";
import type { EventType, TestType } from "@/features/event/event.types";

const TYPE_COLORS: Record<EventType, string> = {
  MATCH: "#E24B4A",
  CAMP: "#378ADD",
  TEST: "#1D9E75",
  OTHER: "#888780",
};

const TYPE_LABELS: Record<EventType, string> = {
  MATCH: "Match",
  CAMP: "Camp",
  TEST: "Test",
  OTHER: "Other",
};

const TEST_LABELS: Record<TestType, string> = {
  VO2MAX: "VO2Max",
  LACTIC_TOLERANCE: "Lactic Tolerance",
  TIME_TRIAL: "Time Trial",
  FIELD_TEST: "Field Test",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventListView({ role, userId }: { role: string; userId: string }) {
  const isCoach = role === "COACH";
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["events", page],
    queryFn: () => fetchEvents(page),
  });

  const events = data?.items ?? [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <CreateEventDialog role={role} />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

      {error && <p className="text-sm text-red-600">Failed to load events: {error.message}</p>}

      {!isLoading && !error && events.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-500">No events scheduled yet.</p>
          <p className="mt-1 text-sm text-gray-400">Click "New Event" to add one.</p>
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 rounded-xl bg-white px-4 py-3"
              style={{ border: "0.5px solid #e5e5e5" }}
            >
              {/* Type dot */}
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[event.type] }}
              />

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{event.title}</span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${TYPE_COLORS[event.type]}18`,
                      color: TYPE_COLORS[event.type],
                    }}
                  >
                    {event.testType ? TEST_LABELS[event.testType] : TYPE_LABELS[event.type]}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                  <span>{formatDate(event.date)}</span>
                  {isCoach && <span>{event.athlete.name}</span>}
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete (own events) */}
              {(event.coachId === userId || event.athleteId === userId) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-gray-400 hover:text-red-500"
                  onClick={() => {
                    if (confirm(`Delete "${event.title}"?`)) {
                      deleteMutation.mutate(event.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {meta && <Paginator meta={meta} onPageChange={setPage} />}
    </div>
  );
}
