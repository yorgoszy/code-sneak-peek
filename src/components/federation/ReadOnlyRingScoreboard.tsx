import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeJudgeScores } from "@/hooks/useRealtimeJudgeScores";

interface MatchData {
  id: string;
  match_order: number;
  status: string;
  winner_id: string | null;
  athlete1_id: string | null;
  athlete2_id: string | null;
  athlete1?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  athlete2?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  athlete1_club?: { name: string } | null;
  athlete2_club?: { name: string } | null;
  category?: { name: string; min_age: number | null; max_age: number | null } | null;
}

interface ReadOnlyRingScoreboardProps {
  currentMatchId: string | null;
  competitionId?: string;
  matchRangeStart?: number;
  matchRangeEnd?: number;
}

export const ReadOnlyRingScoreboard: React.FC<ReadOnlyRingScoreboardProps> = ({ 
  currentMatchId, competitionId, matchRangeStart, matchRangeEnd 
}) => {
  const { t } = useTranslation();
  const [match, setMatch] = useState<MatchData | null>(null);
  const judgeScores = useRealtimeJudgeScores(currentMatchId, { channelPrefix: 'coach-judge-scores' });

  // Load match
  const loadMatch = useCallback(async () => {
    if (!currentMatchId) { setMatch(null); return; }
    const { data } = await supabase
      .from('competition_matches')
      .select(`
        id, match_order, status, winner_id, athlete1_id, athlete2_id,
        athlete1:app_users!competition_matches_athlete1_id_fkey(name, photo_url, avatar_url),
        athlete2:app_users!competition_matches_athlete2_id_fkey(name, photo_url, avatar_url),
        athlete1_club:app_users!competition_matches_athlete1_club_id_fkey(name),
        athlete2_club:app_users!competition_matches_athlete2_club_id_fkey(name),
        category:federation_competition_categories!competition_matches_category_id_fkey(name, min_age, max_age)
      `)
      .eq('id', currentMatchId)
      .single();
    if (data) setMatch(data as any);
    else setMatch(null);
  }, [currentMatchId]);

  useEffect(() => { loadMatch(); }, [loadMatch]);

  // Real-time match updates
  useEffect(() => {
    if (!currentMatchId) return;
    const channel = supabase
      .channel(`coach-match-${currentMatchId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'competition_matches',
        filter: `id=eq.${currentMatchId}`
      }, (payload) => {
        if (payload.eventType === 'DELETE') setMatch(null);
        else loadMatch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentMatchId, loadMatch]);

  const getJudgeScoreForRound = (judgeNum: number, round: number) => {
    return judgeScores.find(s => s.judge_number === judgeNum && s.round === round);
  };

  const getMajorityScore = (round: number, athlete: 'a1' | 'a2'): number | null => {
    const scores: number[] = [];
    for (let j = 1; j <= 3; j++) {
      const s = getJudgeScoreForRound(j, round);
      if (s) scores.push(athlete === 'a1' ? s.athlete1_score : s.athlete2_score);
    }
    if (scores.length < 3) return null;
    const freq: Record<number, number> = {};
    scores.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
    let maxCount = 0, majorityVal = scores[0];
    for (const [val, count] of Object.entries(freq)) {
      if (count > maxCount) { maxCount = count; majorityVal = Number(val); }
    }
    if (maxCount === 1) {
      const sorted = [...scores].sort((a, b) => a - b);
      majorityVal = sorted[Math.floor(sorted.length / 2)];
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

  const totalRounds = 3;
  const avatar = (a: any) => a?.photo_url || a?.avatar_url || undefined;

  if (!currentMatchId || !match) {
    return (
      <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
        {t('federation.live.noActiveMatch', 'Δεν υπάρχει ενεργός αγώνας')}
      </div>
    );
  }

  return (
    <div className="border-t border-border">
      {/* Match info */}
      <div className="px-2 py-1 border-b border-border bg-muted/30 flex items-center gap-2">
        <span className="text-[10px] font-medium">{t('federation.live.fight', 'Αγώνας')} #{match.match_order}</span>
        {match.category && (
          <Badge variant="secondary" className="rounded-none text-[10px] px-1 py-0">
            {match.category.name}
          </Badge>
        )}
        {match.status === 'completed' && (
          <Badge className="rounded-none text-[10px] px-1 py-0 bg-[#00ffba] text-black">
            <Trophy className="h-2.5 w-2.5 mr-0.5" /> {t('federation.live.completed', 'Ολοκληρώθηκε')}
          </Badge>
        )}
      </div>

      {/* Athletes + Judge scores - unified grid matching RingScoreboard */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
        {/* RED column: name + scores */}
        <div>
          <div className="bg-red-500/20 flex items-center gap-1.5 px-2 py-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={avatar(match.athlete1)} />
              <AvatarFallback className="text-[8px]">{match.athlete1?.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold truncate leading-tight">{match.athlete1?.name || 'TBD'}</p>
              {match.athlete1_club && <p className="text-[8px] text-muted-foreground truncate">{match.athlete1_club.name}</p>}
            </div>
          </div>
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-1 py-0.5 text-muted-foreground font-normal"></th>
                {Array.from({ length: totalRounds }, (_, i) => (
                  <th key={i + 1} className={`text-center px-0.5 py-0.5 text-muted-foreground font-normal border-l border-border ${i === 1 ? 'bg-muted/40' : ''}`}>R{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-muted/30 font-bold border-b border-border text-[11px]">
                <td className="px-1 py-1">{t('federation.live.total')}</td>
                {Array.from({ length: totalRounds }, (_, i) => {
                  const roundScored = getRoundTotals(i + 1).count === 3;
                  const ma = roundScored ? getMajorityScore(i + 1, 'a1') : null;
                  return (
                    <td key={i + 1} className={`text-center px-0.5 py-1 text-red-600 border-l border-border ${i === 1 ? 'bg-muted/50' : ''}`}>{ma !== null ? ma : '-'}</td>
                  );
                })}
              </tr>
              {[1, 2, 3].map(j => (
                <tr key={j} className="border-b border-border/50 text-[8px]">
                  <td className="px-1 py-0 font-medium text-muted-foreground">{t('federation.live.judgeShort')}.{j}</td>
                  {Array.from({ length: totalRounds }, (_, i) => {
                    const s = getJudgeScoreForRound(j, i + 1);
                    const val = s?.athlete1_score || 0;
                    return (
                      <td key={i + 1} className={`text-center px-0.5 py-0 border-l border-border ${i === 1 ? 'bg-muted/40' : ''} ${s ? 'font-semibold' : 'text-muted-foreground'}`}>
                        {s ? val : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VS spacer column */}
        <div className="flex flex-col">
          <div className="flex items-center justify-center px-1 bg-muted/20 py-1">
            <span className="text-[10px] font-bold text-muted-foreground">VS</span>
          </div>
          <div className="flex-1 bg-muted/20"></div>
        </div>

        {/* BLUE column: name + scores */}
        <div>
          <div className="bg-blue-500/20 flex items-center gap-1.5 px-2 py-1 justify-end">
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-semibold truncate leading-tight">{match.athlete2?.name || 'TBD'}</p>
              {match.athlete2_club && <p className="text-[8px] text-muted-foreground truncate">{match.athlete2_club.name}</p>}
            </div>
            <Avatar className="h-5 w-5">
              <AvatarImage src={avatar(match.athlete2)} />
              <AvatarFallback className="text-[8px]">{match.athlete2?.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
          </div>
          <table className="w-full text-[9px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-1 py-0.5 text-muted-foreground font-normal"></th>
                {Array.from({ length: totalRounds }, (_, i) => (
                  <th key={i + 1} className={`text-center px-0.5 py-0.5 text-muted-foreground font-normal border-l border-border ${i === 1 ? 'bg-muted/40' : ''}`}>R{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-muted/30 font-bold border-b border-border text-[11px]">
                <td className="px-1 py-1">{t('federation.live.total')}</td>
                {Array.from({ length: totalRounds }, (_, i) => {
                  const roundScored = getRoundTotals(i + 1).count === 3;
                  const ma = roundScored ? getMajorityScore(i + 1, 'a2') : null;
                  return (
                    <td key={i + 1} className={`text-center px-0.5 py-1 text-blue-600 border-l border-border ${i === 1 ? 'bg-muted/50' : ''}`}>{ma !== null ? ma : '-'}</td>
                  );
                })}
              </tr>
              {[1, 2, 3].map(j => (
                <tr key={j} className="border-b border-border/50 text-[8px]">
                  <td className="px-1 py-0 font-medium text-muted-foreground">{t('federation.live.judgeShort')}.{j}</td>
                  {Array.from({ length: totalRounds }, (_, i) => {
                    const s = getJudgeScoreForRound(j, i + 1);
                    const val = s?.athlete2_score || 0;
                    return (
                      <td key={i + 1} className={`text-center px-0.5 py-0 border-l border-border ${i === 1 ? 'bg-muted/40' : ''} ${s ? 'font-semibold' : 'text-muted-foreground'}`}>
                        {s ? val : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Winner */}
      {match.winner_id && (
        <div className="px-2 py-1.5 border-t border-border">
          {(() => {
            const isRedWinner = match.winner_id === match.athlete1_id;
            const roundScoresA1 = [1, 2, 3].map(r => getMajorityScore(r, 'a1'));
            const roundScoresA2 = [1, 2, 3].map(r => getMajorityScore(r, 'a2'));
            return (
              <div className="flex items-center justify-center gap-0">
                <div className={`flex-1 text-center py-1 ${isRedWinner ? 'bg-red-500 text-white' : 'bg-red-500/10'}`}>
                  <p className={`text-[10px] font-semibold truncate px-1 ${isRedWinner ? 'text-white' : 'text-red-600'}`}>
                    {match.athlete1?.name || t('federation.live.red')}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {roundScoresA1.map((score, i) => (
                      <span key={i} className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold border ${isRedWinner ? 'border-white/40 text-white' : 'border-red-300 text-red-600'}`}>
                        {score !== null ? score : '-'}
                      </span>
                    ))}
                  </div>
                  {isRedWinner && <Trophy className="h-3 w-3 mx-auto text-white mt-1" />}
                </div>
                <div className={`flex-1 text-center py-1 ${!isRedWinner ? 'bg-blue-500 text-white' : 'bg-blue-500/10'}`}>
                  <p className={`text-[10px] font-semibold truncate px-1 ${!isRedWinner ? 'text-white' : 'text-blue-600'}`}>
                    {match.athlete2?.name || t('federation.live.blue')}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {roundScoresA2.map((score, i) => (
                      <span key={i} className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold border ${!isRedWinner ? 'border-white/40 text-white' : 'border-blue-300 text-blue-600'}`}>
                        {score !== null ? score : '-'}
                      </span>
                    ))}
                  </div>
                  {!isRedWinner && <Trophy className="h-3 w-3 mx-auto text-white mt-1" />}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
