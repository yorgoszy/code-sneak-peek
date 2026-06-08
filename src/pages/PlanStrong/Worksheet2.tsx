import React, { useEffect, useRef, useState } from 'react';
import { useExercises } from '@/hooks/useExercises';
import { useProgramBuilderState, ProgramStructure } from '@/components/programs/builder/hooks/useProgramBuilderState';
import { useProgramBuilderActions } from '@/components/programs/builder/hooks/useProgramBuilderActions';
import { TrainingWeeks } from '@/components/programs/builder/TrainingWeeks';

export interface PlanStrongWS2Program {
  weeks: any[];
}

interface EmbeddedMonthBuilderProps {
  initial?: PlanStrongWS2Program | null;
  onChange: (program: PlanStrongWS2Program) => void;
  selectedUserId?: string;
  coachId?: string;
}

const EmbeddedMonthBuilder: React.FC<EmbeddedMonthBuilderProps> = ({ initial, onChange, selectedUserId, coachId }) => {
  const { exercises } = useExercises();
  const { program, updateProgram, generateId, loadProgramFromData } = useProgramBuilderState(exercises as any);
  const actions = useProgramBuilderActions(program, updateProgram, generateId, exercises as any);

  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (!exercises || exercises.length === 0) return; // wait for exercises
    seededRef.current = true;

    if (initial && Array.isArray(initial.weeks) && initial.weeks.length > 0) {
      loadProgramFromData({ weeks: initial.weeks });
    } else {
      const weeks = Array.from({ length: 4 }).map((_, i) => ({
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

  // Sync up
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
  const [activeM, setActiveM] = useState(0);
  const [activeW, setActiveW] = useState(0);
  const safeActive = Math.min(Math.max(activeM, 0), Math.max(monthsCount - 1, 0));
  const safeW = Math.min(Math.max(activeW, 0), 3);

  const setMonthProgram = (mIdx: number, p: PlanStrongWS2Program) => {
    const next = Array.from({ length: monthsCount }).map((_, i) =>
      i === mIdx ? p : (ws2Programs[i] ?? null)
    );
    onChange(next);
  };

  return (
    <div className="border border-border">
      <div className="bg-foreground text-background px-3 py-2 text-sm font-bold flex items-center justify-between flex-wrap gap-2">
        <span>PLAN STRONG™ — Program Builder</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: monthsCount }).map((_, i) => {
            const active = i === safeActive;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveM(i)}
                className={`px-2 h-6 border rounded-none text-xs ${active ? 'bg-background text-foreground border-background' : 'bg-transparent text-background border-background/40 hover:bg-background/10'}`}
              >
                M{i + 1}
              </button>
            );
          })}
        </div>
        <span>WORKSHEET #2</span>
      </div>
      <div className="p-2 space-y-2">
        {/* key by safeActive to remount builder per month (avoids state leak between months) */}
        <EmbeddedMonthBuilder
          key={safeActive}
          initial={ws2Programs[safeActive] ?? null}
          onChange={(p) => setMonthProgram(safeActive, p)}
          selectedUserId={selectedUserId}
          coachId={coachId}
        />
      </div>
    </div>
  );
};
