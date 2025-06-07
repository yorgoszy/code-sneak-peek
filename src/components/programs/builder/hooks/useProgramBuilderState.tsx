
import { useState, useCallback } from 'react';
import { formatDatesArray } from '@/utils/dateUtils';
import { Exercise } from '../../types';

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

interface Block {
  id: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

interface Day {
  id: string;
  name: string;
  day_number: number;
  program_blocks: Block[];
}

interface Week {
  id: string;
  name: string;
  week_number: number;
  days: Day[];
}

export interface ProgramStructure {
  id: string;
  name: string;
  description: string;
  user_id?: string;
  start_date?: string;
  training_days?: any[];
  training_dates?: Date[];
  weeks?: Week[];
}

const createInitialProgram = (): ProgramStructure => ({
  id: crypto.randomUUID(),
  name: '',
  description: '',
  user_id: '',
  start_date: new Date().toISOString().split('T')[0],
  training_days: [],
  training_dates: [],
  weeks: []
});

const findExerciseName = (exerciseId: string, exercises: Exercise[]): string => {
  const exercise = exercises.find(ex => ex.id === exerciseId);
  return exercise ? exercise.name : 'Unknown Exercise';
};

// Helper function to convert builder format to database format
const convertWeeksToDatabaseFormat = (builderWeeks: Week[]) => {
  return builderWeeks.map(week => ({
    ...week,
    program_days: week.days?.map(day => ({
      ...day,
      program_blocks: day.program_blocks?.map(block => ({
        ...block,
        program_exercises: block.exercises?.map(exercise => ({
          id: exercise.id,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps,
          kg: exercise.kg,
          percentage_1rm: exercise.percentage_1rm,
          velocity_ms: exercise.velocity_ms,
          tempo: exercise.tempo,
          rest: exercise.rest,
          notes: '',
          exercise_order: exercise.exercise_order,
          exercises: {
            id: exercise.exercise_id,
            name: exercise.exercise_name,
            description: ''
          }
        })) || []
      })) || []
    })) || []
  }));
};

// Helper function to convert database format to builder format
const convertWeeksFromDatabaseFormat = (dbWeeks: any[]) => {
  return dbWeeks.map(week => ({
    ...week,
    days: week.program_days?.map((day: any) => ({
      ...day,
      program_blocks: day.program_blocks?.map((block: any) => ({
        ...block,
        exercises: block.program_exercises?.map((exercise: any) => ({
          id: exercise.id,
          exercise_id: exercise.exercise_id,
          exercise_name: exercise.exercises?.name || 'Unknown Exercise',
          sets: exercise.sets || 1,
          reps: exercise.reps || '',
          percentage_1rm: exercise.percentage_1rm || 0,
          kg: exercise.kg || '',
          velocity_ms: exercise.velocity_ms || '',
          tempo: exercise.tempo || '',
          rest: exercise.rest || '',
          exercise_order: exercise.exercise_order || 1
        })) || []
      })) || []
    })) || []
  }));
};

export const useProgramBuilderState = (exercises: Exercise[]) => {
  const [program, setProgram] = useState<ProgramStructure>(createInitialProgram());

  const updateProgram = useCallback((updates: Partial<ProgramStructure>) => {
    console.log('🔄 Updating program with:', updates);
    setProgram(prev => {
      const updatedProgram = { ...prev, ...updates };
      console.log('🔄 Partial program update:', updatedProgram);
      return updatedProgram;
    });
  }, []);

  const resetProgram = useCallback(() => {
    console.log('🔄 Resetting program to initial state');
    setProgram(createInitialProgram());
  }, []);

  const generateId = useCallback(() => {
    return crypto.randomUUID();
  }, []);

  const loadProgramFromData = useCallback((programData: any) => {
    console.log('📥 Loading program from data:', programData);
    
    try {
      const loadedProgram: ProgramStructure = {
        id: programData.id,
        name: programData.name || '',
        description: programData.description || '',
        user_id: programData.user_id || '',
        start_date: programData.start_date,
        training_days: programData.training_days || [],
        training_dates: programData.training_dates || [],
        weeks: convertWeeksFromDatabaseFormat(programData.program_weeks || [])
      };
      
      console.log('📥 Loaded program structure:', loadedProgram);
      setProgram(loadedProgram);
    } catch (error) {
      console.error('❌ Error loading program:', error);
      setProgram(createInitialProgram());
    }
  }, [exercises]);

  const getTotalTrainingDays = useCallback(() => {
    return program.weeks?.reduce((total, week) => {
      return total + (week.days?.length || 0);
    }, 0) || 0;
  }, [program.weeks]);

  // Convert program to database format
  const prepareProgramForSave = useCallback(() => {
    console.log('💾 Preparing program for save:', program);
    
    // Μετατροπή training_dates σε string format για αποθήκευση
    const formattedTrainingDates = program.training_dates ? 
      formatDatesArray(program.training_dates) : [];
    
    console.log('💾 Formatted training dates for save:', formattedTrainingDates);

    const preparedProgram = {
      id: program.id,
      name: program.name,
      description: program.description,
      user_id: program.user_id || null,
      start_date: program.start_date,
      training_days: program.training_days || [],
      training_dates: formattedTrainingDates,
      weeks: convertWeeksToDatabaseFormat(program.weeks || [])
    };

    console.log('💾 Final prepared program:', preparedProgram);
    return preparedProgram;
  }, [program]);

  return {
    program,
    updateProgram,
    resetProgram,
    generateId,
    loadProgramFromData,
    getTotalTrainingDays,
    prepareProgramForSave
  };
};
