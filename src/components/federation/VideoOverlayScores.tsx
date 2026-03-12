import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Minimize } from 'lucide-react';

interface VideoOverlayScoresProps {
  matchId: string;
  match: {
    athlete1?: { name: string } | null;
    athlete2?: { name: string } | null;
  };
  ringTimer?: {
    timer_current_round: number | null;
    timer_is_break: boolean | null;
    timer_remaining_seconds: number | null;
    timer_running_since: string | null;
  };
}

export const VideoOverlayScores: React.FC<VideoOverlayScoresProps> = ({ matchId, match, ringTimer }) => {
  const [judgeScores, setJudgeScores] = useState<any[]>([]);
  const [liveSeconds, setLiveSeconds] = useState<number | null>(null);

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

  // Live countdown timer
  useEffect(() => {
    if (!ringTimer?.timer_running_since || ringTimer.timer_remaining_seconds == null) {
      setLiveSeconds(ringTimer?.timer_remaining_seconds ?? null);
      return;
    }
    const calcRemaining = () => {
      const elapsed = (Date.now() - new Date(ringTimer.timer_running_since!).getTime()) / 1000;
      return Math.max(0, Math.round((ringTimer.timer_remaining_seconds ?? 0) - elapsed));
    };
    setLiveSeconds(calcRemaining());
    const interval = setInterval(() => setLiveSeconds(calcRemaining()), 1000);
    return () => clearInterval(interval);
  }, [ringTimer?.timer_running_since, ringTimer?.timer_remaining_seconds]);

  const getMajorityScore = (round: number, athlete: 'a1' | 'a2'): number | null => {
    const roundScores = judgeScores.filter(s => s.round === round);
    if (roundScores.length === 0) return null;
    const scores = roundScores.map(s => athlete === 'a1' ? s.athlete1_score : s.athlete2_score);
    scores.sort((a: number, b: number) => a - b);
    return scores[Math.floor(scores.length / 2)];
  };

  const totalRounds = 3;

  const formatName = (fullName?: string) => {
    if (!fullName) return '—';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    const initial = parts[0].charAt(0) + '.';
    const lastName = parts[parts.length - 1];
    return `${initial} ${lastName}`;
  };

  const formatTime = (seconds: number | null) => {
    if (seconds == null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const athlete1Name = formatName(match.athlete1?.name);
  const athlete2Name = formatName(match.athlete2?.name);
  const currentRound = ringTimer?.timer_current_round ?? 1;
  const isBreak = ringTimer?.timer_is_break ?? false;

  return (
    <>
      {/* Exit fullscreen button - only visible in fullscreen */}
      <button
        onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); }}
        className="overlay-exit-fs absolute top-2 right-2 bg-black/60 text-white p-2 rounded-none cursor-pointer hover:bg-black/80 hidden pointer-events-auto"
      >
        <Minimize className="h-4 w-4" />
      </button>

      <div className="overlay-scores absolute bottom-1 right-1 pointer-events-none flex items-end gap-1">
        {/* Names + scores */}
        <div className="flex flex-col gap-0.5">
          {/* Red (athlete2) on top */}
          <div className="flex items-center gap-0.5">
            <div className="score-name bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 w-[120px] truncate">
              {athlete2Name}
            </div>
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => {
              const score = getMajorityScore(r, 'a2');
              return (
                <div key={r} className="score-round bg-red-600/80 text-white text-[9px] font-bold w-5 text-center py-0.5">
                  {score ?? '-'}
                </div>
              );
            })}
          </div>
          {/* Blue (athlete1) on bottom */}
          <div className="flex items-center gap-0.5">
            <div className="score-name bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 w-[120px] truncate">
              {athlete1Name}
            </div>
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => {
              const score = getMajorityScore(r, 'a1');
              return (
                <div key={r} className="score-round bg-blue-600/80 text-white text-[9px] font-bold w-5 text-center py-0.5">
                  {score ?? '-'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Round & Timer */}
        <div className="overlay-timer flex flex-col items-center bg-black/70 text-white px-1.5 py-0.5">
          <span className="text-[7px] font-medium uppercase leading-tight">
            {isBreak ? 'ΔΙΑΛ.' : `R${currentRound}`}
          </span>
          <span className="text-[10px] font-bold leading-tight">
            {formatTime(liveSeconds)}
          </span>
        </div>
      </div>
    </>
  );
};
