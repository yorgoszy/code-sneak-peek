
import { useState } from 'react';
import { Exercise, Program } from '../../types';

interface ProgramStructure {
  name: string;
  description: string;
  athlete_id: string;
  start_date?: string;
  training_days?: number;
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
    start_date: '',
    training_days: 0,
    weeks: []
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const updateProgram = (updates: Partial<ProgramStructure> | ProgramStructure) => {
    if ('name' in updates || 'description' in updates || 'athlete_id' in updates || 'start_date' in updates || 'training_days' in updates || 'weeks' in updates) {
      if ('weeks' in updates && Array.isArray(updates.weeks)) {
        setProgram(updates as ProgramStructure);
      } else {
        setProgram(prev => ({ ...prev, ...updates }));
      }
    }
  };

  const resetProgram = () => {
    setProgram({ name: '', description: '', athlete_id: '', start_date: '', training_days: 0, weeks: [] });
  };

  const loadProgramFromData = (programData: Program) => {
    console.log('Loading program data:', programData);
    
    const loadedProgram: ProgramStructure = {
      name: programData.name,
      description: programData.description || '',
      athlete_id: programData.athlete_id || '',
      start_date: programData.start_date || '',
      training_days: programData.training_days || 0,
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

export type { ProgramStructure, Week, Day, Block, ProgramExercise };
