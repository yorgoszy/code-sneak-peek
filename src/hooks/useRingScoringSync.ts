/**
 * useRingScoringSync
 * Subscribes to competition_rings timer state and auto-syncs
 * round start/stop with the scoring engine. Also reads match fighter names.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RingTimerState {
  timer_current_round: number;
  timer_is_break: boolean;
  timer_remaining_seconds: number | null;
  timer_running_since: string | null;
}

export interface RingSyncState {
  ringId: string | null;
  currentRound: number;
  isBreak: boolean;
  isTimerRunning: boolean;
  remainingSeconds: number | null;
  liveRemainingSeconds: number | null;
  matchId: string | null;
  redName: string;
  blueName: string;
  redPhotoUrl: string | null;
  bluePhotoUrl: string | null;
  connected: boolean;
}

const DEFAULT_STATE: RingSyncState = {
  ringId: null,
  currentRound: 1,
  isBreak: false,
  isTimerRunning: false,
  remainingSeconds: null,
  liveRemainingSeconds: null,
  matchId: null,
  redName: 'Red Corner',
  blueName: 'Blue Corner',
  redPhotoUrl: null,
  bluePhotoUrl: null,
  connected: false,
};

export function useRingScoringSync(ringId: string | null) {
  const [state, setState] = useState<RingSyncState>(DEFAULT_STATE);
  const prevRoundRef = useRef<number>(1);
  const prevBreakRef = useRef<boolean>(false);
  const prevRunningRef = useRef<boolean>(false);
  const runningSinceRef = useRef<string | null>(null);
  const baseRemainingRef = useRef<number | null>(null);

  // Callbacks that consumers can register
  const onRoundStartRef = useRef<((round: number) => void) | null>(null);
  const onRoundEndRef = useRef<((round: number) => void) | null>(null);

  const setOnRoundStart = useCallback((cb: (round: number) => void) => {
    onRoundStartRef.current = cb;
  }, []);

  const setOnRoundEnd = useCallback((cb: (round: number) => void) => {
    onRoundEndRef.current = cb;
  }, []);

  // Apply ring data
  const applyRingData = useCallback((data: any) => {
    if (!data) return;

    const round = data.timer_current_round ?? 1;
    const isBreak = data.timer_is_break ?? false;
    const runningSince = data.timer_running_since ?? null;
    const remaining = data.timer_remaining_seconds ?? null;
    const isRunning = !!runningSince;

    // Detect round transitions
    const wasRunning = prevRunningRef.current;
    const prevRound = prevRoundRef.current;
    const wasBreak = prevBreakRef.current;

    // Round started: timer starts running and not on break
    if (isRunning && !isBreak && (!wasRunning || wasBreak)) {
      onRoundStartRef.current?.(round);
    }

    // Round ended: was running during a round, now either stopped or went to break
    if (wasRunning && !wasBreak && (isBreak || !isRunning)) {
      onRoundEndRef.current?.(prevRound);
    }

    prevRoundRef.current = round;
    prevBreakRef.current = isBreak;
    prevRunningRef.current = isRunning;

    setState(prev => ({
      ...prev,
      currentRound: round,
      isBreak,
      isTimerRunning: isRunning,
      remainingSeconds: remaining,
      connected: true,
    }));
  }, []);

  // Load match info
  const loadMatchInfo = useCallback(async (matchId: string | null) => {
    if (!matchId) {
      setState(prev => ({
        ...prev,
        matchId: null,
        redName: 'Red Corner',
        blueName: 'Blue Corner',
        redPhotoUrl: null,
        bluePhotoUrl: null,
      }));
      return;
    }

    const { data } = await supabase
      .from('competition_matches')
      .select(`
        id,
        athlete1:app_users!competition_matches_athlete1_id_fkey(name, photo_url, avatar_url),
        athlete2:app_users!competition_matches_athlete2_id_fkey(name, photo_url, avatar_url)
      `)
      .eq('id', matchId)
      .maybeSingle();

    if (data) {
      const a1 = data.athlete1 as any;
      const a2 = data.athlete2 as any;
      setState(prev => ({
        ...prev,
        matchId,
        redName: a1?.name || 'Red Corner',
        blueName: a2?.name || 'Blue Corner',
        redPhotoUrl: a1?.photo_url || a1?.avatar_url || null,
        bluePhotoUrl: a2?.photo_url || a2?.avatar_url || null,
      }));
    }
  }, []);

  // Initial load + realtime subscription
  useEffect(() => {
    if (!ringId) {
      setState(DEFAULT_STATE);
      return;
    }

    setState(prev => ({ ...prev, ringId }));

    // Initial fetch
    const fetchRing = async () => {
      const { data } = await supabase
        .from('competition_rings')
        .select('timer_current_round, timer_is_break, timer_remaining_seconds, timer_running_since, current_match_id')
        .eq('id', ringId)
        .maybeSingle();

      if (data) {
        applyRingData(data);
        loadMatchInfo(data.current_match_id);
      }
    };

    fetchRing();

    // Realtime subscription
    const channel = supabase
      .channel(`scoring-ring-sync-${ringId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'competition_rings',
          filter: `id=eq.${ringId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          applyRingData(newData);

          // If match changed, reload match info
          if (newData.current_match_id !== state.matchId) {
            loadMatchInfo(newData.current_match_id);
          }
        }
      )
      .subscribe();

    // Polling fallback every 3s
    const interval = setInterval(fetchRing, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [ringId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    setOnRoundStart,
    setOnRoundEnd,
  };
}
