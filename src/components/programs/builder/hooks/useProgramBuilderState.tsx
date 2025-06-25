
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Exercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  kg: string;
  percentage_1rm?: number;
  velocity_ms?: number;
  tempo: string;
  rest: string;
  notes: string;
  exercise_order: number;
  exercises?: {
    id: string;
    name: string;
    description?: string;
    video_url?: string;
  };
}

export interface Block {
  id: string;
  name: string;
  block_order: number;
  program_exercises: Exercise[];
}

export interface Day {
  id: string;
  name: string;
  day_number: number;
  estimated_duration_minutes?: number;
  program_blocks: Block[];
}

export interface Week {
  id: string;
  name: string;
  week_number: number;
  program_days: Day[];
}

export interface ProgramStructure {
  id?: string;
  name: string;
  description: string;
  user_id?: string;
  user_ids?: string[]; // Νέο πεδίο για πολλαπλούς χρήστες
  is_multiple_assignment?: boolean; // Flag για πολλαπλή ανάθεση
  weeks: Week[];
  training_dates?: (Date | string)[];
}

export const useProgramBuilderState = (availableExercises: any[]) => {
  const [program, setProgram] = useState<ProgramStructure>({
    name: '',
    description: '',
    user_id: '',
    user_ids: [],
    is_multiple_assignment: false,
    weeks: [],
    training_dates: []
  });

  const updateProgram = useCallback((updates: Partial<ProgramStructure>) => {
    setProgram(prev => ({ ...prev, ...updates }));
  }, []);

  const resetProgram = useCallback(() => {
    setProgram({
      name: '',
      description: '',
      user_id: '',
      user_ids: [],
      is_multiple_assignment: false,
      weeks: [],
      training_dates: []
    });
  }, []);

  const generateId = useCallback(() => uuidv4(), []);

  const loadProgramFromData = useCallback((programData: any) => {
    console.log('Loading program data:', programData);
    
    const loadedProgram: ProgramStructure = {
      id: programData.id,
      name: programData.name || '',
      description: programData.description || '',
      user_id: programData.user_id || '',
      user_ids: programData.user_ids || [],
      is_multiple_assignment: programData.is_multiple_assignment || false,
      weeks: programData.program_weeks?.map((week: any) => ({
        id: week.id || generateId(),
        name: week.name || `Εβδομάδα ${week.week_number}`,
        week_number: week.week_number,
        program_days: week.program_days?.map((day: any) => ({
          id: day.id || generateId(),
          name: day.name || `Ημέρα ${day.day_number}`,
          day_number: day.day_number,
          estimated_duration_minutes: day.estimated_duration_minutes,
          program_blocks: day.program_blocks?.map((block: any) => ({
            id: block.id || generateId(),
            name: block.name || 'Block',
            block_order: block.block_order,
            program_exercises: block.program_exercises?.map((exercise: any) => ({
              id: exercise.id || generateId(),
              exercise_id: exercise.exercise_id,
              sets: exercise.sets || 1,
              reps: exercise.reps || '',
              kg: exercise.kg || '',
              percentage_1rm: exercise.percentage_1rm,
              velocity_ms: exercise.velocity_ms,
              tempo: exercise.tempo || '',
              rest: exercise.rest || '',
              notes: exercise.notes || '',
              exercise_order: exercise.exercise_order || 1,
              exercises: exercise.exercises
            })) || []
          })) || []
        })) || []
      })) || [],
      training_dates: programData.training_dates || []
    };

    setProgram(loadedProgram);
  }, [generateId]);

  const getTotalTrainingDays = useCallback(() => {
    return program.weeks.reduce((total, week) => {
      return total + (week.program_days?.length || 0);
    }, 0);
  }, [program.weeks]);

  return {
    program,
    updateProgram,
    resetProgram,
    generateId,
    loadProgramFromData,
    getTotalTrainingDays
  };
};
