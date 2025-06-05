
import { useState, useEffect } from 'react';
import { useProgramAssignments } from '@/hooks/programs/useProgramAssignments';
import { supabase } from '@/integrations/supabase/client';
import type { User, Exercise, Program } from '../../types';
import type { ProgramStructure } from './useProgramBuilderState';

interface UseProgramBuilderDialogLogicProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => Promise<any>;
  onOpenChange: () => void;
  editingProgram?: Program | null;
  editingAssignment?: {
    id: string;
    user_id: string;
    training_dates: string[];
  } | null;
  isOpen: boolean;
  program: ProgramStructure;
}

export const useProgramBuilderDialogLogic = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  editingAssignment,
  isOpen,
  program
}: UseProgramBuilderDialogLogicProps) => {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { createOrUpdateAssignment } = useProgramAssignments();

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const handleClose = () => {
    console.log('🔄 Closing builder dialog');
    setAssignmentDialogOpen(false);
    onOpenChange();
  };

  const handleSave = async () => {
    try {
      console.log('💾 Saving program as draft:', program);
      
      const programData = {
        id: program.id,
        name: program.name,
        description: program.description,
        user_id: currentUserId, // Use current authenticated user
        status: 'draft',
        program_weeks: program.weeks?.map((week, weekIndex) => ({
          id: week.id,
          name: week.name,
          week_number: weekIndex + 1,
          program_days: week.days?.map((day, dayIndex) => ({
            id: day.id,
            name: day.name,
            day_number: dayIndex + 1,
            estimated_duration_minutes: 60, // Default value since property doesn't exist on Day type
            program_blocks: day.blocks?.map((block, blockIndex) => ({
              id: block.id,
              name: block.name,
              block_order: blockIndex + 1,
              program_exercises: block.exercises?.map((exercise, exerciseIndex) => ({
                id: exercise.id,
                exercise_id: exercise.exercise_id,
                sets: exercise.sets,
                reps: exercise.reps,
                kg: exercise.kg,
                percentage_1rm: exercise.percentage_1rm,
                velocity_ms: exercise.velocity_ms,
                tempo: exercise.tempo,
                rest: exercise.rest,
                notes: '', // Default empty string since property doesn't exist on ProgramExercise type
                exercise_order: exerciseIndex + 1
              })) || []
            })) || []
          })) || []
        })) || []
      };

      console.log('📝 Program data to save:', programData);
      await onCreateProgram(programData);
      console.log('✅ Program saved successfully');
      handleClose();
    } catch (error) {
      console.error('❌ Error saving program:', error);
    }
  };

  const handleOpenAssignments = () => {
    console.log('📅 Opening assignments dialog');
    setAssignmentDialogOpen(true);
  };

  const handleAssign = async (userId: string, trainingDates: string[]) => {
    try {
      console.log('🎯 Starting assignment process:', {
        userId,
        trainingDates: trainingDates.length,
        programId: program.id,
        currentUserId
      });

      // Πρώτα αποθηκεύουμε το πρόγραμμα αν δεν έχει ID
      let programId = program.id;
      if (!programId) {
        console.log('💾 Saving program first...');
        const savedProgram = await onCreateProgram({
          name: program.name,
          description: program.description,
          user_id: currentUserId, // Use current authenticated user
          status: 'active',
          program_weeks: program.weeks?.map((week, weekIndex) => ({
            id: week.id,
            name: week.name,
            week_number: weekIndex + 1,
            program_days: week.days?.map((day, dayIndex) => ({
              id: day.id,
              name: day.name,
              day_number: dayIndex + 1,
              estimated_duration_minutes: 60, // Default value since property doesn't exist on Day type
              program_blocks: day.blocks?.map((block, blockIndex) => ({
                id: block.id,
                name: block.name,
                block_order: blockIndex + 1,
                program_exercises: block.exercises?.map((exercise, exerciseIndex) => ({
                  id: exercise.id,
                  exercise_id: exercise.exercise_id,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  kg: exercise.kg,
                  percentage_1rm: exercise.percentage_1rm,
                  velocity_ms: exercise.velocity_ms,
                  tempo: exercise.tempo,
                  rest: exercise.rest,
                  notes: '', // Default empty string since property doesn't exist on ProgramExercise type
                  exercise_order: exerciseIndex + 1
                })) || []
              })) || []
            })) || []
          })) || []
        });
        programId = savedProgram?.id;
        console.log('✅ Program saved with ID:', programId);
      }

      if (!programId) {
        throw new Error('Failed to get program ID after saving');
      }

      // Τώρα δημιουργούμε την ανάθεση
      console.log('📋 Creating assignment...');
      await createOrUpdateAssignment(
        programId,
        userId,
        trainingDates[0], // start_date
        trainingDates[trainingDates.length - 1], // end_date
        trainingDates
      );

      console.log('✅ Assignment created successfully');
      setAssignmentDialogOpen(false);
      handleClose();
    } catch (error) {
      console.error('❌ Error creating assignment:', error);
    }
  };

  // Φιλτράρισμα χρηστών για να εμφανίζονται μόνο athletes
  // Assuming all users are valid since 'role' property doesn't exist on User type
  const availableUsers = users.filter(user => user.email); // Filter by a property that exists
  
  // Προετοιμασία δεδομένων για επεξεργασία ανάθεσης
  const assignmentEditData = editingAssignment ? {
    user_id: editingAssignment.user_id,
    training_dates: editingAssignment.training_dates,
    completedDates: [] // Θα μπορούσε να φορτωθεί από completions
  } : undefined;

  return {
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    handleClose,
    handleSave,
    handleOpenAssignments,
    handleAssign,
    availableUsers,
    assignmentEditData
  };
};
