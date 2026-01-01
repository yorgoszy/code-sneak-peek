
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProgramAssignments = () => {
  const [loading, setLoading] = useState(false);

  const createOrUpdateAssignment = async (
    programId: string, 
    userId: string, 
    startDate?: string, 
    endDate?: string, 
    trainingDates?: string[]
  ) => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const authUserId = auth.user?.id;

      let assignedBy: string | null = null;
      if (authUserId) {
        const { data: me } = await supabase
          .from('app_users')
          .select('id')
          .eq('auth_user_id', authUserId)
          .maybeSingle();
        assignedBy = me?.id ?? null;
      }

      console.log('Creating/updating assignment with params:', {
        programId,
        userId,
        startDate,
        endDate,
        trainingDates,
        assignedBy
      });

      // Check if assignment already exists
      const { data: existingAssignment, error: fetchError } = await supabase
        .from('program_assignments')
        .select('*')
        .eq('program_id', programId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing assignment:', fetchError);
        throw fetchError;
      }

      const assignmentData = {
        program_id: programId,
        user_id: userId,
        start_date: startDate || null,
        end_date: endDate || null,
        status: 'active',
        assignment_type: 'individual',
        training_dates: trainingDates || [],
        assigned_by: assignedBy
      };

      console.log('Assignment data to save:', assignmentData);

      if (existingAssignment) {
        // Update existing assignment
        const { data, error } = await supabase
          .from('program_assignments')
          .update(assignmentData)
          .eq('id', existingAssignment.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating assignment:', error);
          throw error;
        }

        console.log('✅ Assignment updated successfully:', data);
        toast.success('Η ανάθεση ενημερώθηκε επιτυχώς');
        return data;
      } else {
        // Create new assignment
        const { data, error } = await supabase
          .from('program_assignments')
          .insert([assignmentData])
          .select()
          .single();

        if (error) {
          console.error('Error creating assignment:', error);
          throw error;
        }

        console.log('✅ Assignment created successfully:', data);
        toast.success('Η ανάθεση δημιουργήθηκε επιτυχώς');
        return data;
      }
    } catch (error) {
      console.error('Error in createOrUpdateAssignment:', error);
      toast.error('Σφάλμα κατά τη δημιουργία/ενημέρωση της ανάθεσης');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('program_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Η ανάθεση διαγράφηκε επιτυχώς');
      return true;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της ανάθεσης');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramAssignments = async (programId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('program_assignments')
        .select(`
          *,
          programs!inner(id, name, description),
          app_users!inner(id, name, email)
        `);

      if (programId) {
        query = query.eq('program_id', programId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Σφάλμα κατά την ανάκτηση των αναθέσεων');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createOrUpdateAssignment,
    deleteAssignment,
    fetchProgramAssignments
  };
};
