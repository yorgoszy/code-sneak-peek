import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealtimeJudgeScore {
  id: string;
  match_id: string;
  judge_number: number;
  round: number;
  athlete1_score: number;
  athlete2_score: number;
  created_at?: string | null;
  updated_at?: string | null;
}

interface UseRealtimeJudgeScoresOptions {
  channelPrefix?: string;
  pollBaseMs?: number;
  pollMaxMs?: number;
}

const sortScores = (scores: RealtimeJudgeScore[]) =>
  [...scores].sort((a, b) => a.round - b.round || a.judge_number - b.judge_number);

const createSignature = (scores: RealtimeJudgeScore[]) =>
  sortScores(scores)
    .map((score) => `${score.id}:${score.round}:${score.judge_number}:${score.athlete1_score}:${score.athlete2_score}`)
    .join('|');

export const useRealtimeJudgeScores = (
  matchId: string | null | undefined,
  options: UseRealtimeJudgeScoresOptions = {}
) => {
  const [judgeScores, setJudgeScores] = useState<RealtimeJudgeScore[]>([]);
  const lastSignatureRef = useRef<string>('');

  const channelPrefix = options.channelPrefix ?? 'judge-scores';
  const pollBaseMs = options.pollBaseMs ?? 1000;
  const pollMaxMs = options.pollMaxMs ?? 8000;

  const applyScores = useCallback((nextScores: RealtimeJudgeScore[]) => {
    const sorted = sortScores(nextScores);
    const nextSignature = createSignature(sorted);
    if (nextSignature === lastSignatureRef.current) return false;

    lastSignatureRef.current = nextSignature;
    setJudgeScores(sorted);
    return true;
  }, []);

  const syncScores = useCallback(async () => {
    if (!matchId) return false;

    const { data, error } = await supabase
      .from('competition_match_judge_scores')
      .select('id, match_id, judge_number, round, athlete1_score, athlete2_score, created_at, updated_at')
      .eq('match_id', matchId);

    if (error) return false;
    return applyScores((data as RealtimeJudgeScore[]) || []);
  }, [matchId, applyScores]);

  const applyRealtimePayload = useCallback((payload: any) => {
    setJudgeScores((current) => {
      let next = [...current];

      if (payload.eventType === 'DELETE') {
        const deletedId = payload.old?.id;
        next = deletedId ? next.filter((score) => score.id !== deletedId) : [];
      } else {
        const incoming = payload.new as RealtimeJudgeScore | undefined;
        if (!incoming?.id) return current;

        const existingIndex = next.findIndex((score) => score.id === incoming.id);
        if (existingIndex >= 0) {
          next[existingIndex] = incoming;
        } else {
          next.push(incoming);
        }
      }

      const sorted = sortScores(next);
      const nextSignature = createSignature(sorted);
      if (nextSignature === lastSignatureRef.current) return current;

      lastSignatureRef.current = nextSignature;
      return sorted;
    });
  }, []);

  useEffect(() => {
    if (!matchId) {
      lastSignatureRef.current = '';
      setJudgeScores([]);
      return;
    }

    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    let currentPollInterval = pollBaseMs;

    const poll = async () => {
      const changed = await syncScores();
      currentPollInterval = changed
        ? pollBaseMs
        : Math.min(Math.round(currentPollInterval * 1.5), pollMaxMs);

      if (isActive) {
        timeoutId = setTimeout(poll, currentPollInterval);
      }
    };

    void syncScores();

    const channel = supabase
      .channel(`${channelPrefix}-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'competition_match_judge_scores',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          applyRealtimePayload(payload);
          currentPollInterval = pollBaseMs;
          void syncScores();
        }
      )
      .subscribe();

    timeoutId = setTimeout(poll, pollBaseMs);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [matchId, channelPrefix, pollBaseMs, pollMaxMs, syncScores, applyRealtimePayload]);

  return judgeScores;
};
