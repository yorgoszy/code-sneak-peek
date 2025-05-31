
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
        .eq('athlete_id', userId) // Using athlete_id to match DB schema
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
            athlete_id: userId, // Using athlete_id to match DB schema
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
      const { data, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs(id, name, description),
          app_users(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
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
