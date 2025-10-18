import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JumpSessionCard, JumpSessionCardSession } from "@/components/progress/JumpSessionCard";

interface JumpProfileLatestCardProps {
  userId: string;
}

export const JumpProfileLatestCard: React.FC<JumpProfileLatestCardProps> = ({ userId }) => {
  const [session, setSession] = useState<JumpSessionCardSession | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from('jump_test_sessions')
        .select(`
          id,
          user_id,
          test_date,
          notes,
          jump_test_data (
            id,
            non_counter_movement_jump,
            counter_movement_jump,
            depth_jump,
            broad_jump,
            triple_jump_left,
            triple_jump_right
          )
        `)
        .eq('user_id', userId)
        .order('test_date', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading latest jump session:', error);
        return;
      }

      setSession((data || [])[0] || null);
    };

    load();
  }, [userId]);

  if (!session) return null;

  return (
    <JumpSessionCard session={session} />
  );
};