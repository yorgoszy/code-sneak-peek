
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useActivePrograms = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchActivePrograms();
    }
  }, [user]);

  const fetchActivePrograms = async () => {
    try {
      setLoading(true);
      
      // Fetch user data first to get the user ID from app_users
      const { data: userData } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!userData) {
        setPrograms([]);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Fetch active program assignments with full program details
      const { data, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs(
            *,
            app_users(name),
            program_weeks(
              *,
              program_days(
                *,
                program_blocks(
                  *,
                  program_exercises(
                    *,
                    exercises(name)
                  )
                )
              )
            )
          )
        `)
        .eq('athlete_id', userData.id)
        .eq('status', 'active')
        .gte('end_date', today) // Μόνο προγράμματα που δεν έχουν λήξει
        .order('end_date', { ascending: true });

      if (error) {
        console.error('Error fetching active programs:', error);
        setPrograms([]);
      } else {
        setPrograms(data || []);
      }
    } catch (error) {
      console.error('Error fetching active programs:', error);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    programs,
    loading,
    refetch: fetchActivePrograms
  };
};
