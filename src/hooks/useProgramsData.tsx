
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  category?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
}

export interface AthleteGroup {
  id: string;
  name: string;
  athlete_ids: string[];
}

export const useProgramsData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [groups, setGroups] = useState<AthleteGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users from app_users table
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, name, email, role, category')
        .order('name');

      if (usersError) throw usersError;

      // Fetch exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('id, name, description, video_url')
        .order('name');

      if (exercisesError) throw exercisesError;

      // Fetch athlete groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('athlete_groups')
        .select('id, name, athlete_ids')
        .order('name');

      if (groupsError) throw groupsError;

      setUsers(usersData || []);
      setExercises(exercisesData || []);
      setGroups(groupsData || []);
      
      console.log('Fetched data:', {
        users: usersData?.length,
        exercises: exercisesData?.length,
        groups: groupsData?.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    exercises,
    groups,
    loading,
    refetch: fetchData
  };
};
