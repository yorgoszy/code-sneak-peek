import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Droplet, Plus, Trash2 } from "lucide-react";
import { useMenstrualCycles } from "@/hooks/useMenstrualCycles";
import {
  getPhaseForDate,
  phaseColor,
  phaseSoftColor,
} from "@/utils/cyclePhase";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { el } from "date-fns/locale";

interface CyclePageProps {
  userId: string;
  ownerName?: string;
  readOnly?: boolean;
}

export const CyclePage: React.FC<CyclePageProps> = ({
  userId,
  ownerName,
  readOnly = false,
}) => {
  const { cycles, addCycle, deleteCycle } = useMenstrualCycles(userId);
  const [month, setMonth] = useState(new Date());
  const [logOpen, setLogOpen] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [periodLen, setPeriodLen] = useState(5);
  const [cycleLen, setCycleLen] = useState(28);
  const [notes, setNotes] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayPhase = useMemo(() => getPhaseForDate(cycles, today), [cycles, today]);

  // Build month grid
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const submitLog = async () => {
    const ok = await addCycle({
      start_date: startDate,
      period_length: periodLen,
      cycle_length: cycleLen,
      notes: notes || undefined,
    });
    if (ok) {
      setLogOpen(false);
      setNotes("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Phase banner */}
      {todayPhase ? (
        <Card className={`rounded-none border-2 ${phaseSoftColor[todayPhase.phase]}`}>
          <CardContent className="p-4 flex items-start gap-3">
            <Droplet className="h-6 w-6 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base">
                  {todayPhase.label}
                </span>
                <Badge variant="outline" className="rounded-none">
                  Ημέρα {todayPhase.dayOfCycle}
                </Badge>
                <Badge variant="outline" className="rounded-none">
                  Επόμενη: {format(todayPhase.nextStart, "dd/MM/yyyy")}
                </Badge>
              </div>
              <p className="text-sm mt-2">{todayPhase.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-none border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Δεν υπάρχει καταγραφή ακόμα. {!readOnly && "Πάτησε «Καταγραφή Περιόδου» για να ξεκινήσεις."}
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(month, "LLLL yyyy", { locale: el })}
              {ownerName && <span className="text-xs text-muted-foreground">· {ownerName}</span>}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-none"
                onClick={() => setMonth(subMonths(month, 1))}
              >
                ‹
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none"
                onClick={() => setMonth(new Date())}
              >
                Σήμερα
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none"
                onClick={() => setMonth(addMonths(month, 1))}
              >
                ›
              </Button>
              {!readOnly && (
                <Button
                  size="sm"
                  className="rounded-none"
                  onClick={() => setLogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Καταγραφή Περιόδου
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground mb-2">
            {["Δε", "Τρ", "Τε", "Πε", "Πα", "Σά", "Κυ"].map((d) => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const phase = getPhaseForDate(cycles, d);
              const isToday = isSameDay(d, today);
              const inMonth = isSameMonth(d, month);
              return (
                <div
                  key={d.toISOString()}
                  className={`aspect-square border rounded-none p-1 text-xs flex flex-col items-center justify-start ${
                    inMonth ? "" : "opacity-40"
                  } ${isToday ? "border-black border-2" : "border-border"}`}
                >
                  <span className="font-medium">{d.getDate()}</span>
                  {phase && (
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${phaseColor[phase.phase]}`}
                      title={`${phase.label} · ημέρα ${phase.dayOfCycle}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Περίοδος (χαλαρή)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Follicular (δυνατή)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Ωορρηξία
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" /> Luteal (μέτρια)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ιστορικό</CardTitle>
        </CardHeader>
        <CardContent>
          {cycles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Δεν υπάρχουν καταγραφές.</p>
          ) : (
            <div className="divide-y border">
              {cycles.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 text-sm"
                >
                  <div>
                    <div className="font-medium">
                      {format(parseISO(c.start_date), "dd/MM/yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Περίοδος {c.period_length} ημ. · Κύκλος {c.cycle_length} ημ.
                      {c.notes ? ` · ${c.notes}` : ""}
                    </div>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-none"
                      onClick={() => setDeleteId(c.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Καταγραφή Περιόδου</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>1η Ημέρα Περιόδου</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Διάρκεια Περιόδου (μέρες)</Label>
                <Input
                  type="number"
                  min={1}
                  max={14}
                  value={periodLen}
                  onChange={(e) => setPeriodLen(parseInt(e.target.value) || 5)}
                  className="rounded-none"
                />
              </div>
              <div>
                <Label>Διάρκεια Κύκλου (μέρες)</Label>
                <Input
                  type="number"
                  min={15}
                  max={60}
                  value={cycleLen}
                  onChange={(e) => setCycleLen(parseInt(e.target.value) || 28)}
                  className="rounded-none"
                />
              </div>
            </div>
            <div>
              <Label>Σημειώσεις (προαιρετικά)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => setLogOpen(false)}>
              Ακύρωση
            </Button>
            <Button className="rounded-none" onClick={submitLog}>
              Καταχώρηση
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή καταγραφής;</AlertDialogTitle>
            <AlertDialogDescription>
              Η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 rounded-none"
              onClick={async () => {
                if (deleteId) await deleteCycle(deleteId);
                setDeleteId(null);
              }}
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
