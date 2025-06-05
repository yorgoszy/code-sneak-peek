
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface WorkoutCompletion {
  id: string;
  assignment_id: string;
  user_id: string;
  program_id: string;
  week_number: number;
  day_number: number;
  scheduled_date: string;
  completed_date: string;
  status: 'completed' | 'missed' | 'makeup' | 'scheduled';
  notes?: string;
  start_time?: string;
  end_time?: string;
  actual_duration_minutes?: number;
  status_color?: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseResult {
  id: string;
  workout_completion_id: string;
  program_exercise_id: string;
  actual_sets?: number;
  actual_reps?: string;
  actual_kg?: string;
  actual_velocity_ms?: string;
  actual_rest?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentAttendance {
  id: string;
  assignment_id: string;
  user_id: string;
  total_scheduled_workouts: number;
  completed_workouts: number;
  missed_workouts: number;
  makeup_workouts: number;
  attendance_percentage: number;
  last_updated: string;
}

export const useWorkoutCompletions = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getUserId = async () => {
    if (!user?.id) return null;
    
    const { data: userData } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    
    return userData?.id || null;
  };

  const completeWorkout = async (
    assignmentId: string,
    programId: string,
    weekNumber: number,
    dayNumber: number,
    scheduledDate: string,
    notes?: string,
    startTime?: Date,
    endTime?: Date,
    actualDurationMinutes?: number
  ) => {
    try {
      setLoading(true);
      const userId = await getUserId();
      if (!userId) throw new Error('User not found');

      const workoutData: any = {
        assignment_id: assignmentId,
        user_id: userId,
        program_id: programId,
        week_number: weekNumber,
        day_number: dayNumber,
        scheduled_date: scheduledDate,
        completed_date: new Date().toISOString().split('T')[0],
        status: 'completed',
        status_color: 'green',
        notes
      };

      if (startTime) {
        workoutData.start_time = startTime.toISOString();
      }

      if (endTime) {
        workoutData.end_time = endTime.toISOString();
      }

      if (actualDurationMinutes) {
        workoutData.actual_duration_minutes = actualDurationMinutes;
      }

      const { data, error } = await supabase
        .from('workout_completions')
        .insert(workoutData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing workout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveExerciseResults = async (
    workoutCompletionId: string,
    exerciseResults: Omit<ExerciseResult, 'id' | 'workout_completion_id' | 'created_at' | 'updated_at'>[]
  ) => {
    try {
      const resultsToInsert = exerciseResults.map(result => ({
        ...result,
        workout_completion_id: workoutCompletionId
      }));

      const { data, error } = await supabase
        .from('exercise_results')
        .insert(resultsToInsert)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving exercise results:', error);
      throw error;
    }
  };

  const getExerciseResults = async (workoutCompletionId: string) => {
    try {
      const { data, error } = await supabase
        .from('exercise_results')
        .select('*')
        .eq('workout_completion_id', workoutCompletionId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching exercise results:', error);
      return [];
    }
  };

  const updateWorkoutStatus = async (
    assignmentId: string,
    scheduledDate: string,
    status: 'completed' | 'missed' | 'makeup' | 'scheduled',
    statusColor: string
  ) => {
    try {
      console.log('🔄 Ενημέρωση workout status:', {
        assignmentId,
        scheduledDate,
        status,
        statusColor
      });

      // Πρώτα ελέγχουμε αν υπάρχει η εγγραφή
      const { data: existingRecord, error: checkError } = await supabase
        .from('workout_completions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing record:', checkError);
        throw checkError;
      }

      if (!existingRecord) {
        console.log('⚠️ Δεν βρέθηκε εγγραφή - δημιουργία νέας');
        
        // Παίρνουμε το assignment και τα training_dates για να υπολογίσουμε το σωστό week/day number
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('program_assignments')
          .select('program_id, training_dates')
          .eq('id', assignmentId)
          .single();

        if (assignmentError) {
          console.error('❌ Error fetching assignment:', assignmentError);
          throw assignmentError;
        }

        if (!assignmentData?.program_id) {
          throw new Error('No program_id found for assignment');
        }

        // Υπολογίζουμε το week_number και day_number βάσει της θέσης της ημερομηνίας στο training_dates array
        const trainingDates = assignmentData.training_dates || [];
        const dateIndex = trainingDates.findIndex((date: string) => date === scheduledDate);
        
        console.log('📅 Training dates:', trainingDates);
        console.log('📍 Date index for', scheduledDate, ':', dateIndex);

        let weekNumber = 1;
        let dayNumber = 1;

        if (dateIndex >= 0) {
          // Παίρνουμε τη δομή του προγράμματος για να υπολογίσουμε σωστά
          const { data: programData, error: programError } = await supabase
            .from('programs')
            .select(`
              program_weeks (
                week_number,
                program_days (
                  day_number
                )
              )
            `)
            .eq('id', assignmentData.program_id)
            .single();

          if (!programError && programData?.program_weeks?.[0]?.program_days) {
            const daysPerWeek = programData.program_weeks[0].program_days.length;
            weekNumber = Math.floor(dateIndex / daysPerWeek) + 1;
            dayNumber = (dateIndex % daysPerWeek) + 1;
          }
        }

        console.log('📊 Calculated week/day:', { weekNumber, dayNumber });

        // Δημιουργούμε νέα εγγραφή
        const userId = await getUserId();
        if (!userId) throw new Error('User not found');

        const { data, error } = await supabase
          .from('workout_completions')
          .insert({
            assignment_id: assignmentId,
            user_id: userId,
            program_id: assignmentData.program_id,
            week_number: weekNumber,
            day_number: dayNumber,
            scheduled_date: scheduledDate,
            completed_date: status === 'completed' ? new Date().toISOString().split('T')[0] : scheduledDate,
            status: status,
            status_color: statusColor
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating workout completion:', error);
          throw error;
        }

        console.log('✅ Νέα εγγραφή δημιουργήθηκε:', data);
        return data;
      } else {
        // Ενημερώνουμε την υπάρχουσα εγγραφή
        const { data, error } = await supabase
          .from('workout_completions')
          .update({ 
            status,
            status_color: statusColor,
            completed_date: status === 'completed' ? new Date().toISOString().split('T')[0] : null
          })
          .eq('assignment_id', assignmentId)
          .eq('scheduled_date', scheduledDate)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating workout status:', error);
          throw error;
        }

        console.log('✅ Εγγραφή ενημερώθηκε:', data);
        return data;
      }
    } catch (error) {
      console.error('❌ Error in updateWorkoutStatus:', error);
      throw error;
    }
  };

  const markMissedWorkouts = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('workout_completions')
        .update({ 
          status: 'missed',
          status_color: 'red'
        })
        .lt('scheduled_date', today)
        .eq('status', 'scheduled')
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking missed workouts:', error);
      throw error;
    }
  };

  const getAssignmentAttendance = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('assignment_attendance')
        .select('*')
        .eq('assignment_id', assignmentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  };

  const getWorkoutCompletions = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching workout completions:', error);
      throw error;
    }
  };

  return {
    loading,
    completeWorkout,
    saveExerciseResults,
    getExerciseResults,
    updateWorkoutStatus,
    markMissedWorkouts,
    getAssignmentAttendance,
    getWorkoutCompletions
  };
};
