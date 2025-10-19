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
    tripleJump: JumpSessionCardSession | null;
  }>({ nonCmj: null, cmj: null, depthJump: null, broadJump: null, tripleJump: null });
  const [percentageChanges, setPercentageChanges] = useState<{
    nonCmj: number | null;
    cmj: number | null;
    depthJump: number | null;
    broadJump: number | null;
    tripleJump: number | null;
  }>({ nonCmj: null, cmj: null, depthJump: null, broadJump: null, tripleJump: null });

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
          created_at,
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading jump sessions:', error);
        return;
      }

      const allSessions = data || [];
      
      // Βοηθητικές συναρτήσεις για εξαγωγή τιμών και ποσοστού
      const extractValue = (session: any, type: 'nonCmj' | 'cmj' | 'depth' | 'broad' | 'triple'): number | null => {
        const d = session?.jump_test_data?.[0];
        if (d) {
          switch (type) {
            case 'nonCmj':
              return typeof d.non_counter_movement_jump === 'number' ? d.non_counter_movement_jump : null;
            case 'cmj':
              return typeof d.counter_movement_jump === 'number' ? d.counter_movement_jump : null;
            case 'depth':
              return typeof d.depth_jump === 'number' ? d.depth_jump : null;
            case 'broad':
              return typeof d.broad_jump === 'number' ? d.broad_jump : null;
            case 'triple': {
              const L = typeof d.triple_jump_left === 'number' ? d.triple_jump_left : 0;
              const R = typeof d.triple_jump_right === 'number' ? d.triple_jump_right : 0;
              return (L || R) ? (L + R) / 2 : null;
            }
          }
        }
        // Fallback από τα notes (π.χ. "47cm" ή Triple: "L: 560cm R: 660cm")
        const notes: string = session?.notes || '';
        if (type === 'triple') {
          const lMatch = notes.match(/L:\s*(\d+(?:\.\d+)?)/i);
          const rMatch = notes.match(/R:\s*(\d+(?:\.\d+)?)/i);
          const L = lMatch ? parseFloat(lMatch[1]) : 0;
          const R = rMatch ? parseFloat(rMatch[1]) : 0;
          return (L || R) ? (L + R) / 2 : null;
        } else {
          const cmMatch = notes.match(/(\d+(?:\.\d+)?)\s*cm/i) || notes.match(/(\d+(?:\.\d+)?)/);
          return cmMatch ? parseFloat(cmMatch[1]) : null;
        }
      };

      const computeChange = (values: number[]): number | null => {
        if (!values || values.length < 2) return null;
        const current = values[0];
        const previous = values[1];
        if (typeof current !== 'number' || typeof previous !== 'number' || previous === 0) return null;
        const change = ((current - previous) / previous) * 100;
        return Number.isFinite(change) ? change : null;
      };

      // Χωρίζω τα sessions ανά τύπο
      const nonCmjSessions = allSessions.filter(s => s.notes?.includes('Non-CMJ Test'));
      const cmjSessions = allSessions.filter(s => s.notes?.includes('CMJ Test'));
      const depthJumpSessions = allSessions.filter(s => s.notes?.includes('Depth Jump Test'));
      const broadJumpSessions = allSessions.filter(s => s.notes?.includes('Broad Jump Test'));
      const tripleJumpSessions = allSessions.filter(s => s.notes?.includes('Triple Jump Test'));

      // Βρίσκω την τελευταία καταγραφή για κάθε τύπο
      const latestNonCmj = nonCmjSessions[0] || null;
      const latestCmj = cmjSessions[0] || null;
      const latestDepthJump = depthJumpSessions[0] || null;
      const latestBroadJump = broadJumpSessions[0] || null;
      const latestTripleJump = tripleJumpSessions[0] || null;

      setLatestSessions({
        nonCmj: latestNonCmj,
        cmj: latestCmj,
        depthJump: latestDepthJump,
        broadJump: latestBroadJump,
        tripleJump: latestTripleJump
      });

      // Υπολογισμός ποσοστών από τις 2 τελευταίες έγκυρες μετρήσεις (data ή notes)
      const nonValues = nonCmjSessions
        .map((s: any) => extractValue(s, 'nonCmj'))
        .filter((v: number | null): v is number => typeof v === 'number');
      const cmjValues = cmjSessions
        .map((s: any) => extractValue(s, 'cmj'))
        .filter((v: number | null): v is number => typeof v === 'number');
      const depthValues = depthJumpSessions
        .map((s: any) => extractValue(s, 'depth'))
        .filter((v: number | null): v is number => typeof v === 'number');
      const broadValues = broadJumpSessions
        .map((s: any) => extractValue(s, 'broad'))
        .filter((v: number | null): v is number => typeof v === 'number');
      const tripleValues = tripleJumpSessions
        .map((s: any) => extractValue(s, 'triple'))
        .filter((v: number | null): v is number => typeof v === 'number');

      const nonCmjChange = computeChange(nonValues);
      const cmjChange = computeChange(cmjValues);
      const depthJumpChange = computeChange(depthValues);
      const broadJumpChange = computeChange(broadValues);
      const tripleJumpChange = computeChange(tripleValues);

      setPercentageChanges({
        nonCmj: nonCmjChange,
        cmj: cmjChange,
        depthJump: depthJumpChange,
        broadJump: broadJumpChange,
        tripleJump: tripleJumpChange
      });
    };

    load();
  }, [userId]);

  if (!latestSessions.nonCmj && !latestSessions.cmj && !latestSessions.depthJump && !latestSessions.broadJump && !latestSessions.tripleJump) return null;

  const jumpCards = [];

  if (latestSessions.nonCmj) {
    jumpCards.push(
      <JumpSessionCard 
        key={latestSessions.nonCmj.id}
        session={latestSessions.nonCmj} 
        percentageChange={percentageChanges.nonCmj} 
      />
    );
  }

  if (latestSessions.cmj) {
    jumpCards.push(
      <JumpSessionCard 
        key={latestSessions.cmj.id}
        session={latestSessions.cmj} 
        percentageChange={percentageChanges.cmj} 
      />
    );
  }

  if (latestSessions.depthJump) {
    jumpCards.push(
      <JumpSessionCard 
        key={latestSessions.depthJump.id}
        session={latestSessions.depthJump} 
        percentageChange={percentageChanges.depthJump} 
      />
    );
  }

  if (latestSessions.broadJump) {
    jumpCards.push(
      <JumpSessionCard 
        key={latestSessions.broadJump.id}
        session={latestSessions.broadJump} 
        percentageChange={percentageChanges.broadJump} 
      />
    );
  }

  if (latestSessions.tripleJump) {
    jumpCards.push(
      <JumpSessionCard 
        key={latestSessions.tripleJump.id}
        session={latestSessions.tripleJump} 
        percentageChange={percentageChanges.tripleJump} 
      />
    );
  }

  return <>{jumpCards}</>;
};