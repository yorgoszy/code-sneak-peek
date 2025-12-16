
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "./userService";
import { calculateWeekAndDay } from "./weekDayCalculator";
import type { WorkoutCompletion, ExerciseResult } from "./types";

export const completeWorkout = async (
  assignmentId: string,
  programId: string,
  weekNumber: number,
  dayNumber: number,
  scheduledDate: string,
  authUserId: string,
  notes?: string,
  startTime?: Date,
  endTime?: Date,
  actualDurationMinutes?: number,
  rpeScore?: number
) => {
  const userId = await getUserId(authUserId);
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
    notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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

  if (rpeScore) {
    workoutData.rpe_score = rpeScore;
  }

  const { data, error } = await supabase
    .from('workout_completions')
    .insert(workoutData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateWorkoutStatus = async (
  assignmentId: string,
  scheduledDate: string,
  status: 'completed' | 'missed' | 'makeup' | 'pending' | 'cancelled',
  statusColor: string,
  authUserId: string
) => {
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
    
    const { weekNumber, dayNumber, programId } = await calculateWeekAndDay(assignmentId, scheduledDate);

    // Δημιουργούμε νέα εγγραφή
    const userId = await getUserId(authUserId);
    if (!userId) throw new Error('User not found');

    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        assignment_id: assignmentId,
        user_id: userId,
        program_id: programId,
        week_number: weekNumber,
        day_number: dayNumber,
        scheduled_date: scheduledDate,
        completed_date: status === 'completed' ? new Date().toISOString().split('T')[0] : null,
        status: status,
        status_color: statusColor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
};

export const markMissedWorkouts = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('workout_completions')
    .update({ 
      status: 'missed',
      status_color: 'red'
    })
    .lt('scheduled_date', today)
    .eq('status', 'pending')
    .select();

  if (error) throw error;
  return data;
};

export const getWorkoutCompletions = async (assignmentId: string) => {
  const { data, error } = await supabase
    .from('workout_completions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('scheduled_date', { ascending: false });

  if (error) throw error;
  return data || [];
};
