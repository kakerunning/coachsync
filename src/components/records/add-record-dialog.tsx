"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { DISCIPLINES, CATEGORIES } from "@/features/record/disciplines";
import type { Surface } from "@/features/record/record.types";

const selectClass = "w-full rounded-md border px-3 py-2 text-sm";
const selectStyle = { borderColor: "#e5e5e5", borderWidth: "0.5px" as const };

export function AddRecordDialog({ athleteId }: { athleteId: string }) {
  const [open, setOpen] = useState(false);
  const [discipline, setDiscipline] = useState(DISCIPLINES[0].value);
  const [performance, setPerformance] = useState("");
  const [wind, setWind] = useState("");
  const [date, setDate] = useState("");
  const [surface, setSurface] = useState<Surface>("OUTDOOR");
  const [competition, setCompetition] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const selectedDiscipline = DISCIPLINES.find((d) => d.value === discipline)!;

  const mutation = useMutation({
    mutationFn: createRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", athleteId] });
      handleClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleClose() {
    setOpen(false);
    setDiscipline(DISCIPLINES[0].value);
    setPerformance("");
    setWind("");
    setDate("");
    setSurface("OUTDOOR");
    setCompetition("");
    setLocation("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const perf = parseFloat(performance);
    if (isNaN(perf)) { setError("Performance must be a number."); return; }
    if (!date) { setError("Date is required."); return; }

    mutation.mutate({
      athleteId,
      discipline,
      performance: perf,
      unit: selectedDiscipline.unit,
      wind: wind ? parseFloat(wind) : null,
      date,
      surface,
      competition: competition.trim() || undefined,
      location: location.trim() || undefined,
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Record
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Personal Record</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Discipline */}
            <div className="space-y-1">
              <Label htmlFor="discipline">Discipline</Label>
              <select
                id="discipline"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className={selectClass}
                style={selectStyle}
              >
                {CATEGORIES.map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {DISCIPLINES.filter((d) => d.category === cat).map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Performance */}
              <div className="space-y-1">
                <Label htmlFor="performance">
                  Performance ({selectedDiscipline.unit})
                </Label>
                <Input
                  id="performance"
                  type="number"
                  step="0.01"
                  value={performance}
                  onChange={(e) => setPerformance(e.target.value)}
                  placeholder={selectedDiscipline.unit === "s" ? "e.g. 10.45" : "e.g. 7.82"}
                />
              </div>

              {/* Wind */}
              {selectedDiscipline.wind && (
                <div className="space-y-1">
                  <Label htmlFor="wind">Wind (m/s)</Label>
                  <Input
                    id="wind"
                    type="number"
                    step="0.1"
                    value={wind}
                    onChange={(e) => setWind(e.target.value)}
                    placeholder="e.g. -1.2"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Date */}
              <div className="space-y-1">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Surface */}
              <div className="space-y-1">
                <Label htmlFor="surface">Surface</Label>
                <select
                  id="surface"
                  value={surface}
                  onChange={(e) => setSurface(e.target.value as Surface)}
                  className={selectClass}
                  style={selectStyle}
                >
                  <option value="OUTDOOR">Outdoor</option>
                  <option value="INDOOR">Indoor</option>
                </select>
              </div>
            </div>

            {/* Competition */}
            <div className="space-y-1">
              <Label htmlFor="competition">Competition</Label>
              <Input
                id="competition"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                placeholder="Optional"
              />
            </div>

            {/* Location */}
            <div className="space-y-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Optional"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
