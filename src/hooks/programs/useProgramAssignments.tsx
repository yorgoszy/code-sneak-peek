
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProgramAssignment } from "@/components/programs/types";

export const useProgramAssignments = () => {
  const createOrUpdateAssignment = async (programId: string, userId: string, startDate?: string, endDate?: string) => {
    try {
      console.log('Creating/updating assignment for program:', programId, 'user:', userId, 'dates:', { startDate, endDate });
      
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

      // Add dates if provided
      if (startDate) {
        assignmentData.start_date = startDate;
      }
      if (endDate) {
        assignmentData.end_date = endDate;
      }

      if (existingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('program_assignments')
          .update(assignmentData)
          .eq('id', existingAssignment.id);
        
        if (error) throw error;
        console.log('Assignment updated with dates:', assignmentData);
        toast.success('Η ανάθεση ενημερώθηκε επιτυχώς');
      } else {
        // Create new assignment using user_id
        const newAssignmentData = {
          program_id: programId,
          user_id: userId,
          ...assignmentData
        };

        const { error } = await supabase
          .from('program_assignments')
          .insert([newAssignmentData]);
        
        if (error) throw error;
        console.log('New assignment created with dates:', newAssignmentData);
        toast.success('Η ανάθεση δημιουργήθηκε επιτυχώς');
      }
    } catch (error) {
      console.error('Error creating/updating assignment:', error);
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
        
        if (appUsersData && 
            typeof appUsersData === 'object' && 
            appUsersData !== null && 
            'id' in appUsersData) {
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
