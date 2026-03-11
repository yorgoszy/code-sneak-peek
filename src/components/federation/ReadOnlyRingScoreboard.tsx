import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface JudgeScore {
  judge_number: number;
  round: number;
  athlete1_score: number;
  athlete2_score: number;
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
  const [judgeScores, setJudgeScores] = useState<JudgeScore[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);

  // Load match
  useEffect(() => {
    if (!currentMatchId) { setMatch(null); setJudgeScores([]); return; }
    const load = async () => {
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
    };
    load();
  }, [currentMatchId]);

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

  // Real-time match updates
  useEffect(() => {
    if (!currentMatchId) return;
    const channel = supabase
      .channel(`coach-match-${currentMatchId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'competition_matches',
        filter: `id=eq.${currentMatchId}`
      }, async () => {
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
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentMatchId]);

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
          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
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
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        </div>
      </div>

      {/* Judge scores table */}
      {judgeScores.length > 0 && (
        <div className="px-2 py-1">
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
                    <th className="text-center px-0.5 py-0.5 text-blue-600 font-normal border-l border-border">Μ</th>
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
              {/* Totals */}
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
      )}

      {/* Winner */}
      {match.winner_id && (
        <div className="px-3 py-1.5 border-t border-border flex justify-center">
          <Badge className="rounded-none text-[10px] px-2 py-0.5 bg-[#00ffba] text-black">
            <Trophy className="h-2.5 w-2.5 mr-1" />
            Νικητής: {match.winner_id === match.athlete1_id ? match.athlete1?.name : match.athlete2?.name}
          </Badge>
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
