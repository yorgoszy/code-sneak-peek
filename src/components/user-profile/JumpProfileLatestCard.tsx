import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JumpSessionCard, JumpSessionCardSession } from "@/components/progress/JumpSessionCard";

interface JumpProfileLatestCardProps {
  userId: string;
}

export const JumpProfileLatestCard: React.FC<JumpProfileLatestCardProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<JumpSessionCardSession[]>([]);
  const [percentageChanges, setPercentageChanges] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      
      // Φέρνω όλες τις καταγραφές για τον χρήστη
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
        .order('test_date', { ascending: false });

      if (error) {
        console.error('Error loading jump sessions:', error);
        return;
      }

      const allSessions = data || [];
      setSessions(allSessions);

      // Υπολογίζω το ποσοστό αλλαγής για κάθε καταγραφή
      const changes = new Map<string, number>();
      
      for (let i = 0; i < allSessions.length - 1; i++) {
        const currentJump = allSessions[i].jump_test_data?.[0];
        const previousJump = allSessions[i + 1].jump_test_data?.[0];

        // Συγκρίνω το κύριο μέτρημα (non_counter_movement_jump ή counter_movement_jump)
        const currentValue = currentJump?.non_counter_movement_jump || currentJump?.counter_movement_jump;
        const previousValue = previousJump?.non_counter_movement_jump || previousJump?.counter_movement_jump;

        if (currentValue && previousValue) {
          const change = ((currentValue - previousValue) / previousValue) * 100;
          changes.set(allSessions[i].id, change);
        }
      }
      
      setPercentageChanges(changes);
    };

    load();
  }, [userId]);

  if (sessions.length === 0) return null;

  return (
    <>
      {sessions.map((session) => (
        <JumpSessionCard 
          key={session.id}
          session={session} 
          percentageChange={percentageChanges.get(session.id) ?? null} 
        />
      ))}
    </>
  );
};