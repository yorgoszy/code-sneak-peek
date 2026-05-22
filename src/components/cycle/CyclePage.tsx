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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  Droplet,
  Plus,
  Trash2,
  Heart,
  Dumbbell,
  Sparkles,
  CalendarClock,
} from "lucide-react";
import { useMenstrualCycles } from "@/hooks/useMenstrualCycles";
import {
  getPhaseForDate,
  getCycleAverages,
  phaseColor,
  phaseSoftColor,
  phaseBgTint,
  intensityLabel,
  intensityBadge,
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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayPhase = useMemo(() => getPhaseForDate(cycles, today), [cycles, today]);
  const averages = useMemo(() => getCycleAverages(cycles), [cycles]);
  const selectedPhase = useMemo(
    () => (selectedDay ? getPhaseForDate(cycles, selectedDay) : null),
    [cycles, selectedDay]
  );

  // Month grid
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

  const KeyCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string;
    sub?: string;
    tint?: string;
  }> = ({ icon, title, value, sub, tint }) => (
    <Card className={`rounded-none border-2 ${tint || ""}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          <span>{title}</span>
        </div>
        <div className="text-lg font-semibold mt-1 leading-tight">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Today phase banner */}
      {todayPhase ? (
        <Card className={`rounded-none border-2 ${phaseSoftColor[todayPhase.phase]}`}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="text-3xl leading-none">{todayPhase.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base">{todayPhase.label}</span>
                <Badge variant="outline" className="rounded-none">
                  Ημέρα {todayPhase.dayOfCycle} / {todayPhase.cycleLength}
                </Badge>
                <Badge
                  variant="outline"
                  className={`rounded-none ${intensityBadge[todayPhase.intensity]}`}
                >
                  Προπόνηση: {intensityLabel[todayPhase.intensity]}
                </Badge>
                {todayPhase.isFertile && (
                  <Badge variant="outline" className="rounded-none bg-pink-100 border-pink-300 text-pink-900">
                    <Heart className="h-3 w-3 mr-1" /> Γόνιμη ημέρα
                  </Badge>
                )}
                {todayPhase.isOvulation && (
                  <Badge variant="outline" className="rounded-none bg-amber-100 border-amber-300 text-amber-900">
                    <Sparkles className="h-3 w-3 mr-1" /> Ωορρηξία σήμερα
                  </Badge>
                )}
              </div>
              <p className="text-sm mt-2">{todayPhase.recommendation}</p>
              <div className="text-xs mt-2 flex items-start gap-1.5 text-muted-foreground">
                <Dumbbell className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>{todayPhase.trainingAdvice}</span>
              </div>
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

      {/* Predictions */}
      {todayPhase && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <KeyCard
            icon={<Droplet className="h-3.5 w-3.5" />}
            title="Επόμενη περίοδος"
            value={format(todayPhase.nextStart, "dd MMM", { locale: el })}
            sub={`σε ${todayPhase.daysUntilNextPeriod} ημέρες`}
            tint="border-red-300"
          />
          <KeyCard
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            title="Λήξη τρέχουσας"
            value={format(todayPhase.periodEnd, "dd MMM", { locale: el })}
            sub={`διάρκεια ${todayPhase.periodLength} ημ.`}
            tint="border-red-300"
          />
          <KeyCard
            icon={<Sparkles className="h-3.5 w-3.5" />}
            title="Ωορρηξία"
            value={format(todayPhase.ovulationDate, "dd MMM", { locale: el })}
            sub={
              todayPhase.daysUntilOvulation === 0
                ? "σήμερα"
                : todayPhase.daysUntilOvulation > 0
                ? `σε ${todayPhase.daysUntilOvulation} ημ.`
                : `πριν ${Math.abs(todayPhase.daysUntilOvulation)} ημ.`
            }
            tint="border-amber-300"
          />
          <KeyCard
            icon={<Heart className="h-3.5 w-3.5" />}
            title="Γόνιμο παράθυρο"
            value={`${format(todayPhase.fertileStart, "dd MMM", { locale: el })} – ${format(
              todayPhase.fertileEnd,
              "dd MMM",
              { locale: el }
            )}`}
            sub="6 ημέρες υψηλής γονιμότητας"
            tint="border-pink-300"
          />
        </div>
      )}

      {/* Calendar */}
      <Card className="rounded-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(month, "LLLL yyyy", { locale: el })}
              {ownerName && (
                <span className="text-xs text-muted-foreground">· {ownerName}</span>
              )}
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
                <Button size="sm" className="rounded-none" onClick={() => setLogOpen(true)}>
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
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const phase = getPhaseForDate(cycles, d);
              const isToday = isSameDay(d, today);
              const inMonth = isSameMonth(d, month);
              const tint = phase ? phaseBgTint[phase.phase] : "";
              const fertileRing =
                phase?.isFertile && !phase.isOvulation
                  ? "ring-1 ring-pink-400 ring-inset"
                  : "";
              return (
                <Popover key={d.toISOString()}>
                  <PopoverTrigger asChild>
                    <button
                      onClick={() => setSelectedDay(d)}
                      className={`aspect-square border rounded-none p-1 text-xs flex flex-col items-center justify-between transition-colors hover:opacity-80 ${tint} ${fertileRing} ${
                        inMonth ? "" : "opacity-40"
                      } ${isToday ? "border-black border-2" : "border-border"}`}
                    >
                      <span className="font-medium self-start">{d.getDate()}</span>
                      <div className="flex items-center gap-0.5">
                        {phase?.isPeriod && (
                          <span
                            className="h-2 w-2 rounded-full bg-red-500"
                            title="Περίοδος"
                          />
                        )}
                        {phase?.isOvulation && (
                          <span
                            className="h-2 w-2 rounded-full bg-amber-500"
                            title="Ωορρηξία"
                          />
                        )}
                        {phase && !phase.isPeriod && !phase.isOvulation && (
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${phaseColor[phase.phase]}`}
                          />
                        )}
                      </div>
                    </button>
                  </PopoverTrigger>
                  {phase && (
                    <PopoverContent className="rounded-none w-72 p-3">
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <span>{phase.emoji}</span>
                        <span>{format(d, "EEEE dd MMM yyyy", { locale: el })}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className={`rounded-none ${phaseSoftColor[phase.phase]}`}>
                          {phase.label}
                        </Badge>
                        <Badge variant="outline" className="rounded-none">
                          Ημ. {phase.dayOfCycle}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`rounded-none ${intensityBadge[phase.intensity]}`}
                        >
                          {intensityLabel[phase.intensity]}
                        </Badge>
                        {phase.isFertile && (
                          <Badge variant="outline" className="rounded-none bg-pink-100 border-pink-300 text-pink-900">
                            Γόνιμη
                          </Badge>
                        )}
                        {phase.isOvulation && (
                          <Badge variant="outline" className="rounded-none bg-amber-100 border-amber-300 text-amber-900">
                            Ωορρηξία
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs mt-2 text-muted-foreground">{phase.recommendation}</p>
                      <div className="text-xs mt-2 flex items-start gap-1.5">
                        <Dumbbell className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{phase.trainingAdvice}</span>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Περίοδος
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
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 border border-pink-400" /> Γόνιμο παράθυρο
            </span>
          </div>

          {cycles.length > 0 && (
            <div className="mt-3 text-[11px] text-muted-foreground">
              Μέσος κύκλος: {averages.avgCycle} ημέρες · Μέση περίοδος: {averages.avgPeriod} ημέρες
              {cycles.length >= 2 && " (από ιστορικό)"}
            </div>
          )}
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
            <Button
              variant="outline"
              className="rounded-none"
              onClick={() => setLogOpen(false)}
            >
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
