import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Pause, RotateCcw, Trophy, Clock, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MatchData {
  id: string;
  match_order: number;
  status: string;
  athlete1_score: string | null;
  athlete2_score: string | null;
  winner_id: string | null;
  athlete1_id: string | null;
  athlete2_id: string | null;
  athlete1?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  athlete2?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  athlete1_club?: { name: string } | null;
  athlete2_club?: { name: string } | null;
  category?: { name: string; min_age: number | null; max_age: number | null } | null;
}

interface JudgeScore {
  judge_number: number;
  round: number;
  athlete1_score: number;
  athlete2_score: number;
}

interface AvailableMatch {
  id: string;
  match_order: number | null;
  status: string;
  athlete1?: { name: string } | null;
  athlete2?: { name: string } | null;
}

interface RingScoreboardProps {
  ringId: string;
  currentMatchId: string | null;
  matches: AvailableMatch[];
  onMatchChange: (matchId: string) => void;
}

function getRoundConfig(minAge: number | null, maxAge: number | null) {
  if (!minAge && !maxAge) return { rounds: 3, roundDurationSec: 180, breakDurationSec: 60 };
  const age = maxAge || minAge || 18;
  if (age <= 9) return { rounds: 3, roundDurationSec: 60, breakDurationSec: 30 };
  if (age <= 11) return { rounds: 3, roundDurationSec: 60, breakDurationSec: 60 };
  if (age <= 13) return { rounds: 3, roundDurationSec: 90, breakDurationSec: 60 };
  if (age <= 17) return { rounds: 3, roundDurationSec: 120, breakDurationSec: 60 };
  return { rounds: 3, roundDurationSec: 180, breakDurationSec: 60 };
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const RingScoreboard: React.FC<RingScoreboardProps> = ({
  ringId,
  currentMatchId,
  matches,
  onMatchChange,
}) => {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [judgeScores, setJudgeScores] = useState<JudgeScore[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [roundConfig, setRoundConfig] = useState({ rounds: 3, roundDurationSec: 180, breakDurationSec: 60 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipPersistRef = useRef(false);

  // Persist timer state to DB
  const persistTimerState = useCallback(async (running: boolean, remaining: number, round: number, onBreak: boolean) => {
    if (!ringId) return;
    const updateData: any = {
      timer_current_round: round,
      timer_is_break: onBreak,
    };
    if (running) {
      // Save the moment timer started and how many seconds were left at that moment
      updateData.timer_running_since = new Date().toISOString();
      updateData.timer_remaining_seconds = remaining;
    } else {
      updateData.timer_running_since = null;
      updateData.timer_remaining_seconds = remaining;
    }
    await supabase.from('competition_rings').update(updateData).eq('id', ringId);
  }, [ringId]);

  // Restore timer state from DB
  const restoreTimerState = useCallback(async (config: { rounds: number; roundDurationSec: number; breakDurationSec: number }) => {
    if (!ringId) return;
    const { data: ring } = await supabase
      .from('competition_rings')
      .select('timer_running_since, timer_remaining_seconds, timer_current_round, timer_is_break')
      .eq('id', ringId)
      .single();

    if (!ring) return;

    const round = ring.timer_current_round || 1;
    const onBreak = ring.timer_is_break || false;
    setCurrentRound(round);
    setIsBreak(onBreak);

    if (ring.timer_running_since) {
      // Timer was running - calculate elapsed time
      const startedAt = new Date(ring.timer_running_since).getTime();
      const now = Date.now();
      const elapsedSec = Math.floor((now - startedAt) / 1000);
      const savedRemaining = ring.timer_remaining_seconds ?? (onBreak ? config.breakDurationSec : config.roundDurationSec);
      const remaining = Math.max(0, savedRemaining - elapsedSec);
      
      setTimeLeft(remaining);
      if (remaining > 0) {
        skipPersistRef.current = true;
        setIsRunning(true);
      } else {
        // Timer expired while away - handle round transition
        setIsRunning(false);
        if (onBreak) {
          const nextRound = round + 1;
          setIsBreak(false);
          setCurrentRound(nextRound);
          setTimeLeft(config.roundDurationSec);
          persistTimerState(false, config.roundDurationSec, nextRound, false);
        } else if (round < config.rounds) {
          setIsBreak(true);
          setTimeLeft(config.breakDurationSec);
          persistTimerState(false, config.breakDurationSec, round, true);
        } else {
          setTimeLeft(0);
          persistTimerState(false, 0, round, false);
        }
      }
    } else {
      // Timer was paused
      const remaining = ring.timer_remaining_seconds ?? (onBreak ? config.breakDurationSec : config.roundDurationSec);
      setTimeLeft(remaining);
      setIsRunning(false);
    }
  }, [ringId, persistTimerState]);

  // Load match data
  useEffect(() => {
    if (!currentMatchId) { setMatch(null); setJudgeScores([]); return; }
    const loadMatch = async () => {
      const { data } = await supabase
        .from('competition_matches')
        .select(`
          id, match_order, status, athlete1_score, athlete2_score, winner_id, athlete1_id, athlete2_id,
          athlete1:app_users!competition_matches_athlete1_id_fkey(name, photo_url, avatar_url),
          athlete2:app_users!competition_matches_athlete2_id_fkey(name, photo_url, avatar_url),
          athlete1_club:app_users!competition_matches_athlete1_club_id_fkey(name),
          athlete2_club:app_users!competition_matches_athlete2_club_id_fkey(name),
          category:federation_competition_categories!competition_matches_category_id_fkey(name, min_age, max_age)
        `)
        .eq('id', currentMatchId)
        .single();

      if (data) {
        setMatch(data as any);
        const cat = (data as any).category;
        const config = getRoundConfig(cat?.min_age, cat?.max_age);
        setRoundConfig(config);
        // Restore persisted timer state instead of resetting
        await restoreTimerState(config);
      }
    };
    loadMatch();
  }, [currentMatchId, restoreTimerState]);

  // Load judge scores
  const loadJudgeScores = useCallback(async () => {
    if (!currentMatchId) return;
    const { data } = await supabase
      .from('competition_match_judge_scores')
      .select('*')
      .eq('match_id', currentMatchId);
    setJudgeScores(data || []);
  }, [currentMatchId]);

  useEffect(() => { loadJudgeScores(); }, [loadJudgeScores]);

  // Real-time judge scores
  useEffect(() => {
    if (!currentMatchId) return;
    const channel = supabase
      .channel(`judge-scores-${currentMatchId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'competition_match_judge_scores',
        filter: `match_id=eq.${currentMatchId}`
      }, () => loadJudgeScores())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentMatchId, loadJudgeScores]);

  // Timer logic
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          if (isBreak) {
            const nextRound = currentRound + 1;
            setIsBreak(false);
            setCurrentRound(nextRound);
            persistTimerState(false, roundConfig.roundDurationSec, nextRound, false);
            return roundConfig.roundDurationSec;
          } else {
            if (currentRound < roundConfig.rounds) {
              setIsBreak(true);
              persistTimerState(false, roundConfig.breakDurationSec, currentRound, true);
              return roundConfig.breakDurationSec;
            }
            persistTimerState(false, 0, currentRound, false);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isBreak, currentRound, roundConfig, persistTimerState]);

  const handleStartPause = () => {
    if (timeLeft === 0 && currentRound >= roundConfig.rounds && !isBreak) return;
    const newRunning = !isRunning;
    setIsRunning(newRunning);
    persistTimerState(newRunning, timeLeft, currentRound, isBreak);
  };

  const handleResetRound = () => {
    setIsRunning(false);
    const newTime = isBreak ? roundConfig.breakDurationSec : roundConfig.roundDurationSec;
    setTimeLeft(newTime);
    persistTimerState(false, newTime, currentRound, isBreak);
  };

  const handleDeclareWinner = async (winnerId: string) => {
    if (!match) return;
    const { error } = await supabase
      .from('competition_matches')
      .update({
        winner_id: winnerId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        result_type: 'points',
      })
      .eq('id', match.id);
    if (error) toast.error('Σφάλμα ορισμού νικητή');
    else toast.success('Ο νικητής καταχωρήθηκε');
  };

  const copyJudgeLink = (judgeNum: number) => {
    const url = `${window.location.origin}/judge?ring=${ringId}&judge=${judgeNum}`;
    navigator.clipboard.writeText(url);
    toast.success(`Link Κριτή ${judgeNum} αντιγράφηκε`);
  };

  // Calculate aggregated scores from judges
  const getJudgeScoreForRound = (judgeNum: number, round: number) => {
    return judgeScores.find(s => s.judge_number === judgeNum && s.round === round);
  };

  const getRoundTotals = (round: number) => {
    let a1 = 0, a2 = 0, count = 0;
    for (let j = 1; j <= 3; j++) {
      const s = getJudgeScoreForRound(j, round);
      if (s) { a1 += s.athlete1_score; a2 += s.athlete2_score; count++; }
    }
    return { a1, a2, count };
  };

  const totalA1 = [1, 2, 3].reduce((sum, r) => sum + getRoundTotals(r).a1, 0);
  const totalA2 = [1, 2, 3].reduce((sum, r) => sum + getRoundTotals(r).a2, 0);

  const avatar = (a: any) => a?.photo_url || a?.avatar_url || undefined;
  const matchFinished = match?.status === 'completed' || (currentRound >= roundConfig.rounds && timeLeft === 0 && !isBreak && !isRunning);

  if (!currentMatchId) {
    return (
      <div className="px-2 py-2 border-t border-border">
        <Select value="" onValueChange={onMatchChange}>
          <SelectTrigger className="rounded-none h-7 text-xs">
            <SelectValue placeholder="Επιλογή αγώνα..." />
          </SelectTrigger>
          <SelectContent>
            {matches.filter(m => m.status !== 'completed').map(m => (
              <SelectItem key={m.id} value={m.id}>
                #{m.match_order} {m.athlete1?.name || '—'} vs {m.athlete2?.name || '—'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (!match) {
    return <div className="px-2 py-1 border-t border-border text-center text-[10px] text-muted-foreground">Φόρτωση...</div>;
  }

  return (
    <div className="border-t border-border">
      {/* Match selector + Judge links */}
      <div className="px-2 py-1 border-b border-border bg-muted/30 flex items-center gap-1">
        <Select value={currentMatchId} onValueChange={onMatchChange}>
          <SelectTrigger className="rounded-none h-6 text-[10px] flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {matches.filter(m => m.status !== 'completed').map(m => (
              <SelectItem key={m.id} value={m.id}>
                #{m.match_order} {m.athlete1?.name || '—'} vs {m.athlete2?.name || '—'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {match.category && (
          <Badge variant="secondary" className="rounded-none text-[10px] px-1 py-0 shrink-0">
            {match.category.name}
          </Badge>
        )}
        {/* Judge link buttons */}
        <div className="flex gap-0.5 shrink-0">
          {[1, 2, 3].map(j => (
            <Button
              key={j}
              variant="ghost"
              size="sm"
              className="rounded-none h-5 w-5 p-0 text-[8px]"
              title={`Copy link Κριτή ${j}`}
              onClick={() => copyJudgeLink(j)}
            >
              <Link2 className="h-2.5 w-2.5" />
            </Button>
          ))}
        </div>
      </div>

      {/* Timer & Round */}
      <div className="flex items-center justify-center gap-3 px-2 py-1.5 bg-background">
        <Badge variant={isBreak ? "secondary" : "outline"} className="rounded-none text-xs px-2">
          {isBreak ? 'ΔΙΑΛ.' : `R${currentRound}`}
        </Badge>
        <div className="font-mono text-2xl font-bold tracking-wider text-foreground">
          {formatTimer(timeLeft)}
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="rounded-none h-7 w-7 p-0" onClick={handleStartPause} disabled={matchFinished}>
            {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" className="rounded-none h-7 w-7 p-0" onClick={handleResetRound}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Athletes header */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
        <div className="bg-blue-500/20 flex items-center gap-1.5 px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <Avatar className="h-5 w-5">
            <AvatarImage src={avatar(match.athlete1)} />
            <AvatarFallback className="text-[8px]">{match.athlete1?.name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold truncate leading-tight">{match.athlete1?.name || '—'}</p>
            {match.athlete1_club && <p className="text-[8px] text-muted-foreground truncate">{match.athlete1_club.name}</p>}
          </div>
        </div>
        <div className="flex items-center justify-center px-1 bg-muted/20">
          <span className="text-[10px] font-bold text-muted-foreground">VS</span>
        </div>
        <div className="bg-red-500/20 flex items-center gap-1.5 px-2 py-1 justify-end">
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-semibold truncate leading-tight">{match.athlete2?.name || 'TBD'}</p>
            {match.athlete2_club && <p className="text-[8px] text-muted-foreground truncate">{match.athlete2_club.name}</p>}
          </div>
          <Avatar className="h-5 w-5">
            <AvatarImage src={avatar(match.athlete2)} />
            <AvatarFallback className="text-[8px]">{match.athlete2?.name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        </div>
      </div>

      {/* Judge scores table */}
      <div className="px-1 py-1">
        <table className="w-full text-[9px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-1 py-0.5 text-muted-foreground font-normal"></th>
              {[1, 2, 3].map(r => (
                <th key={r} colSpan={2} className="text-center px-0.5 py-0.5 text-muted-foreground font-normal border-l border-border">R{r}</th>
              ))}
              <th colSpan={2} className="text-center px-0.5 py-0.5 font-semibold border-l border-border">Σύν.</th>
            </tr>
            <tr className="border-b border-border">
              <th className="px-1 py-0.5"></th>
              {[1, 2, 3].map(r => (
                <React.Fragment key={r}>
                  <th className={`text-center px-0.5 py-0.5 text-blue-600 font-normal ${r === 1 ? 'border-l border-border' : 'border-l border-border'}`}>Μ</th>
                  <th className="text-center px-0.5 py-0.5 text-red-600 font-normal">Κ</th>
                </React.Fragment>
              ))}
              <th className="text-center px-0.5 py-0.5 text-blue-600 font-semibold border-l border-border">Μ</th>
              <th className="text-center px-0.5 py-0.5 text-red-600 font-semibold">Κ</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map(j => {
              let jTotalA1 = 0, jTotalA2 = 0;
              return (
                <tr key={j} className="border-b border-border/50">
                  <td className="px-1 py-0.5 font-medium text-muted-foreground">Κρ.{j}</td>
                  {[1, 2, 3].map(r => {
                    const s = getJudgeScoreForRound(j, r);
                    const a1 = s?.athlete1_score || 0;
                    const a2 = s?.athlete2_score || 0;
                    jTotalA1 += a1;
                    jTotalA2 += a2;
                    return (
                      <React.Fragment key={r}>
                        <td className={`text-center px-0.5 py-0.5 border-l border-border ${s ? 'font-semibold' : 'text-muted-foreground'}`}>
                          {s ? a1 : '-'}
                        </td>
                        <td className={`text-center px-0.5 py-0.5 ${s ? 'font-semibold' : 'text-muted-foreground'}`}>
                          {s ? a2 : '-'}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="text-center px-0.5 py-0.5 font-bold text-blue-600 border-l border-border">{jTotalA1 || '-'}</td>
                  <td className="text-center px-0.5 py-0.5 font-bold text-red-600">{jTotalA2 || '-'}</td>
                </tr>
              );
            })}
            {/* Totals row */}
            <tr className="bg-muted/30 font-bold">
              <td className="px-1 py-0.5">Σύνολο</td>
              {[1, 2, 3].map(r => {
                const t = getRoundTotals(r);
                return (
                  <React.Fragment key={r}>
                    <td className="text-center px-0.5 py-0.5 text-blue-600 border-l border-border">{t.count > 0 ? t.a1 : '-'}</td>
                    <td className="text-center px-0.5 py-0.5 text-red-600">{t.count > 0 ? t.a2 : '-'}</td>
                  </React.Fragment>
                );
              })}
              <td className="text-center px-0.5 py-1 text-sm text-blue-600 border-l border-border">{totalA1 || '-'}</td>
              <td className="text-center px-0.5 py-1 text-sm text-red-600">{totalA2 || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Winner declaration */}
      {matchFinished && !match.winner_id && (
        <div className="px-2 py-1 border-t border-border flex items-center justify-center gap-2">
          <Button
            size="sm"
            className="rounded-none h-6 text-[10px] px-2 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => match.athlete1_id && handleDeclareWinner(match.athlete1_id)}
          >
            <Trophy className="h-2.5 w-2.5 mr-1" /> Νικητής Μπλε
          </Button>
          <Button
            size="sm"
            className="rounded-none h-6 text-[10px] px-2 bg-red-500 hover:bg-red-600 text-white"
            onClick={() => match.athlete2_id && handleDeclareWinner(match.athlete2_id)}
          >
            <Trophy className="h-2.5 w-2.5 mr-1" /> Νικητής Κόκ.
          </Button>
        </div>
      )}
      {match.winner_id && (
        <div className="px-2 py-1 border-t border-border flex justify-center">
          <Badge className="rounded-none text-[10px] px-2 py-0.5 bg-[#00ffba] text-black">
            <Trophy className="h-2.5 w-2.5 mr-1" /> Νικητής καταχωρήθηκε
          </Badge>
        </div>
      )}

      {/* Round duration info */}
      <div className="px-2 py-0.5 bg-muted/30 border-t border-border flex items-center justify-center gap-2">
        <Clock className="h-2.5 w-2.5 text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground">
          {roundConfig.rounds}×{roundConfig.roundDurationSec / 60}' | Διάλ. {roundConfig.breakDurationSec}''
        </span>
      </div>
    </div>
  );
};
