import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JumpSessionCard, JumpSessionCardSession } from "@/components/progress/JumpSessionCard";
import { format } from "date-fns";

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
      <div key={latestSessions.nonCmj.id} className="space-y-0">
        <JumpSessionCard 
          session={latestSessions.nonCmj} 
          percentageChange={percentageChanges.nonCmj} 
        />
        {previousSessions.nonCmj && (
          <div className="space-y-1 pt-1 px-1.5 pb-1.5">
            <div className="text-[10px] text-gray-500 font-medium">Ιστορικό (1 προηγούμενες)</div>
            <div className="flex flex-col gap-0.5 text-[10px] text-gray-400">
              <div className="flex items-center justify-between">
                <span>{format(new Date(previousSessions.nonCmj.test_date), 'dd/MM/yy')}</span>
              </div>
              <span className="text-right">{previousSessions.nonCmj.notes?.split(' - ')[1] || ''}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (latestSessions.cmj) {
    jumpCards.push(
      <div key={latestSessions.cmj.id} className="space-y-0">
        <JumpSessionCard 
          session={latestSessions.cmj} 
          percentageChange={percentageChanges.cmj} 
        />
        {previousSessions.cmj && (
          <div className="space-y-1 pt-1 px-1.5 pb-1.5">
            <div className="text-[10px] text-gray-500 font-medium">Ιστορικό (1 προηγούμενες)</div>
            <div className="flex flex-col gap-0.5 text-[10px] text-gray-400">
              <div className="flex items-center justify-between">
                <span>{format(new Date(previousSessions.cmj.test_date), 'dd/MM/yy')}</span>
              </div>
              <span className="text-right">{previousSessions.cmj.notes?.split(' - ')[1] || ''}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (latestSessions.depthJump) {
    jumpCards.push(
      <div key={latestSessions.depthJump.id} className="space-y-0">
        <JumpSessionCard 
          session={latestSessions.depthJump} 
          percentageChange={percentageChanges.depthJump} 
        />
        {previousSessions.depthJump && (
          <div className="space-y-1 pt-1 px-1.5 pb-1.5">
            <div className="text-[10px] text-gray-500 font-medium">Ιστορικό (1 προηγούμενες)</div>
            <div className="flex flex-col gap-0.5 text-[10px] text-gray-400">
              <div className="flex items-center justify-between">
                <span>{format(new Date(previousSessions.depthJump.test_date), 'dd/MM/yy')}</span>
              </div>
              <span className="text-right">{previousSessions.depthJump.notes?.split(' - ')[1] || ''}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (latestSessions.broadJump) {
    jumpCards.push(
      <div key={latestSessions.broadJump.id} className="space-y-0">
        <JumpSessionCard 
          session={latestSessions.broadJump} 
          percentageChange={percentageChanges.broadJump} 
        />
        {previousSessions.broadJump && (
          <div className="space-y-1 pt-1 px-1.5 pb-1.5">
            <div className="text-[10px] text-gray-500 font-medium">Ιστορικό (1 προηγούμενες)</div>
            <div className="flex flex-col gap-0.5 text-[10px] text-gray-400">
              <div className="flex items-center justify-between">
                <span>{format(new Date(previousSessions.broadJump.test_date), 'dd/MM/yy')}</span>
              </div>
              <span className="text-right">{previousSessions.broadJump.notes?.split(' - ')[1] || ''}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (latestSessions.tripleJump) {
    jumpCards.push(
      <div key={latestSessions.tripleJump.id} className="space-y-0">
        <JumpSessionCard 
          session={latestSessions.tripleJump} 
          percentageChange={percentageChanges.tripleJump} 
        />
        {previousSessions.tripleJump && (
          <div className="space-y-1 pt-1 px-1.5 pb-1.5">
            <div className="text-[10px] text-gray-500 font-medium">Ιστορικό (1 προηγούμενες)</div>
            <div className="flex flex-col gap-0.5 text-[10px] text-gray-400">
              <div className="flex items-center justify-between">
                <span>{format(new Date(previousSessions.tripleJump.test_date), 'dd/MM/yy')}</span>
              </div>
              <span className="text-right">{previousSessions.tripleJump.notes?.split(' - ')[1] || ''}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <>{jumpCards}</>;
};