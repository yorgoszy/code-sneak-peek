
import { useState } from 'react';
import { User, Exercise } from '../../types';

interface ProgramStructure {
  name: string;
  description: string;
  athlete_id: string;
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
    weeks: []
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const updateProgram = (updates: Partial<ProgramStructure>) => {
    setProgram(prev => ({ ...prev, ...updates }));
  };

  const resetProgram = () => {
    setProgram({ name: '', description: '', athlete_id: '', weeks: [] });
  };

  return {
    program,
    setProgram,
    updateProgram,
    resetProgram,
    generateId
  };
};

export type { ProgramStructure, Week, Day, Block, ProgramExercise };
