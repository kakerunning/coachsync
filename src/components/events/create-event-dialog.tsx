"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvent, fetchAthletes } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import type { EventType, TestType } from "@/features/event/event.types";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "MATCH", label: "Match" },
  { value: "CAMP", label: "Camp" },
  { value: "TEST", label: "Test" },
  { value: "OTHER", label: "Other" },
];

const TEST_TYPES: { value: TestType; label: string }[] = [
  { value: "VO2MAX", label: "VO2Max" },
  { value: "LACTIC_TOLERANCE", label: "Lactic Tolerance" },
  { value: "TIME_TRIAL", label: "Time Trial" },
  { value: "FIELD_TEST", label: "Field Test" },
];

export function CreateEventDialog({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("MATCH");
  const [testType, setTestType] = useState<TestType>("VO2MAX");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [athleteId, setAthleteId] = useState("");
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const isCoach = role === "COACH";

  const { data: athletes = [] } = useQuery({
    queryKey: ["athletes"],
    queryFn: fetchAthletes,
    enabled: open && isCoach,
  });

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      handleClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleClose() {
    setOpen(false);
    setTitle("");
    setType("MATCH");
    setTestType("VO2MAX");
    setDate("");
    setLocation("");
    setNotes("");
    setAthleteId("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (isCoach && !athleteId) {
      setError("Please select an athlete.");
      return;
    }
    mutation.mutate({
      title: title.trim(),
      type,
      testType: type === "TEST" ? testType : undefined,
      date,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      athleteId,
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        New Event
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Regional Championship"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as EventType)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: "#e5e5e5", borderWidth: "0.5px" }}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {type === "TEST" && (
                <div className="space-y-1">
                  <Label htmlFor="testType">Test Type</Label>
                  <select
                    id="testType"
                    value={testType}
                    onChange={(e) => setTestType(e.target.value as TestType)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    style={{ borderColor: "#e5e5e5", borderWidth: "0.5px" }}
                  >
                    {TEST_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className={`grid gap-3 ${isCoach ? "grid-cols-2" : "grid-cols-1"}`}>
              <div className="space-y-1">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {isCoach && (
                <div className="space-y-1">
                  <Label htmlFor="athlete">Athlete</Label>
                  <select
                    id="athlete"
                    value={athleteId}
                    onChange={(e) => setAthleteId(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
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
            </div>

            <div className="space-y-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes…"
                rows={2}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
