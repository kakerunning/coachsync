"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProgram, deleteProgram } from "@/lib/api";
import { SessionList } from "./session-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarDays, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProgramDetailView({ id, role }: { id: string; role: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: program, isLoading, error } = useQuery({
    queryKey: ["program", id],
    queryFn: () => fetchProgram(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      router.push("/dashboard/programs");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">
          {error?.message ?? "Program not found."}
        </p>
        <Link
          href="/dashboard/programs"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← Back to programs
        </Link>
      </div>
    );
  }

  const isActive =
    program.startDate &&
    program.endDate &&
    new Date() >= new Date(program.startDate) &&
    new Date() <= new Date(program.endDate);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/dashboard/programs"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 gap-1 text-gray-500")}
      >
        <ArrowLeft className="h-4 w-4" />
        Programs
      </Link>

      {/* Program header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{program.title}</h1>
            {isActive && <Badge>Active</Badge>}
          </div>
          {program.description && (
            <p className="text-gray-500">{program.description}</p>
          )}
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <CalendarDays className="h-4 w-4" />
            {formatDate(program.startDate)} – {formatDate(program.endDate)}
          </div>
        </div>

        {role === "COACH" && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-red-600 hover:border-red-300 hover:text-red-700"
            onClick={() => {
              if (confirm("Delete this program and all its sessions?")) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            {deleteMutation.isPending ? "Deleting…" : "Delete Program"}
          </Button>
        )}
      </div>

      {/* Sessions */}
      <SessionList programId={id} role={role} />
    </div>
  );
}
