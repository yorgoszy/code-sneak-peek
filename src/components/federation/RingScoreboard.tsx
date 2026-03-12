import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Trophy, Clock, Link2, Copy, Check, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeJudgeScores } from "@/hooks/useRealtimeJudgeScores";
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


interface AvailableMatch {
  id: string;
  match_order: number | null;
  status: string;
  athlete1?: { name: string } | null;
  athlete2?: { name: string } | null;
  athlete1_display?: string;
  athlete2_display?: string;
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
  const judgeScores = useRealtimeJudgeScores(currentMatchId, { channelPrefix: 'ring-judge-scores' });
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

  // Track previous match ID to detect match changes
  const prevMatchIdRef = useRef<string | null>(null);

  // Load match data
  useEffect(() => {
    if (!currentMatchId) { 
      setMatch(null); 
      setIsRunning(false);
      setCurrentRound(1);
      setIsBreak(false);
      setTimeLeft(roundConfig.roundDurationSec);
      return; 
    }
    const matchChanged = prevMatchIdRef.current !== null && prevMatchIdRef.current !== currentMatchId;
    prevMatchIdRef.current = currentMatchId;

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

        if (matchChanged) {
          // Reset timer for new match
          setIsRunning(false);
          setCurrentRound(1);
          setIsBreak(false);
          setTimeLeft(config.roundDurationSec);
          persistTimerState(false, config.roundDurationSec, 1, false);
        } else {
          // Restore persisted timer state
          await restoreTimerState(config);
        }
      }
    };
    loadMatch();
  }, [currentMatchId, restoreTimerState, persistTimerState]);


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

  const handleRefreshMatch = async () => {
    if (!currentMatchId) return;
    // Reset timer
    setIsRunning(false);
    setCurrentRound(1);
    setIsBreak(false);
    setTimeLeft(roundConfig.roundDurationSec);
    persistTimerState(false, roundConfig.roundDurationSec, 1, false);
    // Delete judge scores for this match
    await supabase
      .from('competition_match_judge_scores')
      .delete()
      .eq('match_id', currentMatchId);
    // Reset match status
    await supabase
      .from('competition_matches')
      .update({ status: 'pending', winner_id: null, completed_at: null, result_type: null, athlete1_score: null, athlete2_score: null })
      .eq('id', currentMatchId);
    toast.success('Ο αγώνας ανανεώθηκε');
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

  // Auto-declare winner based on majority vote when all rounds are done
  const handleAutoDeclareWinner = async () => {
    if (!match || match.winner_id) return;
    if (!allRoundsScored) {
      toast.error('Δεν έχουν ολοκληρωθεί όλοι οι γύροι');
      return;
    }
    if (majorityA1 === 0 && majorityA2 === 0) {
      toast.error('Δεν υπάρχουν βαθμολογίες κριτών');
      return;
    }
    if (majorityA1 === majorityA2) {
      toast.error('Ισοπαλία - επιλέξτε νικητή χειροκίνητα');
      return;
    }
    const winnerId = majorityA1 > majorityA2 ? match.athlete1_id : match.athlete2_id;
    if (winnerId) {
      await handleDeclareWinner(winnerId);
    }
  };

  const [judgeLinkDialog, setJudgeLinkDialog] = useState<{ judgeNum: number; url: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const openJudgeLink = (judgeNum: number) => {
    const url = `${window.location.origin}/judge?ring=${ringId}&judge=${judgeNum}`;
    setJudgeLinkDialog({ judgeNum, url });
    setLinkCopied(false);
  };

  const handleCopyLink = async () => {
    if (!judgeLinkDialog) return;
    await navigator.clipboard.writeText(judgeLinkDialog.url);
    setLinkCopied(true);
    toast.success(`Link Κριτή ${judgeLinkDialog.judgeNum} αντιγράφηκε`);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Calculate aggregated scores from judges
  const getJudgeScoreForRound = (judgeNum: number, round: number) => {
    return judgeScores.find(s => s.judge_number === judgeNum && s.round === round);
  };

  // Majority vote: returns the most common score among judges for a given round
  const getMajorityScore = (round: number, athlete: 'a1' | 'a2'): number | null => {
    const scores: number[] = [];
    for (let j = 1; j <= 3; j++) {
      const s = getJudgeScoreForRound(j, round);
      if (s) scores.push(athlete === 'a1' ? s.athlete1_score : s.athlete2_score);
    }
    if (scores.length < 3) return null;
    // Find most frequent score (majority)
    const freq: Record<number, number> = {};
    scores.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
    let maxCount = 0, majorityVal = scores[0];
    for (const [val, count] of Object.entries(freq)) {
      if (count > maxCount) { maxCount = count; majorityVal = Number(val); }
    }
    return majorityVal;
  };

  const getRoundTotals = (round: number) => {
    let a1 = 0, a2 = 0, count = 0;
    for (let j = 1; j <= 3; j++) {
      const s = getJudgeScoreForRound(j, round);
      if (s) { a1 += s.athlete1_score; a2 += s.athlete2_score; count++; }
    }
    return { a1, a2, count };
  };

  // Majority-based total: majority of per-round majority scores (not sum)
  const roundMajoritiesA1 = Array.from({ length: roundConfig.rounds }, (_, i) => getMajorityScore(i + 1, 'a1')).filter((v): v is number => v !== null);
  const roundMajoritiesA2 = Array.from({ length: roundConfig.rounds }, (_, i) => getMajorityScore(i + 1, 'a2')).filter((v): v is number => v !== null);
  
  const getMajorityOfArray = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const freq: Record<number, number> = {};
    arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
    let maxCount = 0, majorityVal = arr[0];
    for (const [val, count] of Object.entries(freq)) {
      if (count > maxCount || (count === maxCount && Number(val) > majorityVal)) { maxCount = count; majorityVal = Number(val); }
    }
    return majorityVal;
  };

  const majorityA1 = getMajorityOfArray(roundMajoritiesA1);
  const majorityA2 = getMajorityOfArray(roundMajoritiesA2);
  
  // Check if all rounds have scores from at least 1 judge
  const allRoundsScored = Array.from({ length: roundConfig.rounds }, (_, i) => getRoundTotals(i + 1).count === 3).every(Boolean);

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
                #{m.match_order} {m.athlete1_display || m.athlete1?.name || 'Νικητής'} vs {m.athlete2_display || m.athlete2?.name || 'Νικητής'}
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
    <>
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
                #{m.match_order} {m.athlete1_display || m.athlete1?.name || 'Νικητής'} vs {m.athlete2_display || m.athlete2?.name || 'Νικητής'}
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
              onClick={() => openJudgeLink(j)}
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
          <Button variant="ghost" size="sm" className="rounded-none h-7 w-7 p-0 text-destructive" onClick={handleRefreshMatch} title="Refresh Match">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Athletes header */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
        <div className="bg-red-500/20 flex items-center gap-1.5 px-2 py-1">
          <Avatar className="h-5 w-5">
            <AvatarImage src={avatar(match.athlete2)} />
            <AvatarFallback className="text-[8px]">{match.athlete2?.name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold truncate leading-tight">{match.athlete2?.name || 'Νικητής προηγούμενου αγώνα'}</p>
            {match.athlete2_club && <p className="text-[8px] text-muted-foreground truncate">{match.athlete2_club.name}</p>}
          </div>
        </div>
        <div className="flex items-center justify-center px-1 bg-muted/20">
          <span className="text-[10px] font-bold text-muted-foreground">VS</span>
        </div>
        <div className="bg-blue-500/20 flex items-center gap-1.5 px-2 py-1 justify-end">
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-semibold truncate leading-tight">{match.athlete1?.name || 'Νικητής προηγούμενου αγώνα'}</p>
            {match.athlete1_club && <p className="text-[8px] text-muted-foreground truncate">{match.athlete1_club.name}</p>}
          </div>
          <Avatar className="h-5 w-5">
            <AvatarImage src={avatar(match.athlete1)} />
            <AvatarFallback className="text-[8px]">{match.athlete1?.name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Judge scores - split layout under each athlete */}
      <div className="grid grid-cols-2 gap-0">
        {/* Red athlete scores (athlete2) */}
        <div className="border-r border-border">
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-1 py-0.5 text-muted-foreground font-normal"></th>
                {Array.from({ length: roundConfig.rounds }, (_, i) => (
                  <th key={i + 1} className="text-center px-0.5 py-0.5 text-muted-foreground font-normal border-l border-border">R{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map(j => (
                <tr key={j} className="border-b border-border/50">
                  <td className="px-1 py-0.5 font-medium text-muted-foreground">Κρ.{j}</td>
                  {Array.from({ length: roundConfig.rounds }, (_, i) => {
                    const s = getJudgeScoreForRound(j, i + 1);
                    const val = s?.athlete2_score || 0;
                    return (
                      <td key={i + 1} className={`text-center px-0.5 py-0.5 border-l border-border ${s ? 'font-semibold' : 'text-muted-foreground'}`}>
                        {s ? val : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {allRoundsScored && (
                <tr className="bg-muted/30 font-bold">
                  <td className="px-1 py-0.5">Σύν.</td>
                  {Array.from({ length: roundConfig.rounds }, (_, i) => {
                    const ma = getMajorityScore(i + 1, 'a2');
                    return (
                      <td key={i + 1} className="text-center px-0.5 py-0.5 text-red-600 border-l border-border">{ma !== null ? ma : '-'}</td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Blue athlete scores (athlete1) */}
        <div>
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-1 py-0.5 text-muted-foreground font-normal"></th>
                {Array.from({ length: roundConfig.rounds }, (_, i) => (
                  <th key={i + 1} className="text-center px-0.5 py-0.5 text-muted-foreground font-normal border-l border-border">R{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map(j => (
                <tr key={j} className="border-b border-border/50">
                  <td className="px-1 py-0.5 font-medium text-muted-foreground">Κρ.{j}</td>
                  {Array.from({ length: roundConfig.rounds }, (_, i) => {
                    const s = getJudgeScoreForRound(j, i + 1);
                    const val = s?.athlete1_score || 0;
                    return (
                      <td key={i + 1} className={`text-center px-0.5 py-0.5 border-l border-border ${s ? 'font-semibold' : 'text-muted-foreground'}`}>
                        {s ? val : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {allRoundsScored && (
                <tr className="bg-muted/30 font-bold">
                  <td className="px-1 py-0.5">Σύν.</td>
                  {Array.from({ length: roundConfig.rounds }, (_, i) => {
                    const ma = getMajorityScore(i + 1, 'a1');
                    return (
                      <td key={i + 1} className="text-center px-0.5 py-0.5 text-blue-600 border-l border-border">{ma !== null ? ma : '-'}</td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Winner declaration - only after all rounds are done */}
      {!match.winner_id && matchFinished && allRoundsScored && (
        <div className="px-2 py-1 border-t border-border space-y-1">
          {/* Auto winner button based on majority scores */}
          {majorityA1 !== majorityA2 && (
            <div className="flex justify-center">
              {(() => {
                const isBlueWinner = majorityA1 > majorityA2;
                const winnerName = isBlueWinner ? match.athlete1?.name : match.athlete2?.name;
                return (
                  <Button
                    size="sm"
                    className={`rounded-none h-7 text-[10px] px-3 ${isBlueWinner ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                    onClick={handleAutoDeclareWinner}
                  >
                    <Trophy className="h-3 w-3 mr-1" />
                    Νικητής: {winnerName} ({majorityA1}-{majorityA2})
                  </Button>
                );
              })()}
            </div>
          )}
          {/* Manual override for ties or special cases */}
          <div className="flex items-center justify-center gap-1">
            <span className="text-[8px] text-muted-foreground">Χειροκίνητα:</span>
            <Button
              size="sm"
              variant="outline"
              className="rounded-none h-5 text-[8px] px-1.5 border-red-500 text-red-600"
              onClick={() => match.athlete2_id && handleDeclareWinner(match.athlete2_id)}
            >
              {match.athlete2?.name || 'Κόκκινη'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-none h-5 text-[8px] px-1.5 border-blue-500 text-blue-600"
              onClick={() => match.athlete1_id && handleDeclareWinner(match.athlete1_id)}
            >
              {match.athlete1?.name || 'Μπλε'}
            </Button>
          </div>
        </div>
      )}
      {match.winner_id && (
        <div className="px-2 py-1.5 border-t border-border">
          {(() => {
            const isBlueWinner = match.winner_id === match.athlete1_id;
            const roundScoresA1 = Array.from({ length: roundConfig.rounds }, (_, i) => getMajorityScore(i + 1, 'a1'));
            const roundScoresA2 = Array.from({ length: roundConfig.rounds }, (_, i) => getMajorityScore(i + 1, 'a2'));
            return (
              <div className="flex items-center justify-center gap-0">
                <div className={`flex-1 text-center py-1 ${!isBlueWinner ? 'bg-red-500 text-white' : 'bg-red-500/10'}`}>
                  <p className={`text-[10px] font-semibold truncate px-1 ${!isBlueWinner ? 'text-white' : 'text-red-600'}`}>
                    {match.athlete2?.name || 'Κόκκινη'}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {roundScoresA2.map((score, i) => (
                      <span key={i} className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold border ${!isBlueWinner ? 'border-white/40 text-white' : 'border-red-300 text-red-600'}`}>
                        {score !== null ? score : '-'}
                      </span>
                    ))}
                  </div>
                  {!isBlueWinner && <Trophy className="h-3 w-3 mx-auto text-white mt-1" />}
                </div>
                <div className={`flex-1 text-center py-1 ${isBlueWinner ? 'bg-blue-500 text-white' : 'bg-blue-500/10'}`}>
                  <p className={`text-[10px] font-semibold truncate px-1 ${isBlueWinner ? 'text-white' : 'text-blue-600'}`}>
                    {match.athlete1?.name || 'Μπλε'}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {roundScoresA1.map((score, i) => (
                      <span key={i} className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold border ${isBlueWinner ? 'border-white/40 text-white' : 'border-blue-300 text-blue-600'}`}>
                        {score !== null ? score : '-'}
                      </span>
                    ))}
                  </div>
                  {isBlueWinner && <Trophy className="h-3 w-3 mx-auto text-white mt-1" />}
                </div>
              </div>
            );
          })()}
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

      {/* Judge QR Link Dialog */}
      <Dialog open={!!judgeLinkDialog} onOpenChange={() => setJudgeLinkDialog(null)}>
        <DialogContent className="rounded-none max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">Κριτής {judgeLinkDialog?.judgeNum}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4">
              <QRCodeSVG value={judgeLinkDialog?.url || ''} size={200} />
            </div>
            <p className="text-[10px] text-muted-foreground break-all text-center px-2">
              {judgeLinkDialog?.url}
            </p>
            <Button
              variant="outline"
              className="rounded-none w-full"
              onClick={handleCopyLink}
            >
              {linkCopied ? <Check className="h-4 w-4 mr-2 text-[#00ffba]" /> : <Copy className="h-4 w-4 mr-2" />}
              {linkCopied ? 'Αντιγράφηκε!' : 'Αντιγραφή Link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
