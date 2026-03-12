import React, { useState, useEffect, useCallback } from 'react';
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


interface UpcomingMatch {
  id: string;
  match_order: number;
  status: string;
  is_bye?: boolean;
  athlete1?: { name: string } | null;
  athlete2?: { name: string } | null;
  athlete1_placeholder?: string;
  athlete2_placeholder?: string;
  category?: { name: string } | null;
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
  const [match, setMatch] = useState<MatchData | null>(null);
  const judgeScores = useRealtimeJudgeScores(currentMatchId, { channelPrefix: 'coach-judge-scores' });
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);

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
    if (data) {
      setMatch(data as any);
    } else {
      setMatch(null);
      setJudgeScores([]);
      setUpcomingMatches([]);
    }
  }, [currentMatchId]);

  useEffect(() => { loadMatch(); }, [loadMatch]);

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
      .channel(`coach-judge-scores-${currentMatchId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'competition_match_judge_scores',
        filter: `match_id=eq.${currentMatchId}`
      }, () => loadJudgeScores())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentMatchId, loadJudgeScores]);

  // Real-time match updates (including deletion from draw reset)
  useEffect(() => {
    if (!currentMatchId) return;
    const channel = supabase
      .channel(`coach-match-${currentMatchId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'competition_matches',
        filter: `id=eq.${currentMatchId}`
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setMatch(null);
          setJudgeScores([]);
          setUpcomingMatches([]);
        } else {
          loadMatch();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentMatchId, loadMatch]);

  // Load upcoming matches for this ring
  useEffect(() => {
    if (!competitionId || !match) { setUpcomingMatches([]); return; }
    const loadUpcoming = async () => {
      let query = supabase
        .from('competition_matches')
        .select(`
          id, match_order, match_number, round_number, status, athlete1_id, athlete2_id, is_bye, category_id,
          athlete1:app_users!competition_matches_athlete1_id_fkey(name),
          athlete2:app_users!competition_matches_athlete2_id_fkey(name),
          category:federation_competition_categories!competition_matches_category_id_fkey(name)
        `)
        .eq('competition_id', competitionId)
        .gt('match_order', match.match_order)
        .eq('is_bye', false)
        .order('match_order', { ascending: true })
        .limit(3);

      if (matchRangeStart && matchRangeEnd) {
        query = query.gte('match_order', matchRangeStart).lte('match_order', matchRangeEnd);
      }

      const { data: matchesRaw } = await query;
      if (!matchesRaw || matchesRaw.length === 0) { setUpcomingMatches([]); return; }

      // For matches with missing athletes, find feeder matches for placeholder text
      const needFeeder = matchesRaw.filter((m: any) => !m.is_bye && (!m.athlete1_id || !m.athlete2_id) && m.round_number > 1);
      let feederMap: Record<string, number> = {};
      if (needFeeder.length > 0) {
        const categoryIds = [...new Set(needFeeder.map((m: any) => m.category_id))];
        const { data: prevMatches } = await supabase
          .from('competition_matches')
          .select('id, match_order, match_number, round_number, category_id, winner_id')
          .eq('competition_id', competitionId)
          .in('category_id', categoryIds)
          .order('match_number', { ascending: true });
        
        if (prevMatches) {
          for (const um of needFeeder) {
            const sameCat = prevMatches.filter((p: any) => p.category_id === (um as any).category_id);
            const feederRound = (um as any).round_number * 2;
            const feederRoundMatches = sameCat.filter((p: any) => p.round_number === feederRound);

            const feeder1 = feederRoundMatches.find((p: any) => p.match_number === ((um as any).match_number * 2) - 1)
              || (feederRoundMatches.length === 1 ? feederRoundMatches[0] : undefined);
            const feeder2 = feederRoundMatches.find((p: any) => p.match_number === (um as any).match_number * 2)
              || (feederRoundMatches.length === 1 ? feederRoundMatches[0] : undefined);

            if (!(um as any).athlete1_id && feeder1?.match_order) {
              feederMap[`${(um as any).id}_1`] = feeder1.match_order;
            }
            if (!(um as any).athlete2_id && feeder2?.match_order) {
              feederMap[`${(um as any).id}_2`] = feeder2.match_order;
            }
          }
        }
      }

      const enriched: UpcomingMatch[] = matchesRaw.map((m: any) => ({
        id: m.id,
        match_order: m.match_order,
        status: m.status,
        is_bye: m.is_bye || false,
        category: m.category,
        athlete1: m.athlete1?.name ? { name: m.athlete1.name } : null,
        athlete2: m.athlete2?.name ? { name: m.athlete2.name } : null,
        athlete1_placeholder: !m.athlete1_id ? (m.is_bye ? undefined : (feederMap[`${m.id}_1`] ? `Νικητής αγ. ${feederMap[`${m.id}_1`]}` : undefined)) : undefined,
        athlete2_placeholder: !m.athlete2_id ? (m.is_bye ? undefined : (feederMap[`${m.id}_2`] ? `Νικητής αγ. ${feederMap[`${m.id}_2`]}` : undefined)) : undefined,
      }));

      setUpcomingMatches(enriched);
    };
    loadUpcoming();
  }, [competitionId, match?.match_order, matchRangeStart, matchRangeEnd]);

  const getJudgeScoreForRound = (judgeNum: number, round: number) => {
    return judgeScores.find(s => s.judge_number === judgeNum && s.round === round);
  };

  // Majority vote per round
  const getMajorityScore = (round: number, athlete: 'a1' | 'a2'): number | null => {
    const scores: number[] = [];
    for (let j = 1; j <= 3; j++) {
      const s = getJudgeScoreForRound(j, round);
      if (s) scores.push(athlete === 'a1' ? s.athlete1_score : s.athlete2_score);
    }
    if (scores.length === 0) return null;
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

  const roundMajoritiesA1 = [1, 2, 3].map(r => getMajorityScore(r, 'a1')).filter((v): v is number => v !== null);
  const roundMajoritiesA2 = [1, 2, 3].map(r => getMajorityScore(r, 'a2')).filter((v): v is number => v !== null);
  
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
  
  const allRoundsScored = [1, 2, 3].every(r => getRoundTotals(r).count > 0);

  const avatar = (a: any) => a?.photo_url || a?.avatar_url || undefined;

  if (!currentMatchId || !match) {
    return (
      <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
        Δεν υπάρχει ενεργός αγώνας
      </div>
    );
  }

  return (
    <div className="border-t border-border">
      {/* Match info */}
      <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
        <span className="text-xs font-medium">Αγώνας #{match.match_order}</span>
        {match.category && (
          <Badge variant="secondary" className="rounded-none text-[10px] px-1 py-0">
            {match.category.name}
          </Badge>
        )}
        {match.status === 'completed' && (
          <Badge className="rounded-none text-[10px] px-1 py-0 bg-[#00ffba] text-black">
            <Trophy className="h-2.5 w-2.5 mr-0.5" /> Ολοκληρώθηκε
          </Badge>
        )}
      </div>

      {/* Athletes */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
        <div className="bg-blue-500/20 flex items-center gap-1.5 px-3 py-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={avatar(match.athlete1)} />
            <AvatarFallback className="text-[8px]">{match.athlete1?.name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{match.athlete1?.name || 'Νικητής προηγούμενου αγώνα'}</p>
            {match.athlete1_club && <p className="text-[9px] text-muted-foreground truncate">{match.athlete1_club.name}</p>}
          </div>
        </div>
        <div className="flex items-center justify-center px-2 bg-muted/20">
          <span className="text-xs font-bold text-muted-foreground">VS</span>
        </div>
        <div className="bg-red-500/20 flex items-center gap-1.5 px-3 py-2 justify-end">
          <div className="min-w-0 text-right">
            <p className="text-xs font-semibold truncate">{match.athlete2?.name || 'Νικητής προηγούμενου αγώνα'}</p>
            {match.athlete2_club && <p className="text-[9px] text-muted-foreground truncate">{match.athlete2_club.name}</p>}
          </div>
          <Avatar className="h-6 w-6">
            <AvatarImage src={avatar(match.athlete2)} />
            <AvatarFallback className="text-[8px]">{match.athlete2?.name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          
        </div>
      </div>

      {/* Judge scores - split layout under each athlete */}
      {judgeScores.length > 0 && (
        <div className="grid grid-cols-2 gap-0">
          {/* Blue athlete scores */}
          <div className="border-r border-border">
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-1 py-0.5 text-muted-foreground font-normal"></th>
                  {[1, 2, 3].map(r => (
                    <th key={r} className="text-center px-0.5 py-0.5 text-muted-foreground font-normal border-l border-border">R{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(j => (
                  <tr key={j} className="border-b border-border/50">
                    <td className="px-1 py-0.5 font-medium text-muted-foreground">Κρ.{j}</td>
                    {[1, 2, 3].map(r => {
                      const s = getJudgeScoreForRound(j, r);
                      const val = s?.athlete1_score || 0;
                      return (
                        <td key={r} className={`text-center px-0.5 py-0.5 border-l border-border ${s ? 'font-semibold' : 'text-muted-foreground'}`}>
                          {s ? val : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {allRoundsScored && (
                  <tr className="bg-muted/30 font-bold">
                    <td className="px-1 py-0.5">Σύν.</td>
                    {[1, 2, 3].map(r => {
                      const ma = getMajorityScore(r, 'a1');
                      return (
                        <td key={r} className="text-center px-0.5 py-0.5 text-blue-600 border-l border-border">{ma !== null ? ma : '-'}</td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Red athlete scores */}
          <div>
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-1 py-0.5 text-muted-foreground font-normal"></th>
                  {[1, 2, 3].map(r => (
                    <th key={r} className="text-center px-0.5 py-0.5 text-muted-foreground font-normal border-l border-border">R{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(j => (
                  <tr key={j} className="border-b border-border/50">
                    <td className="px-1 py-0.5 font-medium text-muted-foreground">Κρ.{j}</td>
                    {[1, 2, 3].map(r => {
                      const s = getJudgeScoreForRound(j, r);
                      const val = s?.athlete2_score || 0;
                      return (
                        <td key={r} className={`text-center px-0.5 py-0.5 border-l border-border ${s ? 'font-semibold' : 'text-muted-foreground'}`}>
                          {s ? val : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {allRoundsScored && (
                  <tr className="bg-muted/30 font-bold">
                    <td className="px-1 py-0.5">Σύν.</td>
                    {[1, 2, 3].map(r => {
                      const ma = getMajorityScore(r, 'a2');
                      return (
                        <td key={r} className="text-center px-0.5 py-0.5 text-red-600 border-l border-border">{ma !== null ? ma : '-'}</td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Winner */}
      {match.winner_id && (
        <div className="px-2 py-1.5 border-t border-border">
          {(() => {
            const isBlueWinner = match.winner_id === match.athlete1_id;
            const roundScoresA1 = [1, 2, 3].map(r => getMajorityScore(r, 'a1'));
            const roundScoresA2 = [1, 2, 3].map(r => getMajorityScore(r, 'a2'));
            return (
              <div className="flex items-center justify-center gap-0">
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
              </div>
            );
          })()}
        </div>
      )}

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <div className="border-t border-border px-3 py-2">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Επόμενοι αγώνες</p>
          <div className="space-y-1">
            {upcomingMatches.map((um) => (
              <div key={um.id} className="flex items-center gap-1.5 text-[10px]">
                <span className="text-muted-foreground font-medium shrink-0">#{um.match_order}</span>
                {um.category && (
                  <Badge variant="outline" className="rounded-none text-[8px] px-1 py-0 shrink-0">
                    {um.category.name}
                  </Badge>
                )}
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className={`truncate ${um.athlete1?.name ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {um.athlete1?.name || um.athlete1_placeholder || 'Νικητής προηγούμενου αγώνα'}
                  </span>
                  <span className="text-muted-foreground shrink-0">vs</span>
                  <span className={`truncate ${um.athlete2?.name ? 'font-medium' : 'text-muted-foreground italic'}`}>
                    {um.athlete2?.name || um.athlete2_placeholder || 'Νικητής προηγούμενου αγώνα'}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
