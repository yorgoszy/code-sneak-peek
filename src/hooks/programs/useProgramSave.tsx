
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
            return;
          }
          appUserId = newUser.id;
        } else if (existingUser) {
          appUserId = existingUser.id;
        }
      }
      
      if (programData.id) {
        // Update existing program
        const { error: programError } = await supabase
          .from('programs')
          .update({
            name: programData.name,
            description: programData.description,
            athlete_id: programData.athlete_id || null,
            status: programData.status || 'draft'
          })
          .eq('id', programData.id);

        if (programError) throw programError;

        // Delete old structure
        await supabase.from('program_weeks').delete().eq('program_id', programData.id);
        
        // Create new structure
        await createProgramStructure(programData.id, programData);
        
        // If createAssignment flag is set, create assignment
        if (programData.createAssignment && appUserId) {
          await createOrUpdateAssignment(programData.id, appUserId);
        }
        
        // If athlete_id is provided and different from creator, create additional assignment
        if (programData.athlete_id && programData.athlete_id !== appUserId && programData.createAssignment) {
          await createOrUpdateAssignment(programData.id, programData.athlete_id);
        }
        
        toast.success('Το πρόγραμμα ενημερώθηκε επιτυχώς');
      } else {
        // Create new program
        const { data: program, error: programError } = await supabase
          .from('programs')
          .insert([{
            name: programData.name,
            description: programData.description,
            athlete_id: programData.athlete_id || null,
            created_by: appUserId,
            status: programData.status || 'draft'
          }])
          .select()
          .single();

        if (programError) throw programError;

        await createProgramStructure(program.id, programData);
        
        // Only create assignments if createAssignment flag is set
        if (programData.createAssignment && appUserId) {
          console.log('Creating assignment for creator');
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30);
          
          const { error: assignmentError } = await supabase
            .from('program_assignments')
            .insert([{
              program_id: program.id,
              athlete_id: appUserId,
              status: 'active',
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0],
              notes: 'Ενεργό πρόγραμμα'
            }]);
            
          if (assignmentError) {
            console.error('Error creating assignment:', assignmentError);
          } else {
            console.log('Assignment created successfully');
          }
        }
        
        // If athlete_id is provided and different from creator, create additional assignment
        if (programData.athlete_id && programData.athlete_id !== appUserId && programData.createAssignment) {
          await createOrUpdateAssignment(program.id, programData.athlete_id);
        }
        
        const successMessage = programData.createAssignment 
          ? 'Το πρόγραμμα δημιουργήθηκε και ανατέθηκε επιτυχώς'
          : 'Το πρόγραμμα αποθηκεύτηκε επιτυχώς';
        toast.success(successMessage);
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
