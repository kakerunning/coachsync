import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronRight } from "lucide-react";
import type { TrainingProgram } from "@/features/training-program/training-program.types";

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProgramCard({ program }: { program: TrainingProgram }) {
  const isActive =
    program.startDate &&
    program.endDate &&
    new Date() >= new Date(program.startDate) &&
    new Date() <= new Date(program.endDate);

  return (
    <Link href={`/dashboard/programs/${program.id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-base">{program.title}</CardTitle>
            {program.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{program.description}</p>
            )}
          </div>
          <ChevronRight className="ml-2 mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>
                {formatDate(program.startDate)} – {formatDate(program.endDate)}
              </span>
            </div>
            {isActive && <Badge className="text-xs">Active</Badge>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
