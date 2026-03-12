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

  // Always show 3 rounds
  const totalRounds = 3;

  const formatName = (fullName?: string) => {
    if (!fullName) return '—';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    const initial = parts[0].charAt(0) + '.';
    const lastName = parts[parts.length - 1];
    return `${initial} ${lastName}`;
  };

  const athlete1Name = formatName(match.athlete1?.name);
  const athlete2Name = formatName(match.athlete2?.name);

  // TODO: Club abbreviations will be implemented later
  const athlete1Club = '';
  const athlete2Club = '';

  return (
    <div className="absolute bottom-1 right-1 pointer-events-none flex flex-col gap-0.5">
      {/* Red (athlete2) on top */}
      <div className="flex items-center gap-0.5">
        {athlete2Club && (
          <div className="bg-black/70 text-white text-[8px] font-bold px-1 py-0.5">
            {athlete2Club}
          </div>
        )}
        <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 w-[120px] truncate">
          {athlete2Name}
        </div>
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => {
          const score = getMajorityScore(r, 'a2');
          return (
            <div key={r} className="bg-red-600/80 text-white text-[9px] font-bold w-5 text-center py-0.5">
              {score ?? '-'}
            </div>
          );
        })}
      </div>
      {/* Blue (athlete1) on bottom */}
      <div className="flex items-center gap-0.5">
        {athlete1Club && (
          <div className="bg-black/70 text-white text-[8px] font-bold px-1 py-0.5">
            {athlete1Club}
          </div>
        )}
        <div className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 w-[120px] truncate">
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
