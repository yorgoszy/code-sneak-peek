
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
      
      // First, ensure the current user exists in app_users table
      let appUserId = null;
      if (user?.id) {
        const { data: existingUser, error: userCheckError } = await supabase
          .from('app_users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (userCheckError && userCheckError.code === 'PGRST116') {
          // User doesn't exist in app_users, create them
          console.log('Creating user in app_users table');
          const { data: newUser, error: createUserError } = await supabase
            .from('app_users')
            .insert([{
              auth_user_id: user.id,
              email: user.email || 'unknown@example.com',
              name: user.email?.split('@')[0] || 'Unknown User',
              role: 'trainer'
            }])
            .select()
            .single();

          if (createUserError) {
            console.error('Error creating user:', createUserError);
            toast.error('Σφάλμα δημιουργίας χρήστη');
            return null;
          }
          appUserId = newUser.id;
        } else if (existingUser) {
          appUserId = existingUser.id;
        }
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

        if (programError) throw programError;

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
        if (programData.createAssignment && programData.training_dates) {
          console.log('Creating assignment with training dates:', programData.training_dates);
          
          if (appUserId) {
            await createOrUpdateAssignment(
              programData.id, 
              appUserId, 
              undefined, 
              undefined, 
              programData.training_dates
            );
          }
          
          if (programData.user_id && programData.user_id !== appUserId) {
            await createOrUpdateAssignment(
              programData.id, 
              programData.user_id, 
              undefined, 
              undefined, 
              programData.training_dates
            );
          }
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
            created_by: appUserId,
            status: programData.status || 'draft'
          }])
          .select()
          .single();

        if (programError) throw programError;

        console.log('Creating program structure for new program:', program.id);
        await createProgramStructure(program.id, programData);
        
        // Handle assignments with training dates
        if (programData.createAssignment && programData.training_dates) {
          console.log('Creating assignment with training dates for new program:', programData.training_dates);
          
          if (appUserId) {
            await createOrUpdateAssignment(
              program.id, 
              appUserId, 
              undefined, 
              undefined, 
              programData.training_dates
            );
          }
          
          if (programData.user_id && programData.user_id !== appUserId) {
            await createOrUpdateAssignment(
              program.id, 
              programData.user_id, 
              undefined, 
              undefined, 
              programData.training_dates
            );
          }
        }
        
        const successMessage = programData.createAssignment 
          ? 'Το πρόγραμμα δημιουργήθηκε και ανατέθηκε επιτυχώς'
          : 'Το πρόγραμμα αποθηκεύτηκε επιτυχώς';
        toast.success(successMessage);
        
        return program;
      }
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error('Σφάλμα αποθήκευσης προγράμματος');
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
