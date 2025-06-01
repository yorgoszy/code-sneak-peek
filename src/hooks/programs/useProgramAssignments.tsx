
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProgramAssignment } from "@/components/programs/types";

export const useProgramAssignments = () => {
  const createOrUpdateAssignment = async (programId: string, userId: string, startDate?: string, endDate?: string) => {
    try {
      console.log('🎯 Creating/updating assignment for program:', programId, 'user:', userId, 'dates:', { startDate, endDate });
      
      // Check if assignment already exists using user_id
      const { data: existingAssignment } = await supabase
        .from('program_assignments')
        .select('id')
        .eq('program_id', programId)
        .eq('user_id', userId)
        .single();

      const assignmentData: any = {
        status: 'active',
        updated_at: new Date().toISOString()
      };

      // CRITICAL: Add dates if provided - this was the missing piece
      if (startDate) {
        assignmentData.start_date = startDate;
        console.log('✅ Setting start_date in assignment:', startDate);
      }
      if (endDate) {
        assignmentData.end_date = endDate;
        console.log('✅ Setting end_date in assignment:', endDate);
      }

      if (existingAssignment) {
        // Update existing assignment
        console.log('📝 Updating existing assignment with data:', assignmentData);
        const { data: updatedData, error } = await supabase
          .from('program_assignments')
          .update(assignmentData)
          .eq('id', existingAssignment.id)
          .select();
        
        if (error) {
          console.error('❌ Error updating assignment:', error);
          throw error;
        }
        console.log('✅ Assignment updated successfully:', updatedData);
        toast.success('Η ανάθεση ενημερώθηκε επιτυχώς');
      } else {
        // Create new assignment using user_id
        const newAssignmentData = {
          program_id: programId,
          user_id: userId,
          ...assignmentData
        };

        console.log('🆕 Creating new assignment with data:', newAssignmentData);
        const { data: newData, error } = await supabase
          .from('program_assignments')
          .insert([newAssignmentData])
          .select();
        
        if (error) {
          console.error('❌ Error creating assignment:', error);
          throw error;
        }
        console.log('✅ New assignment created successfully:', newData);
        toast.success('Η ανάθεση δημιουργήθηκε επιτυχώς');
      }
    } catch (error) {
      console.error('❌ Error creating/updating assignment:', error);
      toast.error('Σφάλμα κατά την ανάθεση του προγράμματος');
      throw error; // Re-throw to handle in the calling function
    }
  };

  const fetchProgramAssignments = async (): Promise<ProgramAssignment[]> => {
    try {
      // Updated to use user_id instead of athlete_id
      const { data, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs!fk_program_assignments_program_id(id, name, description),
          app_users!fk_program_assignments_user_id(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error with foreign key query:', error);
        // Fallback to simple query without joins
        const { data: simpleData, error: simpleError } = await supabase
          .from('program_assignments')
          .select('*')
          .order('created_at', { ascending: false });

        if (simpleError) throw simpleError;
        
        return (simpleData || []).map(assignment => ({
          ...assignment,
          programs: null,
          app_users: null
        }));
      }
      
      // Transform data to handle potential query errors and null checks
      return (data || []).map(assignment => {
        // Safe check for programs
        const hasValidPrograms = assignment.programs && 
          typeof assignment.programs === 'object' && 
          assignment.programs !== null && 
          'id' in assignment.programs;

        // Safe check for app_users with complete null safety
        const appUsersData = assignment.app_users;
        let validAppUsers: any = null;
        
        // Type guard function to check if appUsersData has required properties
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

  return {
    createOrUpdateAssignment,
    fetchProgramAssignments
  };
};
