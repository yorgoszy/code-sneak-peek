
import { supabase } from "@/integrations/supabase/client";
import type { AppUser } from "./types";

interface AppUserExtended extends AppUser {
  auth_user_id?: string | null;
}

export class UserDeletionService {
  static async deleteUserData(user: AppUserExtended): Promise<void> {
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

    // 10. Διαγραφή από bookings & sessions
    await this.deleteBookings(user.id);
    await this.deleteBookingSessions(user.id);
    await this.deleteWaitingList(user.id);

    // 11. Διαγραφή από subscriptions & packages
    await this.deleteUserSubscriptions(user.id);
    await this.deleteVisitPackages(user.id);
    await this.deleteVideocallPackages(user.id);

    // 12. Διαγραφή από AI data
    await this.deleteAIData(user.id);

    // 13. Διαγραφή από user visits & videocalls
    await this.deleteUserVisits(user.id);
    await this.deleteUserVideocalls(user.id);

    // 14. Διαγραφή από discount coupons & magic boxes
    await this.deleteDiscountCoupons(user.id);
    await this.deleteUserMagicBoxes(user.id);

    // 15. Διαγραφή από exercise notes
    await this.deleteExerciseNotes(user.id);

    // 16. Διαγραφή του χρήστη από app_users
    await this.deleteUser(user.id);

    // 17. Διαγραφή του auth user (αν υπάρχει)
    if (user.auth_user_id) {
      await this.deleteAuthUser(user.auth_user_id);
    }

    console.log('✅ Χρήστης διαγράφηκε επιτυχώς');
  }

  private static async deleteAuthUser(authUserId: string): Promise<void> {
    console.log('🗑️ Διαγραφή auth user:', authUserId);
    
    try {
      const { error } = await supabase.functions.invoke('delete-auth-user', {
        body: { authUserId }
      });

      if (error) {
        console.log('⚠️ Auth user deletion error:', error);
      } else {
        console.log('✅ Auth user deleted');
      }
    } catch (err) {
      console.log('⚠️ Auth user deletion error:', err);
    }
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

  private static async deleteBookings(userId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Bookings error:', error);
    }
  }

  private static async deleteBookingSessions(userId: string): Promise<void> {
    const { error } = await supabase
      .from('booking_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Booking sessions error:', error);
    }
  }

  private static async deleteWaitingList(userId: string): Promise<void> {
    const { error } = await supabase
      .from('booking_waiting_list')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Waiting list error:', error);
    }
  }

  private static async deleteUserSubscriptions(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ User subscriptions error:', error);
    }
  }

  private static async deleteVisitPackages(userId: string): Promise<void> {
    const { error } = await supabase
      .from('visit_packages')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Visit packages error:', error);
    }
  }

  private static async deleteVideocallPackages(userId: string): Promise<void> {
    const { error } = await supabase
      .from('videocall_packages')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Videocall packages error:', error);
    }
  }

  private static async deleteAIData(userId: string): Promise<void> {
    // AI conversations
    const { error: conversationsError } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('user_id', userId);

    if (conversationsError) {
      console.log('⚠️ AI conversations error:', conversationsError);
    }

    // AI user profiles
    const { error: profilesError } = await supabase
      .from('ai_user_profiles')
      .delete()
      .eq('user_id', userId);

    if (profilesError) {
      console.log('⚠️ AI user profiles error:', profilesError);
    }

    // AI chat files
    const { error: filesError } = await supabase
      .from('ai_chat_files')
      .delete()
      .eq('user_id', userId);

    if (filesError) {
      console.log('⚠️ AI chat files error:', filesError);
    }
  }

  private static async deleteUserVisits(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_visits')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ User visits error:', error);
    }
  }

  private static async deleteUserVideocalls(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_videocalls')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ User videocalls error:', error);
    }
  }

  private static async deleteDiscountCoupons(userId: string): Promise<void> {
    const { error } = await supabase
      .from('discount_coupons')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ Discount coupons error:', error);
    }
  }

  private static async deleteUserMagicBoxes(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_magic_boxes')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('⚠️ User magic boxes error:', error);
    }
  }

  private static async deleteExerciseNotes(userId: string): Promise<void> {
    // Βρες όλα τα assignments του χρήστη
    const { data: assignments } = await supabase
      .from('program_assignments')
      .select('id')
      .eq('user_id', userId);

    if (assignments && assignments.length > 0) {
      const assignmentIds = assignments.map(a => a.id);
      
      const { error } = await supabase
        .from('exercise_notes')
        .delete()
        .in('assignment_id', assignmentIds);

      if (error) {
        console.log('⚠️ Exercise notes error:', error);
      }
    }
  }

  private static async deleteUser(userId: string): Promise<void> {
    // Χρησιμοποιούμε RPC με SECURITY DEFINER για να παρακάμψουμε RLS και να γίνει σίγουρα η διαγραφή
    // Προαιρετικά: καθάρισμα memberships/πληρωμών
    await supabase.rpc('admin_delete_athlete_memberships', { athlete_id: userId });

    const { error } = await supabase.rpc('admin_delete_athlete', { athlete_id: userId });

    if (error) {
      throw new Error(`Δεν ήταν δυνατή η διαγραφή του χρήστη: ${error.message}`);
    }
  }
}
