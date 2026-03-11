import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Pause, RotateCcw, Trophy, Clock } from "lucide-react";
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

// Round config based on age category
function getRoundConfig(minAge: number | null, maxAge: number | null): { rounds: number; roundDurationSec: number; breakDurationSec: number } {
  // Default: 3 rounds x 3 min, 1 min break
  if (!minAge && !maxAge) return { rounds: 3, roundDurationSec: 180, breakDurationSec: 60 };

  const age = maxAge || minAge || 18;

  if (age <= 9) return { rounds: 3, roundDurationSec: 60, breakDurationSec: 30 };       // 5-7, 8-9
  if (age <= 11) return { rounds: 3, roundDurationSec: 60, breakDurationSec: 60 };      // 10-11
  if (age <= 13) return { rounds: 3, roundDurationSec: 90, breakDurationSec: 60 };      // 12-13
  if (age <= 15) return { rounds: 3, roundDurationSec: 120, breakDurationSec: 60 };     // 14-15
  if (age <= 17) return { rounds: 3, roundDurationSec: 120, breakDurationSec: 60 };     // 16-17
  return { rounds: 3, roundDurationSec: 180, breakDurationSec: 60 };                    // 18-40, U23, 40+
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
  const [scores, setScores] = useState<{ r1: number; r2: number; r3: number }>({ r1: 0, r2: 0, r3: 0 });
  const [scores2, setScores2] = useState<{ r1: number; r2: number; r3: number }>({ r1: 0, r2: 0, r3: 0 });
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [roundConfig, setRoundConfig] = useState({ rounds: 3, roundDurationSec: 180, breakDurationSec: 60 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load match data when currentMatchId changes
  useEffect(() => {
    if (!currentMatchId) { setMatch(null); return; }
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
        setTimeLeft(config.roundDurationSec);

        // Restore scores if saved
        try {
          const s1 = data.athlete1_score ? JSON.parse(data.athlete1_score) : { r1: 0, r2: 0, r3: 0 };
          const s2 = data.athlete2_score ? JSON.parse(data.athlete2_score) : { r1: 0, r2: 0, r3: 0 };
          setScores(s1);
          setScores2(s2);
        } catch {
          setScores({ r1: 0, r2: 0, r3: 0 });
          setScores2({ r1: 0, r2: 0, r3: 0 });
        }
        setCurrentRound(1);
        setIsRunning(false);
        setIsBreak(false);
      }
    };
    loadMatch();
  }, [currentMatchId]);

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
          // Round or break ended
          if (isBreak) {
            // Break ended, start next round
            setIsBreak(false);
            setCurrentRound(r => r + 1);
            return roundConfig.roundDurationSec;
          } else {
            // Round ended
            if (currentRound < roundConfig.rounds) {
              setIsBreak(true);
              return roundConfig.breakDurationSec;
            }
            // All rounds done
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isBreak, currentRound, roundConfig]);

  const handleStartPause = () => {
    if (timeLeft === 0 && currentRound >= roundConfig.rounds && !isBreak) return;
    setIsRunning(prev => !prev);
  };

  const handleResetRound = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? roundConfig.breakDurationSec : roundConfig.roundDurationSec);
  };

  const handleSaveScores = useCallback(async () => {
    if (!match) return;
    const { error } = await supabase
      .from('competition_matches')
      .update({
        athlete1_score: JSON.stringify(scores),
        athlete2_score: JSON.stringify(scores2),
      })
      .eq('id', match.id);
    if (error) toast.error('Σφάλμα αποθήκευσης');
  }, [match, scores, scores2]);

  // Auto-save scores on change
  useEffect(() => {
    if (!match) return;
    const t = setTimeout(handleSaveScores, 1000);
    return () => clearTimeout(t);
  }, [scores, scores2, handleSaveScores]);

  const totalScore1 = scores.r1 + scores.r2 + scores.r3;
  const totalScore2 = scores2.r1 + scores2.r2 + scores2.r3;

  const handleDeclareWinner = async (winnerId: string) => {
    if (!match) return;
    await handleSaveScores();
    const { error } = await supabase
      .from('competition_matches')
      .update({
        winner_id: winnerId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        result_type: 'points',
      })
      .eq('id', match.id);

    if (error) {
      toast.error('Σφάλμα ορισμού νικητή');
    } else {
      toast.success('Ο νικητής καταχωρήθηκε');
    }
  };

  const avatar = (a: any) => a?.photo_url || a?.avatar_url || undefined;
  const roundKeys = ['r1', 'r2', 'r3'] as const;

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
                #{m.match_order} {m.athlete1?.name || 'TBD'} vs {m.athlete2?.name || 'TBD'}
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

  const matchFinished = match.status === 'completed' || (currentRound >= roundConfig.rounds && timeLeft === 0 && !isBreak && !isRunning);

  return (
    <div className="border-t border-border">
      {/* Match selector row */}
      <div className="px-2 py-1 border-b border-border bg-muted/30 flex items-center gap-2">
        <Select value={currentMatchId} onValueChange={onMatchChange}>
          <SelectTrigger className="rounded-none h-6 text-[10px] flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {matches.filter(m => m.status !== 'completed').map(m => (
              <SelectItem key={m.id} value={m.id}>
                #{m.match_order} {m.athlete1?.name || 'TBD'} vs {m.athlete2?.name || 'TBD'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {match.category && (
          <Badge variant="secondary" className="rounded-none text-[10px] px-1 py-0 shrink-0">
            {match.category.name}
          </Badge>
        )}
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
          <Button
            variant="outline"
            size="sm"
            className="rounded-none h-7 w-7 p-0"
            onClick={handleStartPause}
            disabled={matchFinished}
          >
            {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none h-7 w-7 p-0"
            onClick={handleResetRound}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Athletes & Scores */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
        {/* Blue Corner (Athlete 1) */}
        <div className="bg-blue-500/10 border-r border-border">
          <div className="flex items-center gap-1.5 px-2 py-1 border-b border-blue-500/20 bg-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <Avatar className="h-5 w-5">
              <AvatarImage src={avatar(match.athlete1)} />
              <AvatarFallback className="text-[8px]">{match.athlete1?.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold truncate leading-tight">{match.athlete1?.name || 'TBD'}</p>
              {match.athlete1_club && <p className="text-[8px] text-muted-foreground truncate leading-tight">{match.athlete1_club.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1">
            {roundKeys.map((rk, i) => (
              <div key={rk} className="flex-1 text-center">
                <label className="text-[8px] text-muted-foreground block">R{i + 1}</label>
                <Input
                  type="number"
                  min={0}
                  value={scores[rk] || ''}
                  onChange={(e) => setScores(prev => ({ ...prev, [rk]: parseInt(e.target.value) || 0 }))}
                  className="rounded-none h-6 text-xs text-center p-0 no-spinners"
                />
              </div>
            ))}
            <div className="text-center px-1">
              <label className="text-[8px] text-muted-foreground block">Σύν.</label>
              <span className="text-sm font-bold text-blue-600">{totalScore1}</span>
            </div>
          </div>
        </div>

        {/* VS / Winner */}
        <div className="flex flex-col items-center justify-center px-1 bg-muted/20">
          <span className="text-[10px] font-bold text-muted-foreground">VS</span>
          {matchFinished && !match.winner_id && (
            <div className="flex flex-col gap-0.5 mt-1">
              <Button
                size="sm"
                className="rounded-none h-5 text-[8px] px-1 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => match.athlete1_id && handleDeclareWinner(match.athlete1_id)}
              >
                <Trophy className="h-2 w-2 mr-0.5" />
                Μπλε
              </Button>
              <Button
                size="sm"
                className="rounded-none h-5 text-[8px] px-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => match.athlete2_id && handleDeclareWinner(match.athlete2_id)}
              >
                <Trophy className="h-2 w-2 mr-0.5" />
                Κόκ.
              </Button>
            </div>
          )}
          {match.winner_id && (
            <Badge className="rounded-none text-[8px] px-1 py-0 bg-[#00ffba] text-black mt-1">
              <Trophy className="h-2 w-2 mr-0.5" />
              Νικητής
            </Badge>
          )}
        </div>

        {/* Red Corner (Athlete 2) */}
        <div className="bg-red-500/10 border-l border-border">
          <div className="flex items-center gap-1.5 px-2 py-1 border-b border-red-500/20 bg-red-500/20 justify-end">
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-semibold truncate leading-tight">{match.athlete2?.name || 'TBD'}</p>
              {match.athlete2_club && <p className="text-[8px] text-muted-foreground truncate leading-tight">{match.athlete2_club.name}</p>}
            </div>
            <Avatar className="h-5 w-5">
              <AvatarImage src={avatar(match.athlete2)} />
              <AvatarFallback className="text-[8px]">{match.athlete2?.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          </div>
          <div className="flex items-center gap-1 px-2 py-1">
            <div className="text-center px-1">
              <label className="text-[8px] text-muted-foreground block">Σύν.</label>
              <span className="text-sm font-bold text-red-600">{totalScore2}</span>
            </div>
            {roundKeys.map((rk, i) => (
              <div key={rk} className="flex-1 text-center">
                <label className="text-[8px] text-muted-foreground block">R{i + 1}</label>
                <Input
                  type="number"
                  min={0}
                  value={scores2[rk] || ''}
                  onChange={(e) => setScores2(prev => ({ ...prev, [rk]: parseInt(e.target.value) || 0 }))}
                  className="rounded-none h-6 text-xs text-center p-0 no-spinners"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

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
