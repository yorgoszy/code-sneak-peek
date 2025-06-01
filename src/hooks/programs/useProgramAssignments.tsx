
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProgramAssignment } from "@/components/programs/types";

export const useProgramAssignments = () => {
  const createOrUpdateAssignment = async (programId: string, userId: string) => {
    try {
      console.log('Creating/updating assignment for program:', programId, 'user:', userId);
      
      // Check if assignment already exists using athlete_id (DB field name)
      const { data: existingAssignment } = await supabase
        .from('program_assignments')
        .select('id')
        .eq('program_id', programId)
        .eq('athlete_id', userId)
        .single();

      if (existingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('program_assignments')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', existingAssignment.id);
        
        if (error) throw error;
        console.log('Assignment updated');
      } else {
        // Create new assignment using athlete_id
        const { error } = await supabase
          .from('program_assignments')
          .insert([{
            program_id: programId,
            athlete_id: userId,
            status: 'active'
          }]);
        
        if (error) throw error;
        console.log('New assignment created');
      }
    } catch (error) {
      console.error('Error creating/updating assignment:', error);
      // Don't throw here, as the program itself was saved successfully
    }
  };

  const fetchProgramAssignments = async (): Promise<ProgramAssignment[]> => {
    try {
      // First try with foreign key references
      const { data, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs!fk_program_assignments_program_id(id, name, description),
          app_users!fk_program_assignments_athlete_id(id, name, email)
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
      
      // Transform data to handle potential query errors
      return (data || []).map(assignment => ({
        ...assignment,
        programs: assignment.programs && typeof assignment.programs === 'object' && 'id' in assignment.programs 
          ? assignment.programs as any 
          : null,
        app_users: assignment.app_users && typeof assignment.app_users === 'object' && 'id' in assignment.app_users 
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
