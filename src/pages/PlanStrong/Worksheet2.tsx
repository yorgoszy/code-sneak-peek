import React, { useEffect, useRef, useState } from 'react';
import { useExercises } from '@/hooks/useExercises';
import { useProgramBuilderState } from '@/components/programs/builder/hooks/useProgramBuilderState';
import { useProgramBuilderActions } from '@/components/programs/builder/hooks/useProgramBuilderActions';
import { TrainingWeeks } from '@/components/programs/builder/TrainingWeeks';

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
}

const EmbeddedBuilder: React.FC<EmbeddedBuilderProps> = ({ initial, totalWeeks, onChange, selectedUserId, coachId, onActiveWeekIndexChange }) => {
  const { exercises } = useExercises();
  const { program, updateProgram, generateId, loadProgramFromData } = useProgramBuilderState(exercises as any);
  const actions = useProgramBuilderActions(program, updateProgram, generateId, exercises as any);

  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (!exercises || exercises.length === 0) return;
    seededRef.current = true;

    if (initial && Array.isArray(initial.weeks) && initial.weeks.length > 0) {
      loadProgramFromData({ weeks: initial.weeks });
    } else {
      const weeks = Array.from({ length: totalWeeks }).map((_, i) => ({
        id: generateId(),
        name: `Εβδομάδα ${i + 1}`,
        week_number: i + 1,
        program_days: [{
          id: generateId(),
          name: 'Ημέρα 1',
          day_number: 1,
          program_blocks: [],
        }],
      }));
      updateProgram({ weeks });
    }
  }, [exercises]);

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
    />
  );
};

interface MonthNLItem { name: string; nlPerWeek: number[]; totalNL: number }

interface Worksheet2Props {
  monthsCount: number;
  ws2Programs: (PlanStrongWS2Program | null)[];
  onChange: (programs: (PlanStrongWS2Program | null)[]) => void;
  selectedUserId?: string;
  coachId?: string;
  monthsNL?: MonthNLItem[][];
}

export const Worksheet2: React.FC<Worksheet2Props> = ({ monthsCount, ws2Programs, onChange, selectedUserId, coachId, monthsNL }) => {
  const [activeW, setActiveW] = useState(0);
  const totalWeeks = Math.max(monthsCount, 1) * 4;
  const safeW = Math.min(Math.max(activeW, 0), totalWeeks - 1);
  const monthIdx = Math.floor(safeW / 4);
  const weekInMonth = safeW % 4;

  const setSingleProgram = (p: PlanStrongWS2Program) => {
    onChange([p]);
  };

  const currentMonthNL = monthsNL && monthsNL[monthIdx] ? monthsNL[monthIdx] : [];

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
              {currentMonthNL.map((row, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="truncate pr-2">{row.name}</span>
                  <span className="tabular-nums font-medium">{row.nlPerWeek[weekInMonth] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <EmbeddedBuilder
          initial={ws2Programs[0] ?? null}
          totalWeeks={totalWeeks}
          onChange={setSingleProgram}
          selectedUserId={selectedUserId}
          coachId={coachId}
          onActiveWeekIndexChange={setActiveW}
        />
      </div>
    </div>
  );
};
