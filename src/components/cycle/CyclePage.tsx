import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronDown,
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
    <Card className={`rounded-none border ${tint || ""}`}>
      <CardContent className="p-2">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground leading-tight">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        <div className="text-sm font-semibold mt-0.5 leading-tight">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{sub}</div>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-2">
      {/* Today phase banner */}
      {todayPhase ? (
        <Card className={`rounded-none border ${phaseSoftColor[todayPhase.phase]}`}>
          <CardContent className="p-2 flex items-start gap-2">
            <div className="text-xl leading-none">{todayPhase.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-semibold text-xs">{todayPhase.label}</span>
                <Badge variant="outline" className="rounded-none text-[10px] px-1 py-0">
                  Ημ. {todayPhase.dayOfCycle}/{todayPhase.cycleLength}
                </Badge>
                <Badge
                  variant="outline"
                  className={`rounded-none text-[10px] px-1 py-0 ${intensityBadge[todayPhase.intensity]}`}
                >
                  {intensityLabel[todayPhase.intensity]}
                </Badge>
                {todayPhase.isFertile && (
                  <Badge variant="outline" className="rounded-none text-[10px] px-1 py-0 bg-pink-100 border-pink-300 text-pink-900">
                    <Heart className="h-2 w-2 mr-0.5" /> Γόνιμη
                  </Badge>
                )}
                {todayPhase.isOvulation && (
                  <Badge variant="outline" className="rounded-none text-[10px] px-1 py-0 bg-amber-100 border-amber-300 text-amber-900">
                    <Sparkles className="h-2 w-2 mr-0.5" /> Ωορρηξία
                  </Badge>
                )}
              </div>
              <p className="text-[11px] mt-1 leading-snug">{todayPhase.recommendation}</p>
              <div className="text-[11px] mt-0.5 flex items-start gap-1 text-muted-foreground leading-snug">
                <Dumbbell className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{todayPhase.trainingAdvice}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-none border-dashed">
          <CardContent className="p-2 text-[11px] text-muted-foreground">
            Δεν υπάρχει καταγραφή ακόμα. {!readOnly && "Πάτησε «Καταγραφή» για να ξεκινήσεις."}
          </CardContent>
        </Card>
      )}

      {/* Predictions */}
      {todayPhase && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
          <KeyCard
            icon={<Droplet className="h-3 w-3" />}
            title="Επόμ. περίοδος"
            value={format(todayPhase.nextStart, "dd MMM", { locale: el })}
            sub={`σε ${todayPhase.daysUntilNextPeriod} ημ.`}
            tint="border-red-300"
          />
          <KeyCard
            icon={<CalendarClock className="h-3 w-3" />}
            title="Λήξη τρέχουσας"
            value={format(todayPhase.periodEnd, "dd MMM", { locale: el })}
            sub={`${todayPhase.periodLength} ημ.`}
            tint="border-red-300"
          />
          <KeyCard
            icon={<Sparkles className="h-3 w-3" />}
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
            icon={<Heart className="h-3 w-3" />}
            title="Γόνιμο παράθυρο"
            value={`${format(todayPhase.fertileStart, "dd MMM", { locale: el })}–${format(
              todayPhase.fertileEnd,
              "dd MMM",
              { locale: el }
            )}`}
            sub="6 ημέρες"
            tint="border-pink-300"
          />
        </div>
      )}

      {/* Calendar */}
      <Card className="rounded-none">
        <CardHeader className="p-2 pb-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-xs flex items-center gap-1.5 min-w-1">
              <CalendarIcon className="h-3 w-3 flex-shrink-0" />
              <span className="capitalize truncate">{format(month, "LLLL yyyy", { locale: el })}</span>
            </CardTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="rounded-none h-6 w-6 text-xs"
                onClick={() => setMonth(subMonths(month, 1))}
              >
                ‹
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none h-6 px-1.5 text-[10px]"
                onClick={() => setMonth(new Date())}
              >
                Σήμερα
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-none h-6 w-6 text-xs"
                onClick={() => setMonth(addMonths(month, 1))}
              >
                ›
              </Button>
              {!readOnly && (
                <Button size="icon" className="rounded-none h-6 w-6 sm:hidden" onClick={() => setLogOpen(true)} title="Καταγραφή">
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              {!readOnly && (
                <Button size="sm" className="rounded-none h-6 px-1.5 text-[10px] hidden sm:inline-flex" onClick={() => setLogOpen(true)}>
                  <Plus className="h-3 w-3 mr-0.5" />
                  Καταγραφή
                </Button>
              )}
            </div>
          </div>
          {ownerName && (
            <div className="text-[10px] text-muted-foreground mt-0.5">{ownerName}</div>
          )}
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="grid grid-cols-7 text-[10px] font-medium text-muted-foreground mb-0.5">
            {["Δε", "Τρ", "Τε", "Πε", "Πα", "Σά", "Κυ"].map((d) => (
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
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
                      className={`h-8 lg:h-9 border rounded-none p-0.5 text-[10px] flex flex-col items-center justify-between transition-colors hover:opacity-80 ${tint} ${fertileRing} ${
                        inMonth ? "" : "opacity-40"
                      } ${isToday ? "border-black border-2" : "border-border"}`}
                    >
                      <span className="font-medium self-start leading-none">{d.getDate()}</span>
                      <div className="flex items-center gap-0.5">
                        {phase?.isPeriod && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        )}
                        {phase?.isOvulation && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        )}
                        {phase && !phase.isPeriod && !phase.isOvulation && (
                          <span
                            className={`h-1 w-1 rounded-full ${phaseColor[phase.phase]}`}
                          />
                        )}
                      </div>
                    </button>
                  </PopoverTrigger>
                  {phase && (
                    <PopoverContent className="rounded-none w-64 p-2" align="center">
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <span>{phase.emoji}</span>
                        <span>{format(d, "EEEE dd MMM yyyy", { locale: el })}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <Badge variant="outline" className={`rounded-none text-[10px] px-1 py-1 ${phaseSoftColor[phase.phase]}`}>
                          {phase.label}
                        </Badge>
                        <Badge variant="outline" className="rounded-none text-[10px] px-1 py-1">
                          Ημ. {phase.dayOfCycle}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`rounded-none text-[10px] px-1 py-1 ${intensityBadge[phase.intensity]}`}
                        >
                          {intensityLabel[phase.intensity]}
                        </Badge>
                        {phase.isFertile && (
                          <Badge variant="outline" className="rounded-none text-[10px] px-1 py-1 bg-pink-100 border-pink-300 text-pink-900">
                            Γόνιμη
                          </Badge>
                        )}
                        {phase.isOvulation && (
                          <Badge variant="outline" className="rounded-none text-[10px] px-1 py-1 bg-amber-100 border-amber-300 text-amber-900">
                            Ωορρηξία
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] mt-1.5 text-muted-foreground">{phase.recommendation}</p>
                      <div className="text-[11px] mt-1.5 flex items-start gap-1">
                        <Dumbbell className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{phase.trainingAdvice}</span>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              );
            })}
          </div>

          {/* Legend + Averages inline */}
          <div className="flex items-center gap-x-2 gap-y-0.5 mt-2 text-[10px] flex-wrap">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Περίοδος
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Follicular
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Ωορρηξία
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Luteal
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 border border-pink-400" /> Γόνιμο
            </span>
            {cycles.length > 0 && (
              <span className="text-muted-foreground ml-auto">
                Μέσος κύκλος: {averages.avgCycle}ημ. · Μέση περίοδος: {averages.avgPeriod}ημ.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History — Collapsible */}
      <Collapsible defaultOpen={cycles.length <= 3}>
        <Card className="rounded-none">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50">
              <span className="text-xs font-semibold">Ιστορικό καταγραφών</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-1 pb-2 px-2">
              {cycles.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">Δεν υπάρχουν καταγραφές.</p>
              ) : (
                <div className="divide-y border max-h-32 overflow-y-auto">
                  {cycles.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 text-[11px]"
                    >
                      <div>
                        <div className="font-medium">
                          {format(parseISO(c.start_date), "dd/MM/yyyy")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Περίοδος {c.period_length}ημ. · Κύκλος {c.cycle_length}ημ.
                          {c.notes ? ` · ${c.notes}` : ""}
                        </div>
                      </div>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-none h-6 w-6"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
