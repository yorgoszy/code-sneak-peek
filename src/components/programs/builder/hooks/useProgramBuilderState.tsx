
import { useState } from 'react';
import { Exercise } from '../../types';

interface ProgramStructure {
  name: string;
  description: string;
  athlete_id: string;
  start_date?: Date;
  training_days?: string[];
  weeks: Week[];
}

interface Week {
  id: string;
  name: string;
  week_number: number;
  days: Day[];
}

interface Day {
  id: string;
  name: string;
  day_number: number;
  blocks: Block[];
}

interface Block {
  id: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  percentage_1rm: number;
  kg: string;
  velocity_ms: string;
  tempo: string;
  rest: string;
  exercise_order: number;
}

export const useProgramBuilderState = (exercises: Exercise[]) => {
  const [program, setProgram] = useState<ProgramStructure>({
    name: '',
    description: '',
    athlete_id: '',
    start_date: undefined,
    training_days: [],
    weeks: []
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const updateProgram = (updates: Partial<ProgramStructure> | ProgramStructure) => {
    if ('name' in updates || 'description' in updates || 'athlete_id' in updates || 'start_date' in updates || 'training_days' in updates || 'weeks' in updates) {
      // Handle both partial updates and full program updates
      if ('weeks' in updates && Array.isArray(updates.weeks)) {
        // Full program update
        setProgram(updates as ProgramStructure);
      } else {
        // Partial update
        setProgram(prev => ({ ...prev, ...updates }));
      }
    }
  };

  const resetProgram = () => {
    setProgram({ name: '', description: '', athlete_id: '', start_date: undefined, training_days: [], weeks: [] });
  };

  return {
    program,
    updateProgram,
    resetProgram,
    generateId
  };
};

export type { ProgramStructure, Week, Day, Block, ProgramExercise };
