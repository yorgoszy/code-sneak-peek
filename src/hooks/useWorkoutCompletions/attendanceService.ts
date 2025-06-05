
import { supabase } from "@/integrations/supabase/client";

export const getAssignmentAttendance = async (assignmentId: string) => {
  const { data, error } = await supabase
    .from('assignment_attendance')
    .select('*')
    .eq('assignment_id', assignmentId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};
