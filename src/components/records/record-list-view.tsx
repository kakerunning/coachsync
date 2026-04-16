// RecordListView — personal best tracker grouped by discipline category.
// Each discipline shows the best mark prominently, with older marks collapsible
// underneath. Coaches must select an athlete before records are fetched.
"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRecords, deleteRecord, fetchAthletes } from "@/lib/api";
import { AddRecordDialog } from "./add-record-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 } from "lucide-react";
import { CATEGORIES, DISCIPLINE_MAP } from "@/features/record/disciplines";
import type { PersonalRecord } from "@/features/record/record.types";

function formatPerf(record: PersonalRecord): string {
  const p = record.performance;
  if (record.unit === "s") {
    // Format as mm:ss.xx for >= 60s
    if (p >= 60) {
      const min = Math.floor(p / 60);
      const sec = (p % 60).toFixed(2).padStart(5, "0");
      return `${min}:${sec}`;
    }
    return p.toFixed(2);
  }
  return p.toFixed(2);
}

function formatWind(wind: number | null): string {
  if (wind == null) return "";
  return wind >= 0 ? `+${wind.toFixed(1)}` : wind.toFixed(1);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}

type GroupedRecords = Map<string, { best: PersonalRecord; history: PersonalRecord[] }>;

function groupRecords(records: PersonalRecord[]): GroupedRecords {
  const map = new Map<string, PersonalRecord[]>();
  for (const r of records) {
    (map.get(r.discipline) ?? map.set(r.discipline, []).get(r.discipline)!).push(r);
  }

  const grouped: GroupedRecords = new Map();
  for (const [discipline, recs] of map) {
    const disc = DISCIPLINE_MAP.get(discipline);
    // Best = lowest for time, highest for distance/field
    const sorted = [...recs].sort((a, b) =>
      disc?.unit === "s" ? a.performance - b.performance : b.performance - a.performance
    );
    grouped.set(discipline, { best: sorted[0], history: sorted.slice(1) });
  }
  return grouped;
}

function RecordRow({
  record,
  isBest,
  onDelete,
  isDeleting,
}: {
  record: PersonalRecord;
  isBest: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const disc = DISCIPLINE_MAP.get(record.discipline);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isBest ? "bg-white" : "bg-gray-50/60"}`}
      style={{ borderBottom: "0.5px solid #e5e5e5" }}
    >
      {/* PB badge */}
      {isBest && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}
        >
          PB
        </span>
      )}
      {!isBest && <span className="w-8 shrink-0" />}

      {/* Performance */}
      <span className={`font-mono font-medium ${isBest ? "text-gray-900" : "text-gray-500"}`}>
        {formatPerf(record)}
        <span className="ml-0.5 text-xs font-normal text-gray-400">{record.unit}</span>
      </span>

      {/* Wind */}
      {disc?.wind && (
        <span className="w-14 shrink-0 text-xs text-gray-400">
          {record.wind != null ? `${formatWind(record.wind)} m/s` : ""}
        </span>
      )}
      {!disc?.wind && <span className="w-14 shrink-0" />}

      {/* Surface */}
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-xs"
        style={
          record.surface === "INDOOR"
            ? { backgroundColor: "#E6F1FB", color: "#185FA5" }
            : { backgroundColor: "#f3f4f6", color: "#6b7280" }
        }
      >
        {record.surface === "INDOOR" ? "Indoor" : "Outdoor"}
      </span>

      {/* Date */}
      <span className="text-gray-400">{formatDate(record.date)}</span>

      {/* Competition / Location */}
      <span className="flex-1 truncate text-gray-400">
        {[record.competition, record.location].filter(Boolean).join(" · ")}
      </span>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-gray-300 hover:text-red-500"
        onClick={onDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function RecordListView({ isCoach, currentUserId }: { isCoach: boolean; currentUserId: string }) {
  const queryClient = useQueryClient();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");

  const athleteId = isCoach ? selectedAthleteId : currentUserId;

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes"],
    queryFn: fetchAthletes,
    enabled: isCoach,
  });

  // Do not fetch until a coach has selected an athlete — an empty athleteId would
  // return the coach's own (non-existent) records rather than erroring gracefully.
  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ["records", athleteId],
    queryFn: () => fetchRecords(athleteId || undefined),
    enabled: !isCoach || !!athleteId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["records", athleteId] }),
  });

  const grouped = useMemo(() => groupRecords(records), [records]);

  // Filter to categories that have at least one record
  const activeCategories = CATEGORIES.filter((cat) =>
    [...grouped.keys()].some((d) => DISCIPLINE_MAP.get(d)?.category === cat)
  );

  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  function toggleHistory(discipline: string) {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      next.has(discipline) ? next.delete(discipline) : next.add(discipline);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Personal Records</h1>
        {(!isCoach || athleteId) && (
          <AddRecordDialog athleteId={athleteId || currentUserId} />
        )}
      </div>

      {/* Athlete selector for coach */}
      {isCoach && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Athlete</label>
          <select
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "#e5e5e5", borderWidth: "0.5px" }}
          >
            <option value="">Select athlete…</option>
            {athletes.map((rel) => (
              <option key={rel.athleteId} value={rel.athleteId}>
                {rel.athlete.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isCoach && !selectedAthleteId && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-400">Select an athlete to view their records.</p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      )}

      {error && <p className="text-sm text-red-600">Failed to load records: {error.message}</p>}

      {!isLoading && !error && records.length === 0 && (!isCoach || athleteId) && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-500">No personal records yet.</p>
          <p className="mt-1 text-sm text-gray-400">Click "Add Record" to log one.</p>
        </div>
      )}

      {/* Grouped records */}
      {activeCategories.map((cat) => {
        const catDisciplines = [...grouped.entries()].filter(
          ([d]) => DISCIPLINE_MAP.get(d)?.category === cat
        );

        return (
          <div key={cat} className="overflow-hidden rounded-xl" style={{ border: "0.5px solid #e5e5e5" }}>
            {/* Category header */}
            <div
              className="flex items-center gap-2 px-4 py-2"
              style={{ backgroundColor: "#f9fafb", borderBottom: "0.5px solid #e5e5e5" }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#1D9E75" }} />
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{cat}</span>
            </div>

            {catDisciplines.map(([discipline, { best, history }]) => {
              const disc = DISCIPLINE_MAP.get(discipline);
              const showHistory = expandedHistory.has(discipline);

              return (
                <div key={discipline}>
                  {/* Discipline label row */}
                  <div
                    className="flex items-center gap-2 bg-white px-4 py-1.5"
                    style={{ borderBottom: "0.5px solid #f3f4f6" }}
                  >
                    <span className="text-xs font-medium text-gray-700">{disc?.label ?? discipline}</span>
                    {history.length > 0 && (
                      <button
                        onClick={() => toggleHistory(discipline)}
                        className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                      >
                        {showHistory ? "Hide history" : `+${history.length} more`}
                      </button>
                    )}
                  </div>

                  {/* Best */}
                  <RecordRow
                    record={best}
                    isBest
                    onDelete={() => deleteMutation.mutate(best.id)}
                    isDeleting={deleteMutation.isPending}
                  />

                  {/* History */}
                  {showHistory &&
                    history.map((r) => (
                      <RecordRow
                        key={r.id}
                        record={r}
                        isBest={false}
                        onDelete={() => deleteMutation.mutate(r.id)}
                        isDeleting={deleteMutation.isPending}
                      />
                    ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
