"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAthletes, removeAthlete } from "@/lib/api";
import { AddAthleteDialog } from "./add-athlete-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserMinus } from "lucide-react";
import { CreateInviteButton } from "@/components/invite/create-invite-button";
import Link from "next/link";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AthleteListView() {
  const queryClient = useQueryClient();

  const { data: athletes = [], isLoading, error } = useQuery({
    queryKey: ["athletes"],
    queryFn: fetchAthletes,
  });

  const removeMutation = useMutation({
    mutationFn: removeAthlete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Athletes</h1>
        <div className="flex gap-2">
          <CreateInviteButton />
          <AddAthleteDialog />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">Failed to load athletes: {error.message}</p>
      )}

      {!isLoading && !error && athletes.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-500">No athletes on your roster yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Click "Add Athlete" to invite someone by email.
          </p>
        </div>
      )}

      {!isLoading && athletes.length > 0 && (
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {athletes.map((rel) => (
                <TableRow key={rel.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/athletes/${rel.athleteId}/sessions`}
                      className="hover:underline text-gray-900"
                    >
                      {rel.athlete.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-500">{rel.athlete.email}</TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {formatDate(rel.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => {
                        if (confirm(`Remove ${rel.athlete.name} from your roster?`)) {
                          removeMutation.mutate(rel.athleteId);
                        }
                      }}
                      disabled={removeMutation.isPending}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
