"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchAthletes } from "@/lib/api";
import { fetchPrograms } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Users, Dumbbell, ChevronRight } from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function CoachOverview() {
  const { data: athletes = [], isLoading: loadingAthletes } = useQuery({
    queryKey: ["athletes"],
    queryFn: fetchAthletes,
  });

  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ["programs"],
    queryFn: fetchPrograms,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Athletes"
          value={athletes.length}
          icon={Users}
          loading={loadingAthletes}
        />
        <StatCard
          title="Training Programs"
          value={programs.length}
          icon={Dumbbell}
          loading={loadingPrograms}
        />
      </div>

      {/* Athletes preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Your Athletes</CardTitle>
          <Link
            href="/dashboard/athletes"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {loadingAthletes ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : athletes.length === 0 ? (
            <p className="text-sm text-gray-500">
              No athletes yet.{" "}
              <Link href="/dashboard/athletes" className="text-blue-600 hover:underline">
                Add one →
              </Link>
            </p>
          ) : (
            <ul className="divide-y">
              {athletes.slice(0, 5).map((rel) => (
                <li key={rel.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{rel.athlete.name}</p>
                    <p className="text-xs text-gray-500">{rel.athlete.email}</p>
                  </div>
                  <Badge variant="secondary">Athlete</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Programs preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Training Programs</CardTitle>
          <Link
            href="/dashboard/programs"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {loadingPrograms ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <p className="text-sm text-gray-500">
              No programs yet.{" "}
              <Link href="/dashboard/programs" className="text-blue-600 hover:underline">
                Create one →
              </Link>
            </p>
          ) : (
            <ul className="divide-y">
              {programs.slice(0, 5).map((program) => (
                <li key={program.id} className="py-2">
                  <Link
                    href={`/dashboard/programs/${program.id}`}
                    className="flex items-center justify-between hover:text-blue-600"
                  >
                    <p className="text-sm font-medium">{program.title}</p>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
