
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  category?: string;
  user_status: string;
  birth_date?: string;
  created_at: string;
}

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted: () => void;
  user: AppUser | null;
}

export const DeleteUserDialog = ({ isOpen, onClose, onUserDeleted, user }: DeleteUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      console.log('🗑️ Ξεκινώ διαγραφή χρήστη:', user.name, user.id);

      // 1. Διαγραφή από exercise_results - πρώτα βρίσκουμε τα workout_completion_ids
      const { data: workoutCompletions } = await supabase
        .from('workout_completions')
        .select('id')
        .eq('user_id', user.id);

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

      // 2. Διαγραφή από workout_completions
      const { error: workoutError } = await supabase
        .from('workout_completions')
        .delete()
        .eq('user_id', user.id);

      if (workoutError) {
        console.log('⚠️ Workout completions error (πιθανώς δεν υπάρχουν):', workoutError);
      }

      // 3. Διαγραφή από program_assignments
      const { error: assignmentsError } = await supabase
        .from('program_assignments')
        .delete()
        .eq('user_id', user.id);

      if (assignmentsError) {
        console.log('⚠️ Program assignments error (πιθανώς δεν υπάρχουν):', assignmentsError);
      }

      // 4. Διαγραφή από group_members
      const { error: groupMembersError } = await supabase
        .from('group_members')
        .delete()
        .eq('user_id', user.id);

      if (groupMembersError) {
        console.log('⚠️ Group members error (πιθανώς δεν υπάρχουν):', groupMembersError);
      }

      // 5. Διαγραφή από user_roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      if (rolesError) {
        console.log('⚠️ User roles error (πιθανώς δεν υπάρχουν):', rolesError);
      }

      // 6. Διαγραφή από assignment_attendance
      const { error: attendanceError } = await supabase
        .from('assignment_attendance')
        .delete()
        .eq('user_id', user.id);

      if (attendanceError) {
        console.log('⚠️ Assignment attendance error (πιθανώς δεν υπάρχουν):', attendanceError);
      }

      // 7. Διαγραφή από payments
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('user_id', user.id);

      if (paymentsError) {
        console.log('⚠️ Payments error (πιθανώς δεν υπάρχουν):', paymentsError);
      }

      // 8. Διαγραφή από τους πίνακες τεστ - χωρίς loop για να αποφύγουμε TypeScript errors
      const { error: anthropometricError } = await supabase
        .from('anthropometric_test_sessions')
        .delete()
        .eq('user_id', user.id);

      if (anthropometricError) {
        console.log('⚠️ Anthropometric test sessions error:', anthropometricError);
      }

      const { error: enduranceError } = await supabase
        .from('endurance_test_sessions')
        .delete()
        .eq('user_id', user.id);

      if (enduranceError) {
        console.log('⚠️ Endurance test sessions error:', enduranceError);
      }

      const { error: functionalError } = await supabase
        .from('functional_test_sessions')
        .delete()
        .eq('user_id', user.id);

      if (functionalError) {
        console.log('⚠️ Functional test sessions error:', functionalError);
      }

      const { error: jumpError } = await supabase
        .from('jump_test_sessions')
        .delete()
        .eq('user_id', user.id);

      if (jumpError) {
        console.log('⚠️ Jump test sessions error:', jumpError);
      }

      const { error: strengthError } = await supabase
        .from('strength_test_sessions')
        .delete()
        .eq('user_id', user.id);

      if (strengthError) {
        console.log('⚠️ Strength test sessions error:', strengthError);
      }

      // 9. Διαγραφή από tests
      const { error: testsError } = await supabase
        .from('tests')
        .delete()
        .eq('user_id', user.id);

      if (testsError) {
        console.log('⚠️ Tests error (πιθανώς δεν υπάρχουν):', testsError);
      }

      // 10. Τέλος, διαγραφή του χρήστη
      const { error: userError } = await supabase
        .from('app_users')
        .delete()
        .eq('id', user.id);

      if (userError) {
        console.error('❌ Σφάλμα διαγραφής χρήστη:', userError);
        toast({
          variant: "destructive",
          title: "Σφάλμα",
          description: `Δεν ήταν δυνατή η διαγραφή του χρήστη: ${userError.message}`,
        });
        return;
      }

      console.log('✅ Χρήστης διαγράφηκε επιτυχώς');
      toast({
        title: "Επιτυχία",
        description: "Ο χρήστης διαγράφηκε επιτυχώς",
      });
      onUserDeleted();
      onClose();

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: "Προέκυψε σφάλμα κατά τη διαγραφή του χρήστη",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Διαγραφή Χρήστη</AlertDialogTitle>
          <AlertDialogDescription>
            Είστε σίγουροι ότι θέλετε να διαγράψετε τον χρήστη "{user?.name}"? 
            <br /><br />
            <strong>Προσοχή:</strong> Θα διαγραφούν επίσης όλα τα δεδομένα του χρήστη (προπονήσεις, τεστ, αναθέσεις προγραμμάτων κ.λπ.).
            <br />
            Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={loading}
            className="rounded-none bg-red-600 hover:bg-red-700"
          >
            {loading ? "Διαγραφή..." : "Διαγραφή"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
