import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JumpSessionCard, JumpSessionCardSession } from "@/components/progress/JumpSessionCard";

interface JumpProfileLatestCardProps {
  userId: string;
}

export const JumpProfileLatestCard: React.FC<JumpProfileLatestCardProps> = ({ userId }) => {
  const [latestSessions, setLatestSessions] = useState<{
    nonCmj: JumpSessionCardSession | null;
    cmj: JumpSessionCardSession | null;
    depthJump: JumpSessionCardSession | null;
    broadJump: JumpSessionCardSession | null;
  }>({ nonCmj: null, cmj: null, depthJump: null, broadJump: null });
  const [percentageChanges, setPercentageChanges] = useState<{
    nonCmj: number | null;
    cmj: number | null;
    depthJump: number | null;
    broadJump: number | null;
  }>({ nonCmj: null, cmj: null, depthJump: null, broadJump: null });

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
      
      // Χωρίζω τα sessions ανά τύπο
      const nonCmjSessions = allSessions.filter(s => s.notes?.includes('Non-CMJ Test'));
      const cmjSessions = allSessions.filter(s => s.notes?.includes('CMJ Test'));
      const depthJumpSessions = allSessions.filter(s => s.notes?.includes('Depth Jump Test'));
      const broadJumpSessions = allSessions.filter(s => s.notes?.includes('Broad Jump Test'));

      // Βρίσκω την τελευταία καταγραφή για κάθε τύπο
      const latestNonCmj = nonCmjSessions[0] || null;
      const latestCmj = cmjSessions[0] || null;
      const latestDepthJump = depthJumpSessions[0] || null;
      const latestBroadJump = broadJumpSessions[0] || null;

      setLatestSessions({
        nonCmj: latestNonCmj,
        cmj: latestCmj,
        depthJump: latestDepthJump,
        broadJump: latestBroadJump
      });

      // Υπολογίζω το ποσοστό για Non-CMJ
      let nonCmjChange: number | null = null;
      if (nonCmjSessions.length >= 2) {
        const currentJump = nonCmjSessions[0].jump_test_data?.[0];
        const previousJump = nonCmjSessions[1].jump_test_data?.[0];
        
        const currentValue = currentJump?.non_counter_movement_jump;
        const previousValue = previousJump?.non_counter_movement_jump;

        if (currentValue && previousValue) {
          nonCmjChange = ((currentValue - previousValue) / previousValue) * 100;
        }
      }

      // Υπολογίζω το ποσοστό για CMJ
      let cmjChange: number | null = null;
      if (cmjSessions.length >= 2) {
        const currentJump = cmjSessions[0].jump_test_data?.[0];
        const previousJump = cmjSessions[1].jump_test_data?.[0];
        
        const currentValue = currentJump?.counter_movement_jump;
        const previousValue = previousJump?.counter_movement_jump;

        if (currentValue && previousValue) {
          cmjChange = ((currentValue - previousValue) / previousValue) * 100;
        }
      }

      // Υπολογίζω το ποσοστό για Depth Jump
      let depthJumpChange: number | null = null;
      if (depthJumpSessions.length >= 2) {
        const currentJump = depthJumpSessions[0].jump_test_data?.[0];
        const previousJump = depthJumpSessions[1].jump_test_data?.[0];
        
        const currentValue = currentJump?.depth_jump;
        const previousValue = previousJump?.depth_jump;

        if (currentValue && previousValue) {
          depthJumpChange = ((currentValue - previousValue) / previousValue) * 100;
        }
      }

      // Υπολογίζω το ποσοστό για Broad Jump
      let broadJumpChange: number | null = null;
      if (broadJumpSessions.length >= 2) {
        const currentJump = broadJumpSessions[0].jump_test_data?.[0];
        const previousJump = broadJumpSessions[1].jump_test_data?.[0];
        
        const currentValue = currentJump?.broad_jump;
        const previousValue = previousJump?.broad_jump;

        if (currentValue && previousValue) {
          broadJumpChange = ((currentValue - previousValue) / previousValue) * 100;
        }
      }

      setPercentageChanges({
        nonCmj: nonCmjChange,
        cmj: cmjChange,
        depthJump: depthJumpChange,
        broadJump: broadJumpChange
      });
    };

    load();
  }, [userId]);

  if (!latestSessions.nonCmj && !latestSessions.cmj && !latestSessions.depthJump && !latestSessions.broadJump) return null;

  return (
    <>
      {latestSessions.nonCmj && (
        <JumpSessionCard 
          key={latestSessions.nonCmj.id}
          session={latestSessions.nonCmj} 
          percentageChange={percentageChanges.nonCmj} 
        />
      )}
      {latestSessions.cmj && (
        <JumpSessionCard 
          key={latestSessions.cmj.id}
          session={latestSessions.cmj} 
          percentageChange={percentageChanges.cmj} 
        />
      )}
      {latestSessions.depthJump && (
        <JumpSessionCard 
          key={latestSessions.depthJump.id}
          session={latestSessions.depthJump} 
          percentageChange={percentageChanges.depthJump} 
        />
      )}
      {latestSessions.broadJump && (
        <JumpSessionCard 
          key={latestSessions.broadJump.id}
          session={latestSessions.broadJump} 
          percentageChange={percentageChanges.broadJump} 
        />
      )}
    </>
  );
};