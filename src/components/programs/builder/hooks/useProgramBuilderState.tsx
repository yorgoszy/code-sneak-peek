
import { useState, useCallback } from 'react';
import type { User, Exercise } from '../../types';

export interface Week {
  id: string;
  name: string;
  week_number: number;
  program_days: Day[];
}

export interface Day {
  id: string;
  name: string;
  day_number: number;
  estimated_duration_minutes?: number;
  program_blocks: Block[];
}

export interface Block {
  id: string;
  name: string;
  block_order: number;
  program_exercises: ProgramExercise[];
}

export interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_order: number;
  sets: number;
  reps: string;
  kg: string;
  tempo: string;
  rest: string;
  notes?: string;
  exercises?: Exercise;
}

export interface ProgramStructure {
  id?: string;
  name: string;
  description: string;
  user_id: string;
  user_ids: string[];
  selected_group_id?: string;
  is_multiple_assignment: boolean;
  training_dates: Date[];
  weeks: Week[];
}

export const useProgramBuilderState = (exercises: Exercise[]) => {
  const [program, setProgram] = useState<ProgramStructure>({
    name: '',
    description: '',
    user_id: '',
    user_ids: [],
    selected_group_id: '',
    is_multiple_assignment: true,
    training_dates: [],
    weeks: []
  });

  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  const updateProgram = useCallback((updates: Partial<ProgramStructure>) => {
    setProgram(prev => ({ ...prev, ...updates }));
  }, []);

  const resetProgram = useCallback(() => {
    setProgram({
      name: '',
      description: '',
      user_id: '',
      user_ids: [],
      selected_group_id: '',
      is_multiple_assignment: true,
      training_dates: [],
      weeks: []
    });
  }, []);

  const loadProgramFromData = useCallback((programData: any) => {
    console.log('🔄 Loading program data:', programData);
    
    const loadedProgram: ProgramStructure = {
      id: programData.id,
      name: programData.name || '',
      description: programData.description || '',
      user_id: programData.user_id || '',
      user_ids: programData.user_ids || [],
      selected_group_id: programData.selected_group_id || '',
      is_multiple_assignment: programData.is_multiple_assignment || true,
      training_dates: programData.training_dates?.map((date: string) => new Date(date)) || [],
      weeks: programData.program_weeks?.map((week: any) => ({
        id: week.id,
        name: week.name,
        week_number: week.week_number,
        program_days: week.program_days?.map((day: any) => ({
          id: day.id,
          name: day.name,
          day_number: day.day_number,
          estimated_duration_minutes: day.estimated_duration_minutes,
          program_blocks: day.program_blocks?.map((block: any) => ({
            id: block.id,
            name: block.name,
            block_order: block.block_order,
            program_exercises: block.program_exercises?.map((pe: any) => {
              const exercise = exercises.find(ex => ex.id === pe.exercise_id);
              return {
                id: pe.id,
                exercise_id: pe.exercise_id,
                exercise_order: pe.exercise_order,
                sets: pe.sets,
                reps: pe.reps || '',
                kg: pe.kg || '',
                tempo: pe.tempo || '',
                rest: pe.rest || '',
                notes: pe.notes || '',
                exercises: exercise
              };
            }) || []
          })) || []
        })) || []
      })) || []
    };

    setProgram(loadedProgram);
  }, [exercises]);

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
