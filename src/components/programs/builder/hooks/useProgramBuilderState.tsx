
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
  /** Used to restore the previous day name when toggling Test/Competition */
  original_day_name?: string;
  day_number: number;
  estimated_duration_minutes?: number;
  is_test_day?: boolean;
  test_types?: string[];
  is_competition_day?: boolean;
  program_blocks: Block[];
}

export interface Block {
  id: string;
  name: string;
  block_order: number;
  training_type?:
    | 'warm up'
    | 'activation'
    | 'power'
    | 'str'
    | 'str/spd'
    | 'pwr'
    | 'spd/str'
    | 'spd'
    | 'str/end'
    | 'pwr/end'
    | 'spd/end'
    | 'end'
    | 'hpr'
    | 'mobility'
    | 'neural act'
    | 'stability'
    | 'recovery'
    | 'accessory'
    | 'rotational';
  workout_format?: 'time_cap' | 'emom' | 'for_time' | 'amrap';
  workout_duration?: string;
  block_sets?: number;
  program_exercises: ProgramExercise[];
}

export interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_order: number;
  sets: number;
  reps: string;
  reps_mode?: 'reps' | 'time' | 'meter';
  kg: string;
  kg_mode?: 'kg' | 'rpm' | 'meter' | 's/m' | 'km/h';
  percentage_1rm?: number;
  velocity_ms?: number;
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
  is_template?: boolean;
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
    console.log('🔄 [useProgramBuilderState] Updating program with:', updates);
    setProgram(prev => {
      const newProgram = { ...prev, ...updates };
      console.log('🔄 [useProgramBuilderState] New program state:', newProgram);
      return newProgram;
    });
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
      is_template: programData.is_template || false,
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
          is_test_day: day.is_test_day || false,
          test_types: day.test_types || [],
          is_competition_day: day.is_competition_day || false,
          program_blocks: day.program_blocks
            ?.sort((a: any, b: any) => (a.block_order || 0) - (b.block_order || 0))
            ?.map((block: any) => ({
              id: block.id,
              name: block.name,
              block_order: block.block_order,
              training_type: block.training_type,
              workout_format: block.workout_format || '',
              workout_duration: block.workout_duration || '',
              block_sets: block.block_sets || 1,
              program_exercises: block.program_exercises
                ?.sort((a: any, b: any) => (a.exercise_order || 0) - (b.exercise_order || 0))
                ?.map((pe: any) => {
                  const exercise = exercises.find(ex => ex.id === pe.exercise_id);
                  return {
                    id: pe.id,
                    exercise_id: pe.exercise_id,
                    exercise_order: pe.exercise_order,
                    sets: pe.sets,
                    reps: pe.reps || '',
                    reps_mode: pe.reps_mode || 'reps',
                    kg: pe.kg || '',
                    kg_mode: pe.kg_mode || 'kg',
                    percentage_1rm: pe.percentage_1rm || 0,
                    velocity_ms: pe.velocity_ms || 0,
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
