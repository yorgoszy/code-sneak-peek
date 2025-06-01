
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProgramAssignment } from "@/components/programs/types";

export const useProgramAssignments = () => {
  const createOrUpdateAssignment = async (
    programId: string, 
    userId: string, 
    startDate?: string, 
    endDate?: string,
    trainingDates?: string[]
  ) => {
    try {
      console.log('=== ASSIGNMENT SAVE DEBUG ===');
      console.log('20. Function called with parameters:');
      console.log('    - programId:', programId);
      console.log('    - userId:', userId);
      console.log('    - startDate:', startDate);
      console.log('    - endDate:', endDate);
      console.log('    - trainingDates:', trainingDates);
      
      // Check if assignment already exists using user_id
      const { data: existingAssignment } = await supabase
        .from('program_assignments')
        .select('id')
        .eq('program_id', programId)
        .eq('user_id', userId)
        .single();

      console.log('21. Existing assignment check result:', existingAssignment);

      const assignmentData: any = {
        status: 'active',
        updated_at: new Date().toISOString()
      };

      // Add dates if provided
      if (startDate) {
        assignmentData.start_date = startDate;
        console.log('22. ✅ Setting start_date in assignment data:', startDate);
      }
      if (endDate) {
        assignmentData.end_date = endDate;
        console.log('23. ✅ Setting end_date in assignment data:', endDate);
      }
      if (trainingDates && trainingDates.length > 0) {
        assignmentData.training_dates = trainingDates;
        console.log('24. ✅ Setting training_dates in assignment data:', trainingDates);
      }

      console.log('25. Complete assignment data object:', assignmentData);

      if (existingAssignment) {
        // Update existing assignment
        console.log('26. 📝 Updating existing assignment with data:', assignmentData);
        const { data: updatedData, error } = await supabase
          .from('program_assignments')
          .update(assignmentData)
          .eq('id', existingAssignment.id)
          .select();
        
        if (error) {
          console.error('27. ❌ Error updating assignment:', error);
          throw error;
        }
        console.log('28. ✅ Assignment updated successfully:', updatedData);
        toast.success('Η ανάθεση ενημερώθηκε επιτυχώς');
      } else {
        // Create new assignment using user_id
        const newAssignmentData = {
          program_id: programId,
          user_id: userId,
          ...assignmentData
        };

        console.log('29. 🆕 Creating new assignment with complete data:', newAssignmentData);
        const { data: newData, error } = await supabase
          .from('program_assignments')
          .insert([newAssignmentData])
          .select();
        
        if (error) {
          console.error('30. ❌ Error creating assignment:', error);
          throw error;
        }
        console.log('31. ✅ New assignment created successfully:', newData);
        toast.success('Η ανάθεση δημιουργήθηκε επιτυχώς');
      }
    } catch (error) {
      console.error('❌ Error creating/updating assignment:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
      throw error;
    }
  };

  const fetchProgramAssignments = async (): Promise<ProgramAssignment[]> => {
    try {
      console.log('=== FETCHING ALL ASSIGNMENTS DEBUG ===');
      
      const { data, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs!fk_program_assignments_program_id(id, name, description),
          app_users!fk_program_assignments_user_id(id, name, email)
        `)
        .order('created_at', { ascending: false });

      console.log('32. Raw program_assignments query result:', data);
      console.log('33. Query error (if any):', error);

      if (error) {
        console.error('Error with foreign key query:', error);
        // Fallback to simple query without joins
        const { data: simpleData, error: simpleError } = await supabase
          .from('program_assignments')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('34. Fallback simple query result:', simpleData);

        if (simpleError) throw simpleError;
        
        return (simpleData || []).map(assignment => ({
          ...assignment,
          programs: null,
          app_users: null
        }));
      }
      
      return (data || []).map(assignment => {
        const hasValidPrograms = assignment.programs && 
          typeof assignment.programs === 'object' && 
          assignment.programs !== null && 
          'id' in assignment.programs;

        const appUsersData = assignment.app_users;
        let validAppUsers: any = null;
        
        const isValidAppUser = (data: any): data is { id: string; name: string; email: string } => {
          return data && 
                 typeof data === 'object' && 
                 data !== null &&
                 typeof data.id === 'string' &&
                 typeof data.name === 'string' &&
                 typeof data.email === 'string';
        };

        if (isValidAppUser(appUsersData)) {
          validAppUsers = appUsersData;
        }

        return {
          ...assignment,
          programs: hasValidPrograms ? assignment.programs as any : null,
          app_users: validAppUsers
        };
      });
    } catch (error) {
      console.error('Error fetching program assignments:', error);
      toast.error('Σφάλμα φόρτωσης αναθέσεων');
      return [];
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      console.log('🗑️ Deleting assignment:', assignmentId);
      
      const { error } = await supabase
        .from('program_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        console.error('❌ Error deleting assignment:', error);
        throw error;
      }

      console.log('✅ Assignment deleted successfully');
      toast.success('Η ανάθεση διαγράφηκε επιτυχώς');
      return true;
    } catch (error) {
      console.error('❌ Error deleting assignment:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της ανάθεσης');
      return false;
    }
  };

  return {
    createOrUpdateAssignment,
    fetchProgramAssignments,
    deleteAssignment
  };
};
