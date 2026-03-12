import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Minimize, Trophy } from 'lucide-react';
import { useRealtimeJudgeScores } from '@/hooks/useRealtimeJudgeScores';

interface VideoOverlayScoresProps {
  matchId: string;
  ringId: string;
  match: {
    athlete1?: { name: string } | null;
    athlete2?: { name: string } | null;
    match_order?: number;
    category?: {
      name?: string;
      gender?: string | null;
      min_age?: number | null;
      max_age?: number | null;
      min_weight?: number | null;
      max_weight?: number | null;
    } | null;
  };
  ringLabel?: string;
}

type RingTimerState = {
  timer_current_round: number | null;
  timer_is_break: boolean | null;
  timer_remaining_seconds: number | null;
  timer_running_since: string | null;
};

const DEFAULT_TIMER_STATE: RingTimerState = {
  timer_current_round: 1,
  timer_is_break: false,
  timer_remaining_seconds: null,
  timer_running_since: null,
};

export const VideoOverlayScores: React.FC<VideoOverlayScoresProps> = ({ matchId, ringId, match, ringLabel }) => {
  const judgeScores = useRealtimeJudgeScores(matchId, { channelPrefix: 'overlay-scores', pollBaseMs: 150, pollMaxMs: 500 });
  const [liveSeconds, setLiveSeconds] = useState<number | null>(null);
  const [timerState, setTimerState] = useState<RingTimerState>(DEFAULT_TIMER_STATE);
  const lastTimerSignatureRef = useRef<string>('');
  const safeRingId = ringId && ringId !== 'undefined' ? ringId : null;

  const applyTimerState = useCallback((next: Partial<RingTimerState> | null | undefined) => {
    if (!next) return;
    const normalized: RingTimerState = {
      timer_current_round: next.timer_current_round ?? 1,
      timer_is_break: next.timer_is_break ?? false,
      timer_remaining_seconds: next.timer_remaining_seconds ?? null,
      timer_running_since: next.timer_running_since ?? null,
    };

    const signature = [
      normalized.timer_current_round,
      normalized.timer_is_break,
      normalized.timer_remaining_seconds,
      normalized.timer_running_since,
    ].join('|');

    if (signature === lastTimerSignatureRef.current) return;
    lastTimerSignatureRef.current = signature;
    setTimerState(normalized);
  }, []);

  // Initial fetch
  const loadTimerState = useCallback(async () => {
    if (!safeRingId) return;
    const { data } = await supabase
      .from('competition_rings')
      .select('timer_current_round, timer_is_break, timer_remaining_seconds, timer_running_since')
      .eq('id', safeRingId)
      .maybeSingle();

    applyTimerState(data as RingTimerState | null);
  }, [safeRingId, applyTimerState]);

  useEffect(() => { loadTimerState(); }, [loadTimerState]);

  // Primary: realtime timer sync
  useEffect(() => {
    if (!safeRingId) return;

    const channel = supabase
      .channel(`overlay-ring-timer-${safeRingId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'competition_rings',
        filter: `id=eq.${safeRingId}`
      }, (payload) => {
        if (payload.eventType === 'DELETE') return;
        applyTimerState(payload.new as RingTimerState);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [safeRingId, applyTimerState]);

  // Fallback: polling in case realtime event is missed
  useEffect(() => {
    if (!safeRingId) return;

    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const { data } = await supabase
        .from('competition_rings')
        .select('timer_current_round, timer_is_break, timer_remaining_seconds, timer_running_since')
        .eq('id', safeRingId)
        .maybeSingle();

      applyTimerState(data as RingTimerState | null);

      if (active) {
        timeoutId = setTimeout(poll, 150);
      }
    };

    timeoutId = setTimeout(poll, 150);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [safeRingId, applyTimerState]);


  // Live countdown timer - synced with ring timer via direct subscription + polling fallback
  useEffect(() => {
    if (!timerState.timer_running_since) {
      setLiveSeconds(timerState.timer_remaining_seconds ?? null);
      return;
    }

    if (timerState.timer_remaining_seconds == null) {
      setLiveSeconds(null);
      return;
    }

    const calcRemaining = () => {
      const elapsed = (Date.now() - new Date(timerState.timer_running_since!).getTime()) / 1000;
      // Use Math.ceil so the overlay never shows a lower second before the ring timer does
      return Math.max(0, Math.ceil((timerState.timer_remaining_seconds ?? 0) - elapsed));
    };

    setLiveSeconds(calcRemaining());
    const interval = setInterval(() => setLiveSeconds(calcRemaining()), 50);
    return () => clearInterval(interval);
  }, [timerState.timer_running_since, timerState.timer_remaining_seconds, timerState.timer_current_round, timerState.timer_is_break]);

  const getMajorityScore = (round: number, athlete: 'a1' | 'a2'): number | null => {
    const roundScores = judgeScores.filter(s => s.round === round);
    if (roundScores.length < 3) return null;
    const scores = roundScores.map(s => athlete === 'a1' ? s.athlete1_score : s.athlete2_score);
    scores.sort((a: number, b: number) => a - b);
    return scores[Math.floor(scores.length / 2)];
  };

  const totalRounds = 3;

  // Determine winner by majority of round wins
  const getWinner = (): 'a1' | 'a2' | null => {
    let a1Wins = 0, a2Wins = 0;
    for (let r = 1; r <= totalRounds; r++) {
      const s1 = getMajorityScore(r, 'a1');
      const s2 = getMajorityScore(r, 'a2');
      if (s1 == null || s2 == null) return null; // not all rounds scored
      if (s1 > s2) a1Wins++;
      else if (s2 > s1) a2Wins++;
    }
    if (a1Wins > a2Wins) return 'a1';
    if (a2Wins > a1Wins) return 'a2';
    return null;
  };

  const winner = getWinner();

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
  const currentRound = timerState.timer_current_round ?? 1;
  const isBreak = timerState.timer_is_break ?? false;

  const buildMatchLabel = () => {
    const parts: string[] = [];
    if (match.match_order) parts.push(`#${match.match_order}`);
    const cat = match.category;
    if (cat) {
      if (cat.gender) {
        parts.push(cat.gender === 'male' ? 'M' : cat.gender === 'female' ? 'F' : cat.gender);
      }
      if (cat.min_age != null || cat.max_age != null) {
        if (cat.min_age != null && cat.max_age != null) parts.push(`${cat.min_age}-${cat.max_age}y`);
        else if (cat.min_age != null) parts.push(`${cat.min_age}+y`);
        else parts.push(`-${cat.max_age}y`);
      }
      if (cat.min_weight != null || cat.max_weight != null) {
        if (cat.min_weight != null && cat.max_weight != null) parts.push(`${cat.max_weight}kg`);
        else if (cat.min_weight != null) parts.push(`+${cat.min_weight}kg`);
        else parts.push(`-${cat.max_weight}kg`);
      }
    }
    return parts.join(' · ');
  };

  const matchLabel = buildMatchLabel();

  return (
    <>
      {/* Exit fullscreen button - only visible in fullscreen */}
      <button
        onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); }}
        className="overlay-exit-fs absolute top-2 right-2 bg-black/60 text-white p-2 rounded-none cursor-pointer hover:bg-black/80 hidden pointer-events-auto z-10"
      >
        <Minimize className="h-4 w-4" />
      </button>

      {/* Ring label - top left */}
      {ringLabel && (
        <div className="overlay-ring-label absolute top-1 left-1 bg-white/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-none pointer-events-none">
          {ringLabel}
        </div>
      )}

      {/* Bottom-right overlay: scores stacked vertically, all touching */}
      <div className="overlay-scores absolute bottom-1 right-1 pointer-events-none">
        <div className="flex flex-col" style={{ gap: 0 }}>
          {/* Top row: Match number (over name) + Timer (over scores) */}
          <div className="flex items-stretch" style={{ gap: '2px' }}>
            {match.match_order ? (
              <div className="overlay-match-number bg-white text-black text-[9px] font-bold px-1.5 py-0.5 w-[120px] text-center leading-none flex items-center justify-center">
                #{match.match_order}
              </div>
            ) : (
              <div className="w-[120px]"></div>
            )}
            {winner ? (
              <div className="overlay-timer bg-yellow-400 text-black text-[9px] font-bold py-0.5 flex items-center justify-center gap-1 leading-none">
                <Trophy className="h-3 w-3" />
              </div>
            ) : (
              <div className="overlay-timer bg-white/90 text-black text-[9px] font-bold py-0.5 flex items-center justify-center gap-1 leading-none">
                <span className="text-[7px] font-medium uppercase">
                  {isBreak ? 'ΔΙΑΛ.' : `R${currentRound}`}
                </span>
                <span className="text-[9px] font-bold">
                  {formatTime(liveSeconds)}
                </span>
              </div>
            )}
          </div>

          {/* Red (athlete1) name + scores row - TOP */}
          <div className="flex items-stretch" style={{ gap: '2px' }}>
            <div className={`score-name text-white text-[9px] font-bold px-1.5 py-0.5 w-[120px] truncate flex items-center gap-0.5 ${winner === 'a1' ? 'bg-red-600 ring-1 ring-yellow-400' : winner === 'a2' ? 'bg-red-600/40' : 'bg-red-600'}`}>
              {winner === 'a1' && <Trophy className="h-2.5 w-2.5 text-yellow-400 flex-shrink-0" />}
              {athlete1Name}
            </div>
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => {
              const score = getMajorityScore(r, 'a1');
              return (
                <div key={r} className={`score-round text-white text-[9px] font-bold w-5 text-center py-0.5 flex items-center justify-center ${winner === 'a2' ? 'bg-red-600/40' : 'bg-red-600/80'}`}>
                  {score ?? '-'}
                </div>
              );
            })}
          </div>

          {/* Blue (athlete2) name + scores row - BOTTOM */}
          <div className="flex items-stretch" style={{ gap: '2px' }}>
            <div className={`score-name text-white text-[9px] font-bold px-1.5 py-0.5 w-[120px] truncate flex items-center gap-0.5 ${winner === 'a2' ? 'bg-blue-600 ring-1 ring-yellow-400' : winner === 'a1' ? 'bg-blue-600/40' : 'bg-blue-600'}`}>
              {winner === 'a2' && <Trophy className="h-2.5 w-2.5 text-yellow-400 flex-shrink-0" />}
              {athlete2Name}
            </div>
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => {
              const score = getMajorityScore(r, 'a2');
              return (
                <div key={r} className={`score-round text-white text-[9px] font-bold w-5 text-center py-0.5 flex items-center justify-center ${winner === 'a1' ? 'bg-blue-600/40' : 'bg-blue-600/80'}`}>
                  {score ?? '-'}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
