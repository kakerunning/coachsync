"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPrograms } from "@/lib/api";
import { ProgramCard } from "./program-card";
import { CreateProgramDialog } from "./create-program-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export function ProgramListView({ role }: { role: string }) {
  const { data: programs = [], isLoading, error } = useQuery({
    queryKey: ["programs"],
    queryFn: fetchPrograms,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Training Programs</h1>
        {role === "COACH" && <CreateProgramDialog />}
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">Failed to load programs: {error.message}</p>
      )}

      {!isLoading && !error && programs.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-500">No training programs yet.</p>
          {role === "COACH" && (
            <p className="mt-1 text-sm text-gray-400">Click "New Program" to get started.</p>
          )}
        </div>
      )}

      {!isLoading && programs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}
    </div>
  );
}
