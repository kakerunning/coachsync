"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSession } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

export function CreateSessionDialog({ programId }: { programId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof createSession>[1]) =>
      createSession(programId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", programId] });
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleClose() {
    setOpen(false);
    setTitle("");
    setDescription("");
    setScheduledAt("");
    setDurationMin("");
    setNotes("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!scheduledAt) {
      setError("Scheduled date/time is required.");
      return;
    }
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMin: durationMin ? parseInt(durationMin, 10) : undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Add Session
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Training Session</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="sessionTitle">Title</Label>
              <Input
                id="sessionTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Day 1 – Squat Focus"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sessionDescription">Description</Label>
              <Textarea
                id="sessionDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional…"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="durationMin">Duration (min)</Label>
                <Input
                  id="durationMin"
                  type="number"
                  min="1"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Coach notes…"
                rows={2}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Adding…" : "Add Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
