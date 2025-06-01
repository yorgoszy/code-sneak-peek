
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProgramAssignment } from "@/components/programs/types";

export const useProgramAssignments = () => {
  const createOrUpdateAssignment = async (programId: string, userId: string) => {
    try {
      console.log('Creating/updating assignment for program:', programId, 'user:', userId);
      
      // Check if assignment already exists using user_id
      const { data: existingAssignment } = await supabase
        .from('program_assignments')
        .select('id')
        .eq('program_id', programId)
        .eq('user_id', userId)
        .single();

      if (existingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('program_assignments')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', existingAssignment.id);
        
        if (error) throw error;
        console.log('Assignment updated');
        toast.success('Η ανάθεση ενημερώθηκε επιτυχώς');
      } else {
        // Create new assignment using user_id
        const { error } = await supabase
          .from('program_assignments')
          .insert([{
            program_id: programId,
            user_id: userId,
            status: 'active'
          }]);
        
        if (error) throw error;
        console.log('New assignment created');
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
      return (data || []).map(assignment => ({
        ...assignment,
        programs: assignment.programs && typeof assignment.programs === 'object' && 'id' in assignment.programs 
          ? assignment.programs as any 
          : null,
        app_users: assignment.app_users && typeof assignment.app_users === 'object' && assignment.app_users !== null && 'id' in assignment.app_users 
          ? assignment.app_users as any 
          : null
      }));
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
