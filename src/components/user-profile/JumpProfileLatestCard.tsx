import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JumpSessionCard, JumpSessionCardSession } from "@/components/progress/JumpSessionCard";
import { format } from "date-fns";

interface JumpProfileLatestCardProps {
  userId: string;
  useCoachTables?: boolean;
  coachId?: string;
}

// Extract a numeric metric from a jump session for a specific type
const extractMetric = (
  session: any,
  type: 'nonCmj' | 'cmj' | 'depth' | 'broad' | 'triple',
  useCoachTables: boolean = false
): number | null => {
  // Get data based on table type
  const d = useCoachTables 
    ? session?.coach_jump_test_data?.[0] 
    : session?.jump_test_data?.[0];
  
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
  // Fallback from notes (e.g., "47cm" or Triple: "L: 560cm R: 660cm")
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

export const JumpProfileLatestCard: React.FC<JumpProfileLatestCardProps> = ({ 
  userId,
  useCoachTables = false,
  coachId 
}) => {
  const [latestSessions, setLatestSessions] = useState<{
    nonCmj: JumpSessionCardSession | null;
    cmj: JumpSessionCardSession | null;
    depthJump: JumpSessionCardSession | null;
    broadJump: JumpSessionCardSession | null;
    tripleJump: JumpSessionCardSession | null;
  }>({ nonCmj: null, cmj: null, depthJump: null, broadJump: null, tripleJump: null });
  
  const [previousSessions, setPreviousSessions] = useState<{
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
      
      let allSessions: any[] = [];

      if (useCoachTables && coachId) {
        // Fetch from coach tables
        const { data, error } = await supabase
          .from('coach_jump_test_sessions')
          .select(`
            id,
            coach_user_id,
            test_date,
            notes,
            created_at,
            coach_jump_test_data (
              id,
              non_counter_movement_jump,
              counter_movement_jump,
              depth_jump,
              broad_jump,
              triple_jump_left,
              triple_jump_right
            )
          `)
          .eq('coach_id', coachId)
          .eq('user_id', userId)
          .order('test_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading coach jump sessions:', error);
          return;
        }
        allSessions = data || [];
      } else {
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
        allSessions = data || [];
      }

      
      
      // Υπολογισμός ποσοστού αλλαγής (χρησιμοποιούμε extractMetric για τις τιμές)
      const computeChange = (values: number[]): number | null => {
        if (!values || values.length < 2) return null;
        const current = values[0];
        const previous = values[1];
        if (typeof current !== 'number' || typeof previous !== 'number' || previous === 0) return null;
        const change = ((current - previous) / previous) * 100;
        return Number.isFinite(change) ? change : null;
      };


      // Χωρίζω τα sessions ανά τύπο (ίδια λογική με το JumpHistoryTab)
      const nonCmjSessions = allSessions.filter(s => s.notes?.startsWith('Non-CMJ Test'));
      const cmjSessions = allSessions.filter(s => s.notes?.startsWith('CMJ Test') && !s.notes?.startsWith('Non-CMJ'));
      const depthJumpSessions = allSessions.filter(s => s.notes?.startsWith('Depth Jump Test'));
      const broadJumpSessions = allSessions.filter(s => s.notes?.startsWith('Broad Jump Test'));
      const tripleJumpSessions = allSessions.filter(s => s.notes?.startsWith('Triple Jump Test'));

      // Βρίσκω την τελευταία και προηγούμενη καταγραφή για κάθε τύπο
      const latestNonCmj = nonCmjSessions[0] || null;
      const latestCmj = cmjSessions[0] || null;
      const latestDepthJump = depthJumpSessions[0] || null;
      const latestBroadJump = broadJumpSessions[0] || null;
      const latestTripleJump = tripleJumpSessions[0] || null;

      const prevNonCmj = nonCmjSessions[1] || null;
      const prevCmj = cmjSessions[1] || null;
      const prevDepthJump = depthJumpSessions[1] || null;
      const prevBroadJump = broadJumpSessions[1] || null;
      const prevTripleJump = tripleJumpSessions[1] || null;

      setLatestSessions({
        nonCmj: latestNonCmj,
        cmj: latestCmj,
        depthJump: latestDepthJump,
        broadJump: latestBroadJump,
        tripleJump: latestTripleJump
      });

      setPreviousSessions({
        nonCmj: prevNonCmj,
        cmj: prevCmj,
        depthJump: prevDepthJump,
        broadJump: prevBroadJump,
        tripleJump: prevTripleJump
      });

      // Υπολογισμός ποσοστών από τις 2 τελευταίες έγκυρες μετρήσεις (data ή notes)
      const nonValues = nonCmjSessions
        .map((s: any) => extractMetric(s, 'nonCmj', useCoachTables))
        .filter((v: number | null): v is number => typeof v === 'number');
      const cmjValues = cmjSessions
        .map((s: any) => extractMetric(s, 'cmj', useCoachTables))
        .filter((v: number | null): v is number => typeof v === 'number');
      const depthValues = depthJumpSessions
        .map((s: any) => extractMetric(s, 'depth', useCoachTables))
        .filter((v: number | null): v is number => typeof v === 'number');
      const broadValues = broadJumpSessions
        .map((s: any) => extractMetric(s, 'broad', useCoachTables))
        .filter((v: number | null): v is number => typeof v === 'number');
      const tripleValues = tripleJumpSessions
        .map((s: any) => extractMetric(s, 'triple', useCoachTables))
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
  }, [userId, useCoachTables, coachId]);

  if (!latestSessions.nonCmj && !latestSessions.cmj && !latestSessions.depthJump && !latestSessions.broadJump && !latestSessions.tripleJump) return null;

  const jumpCards = [];

  if (latestSessions.nonCmj) {
    const history = previousSessions.nonCmj && extractMetric(previousSessions.nonCmj, 'nonCmj', useCoachTables) !== null 
      ? [previousSessions.nonCmj] as JumpSessionCardSession[] 
      : [];
    jumpCards.push(
      <JumpSessionCard 
        key={latestSessions.nonCmj.id}
        session={latestSessions.nonCmj} 
        percentageChange={percentageChanges.nonCmj}
        historySessions={history}
        useCoachTables={useCoachTables}
      />
    );
  }

  if (latestSessions.cmj) {
    const history = previousSessions.cmj && extractMetric(previousSessions.cmj, 'cmj', useCoachTables) !== null 
      ? [previousSessions.cmj] as JumpSessionCardSession[] 
      : [];
    jumpCards.push(
      <JumpSessionCard 
        key={latestSessions.cmj.id}
        session={latestSessions.cmj} 
        percentageChange={percentageChanges.cmj}
        historySessions={history}
        useCoachTables={useCoachTables}
      />
    );
  }

  if (latestSessions.depthJump) {
    const history = previousSessions.depthJump && extractMetric(previousSessions.depthJump, 'depth', useCoachTables) !== null 
      ? [previousSessions.depthJump] as JumpSessionCardSession[] 
      : [];
    jumpCards.push(
      <JumpSessionCard 
        key={latestSessions.depthJump.id}
        session={latestSessions.depthJump} 
        percentageChange={percentageChanges.depthJump}
        historySessions={history}
        useCoachTables={useCoachTables}
      />
    );
  }

  if (latestSessions.broadJump) {
    const history = previousSessions.broadJump && extractMetric(previousSessions.broadJump, 'broad', useCoachTables) !== null 
      ? [previousSessions.broadJump] as JumpSessionCardSession[] 
      : [];
    jumpCards.push(
      <JumpSessionCard 
        key={latestSessions.broadJump.id}
        session={latestSessions.broadJump} 
        percentageChange={percentageChanges.broadJump}
        historySessions={history}
        useCoachTables={useCoachTables}
      />
    );
  }

  if (latestSessions.tripleJump) {
    const history = previousSessions.tripleJump && extractMetric(previousSessions.tripleJump, 'triple', useCoachTables) !== null 
      ? [previousSessions.tripleJump] as JumpSessionCardSession[] 
      : [];
    jumpCards.push(
      <JumpSessionCard 
        key={latestSessions.tripleJump.id}
        session={latestSessions.tripleJump} 
        percentageChange={percentageChanges.tripleJump}
        historySessions={history}
        useCoachTables={useCoachTables}
      />
    );
  }

  return <>{jumpCards}</>;
};