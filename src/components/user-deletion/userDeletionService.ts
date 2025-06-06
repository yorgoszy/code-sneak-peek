
import { supabase } from "@/integrations/supabase/client";
import type { AppUser } from "./types";

export class UserDeletionService {
  static async deleteUserData(user: AppUser): Promise<void> {
    console.log('🗑️ Ξεκινώ διαγραφή χρήστη:', user.name, user.id);

    // 1. Διαγραφή από exercise_results - πρώτα βρίσκουμε τα workout_completion_ids
    await this.deleteExerciseResults(user.id);

    // 2. Διαγραφή από workout_completions
    await this.deleteWorkoutCompletions(user.id);

    // 3. Διαγραφή από program_assignments
    await this.deleteProgramAssignments(user.id);

    // 4. Διαγραφή από group_members
    await this.deleteGroupMembers(user.id);

    // 5. Διαγραφή από user_roles
    await this.deleteUserRoles(user.id);

    // 6. Διαγραφή από assignment_attendance
    await this.deleteAssignmentAttendance(user.id);

    // 7. Διαγραφή από payments
    await this.deletePayments(user.id);

    // 8. Διαγραφή από τους πίνακες τεστ
    await this.deleteTestSessions(user.id);

    // 9. Διαγραφή από tests
    await this.deleteTests(user.id);

    // 10. Τέλος, διαγραφή του χρήστη
    await this.deleteUser(user.id);

    console.log('✅ Χρήστης διαγράφηκε επιτυχώς');
  }

  private static async deleteExerciseResults(userId: string): Promise<void> {
    const { data: workoutCompletions } = await supabase
      .from('workout_completions')
      .select('id')
      .eq('user_id', userId);

    if (workoutCompletions && workoutCompletions.length > 0) {
      const workoutCompletionIds = workoutCompletions.map(wc => wc.id);
      
      const { error: exerciseResultsError } = await supabase
        .from('exercise_results')
        .delete()
        .in('workout_completion_id', workoutCompletionIds);

      if (exerciseResultsError) {
        console.log('⚠️ Exercise results error (πιθανώς δεν υπάρχουν):', exerciseResultsError);
      }
    }
  }

  private static async deleteWorkoutCompletions(userId: string): Promise<void> {
    const { error } = await supabase
      .from('workout_completions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Workout completions error (πιθανώς δεν υπάρχουν):', error);
    }
  }

  private static async deleteProgramAssignments(userId: string): Promise<void> {
    const { error } = await supabase
      .from('program_assignments')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Program assignments error (πιθανώς δεν υπάρχουν):', error);
    }
  }

  private static async deleteGroupMembers(userId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Group members error (πιθανώς δεν υπάρχουν):', error);
    }
  }

  private static async deleteUserRoles(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ User roles error (πιθανώς δεν υπάρχουν):', error);
    }
  }

  private static async deleteAssignmentAttendance(userId: string): Promise<void> {
    const { error } = await supabase
      .from('assignment_attendance')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Assignment attendance error (πιθανώς δεν υπάρχουν):', error);
    }
  }

  private static async deletePayments(userId: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Payments error (πιθανώς δεν υπάρχουν):', error);
    }
  }

  private static async deleteTestSessions(userId: string): Promise<void> {
    // Διαγραφή από anthropometric_test_sessions
    const { error: anthropometricError } = await supabase
      .from('anthropometric_test_sessions')
      .delete()
      .eq('user_id', userId);

    if (anthropometricError) {
      console.log('⚠️ Anthropometric test sessions error:', anthropometricError);
    }

    // Διαγραφή από endurance_test_sessions
    const { error: enduranceError } = await supabase
      .from('endurance_test_sessions')
      .delete()
      .eq('user_id', userId);

    if (enduranceError) {
      console.log('⚠️ Endurance test sessions error:', enduranceError);
    }

    // Διαγραφή από functional_test_sessions
    const { error: functionalError } = await supabase
      .from('functional_test_sessions')
      .delete()
      .eq('user_id', userId);

    if (functionalError) {
      console.log('⚠️ Functional test sessions error:', functionalError);
    }

    // Διαγραφή από jump_test_sessions
    const { error: jumpError } = await supabase
      .from('jump_test_sessions')
      .delete()
      .eq('user_id', userId);

    if (jumpError) {
      console.log('⚠️ Jump test sessions error:', jumpError);
    }

    // Διαγραφή από strength_test_sessions
    const { error: strengthError } = await supabase
      .from('strength_test_sessions')
      .delete()
      .eq('user_id', userId);

    if (strengthError) {
      console.log('⚠️ Strength test sessions error:', strengthError);
    }
  }

  private static async deleteTests(userId: string): Promise<void> {
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Tests error (πιθανώς δεν υπάρχουν):', error);
    }
  }

  private static async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new Error(`Δεν ήταν δυνατή η διαγραφή του χρήστη: ${error.message}`);
    }
  }
}
