import { supabase } from "@/integrations/supabase/client";
import type { AppUser } from "./types";

export class UserDeletionService {
  static async deleteUserData(user: AppUser): Promise<void> {
    // One transaction: a failed dependency cleanup must not partly delete a user.
    const { error } = await supabase.rpc('admin_delete_athlete', { athlete_id: user.id });
    if (error) {
      throw new Error(`Δεν ήταν δυνατή η διαγραφή του χρήστη: ${error.message}`);
    }

    if (user.auth_user_id) {
      const { data, error: authError } = await supabase.functions.invoke('delete-auth-user', {
        body: { authUserId: user.auth_user_id },
      });
      if (authError || data?.error || data?.success !== true) {
        throw new Error('Τα στοιχεία χρήστη διαγράφηκαν, αλλά δεν διαγράφηκε ο λογαριασμός σύνδεσης. Απαιτείται επανάληψη της διαγραφής λογαριασμού.');
      }
    }
  }
}
