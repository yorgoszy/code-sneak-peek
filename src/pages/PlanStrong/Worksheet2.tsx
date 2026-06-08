import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { useExercises } from '@/hooks/useExercises';
import { getVideoThumbnail, isValidVideoUrl } from '@/utils/videoUtils';
import { useProgramBuilderState } from '@/components/programs/builder/hooks/useProgramBuilderState';
import { useProgramBuilderActions } from '@/components/programs/builder/hooks/useProgramBuilderActions';
import { TrainingWeeks } from '@/components/programs/builder/TrainingWeeks';
import { PlanStrongZoneKgProvider } from '@/contexts/PlanStrongZoneKgContext';
import { supabase } from '@/integrations/supabase/client';

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
}

const EmbeddedBuilder: React.FC<EmbeddedBuilderProps> = ({ initial, totalWeeks, onChange, selectedUserId, coachId, onActiveWeekIndexChange, weekDifficulties }) => {
  const { exercises } = useExercises();
  const { program, updateProgram, generateId, loadProgramFromData } = useProgramBuilderState(exercises as any);
  const actions = useProgramBuilderActions(program, updateProgram, generateId, exercises as any);

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

interface MonthNLItem { name: string; exerciseId?: string; videoUrl?: string; nlPerWeek: number[]; totalNL: number; nlPerZonePerWeek?: number[][]; zoneKg?: number[]; zonePct?: number[] }

interface Worksheet2Props {
  monthsCount: number;
  ws2Programs: (PlanStrongWS2Program | null)[];
  onChange: (programs: (PlanStrongWS2Program | null)[]) => void;
  selectedUserId?: string;
  coachId?: string;
  monthsNL?: MonthNLItem[][];
  weekDifficulties?: (string | null)[];
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

export const Worksheet2: React.FC<Worksheet2Props> = ({ monthsCount, ws2Programs, onChange, selectedUserId, coachId, monthsNL, weekDifficulties }) => {
  const [activeW, setActiveW] = useState(0);
  const totalWeeks = Math.max(monthsCount, 1) * 4;
  const safeW = Math.min(Math.max(activeW, 0), totalWeeks - 1);
  const monthIdx = Math.floor(safeW / 4);
  const weekInMonth = safeW % 4;

  const [currentProgram, setCurrentProgram] = useState<PlanStrongWS2Program | null>(ws2Programs[0] ?? null);

  const setSingleProgram = (p: PlanStrongWS2Program) => {
    setCurrentProgram(p);
    onChange([p]);
  };

  const currentMonthNL = monthsNL && monthsNL[monthIdx] ? monthsNL[monthIdx] : [];

  const zoneMetaByExerciseId = useMemo(() => {
    const map: Record<string, { kg: number; percentage: number }[]> = {};
    currentMonthNL.forEach((row) => {
      if (row.exerciseId && row.zoneKg && row.zoneKg.length > 0) {
        // ZONE_COEF = [0.55, 0.65, 0.75, 0.85, 0.93, 1] → percentages
        const ZONE_PCT = [55, 65, 75, 85, 93, 100];
        map[row.exerciseId] = row.zoneKg.map((kg, i) => ({
          kg,
          percentage: ZONE_PCT[i] ?? 0,
        })).filter(m => m.kg > 0);
      }
    });
    return map;
  }, [currentMonthNL]);

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
          const exId = pe.exercise_id;
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
  }, [currentProgram, ws2Programs, safeW]);

  return (
    <div className="border border-border">
      <div className="bg-foreground text-background px-3 py-2 text-sm font-bold flex items-center justify-between">
        <span>PLAN STRONG™ — Program Builder</span>
        <span>WORKSHEET #2</span>
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
                const sets = zones
                  .map((nl, z) => ({ nl, kg: kgs[z] || 0 }))
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
                          <div
                            key={idx}
                            className={`inline-flex items-center gap-0.5 border px-1 py-0.5 tabular-nums ${done ? 'border-[#00ffba] bg-[#00ffba]/10' : 'border-border'}`}
                            title={`Χρησιμοποιημένα: ${used} / ${p.nl}`}
                          >
                            <span className="font-medium">{p.kg}</span>
                            <span className="text-[9px] text-muted-foreground">kg</span>
                            <span className="text-muted-foreground mx-0.5">·</span>
                            <span className="font-medium">{remain}</span>
                            <span className="text-[9px] text-muted-foreground">/{p.nl}</span>
                          </div>
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
          />
        </PlanStrongZoneKgProvider>
      </div>
    </div>
  );
};
