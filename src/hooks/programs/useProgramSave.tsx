
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProgramStructure } from './useProgramStructure';
import { useProgramAssignments } from './useProgramAssignments';
import { useAuth } from '../useAuth';

export const useProgramSave = () => {
  const [loading, setLoading] = useState(false);
  const { createProgramStructure } = useProgramStructure();
  const { createOrUpdateAssignment } = useProgramAssignments();
  const { user } = useAuth();

  const saveProgram = async (programData: any) => {
    setLoading(true);
    try {
      console.log('Saving program data:', programData);
      
      // Ensure we have a user authenticated
      if (!user?.id) {
        toast.error('Πρέπει να είστε συνδεδεμένοι για να αποθηκεύσετε πρόγραμμα');
        return null;
      }
      
      // Get the current user's app_users id (needed for created_by)
      let currentUserAppId = null;
      
      const { data: currentAppUser, error: currentUserError } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (currentUserError) {
        console.error('Error finding current user:', currentUserError);
        toast.error('Δεν βρέθηκε ο τρέχων χρήστης στη βάση δεδομένων');
        return null;
      }
      
      currentUserAppId = currentAppUser.id;
      console.log('✅ Current user found:', currentAppUser);

      if (!currentUserAppId) {
        toast.error('Δεν ήταν δυνατή η εύρεση του χρήστη');
        return null;
      }
      
      if (programData.id) {
        // Update existing program
        const { data: updatedProgram, error: programError } = await supabase
          .from('programs')
          .update({
            name: programData.name,
            description: programData.description,
            user_id: programData.user_id || null,
            status: programData.status || 'draft'
          })
          .eq('id', programData.id)
          .select()
          .single();

        if (programError) {
          console.error('Error updating program:', programError);
          toast.error('Σφάλμα ενημέρωσης προγράμματος: ' + programError.message);
          throw programError;
        }

        // Delete old structure completely
        console.log('Deleting old program structure for program:', programData.id);
        const { error: deleteWeeksError } = await supabase
          .from('program_weeks')
          .delete()
          .eq('program_id', programData.id);
        
        if (deleteWeeksError) {
          console.error('Error deleting old weeks:', deleteWeeksError);
        }
        
        // Create new structure
        console.log('Creating new program structure');
        await createProgramStructure(programData.id, programData);
        
        // Handle assignments with training dates
        if (programData.createAssignment && programData.training_dates && programData.user_id) {
          console.log('Creating assignment with training dates:', programData.training_dates);
          
          await createOrUpdateAssignment(
            programData.id, 
            programData.user_id, // Use the selected user_id directly
            undefined, 
            undefined, 
            programData.training_dates
          );
        }
        
        const successMessage = programData.createAssignment 
          ? 'Το πρόγραμμα ενημερώθηκε και ανατέθηκε επιτυχώς'
          : 'Το πρόγραμμα ενημερώθηκε επιτυχώς';
        toast.success(successMessage);
        
        return updatedProgram;
      } else {
        // Create new program
        const { data: program, error: programError } = await supabase
          .from('programs')
          .insert([{
            name: programData.name,
            description: programData.description,
            user_id: programData.user_id || null,
            created_by: currentUserAppId,
            status: programData.status || 'draft'
          }])
          .select()
          .single();

        if (programError) {
          console.error('Error creating program:', programError);
          toast.error('Σφάλμα δημιουργίας προγράμματος: ' + programError.message);
          throw programError;
        }

        console.log('Creating program structure for new program:', program.id);
        await createProgramStructure(program.id, programData);
        
        // Handle assignments with training dates
        if (programData.createAssignment && programData.training_dates && programData.user_id) {
          console.log('Creating assignment with training dates for new program:', programData.training_dates);
          
          await createOrUpdateAssignment(
            program.id, 
            programData.user_id, // Use the selected user_id directly
            undefined, 
            undefined, 
            programData.training_dates
          );
        }
        
        const successMessage = programData.createAssignment 
          ? 'Το πρόγραμμα δημιουργήθηκε και ανατέθηκε επιτυχώς'
          : 'Το πρόγραμμα αποθηκεύτηκε επιτυχώς';
        toast.success(successMessage);
        
        return program;
      }
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error('Σφάλμα αποθήκευσης προγράμματος: ' + (error as any).message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveProgram
  };
};
