
import { useState, useCallback } from 'react';
import { formatDatesArray } from '@/utils/dateUtils';
import { Exercise, Week, Day, Block, ProgramExercise } from '../../types';

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

export const useProgramBuilderState = (exercises: Exercise[]) => {
  const [program, setProgram] = useState<ProgramStructure>(createInitialProgram());

  const updateProgram = useCallback((updates: Partial<ProgramStructure>) => {
    console.log('🔄 Updating program with:', updates);
    setProgram(prev => {
      const updatedProgram = { ...prev, ...updates };
      console.log('🔄 Updated program state:', updatedProgram);
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
      // Χρησιμοποιούμε program_weeks από τη βάση δεδομένων
      const weeksData = programData.program_weeks || programData.weeks || [];
      
      const loadedProgram: ProgramStructure = {
        id: programData.id,
        name: programData.name || '',
        description: programData.description || '',
        user_id: programData.user_id || '',
        start_date: programData.start_date,
        training_days: programData.training_days || [],
        training_dates: programData.training_dates || [],
        weeks: weeksData.map((week: any) => ({
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
              program_exercises: block.program_exercises?.map((exercise: any) => ({
                id: exercise.id,
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
                exercises: exercise.exercises || { name: findExerciseName(exercise.exercise_id, exercises) }
              })) || []
            })) || []
          })) || []
        }))
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
      return total + (week.program_days?.length || 0);
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
      weeks: program.weeks || []
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
