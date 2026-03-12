import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoOverlayScoresProps {
  matchId: string;
  match: {
    athlete1?: { name: string } | null;
    athlete2?: { name: string } | null;
  };
}

export const VideoOverlayScores: React.FC<VideoOverlayScoresProps> = ({ matchId, match }) => {
  const [judgeScores, setJudgeScores] = useState<any[]>([]);

  const loadScores = useCallback(async () => {
    const { data } = await supabase
      .from('competition_match_judge_scores')
      .select('*')
      .eq('match_id', matchId);
    setJudgeScores(data || []);
  }, [matchId]);

  useEffect(() => { loadScores(); }, [loadScores]);

  useEffect(() => {
    const channel = supabase
      .channel(`overlay-scores-${matchId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'competition_match_judge_scores',
        filter: `match_id=eq.${matchId}`
      }, () => loadScores())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId, loadScores]);

  // Calculate majority score per round for each athlete
  const getMajorityScore = (round: number, athlete: 'a1' | 'a2'): number | null => {
    const roundScores = judgeScores.filter(s => s.round === round);
    if (roundScores.length === 0) return null;
    const scores = roundScores.map(s => athlete === 'a1' ? s.athlete1_score : s.athlete2_score);
    scores.sort((a: number, b: number) => a - b);
    return scores[Math.floor(scores.length / 2)];
  };

  // Find max round that has scores
  const maxRound = judgeScores.length > 0 ? Math.max(...judgeScores.map(s => s.round)) : 0;
  const rounds = Array.from({ length: Math.max(maxRound, 1) }, (_, i) => i + 1);

  const athlete1Name = match.athlete1?.name?.split(' ').pop() || '—';
  const athlete2Name = match.athlete2?.name?.split(' ').pop() || '—';

  return (
    <div className="absolute bottom-1 right-1 pointer-events-none flex flex-col gap-0.5">
      {/* Red (athlete2) on top */}
      <div className="flex items-center gap-0.5">
        <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 truncate max-w-[100px]">
          {athlete2Name}
        </div>
        {rounds.map(r => {
          const score = getMajorityScore(r, 'a2');
          return score !== null ? (
            <div key={r} className="bg-red-600/80 text-white text-[9px] font-bold w-5 text-center py-0.5">
              {score}
            </div>
          ) : null;
        })}
      </div>
      {/* Blue (athlete1) on bottom */}
      <div className="flex items-center gap-0.5">
        <div className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 truncate max-w-[100px]">
          {athlete1Name}
        </div>
        {rounds.map(r => {
          const score = getMajorityScore(r, 'a1');
          return score !== null ? (
            <div key={r} className="bg-blue-600/80 text-white text-[9px] font-bold w-5 text-center py-0.5">
              {score}
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
};
