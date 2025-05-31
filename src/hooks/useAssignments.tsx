
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProgramAssignment } from "@/types/assignments";

export const useAssignments = () => {
  const [loading, setLoading] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs(id, name, description),
          app_users!program_assignments_athlete_id_fkey(id, name, email),
          athlete_groups(id, name, athlete_ids)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched assignments:', data);
      
      // Transform the data to match ProgramAssignment type
      const transformedData = (data || []).map(item => ({
        id: item.id,
        program_id: item.program_id,
        assigned_by: item.assigned_by || undefined,
        assignment_type: (item.assignment_type as 'individual' | 'group') || 'individual',
        athlete_id: item.athlete_id || undefined,
        group_id: item.group_id || undefined,
        start_date: item.start_date,
        end_date: item.end_date || undefined,
        status: item.status,
        notes: item.notes || undefined,
        progress: item.progress || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        programs: item.programs || undefined,
        app_users: Array.isArray(item.app_users) && item.app_users.length > 0 ? item.app_users[0] : undefined,
        athlete_groups: Array.isArray(item.athlete_groups) && item.athlete_groups.length > 0 ? item.athlete_groups[0] : undefined
      }));

      return transformedData;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Σφάλμα φόρτωσης αναθέσεων');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (assignmentData: any) => {
    setLoading(true);
    try {
      console.log('Creating assignment:', assignmentData);
      
      // Get current user
      const { data: userData } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userData) throw new Error('User not found');

      const { error } = await supabase
        .from('program_assignments')
        .insert([{
          ...assignmentData,
          assigned_by: userData.id
        }]);

      if (error) throw error;
      toast.success('Η ανάθεση δημιουργήθηκε επιτυχώς');
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Σφάλμα δημιουργίας ανάθεσης');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (id: string, updates: Partial<ProgramAssignment>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('program_assignments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Η ανάθεση ενημερώθηκε επιτυχώς');
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Σφάλμα ενημέρωσης ανάθεσης');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ανάθεση;')) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('program_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Η ανάθεση διαγράφηκε επιτυχώς');
      return true;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Σφάλμα διαγραφής ανάθεσης');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment
  };
};
