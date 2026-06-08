import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUserExerciseDataCacheContext } from '@/hooks/useUserExerciseDataCache';
import { Play, CalendarIcon, Send, X } from 'lucide-react';
import { useExercises } from '@/hooks/useExercises';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { useProgramBuilderState } from '@/components/programs/builder/hooks/useProgramBuilderState';
import { useProgramBuilderActions } from '@/components/programs/builder/hooks/useProgramBuilderActions';
import { TrainingWeeks } from '@/components/programs/builder/TrainingWeeks';
import { PlanStrongZoneKgProvider } from '@/contexts/PlanStrongZoneKgContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { formatDateForStorage } from '@/utils/dateUtils';
import { programService } from '@/components/programs/builder/services/programService';
import { assignmentService } from '@/components/programs/builder/services/assignmentService';
import { workoutCompletionService } from '@/components/programs/builder/services/workoutCompletionService';
import { cn } from '@/lib/utils';

export interface PlanStrongWS2Program {
  weeks: any[];
}

interface EmbeddedBuilderProps {
  initial?: PlanStrongWS2Program | null;
  totalWeeks: number;
  onChange: (program: PlanStrongWS2Program) => void;
  selectedUserId?: string;
  coachId?: string;
  onActiveWeekIndexChange?: (idx: number) => void;
  weekDifficulties?: (string | null)[];
  addFromNLRef?: React.MutableRefObject<((weekIdx: number, exerciseId: string, exerciseName: string, kg: number, pct: number, velocity: number, blockId?: string) => void) | null>;
}

const EmbeddedBuilder: React.FC<EmbeddedBuilderProps> = ({ initial, totalWeeks, onChange, selectedUserId, coachId, onActiveWeekIndexChange, weekDifficulties, addFromNLRef }) => {
  const { exercises } = useExercises();
  const { program, updateProgram, generateId, loadProgramFromData } = useProgramBuilderState(exercises as any);
  const actions = useProgramBuilderActions(program, updateProgram, generateId, exercises as any);

  // Expose function for parent NL row to add an exercise into the current week
  useEffect(() => {
    if (!addFromNLRef) return;
    addFromNLRef.current = (weekIdx, exerciseId, exerciseName, kg, pct, velocity) => {
      updateProgram((prev) => {
        const weeks = [...(prev.weeks || [])];
        if (!weeks[weekIdx]) return prev;
        const week = { ...weeks[weekIdx] };
        const days = [...(week.program_days || [])];
        if (days.length === 0) {
          days.push({ id: generateId(), name: 'Ημέρα 1', day_number: 1, program_blocks: [] });
        }
        const day = { ...days[0] };
        let blocks = [...(day.program_blocks || [])];
        if (blocks.length === 0) {
          blocks.push({
            id: generateId(),
            name: 'Block 1',
            block_sets: 1,
            block_order: 1,
            program_exercises: [],
          } as any);
        }
        const lastIdx = blocks.length - 1;
        const lastBlock = { ...blocks[lastIdx] };
        const exList = [...(lastBlock.program_exercises || [])];
        exList.push({
          id: generateId(),
          exercise_id: exerciseId,
          sets: 1,
          reps: '',
          reps_mode: 'reps' as const,
          kg: String(kg).replace('.', ','),
          kg_mode: 'kg' as const,
          percentage_1rm: pct,
          velocity_ms: velocity ? Number(velocity.toFixed(2)) : 0,
          tempo: '',
          rest: '',
          notes: '',
          exercise_order: exList.length + 1,
          exercises: { id: exerciseId, name: exerciseName, description: '' },
        });
        lastBlock.program_exercises = exList;
        blocks[lastIdx] = lastBlock;
        day.program_blocks = blocks;
        days[0] = day;
        week.program_days = days;
        weeks[weekIdx] = week;
        return { weeks };
      });
    };
    return () => { if (addFromNLRef) addFromNLRef.current = null; };
  }, [addFromNLRef, updateProgram, generateId]);


  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (!exercises || exercises.length === 0) return;
    seededRef.current = true;

    const existing = (initial && Array.isArray(initial.weeks)) ? initial.weeks : [];
    const weeks = [...existing];
    while (weeks.length < totalWeeks) {
      const i = weeks.length;
      weeks.push({
        id: generateId(),
        name: `Εβδομάδα ${i + 1}`,
        week_number: i + 1,
        program_days: [{
          id: generateId(),
          name: 'Ημέρα 1',
          day_number: 1,
          program_blocks: [],
        }],
      });
    }
    loadProgramFromData({ weeks });
  }, [exercises]);

  // Auto-extend if monthsCount grows after seed
  useEffect(() => {
    if (!seededRef.current) return;
    if (program.weeks.length >= totalWeeks) return;
    const weeks = [...program.weeks];
    while (weeks.length < totalWeeks) {
      const i = weeks.length;
      weeks.push({
        id: generateId(),
        name: `Εβδομάδα ${i + 1}`,
        week_number: i + 1,
        program_days: [{
          id: generateId(),
          name: 'Ημέρα 1',
          day_number: 1,
          program_blocks: [],
        }],
      });
    }
    updateProgram({ weeks });
  }, [totalWeeks, program.weeks.length]);

  useEffect(() => {
    if (!seededRef.current) return;
    onChange({ weeks: program.weeks });
  }, [program.weeks]);

  return (
    <TrainingWeeks
      weeks={program.weeks}
      exercises={exercises as any}
      selectedUserId={selectedUserId}
      onAddWeek={actions.addWeek}
      onRemoveWeek={actions.removeWeek}
      onDuplicateWeek={actions.duplicateWeek}
      onUpdateWeekName={actions.updateWeekName}
      onPasteWeek={actions.pasteWeek}
      onAddDay={actions.addDay}
      onRemoveDay={actions.removeDay}
      onUpdateDayName={actions.updateDayName}
      onUpdateDayTestDay={actions.updateDayTestDay}
      onUpdateDayCompetitionDay={actions.updateDayCompetitionDay}
      onUpdateDayEsdRecovery={actions.updateDayEsdRecovery}
      onUpdateDayEffort={actions.updateDayEffort}
      onAddBlock={actions.addBlock}
      onRemoveBlock={actions.removeBlock}
      onDuplicateBlock={actions.duplicateBlock}
      onUpdateBlockName={actions.updateBlockName}
      onUpdateBlockTrainingType={actions.updateBlockTrainingType}
      onUpdateBlockWorkoutFormat={actions.updateBlockWorkoutFormat}
      onUpdateBlockWorkoutDuration={actions.updateBlockWorkoutDuration}
      onUpdateBlockSets={actions.updateBlockSets}
      onAddExercise={actions.addExercise}
      onRemoveExercise={actions.removeExercise}
      onUpdateExercise={actions.updateExercise}
      onDuplicateExercise={actions.duplicateExercise}
      onReorderWeeks={actions.reorderWeeks}
      onReorderDays={actions.reorderDays}
      onReorderBlocks={actions.reorderBlocks}
      onReorderExercises={actions.reorderExercises}
      onPasteBlock={actions.pasteBlock}
      onPasteBlockAtBlock={actions.pasteBlockAtBlock}
      onPasteDay={actions.pasteDay}
      onSelectBlockTemplate={actions.loadBlockTemplate}
      coachId={coachId}
      onActiveWeekChange={(weekId) => {
        const idx = program.weeks.findIndex((w: any) => w.id === weekId);
        if (idx >= 0 && onActiveWeekIndexChange) onActiveWeekIndexChange(idx);
      }}
      weekDifficulties={weekDifficulties}
    />
  );
};

interface MonthNLItem { name: string; exerciseId?: string; videoUrl?: string; nlPerWeek: number[]; totalNL: number; nlPerZonePerWeek?: number[][]; zoneKg?: number[]; zonePct?: number[]; zonePctLabels?: number[] }

interface AssignUser { id: string; name: string; email?: string; avatar_url?: string | null; photo_url?: string | null }
interface Worksheet2Props {
  monthsCount: number;
  ws2Programs: (PlanStrongWS2Program | null)[];
  onChange: (programs: (PlanStrongWS2Program | null)[]) => void;
  selectedUserId?: string;
  coachId?: string;
  monthsNL?: MonthNLItem[][];
  weekDifficulties?: (string | null)[];
  planName?: string;
  assignUsers?: AssignUser[];
}

// Parse reps strings like "5", "3.2.1" (sums to 6), etc.
const parseRepsCount = (reps: any): number => {
  if (reps === null || reps === undefined) return 0;
  const s = String(reps).trim();
  if (!s) return 0;
  // tempo-style additive notation
  if (s.includes('.')) {
    return s.split('.').reduce((a, p) => a + (parseInt(p, 10) || 0), 0);
  }
  return parseInt(s, 10) || 0;
};
const parseKg = (kg: any): number => {
  if (kg === null || kg === undefined) return 0;
  return parseFloat(String(kg).replace(',', '.')) || 0;
};

export const Worksheet2: React.FC<Worksheet2Props> = ({ monthsCount, ws2Programs, onChange, selectedUserId, coachId, monthsNL, weekDifficulties, planName, assignUsers }) => {
  const [activeW, setActiveW] = useState(0);
  const totalWeeks = Math.max(monthsCount, 1) * 4;
  const safeW = Math.min(Math.max(activeW, 0), totalWeeks - 1);
  const monthIdx = Math.floor(safeW / 4);
  const weekInMonth = safeW % 4;

  const [currentProgram, setCurrentProgram] = useState<PlanStrongWS2Program | null>(ws2Programs[0] ?? null);
  const addFromNLRef = useRef<((weekIdx: number, exerciseId: string, exerciseName: string, kg: number, pct: number, velocity: number) => void) | null>(null);
  const { getOneRM, getVelocityForPercentage } = useUserExerciseDataCacheContext();

  const handleNlChipClick = useCallback((exerciseId: string | undefined, exerciseName: string, kg: number, pct: number) => {
    if (!exerciseId || !addFromNLRef.current) return;
    const oneRM = getOneRM(exerciseId) ?? 0;
    const v = getVelocityForPercentage(exerciseId, pct, oneRM) || 0;
    addFromNLRef.current(safeW, exerciseId, exerciseName, kg, pct, v);
    toast.success(`Προστέθηκε ${exerciseName} · ${pct}% · ${kg}kg`);
  }, [getOneRM, getVelocityForPercentage, safeW]);

  const setSingleProgram = (p: PlanStrongWS2Program) => {
    setCurrentProgram(p);
    onChange([p]);
  };

  const currentMonthNL = monthsNL && monthsNL[monthIdx] ? monthsNL[monthIdx] : [];

  // Fetch exercise relationships and map any related exercise -> its WS1 root exercise id
  const ws1ExerciseIds = useMemo(
    () => currentMonthNL.map(r => r.exerciseId).filter(Boolean) as string[],
    [currentMonthNL]
  );
  const [linkedToRoot, setLinkedToRoot] = useState<Record<string, string>>({});
  useEffect(() => {
    if (ws1ExerciseIds.length === 0) { setLinkedToRoot({}); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('exercise_relationships')
        .select('exercise_id, related_exercise_id')
        .eq('relationship_type', 'strength_variant');
      if (cancelled || !data) return;
      const adj = new Map<string, Set<string>>();
      for (const rel of data) {
        if (!adj.has(rel.exercise_id)) adj.set(rel.exercise_id, new Set());
        if (!adj.has(rel.related_exercise_id)) adj.set(rel.related_exercise_id, new Set());
        adj.get(rel.exercise_id)!.add(rel.related_exercise_id);
        adj.get(rel.related_exercise_id)!.add(rel.exercise_id);
      }
      const ws1Set = new Set(ws1ExerciseIds);
      const visited = new Set<string>();
      const result: Record<string, string> = {};
      for (const start of adj.keys()) {
        if (visited.has(start)) continue;
        const group: string[] = [];
        const queue = [start];
        while (queue.length) {
          const cur = queue.pop()!;
          if (visited.has(cur)) continue;
          visited.add(cur);
          group.push(cur);
          for (const n of adj.get(cur) || []) if (!visited.has(n)) queue.push(n);
        }
        const root = group.find(g => ws1Set.has(g));
        if (root) for (const g of group) if (g !== root) result[g] = root;
      }
      setLinkedToRoot(result);
    })();
    return () => { cancelled = true; };
  }, [ws1ExerciseIds.join('|')]);

  const zoneMetaByExerciseId = useMemo(() => {
    const map: Record<string, { kg: number; percentage: number }[]> = {};
    currentMonthNL.forEach((row) => {
      if (row.exerciseId && row.zoneKg && row.zoneKg.length > 0) {
        const ZONE_PCT = [55, 65, 75, 85, 93, 100];
        const meta = row.zoneKg.map((kg, i) => ({
          kg,
          percentage: ZONE_PCT[i] ?? 0,
        })).filter(m => m.kg > 0);
        map[row.exerciseId] = meta;
      }
    });
    for (const [linkedId, rootId] of Object.entries(linkedToRoot)) {
      if (map[rootId] && !map[linkedId]) map[linkedId] = map[rootId];
    }
    return map;
  }, [currentMonthNL, linkedToRoot]);

  // Compute "used reps" per exercise per kg across ALL days of the current week
  const usedByExerciseKg = useMemo(() => {
    const map: Record<string, Record<number, number>> = {};
    const weeks = currentProgram?.weeks || (ws2Programs[0]?.weeks ?? []);
    const week = weeks[safeW];
    if (!week) return map;
    (week.program_days || []).forEach((d: any) => {
      (d.program_blocks || []).forEach((b: any) => {
        const blockSets = Number(b.block_sets) || 1;
        (b.program_exercises || []).forEach((pe: any) => {
          const rawId = pe.exercise_id;
          const exId = rawId && linkedToRoot[rawId] ? linkedToRoot[rawId] : rawId;
          const kg = parseKg(pe.kg);
          const setsN = (Number(pe.sets) || 0) * blockSets;
          const repsN = parseRepsCount(pe.reps);
          if (!exId || !kg || !setsN || !repsN) return;
          if (!map[exId]) map[exId] = {};
          map[exId][kg] = (map[exId][kg] || 0) + setsN * repsN;
        });
      });
    });
    return map;
  }, [currentProgram, ws2Programs, safeW, linkedToRoot]);

  // ===== Assignment =====
  const weeksForAssign = currentProgram?.weeks || ws2Programs[0]?.weeks || [];
  const totalRequiredDays = useMemo(
    () => weeksForAssign.reduce((sum: number, w: any) => sum + (w.program_days?.length || 0), 0),
    [weeksForAssign]
  );
  const [assignDates, setAssignDates] = useState<Date[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!assignUsers || assignUsers.length === 0) {
      toast.error('Δεν υπάρχουν χρήστες — πρόσθεσε από το Worksheet #1');
      return;
    }
    if (totalRequiredDays === 0) {
      toast.error('Δεν υπάρχουν ημέρες προπόνησης');
      return;
    }
    if (assignDates.length < totalRequiredDays) {
      toast.error(`Επίλεξε ${totalRequiredDays} ημερομηνίες (έχεις ${assignDates.length})`);
      return;
    }
    setAssigning(true);
    try {
      const trainingDates = assignDates
        .slice(0, totalRequiredDays)
        .sort((a, b) => a.getTime() - b.getTime())
        .map(d => formatDateForStorage(d));

      for (const u of assignUsers) {
        const savedProgram = await programService.saveProgram({
          name: planName || 'Plan Strong',
          description: '',
          user_id: u.id,
          weeks: weeksForAssign,
        } as any);

        const assignment = await assignmentService.saveAssignment({
          program: { ...savedProgram, weeks: weeksForAssign },
          userId: u.id,
          trainingDates,
        });

        if (assignment && assignment.length > 0) {
          await workoutCompletionService.createWorkoutCompletions(
            assignment[0],
            savedProgram,
            u.id,
            trainingDates,
            { name: planName || 'Plan Strong', weeks: weeksForAssign } as any
          );
        }
      }
      toast.success(`Ανατέθηκε σε ${assignUsers.length} χρήστες`);
      setAssignOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Σφάλμα ανάθεσης');
    } finally {
      setAssigning(false);
    }
  };


  return (
    <div className="border border-border">
      <div className="bg-foreground text-background px-3 py-2 text-sm font-bold flex items-center justify-between gap-2">
        <span>PLAN STRONG™ — Program Builder</span>
        <div className="flex items-center gap-2">
          <Popover open={assignOpen} onOpenChange={setAssignOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-none h-7 text-foreground">
                <CalendarIcon className="w-3 h-3 mr-1" />
                Ανάθεση
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 rounded-none" align="end">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold mb-1">Χρήστες ({assignUsers?.length || 0})</div>
                  {(!assignUsers || assignUsers.length === 0) ? (
                    <div className="text-xs text-muted-foreground">Πρόσθεσε χρήστες στο Worksheet #1</div>
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-[320px]">
                      {assignUsers.map(u => (
                        <div key={u.id} className="flex items-center gap-1 border border-border px-1.5 py-0.5">
                          <Avatar className="h-4 w-4">
                            {(u.photo_url || u.avatar_url) ? (
                              <AvatarImage src={u.photo_url || u.avatar_url || ''} alt={u.name} />
                            ) : null}
                            <AvatarFallback className="text-[8px]">{u.name?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-[11px]">{u.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1">
                    Ημερομηνίες: {assignDates.length}/{totalRequiredDays}
                  </div>
                  <Calendar
                    mode="multiple"
                    selected={assignDates}
                    onSelect={(d) => setAssignDates((d as Date[]) || [])}
                    disabled={(date) => {
                      const today = new Date(); today.setHours(0,0,0,0);
                      return date < today;
                    }}
                    className={cn("p-3 pointer-events-auto rounded-none border border-border")}
                  />
                  {assignDates.length > 0 && (
                    <Button
                      type="button" size="sm" variant="ghost"
                      className="rounded-none mt-1 h-6 text-[11px]"
                      onClick={() => setAssignDates([])}
                    >
                      <X className="w-3 h-3 mr-1" /> Καθαρισμός
                    </Button>
                  )}
                </div>
                <Button
                  size="sm" className="rounded-none w-full"
                  disabled={assigning || !assignUsers?.length || assignDates.length < totalRequiredDays}
                  onClick={handleAssign}
                >
                  <Send className="w-3 h-3 mr-1" />
                  {assigning ? 'Ανάθεση...' : `Ανάθεση σε ${assignUsers?.length || 0}`}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <span>WORKSHEET #2</span>
        </div>
      </div>
      <div className="p-2 space-y-2">
        {currentMonthNL.length > 0 && (
          <div className="border border-border">
            <div className="bg-muted px-2 py-1 text-xs font-bold flex items-center justify-between">
              <span>NL — M{monthIdx + 1} · Εβδομάδα {weekInMonth + 1}</span>
            </div>
            <div className="p-2 space-y-1">
              {currentMonthNL.map((row, i) => {
                const zones = row.nlPerZonePerWeek?.[weekInMonth] || [];
                const kgs = row.zoneKg || [];
                const pctLabels = row.zonePctLabels || [];
                const sets = zones
                  .map((nl, z) => ({ nl, kg: kgs[z] || 0, pct: pctLabels[z] || 0 }))
                  .filter(p => p.nl > 0);
                const hasVideo = row.videoUrl && isValidVideoUrl(row.videoUrl);
                const thumb = hasVideo ? getVideoThumbnail(row.videoUrl!) : null;
                const usedMap = row.exerciseId ? (usedByExerciseKg[row.exerciseId] || {}) : {};
                const totalUsed = Object.values(usedMap).reduce((a, b) => a + b, 0);
                const totalReq = row.nlPerWeek[weekInMonth] ?? 0;
                const totalRemain = Math.max(0, totalReq - totalUsed);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs border-b border-border/50 pb-1 last:border-0">
                    {thumb ? (
                      <div className="w-8 h-5 overflow-hidden bg-muted flex-shrink-0">
                        <img src={thumb} alt={row.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-5 bg-muted flex items-center justify-center flex-shrink-0">
                        <Play className="w-2 h-2 text-muted-foreground" />
                      </div>
                    )}
                    <span className="truncate font-medium min-w-[80px] max-w-[140px]">{row.name}</span>
                    <div className="flex flex-wrap gap-1">
                      {sets.map((p, idx) => {
                        const used = usedMap[p.kg] || 0;
                        const remain = Math.max(0, p.nl - used);
                        const done = used >= p.nl;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleNlChipClick(row.exerciseId, row.name, p.kg, p.pct)}
                            className={`inline-flex flex-col items-center border px-1 py-0.5 tabular-nums leading-tight cursor-pointer hover:bg-foreground/10 ${done ? 'border-[#00ffba] bg-[#00ffba]/10' : 'border-border'}`}
                            title={`Κλικ για προσθήκη · Χρησιμοποιημένα: ${used} / ${p.nl}`}
                          >
                            <span className="font-medium">
                              {p.pct}<span className="text-[9px] text-muted-foreground">%</span>
                            </span>
                            <span>
                              <span className="font-medium">{remain}</span>
                              <span className="text-[9px] text-muted-foreground">/{p.nl}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex-1" />
                    <span className="tabular-nums font-bold min-w-[3.5rem] text-right">
                      {totalRemain}/{totalReq}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <PlanStrongZoneKgProvider zoneMetaByExerciseId={zoneMetaByExerciseId}>
          <EmbeddedBuilder
            initial={ws2Programs[0] ?? null}
            totalWeeks={totalWeeks}
            onChange={setSingleProgram}
            selectedUserId={selectedUserId}
            coachId={coachId}
            onActiveWeekIndexChange={setActiveW}
            weekDifficulties={weekDifficulties}
            addFromNLRef={addFromNLRef}
          />
        </PlanStrongZoneKgProvider>
      </div>
    </div>
  );
};
