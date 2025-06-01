
import { useState, useCallback } from 'react';
import { Exercise, Program } from '../../types';

export interface ProgramExercise {
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

export interface Block {
  id: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

export interface Day {
  id: string;
  name: string;
  day_number: number;
  blocks: Block[];
}

export interface Week {
  id: string;
  name: string;
  week_number: number;
  days: Day[];
}

export interface ProgramStructure {
  id?: string;
  name: string;
  description: string;
  user_id: string;
  start_date?: Date;
  training_days?: string[];
  training_dates?: string[]; // Added training_dates
  weeks: Week[];
  status?: string;
}

export const useProgramBuilderState = (exercises: Exercise[]) => {
  const [program, setProgram] = useState<ProgramStructure>({
    name: '',
    description: '',
    user_id: '',
    start_date: undefined,
    training_days: [],
    training_dates: [], // Added training_dates
    weeks: []
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const updateProgram = (updates: Partial<ProgramStructure> | ProgramStructure) => {
    if ('name' in updates || 'description' in updates || 'user_id' in updates || 'start_date' in updates || 'training_days' in updates || 'training_dates' in updates || 'weeks' in updates) {
      if ('weeks' in updates && Array.isArray(updates.weeks)) {
        setProgram(updates as ProgramStructure);
      } else {
        setProgram(prev => ({ ...prev, ...updates }));
      }
    }
  };

  const resetProgram = () => {
    setProgram({ name: '', description: '', user_id: '', start_date: undefined, training_days: [], training_dates: [], weeks: [] });
  };

  const loadProgramFromData = (programData: Program) => {
    console.log('Loading program data:', programData);
    
    const loadedProgram: ProgramStructure = {
      name: programData.name,
      description: programData.description || '',
      user_id: programData.athlete_id || '',
      start_date: undefined,
      training_days: [],
      training_dates: [], // Added training_dates
      weeks: programData.program_weeks?.map(week => ({
        id: week.id,
        name: week.name,
        week_number: week.week_number,
        days: week.program_days?.map(day => ({
          id: day.id,
          name: day.name,
          day_number: day.day_number,
          blocks: day.program_blocks?.map(block => ({
            id: block.id,
            name: block.name,
            block_order: block.block_order,
            exercises: block.program_exercises?.map(exercise => {
              const exerciseData = exercises.find(ex => ex.id === exercise.exercise_id);
              return {
                id: exercise.id,
                exercise_id: exercise.exercise_id,
                exercise_name: exerciseData?.name || 'Unknown Exercise',
                sets: exercise.sets,
                reps: exercise.reps || '',
                percentage_1rm: exercise.percentage_1rm || 0,
                kg: exercise.kg || '',
                velocity_ms: exercise.velocity_ms?.toString() || '',
                tempo: exercise.tempo || '',
                rest: exercise.rest || '',
                exercise_order: exercise.exercise_order
              };
            }) || []
          })) || []
        })) || []
      })) || []
    };

    setProgram(loadedProgram);
  };

  return {
    program,
    updateProgram,
    resetProgram,
    generateId,
    loadProgramFromData
  };
};
