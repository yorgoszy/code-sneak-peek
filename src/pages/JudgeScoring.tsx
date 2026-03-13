import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Send, Clock, Pause } from "lucide-react";

interface MatchData {
  id: string;
  match_order: number;
  status: string;
  athlete1_id: string | null;
  athlete2_id: string | null;
  athlete1?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  athlete2?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  category?: { name: string; min_age: number | null; max_age: number | null } | null;
}

const JudgeScoring: React.FC = () => {
  const [searchParams] = useSearchParams();
  const ringId = searchParams.get('ring');
  const judgeNumber = parseInt(searchParams.get('judge') || '1');

  const [ring, setRing] = useState<any>(null);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [scores, setScores] = useState<{ [round: number]: { a1: number; a2: number } }>({
    1: { a1: 0, a2: 0 },
    2: { a1: 0, a2: 0 },
    3: { a1: 0, a2: 0 },
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const currentMatchIdRef = useRef<string | null>(null);

  // Load match by ID
  const loadMatch = useCallback(async (matchId: string) => {
    const { data: matchData, error: matchError } = await supabase
      .from('competition_matches')
      .select(`
        id, match_order, status, athlete1_id, athlete2_id,
        athlete1:app_users!competition_matches_athlete1_id_fkey(name, photo_url, avatar_url),
        athlete2:app_users!competition_matches_athlete2_id_fkey(name, photo_url, avatar_url)
      `)
      .eq('id', matchId)
      .maybeSingle();

    if (matchError) {
      console.error('❌ Judge match load error:', matchError);
      setMatch(null);
      setLoadError('Access denied');
      return;
    }

    if (matchData) {
      setMatch(matchData as MatchData);
      currentMatchIdRef.current = matchData.id;

      // Load existing scores for this judge
      const { data: existingScores } = await supabase
        .from('competition_match_judge_scores')
        .select('*')
        .eq('match_id', matchData.id)
        .eq('judge_number', judgeNumber);

      if (existingScores?.length) {
        const newScores = { 1: { a1: 0, a2: 0 }, 2: { a1: 0, a2: 0 }, 3: { a1: 0, a2: 0 } };
        existingScores.forEach((s: any) => {
          newScores[s.round as 1 | 2 | 3] = { a1: s.athlete1_score, a2: s.athlete2_score };
        });
        setScores(newScores);
      } else {
        setScores({ 1: { a1: 0, a2: 0 }, 2: { a1: 0, a2: 0 }, 3: { a1: 0, a2: 0 } });
      }
    } else {
      setMatch(null);
      currentMatchIdRef.current = null;
    }
  }, [judgeNumber]);

  // Load ring & current match
  const loadRingAndMatch = useCallback(async () => {
    if (!ringId) return;

    setLoading(true);
    setLoadError(null);

    const { data: ringData, error: ringError } = await supabase
      .from('competition_rings')
      .select('id, ring_name, current_match_id')
      .eq('id', ringId)
      .maybeSingle();

    if (ringError) {
      console.error('❌ Judge ring load error:', ringError);
      setRing(null);
      setMatch(null);
      setLoadError('Ring load error');
      setLoading(false);
      return;
    }

    if (!ringData) {
      setRing(null);
      setMatch(null);
      setLoadError('Ring not found');
      setLoading(false);
      return;
    }

    setRing(ringData);

    if (!ringData.current_match_id) {
      setMatch(null);
      currentMatchIdRef.current = null;
      setLoading(false);
      return;
    }

    await loadMatch(ringData.current_match_id);
    setLoading(false);
  }, [ringId, loadMatch]);

  useEffect(() => {
    loadRingAndMatch();
  }, [loadRingAndMatch]);

  // Real-time + polling: listen for ring changes (match switch & refresh)
  useEffect(() => {
    if (!ringId) return;
    let isActive = true;
    let pollTimeout: ReturnType<typeof setTimeout>;
    let lastRingUpdate: string | null = null;

    const handleRingChange = (newData: any) => {
      setRing(newData);
      lastRingUpdate = newData?.updated_at || null;
      const newMatchId = newData?.current_match_id;
      
      if (newMatchId && newMatchId !== currentMatchIdRef.current) {
        currentMatchIdRef.current = newMatchId;
        setScores({ 1: { a1: 0, a2: 0 }, 2: { a1: 0, a2: 0 }, 3: { a1: 0, a2: 0 } });
        loadMatch(newMatchId);
      } else if (!newMatchId) {
        setMatch(null);
        currentMatchIdRef.current = null;
        setScores({ 1: { a1: 0, a2: 0 }, 2: { a1: 0, a2: 0 }, 3: { a1: 0, a2: 0 } });
      }
    };

    // Realtime subscription
    const channel = supabase
      .channel(`judge-ring-${ringId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'competition_rings',
        filter: `id=eq.${ringId}`
      }, (payload) => {
        console.log('🔄 Judge realtime ring update received');
        handleRingChange(payload.new);
      })
      .subscribe((status) => {
        console.log('📡 Judge ring channel status:', status);
      });

    // Polling fallback every 2s
    const poll = async () => {
      if (!isActive) return;
      try {
        const query = supabase
          .from('competition_rings')
          .select('id, ring_name, current_match_id, updated_at')
          .eq('id', ringId);
        
        if (lastRingUpdate) {
          query.gt('updated_at', lastRingUpdate);
        }
        
        const { data } = await query.maybeSingle();
        if (data) {
          console.log('🔄 Judge poll: ring updated');
          handleRingChange(data);
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
      if (isActive) {
        pollTimeout = setTimeout(poll, 2000);
      }
    };
    pollTimeout = setTimeout(poll, 2000);

    return () => {
      isActive = false;
      clearTimeout(pollTimeout);
      supabase.removeChannel(channel);
    };
  }, [ringId, loadMatch]);

  // Real-time + polling: listen for match updates (refresh match)
  useEffect(() => {
    if (!match?.id) return;
    let isActive = true;
    let pollTimeout: ReturnType<typeof setTimeout>;
    let lastMatchUpdate: string | null = null;

    const channel = supabase
      .channel(`judge-match-${match.id}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'competition_matches',
        filter: `id=eq.${match.id}`
      }, (payload) => {
        console.log('🔄 Judge realtime match update received');
        lastMatchUpdate = (payload.new as any)?.updated_at || null;
        loadMatch(match.id);
      })
      .subscribe();

    // Polling fallback every 2s
    const poll = async () => {
      if (!isActive) return;
      try {
        const query = supabase
          .from('competition_matches')
          .select('id, updated_at')
          .eq('id', match.id);
        
        if (lastMatchUpdate) {
          query.gt('updated_at', lastMatchUpdate);
        }

        const { data } = await query.maybeSingle();
        if (data) {
          console.log('🔄 Judge poll: match updated');
          lastMatchUpdate = data.updated_at;
          loadMatch(match.id);
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
      if (isActive) {
        pollTimeout = setTimeout(poll, 2000);
      }
    };
    pollTimeout = setTimeout(poll, 2000);

    return () => {
      isActive = false;
      clearTimeout(pollTimeout);
      supabase.removeChannel(channel);
    };
  }, [match?.id, loadMatch]);

  const handleSaveRound = async (round: number) => {
    if (!match) return;
    setSaving(true);
    const { error } = await supabase
      .from('competition_match_judge_scores')
      .upsert({
        match_id: match.id,
        judge_number: judgeNumber,
        round,
        athlete1_score: scores[round].a1,
        athlete2_score: scores[round].a2,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'match_id,judge_number,round' });

    setSaving(false);
    if (error) {
      toast.error('Save error');
    } else {
      toast.success(`R${round} saved`);
    }
  };

  const handleSaveAll = async () => {
    if (!match) return;
    setSaving(true);
    for (const round of [1, 2, 3]) {
      await supabase
        .from('competition_match_judge_scores')
        .upsert({
          match_id: match.id,
          judge_number: judgeNumber,
          round,
          athlete1_score: scores[round].a1,
          athlete2_score: scores[round].a2,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'match_id,judge_number,round' });
    }
    setSaving(false);
    toast.success('All rounds saved');
  };

  const avatar = (a: any) => a?.photo_url || a?.avatar_url || undefined;

  if (!ringId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-semibold">Invalid judge link</p>
          <p className="text-sm mt-2">Please use the link provided by the organization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-background p-2 text-center">
        <h1 className="text-base font-bold">Judge {judgeNumber}</h1>
        <p className="text-[10px] opacity-70">{ring?.ring_name || `Ring`}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : !match ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">{loadError || 'Waiting for match...'}</p>
            <p className="text-xs mt-1">The match will appear automatically</p>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          {/* Match badge */}
          <div className="text-center py-1.5">
            <Badge variant="outline" className="rounded-none text-[10px]">
              Fight #{match.match_order}
            </Badge>
          </div>

          {/* Athletes - ring style with grid */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
            {/* RED = Athlete 1 */}
            <div className="bg-red-500/20 flex items-center gap-1.5 px-2 py-1.5">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={avatar(match.athlete1)} />
                <AvatarFallback className="text-[8px]">{match.athlete1?.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <p className="text-[11px] font-semibold truncate leading-tight">{match.athlete1?.name || 'Red corner'}</p>
            </div>
            {/* VS */}
            <div className="flex items-center justify-center px-2 bg-muted/20">
              <span className="text-[10px] font-bold text-muted-foreground">VS</span>
            </div>
            {/* BLUE = Athlete 2 */}
            <div className="bg-blue-500/20 flex items-center gap-1.5 px-2 py-1.5 justify-end">
              <p className="text-[11px] font-semibold truncate leading-tight text-right">{match.athlete2?.name || 'Blue corner'}</p>
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={avatar(match.athlete2)} />
                <AvatarFallback className="text-[8px]">{match.athlete2?.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Scoring per round */}
          {[1, 2, 3].map((round) => (
            <div key={round} className="border-b border-border px-2 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant="secondary" className="rounded-none text-[10px] px-1.5 py-0">R{round}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none h-6 text-[10px] px-2"
                  onClick={() => handleSaveRound(round)}
                  disabled={saving}
                >
                  <Send className="h-2.5 w-2.5 mr-1" />
                  Save
                </Button>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
                <div>
                  <label className="text-[9px] text-red-600 font-medium block mb-0.5 truncate">{match.athlete1?.name || 'Red'}</label>
                  <Input
                    type="number"
                    min={0}
                    value={scores[round].a1 || ''}
                    onChange={(e) => setScores(prev => ({
                      ...prev,
                      [round]: { ...prev[round], a1: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-none h-10 text-lg text-center font-bold"
                  />
                </div>
                <div className="w-3" />
                <div>
                  <label className="text-[9px] text-blue-600 font-medium block mb-0.5 truncate text-right">{match.athlete2?.name || 'Blue'}</label>
                  <Input
                    type="number"
                    min={0}
                    value={scores[round].a2 || ''}
                    onChange={(e) => setScores(prev => ({
                      ...prev,
                      [round]: { ...prev[round], a2: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-none h-10 text-lg text-center font-bold"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="px-2 py-2 bg-muted/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">Total</span>
              <Button
                size="sm"
                className="rounded-none h-7 text-[10px] bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                onClick={handleSaveAll}
                disabled={saving}
              >
                <Send className="h-2.5 w-2.5 mr-1" />
                Save All
              </Button>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-0 text-center">
              <span className="text-xl font-bold text-red-600">
                {scores[1].a1 + scores[2].a1 + scores[3].a1}
              </span>
              <div className="w-3" />
              <span className="text-xl font-bold text-blue-600">
                {scores[1].a2 + scores[2].a2 + scores[3].a2}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeScoring;
