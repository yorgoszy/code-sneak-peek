import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Send } from "lucide-react";

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
      setLoadError('Σφάλμα φόρτωσης ring');
      setLoading(false);
      return;
    }

    if (!ringData) {
      setRing(null);
      setMatch(null);
      setLoadError('Το ring δεν βρέθηκε');
      setLoading(false);
      return;
    }

    setRing(ringData);

    if (!ringData.current_match_id) {
      setMatch(null);
      setLoading(false);
      return;
    }

    const { data: matchData, error: matchError } = await supabase
      .from('competition_matches')
      .select('id, match_order, status, athlete1_id, athlete2_id')
      .eq('id', ringData.current_match_id)
      .maybeSingle();

    console.log('🥊 Judge match load:', { matchData, matchError });

    if (matchError) {
      console.error('❌ Judge match load error:', matchError);
      setMatch(null);
      setLoadError('Δεν επιτρέπεται πρόσβαση στον αγώνα');
      setLoading(false);
      return;
    }

    if (matchData) {
      setMatch(matchData as MatchData);
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
    }

    setLoading(false);
  }, [ringId, judgeNumber]);

  useEffect(() => {
    loadRingAndMatch();
  }, [loadRingAndMatch]);

  // Real-time: listen for ring changes (match selection)
  useEffect(() => {
    if (!ringId) return;
    const channel = supabase
      .channel(`judge-ring-${ringId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'competition_rings',
        filter: `id=eq.${ringId}`
      }, () => loadRingAndMatch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ringId, loadRingAndMatch]);

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
      toast.error('Σφάλμα αποθήκευσης');
    } else {
      toast.success(`R${round} αποθηκεύτηκε`);
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
    toast.success('Όλοι οι γύροι αποθηκεύτηκαν');
  };

  const avatar = (a: any) => a?.photo_url || a?.avatar_url || undefined;

  if (!ringId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-semibold">Μη έγκυρο link κριτή</p>
          <p className="text-sm mt-2">Χρησιμοποιήστε το link που σας δόθηκε από τη διοργάνωση</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-background p-3 text-center">
        <h1 className="text-lg font-bold">Κριτής {judgeNumber}</h1>
        <p className="text-xs opacity-70">{ring?.ring_name || `Ring`}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Φόρτωση...</p>
          </div>
        </div>
      ) : !match ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">{loadError || 'Αναμονή για αγώνα...'}</p>
            <p className="text-xs mt-1">Ο αγώνας θα εμφανιστεί αυτόματα</p>
          </div>
        </div>
      ) : (
        <div className="p-3 space-y-4 max-w-md mx-auto">
          {/* Match info */}
          <div className="text-center">
            <Badge variant="outline" className="rounded-none text-xs mb-2">
              Αγώνας #{match.match_order}
            </Badge>
          </div>

          {/* Athletes */}
          <div className="grid grid-cols-2 gap-3">
            {/* Blue corner */}
            <div className="bg-blue-500/10 border border-blue-500/30 p-3 text-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-2" />
              <Avatar className="h-12 w-12 mx-auto mb-1">
                <AvatarImage src={avatar(match.athlete1)} />
                <AvatarFallback>{match.athlete1?.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold truncate">{match.athlete1?.name || 'Μπλε γωνία'}</p>
            </div>
            {/* Red corner */}
            <div className="bg-red-500/10 border border-red-500/30 p-3 text-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-2" />
              <Avatar className="h-12 w-12 mx-auto mb-1">
                <AvatarImage src={avatar(match.athlete2)} />
                <AvatarFallback>{match.athlete2?.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold truncate">{match.athlete2?.name || 'Κόκκινη γωνία'}</p>
            </div>
          </div>

          {/* Scoring per round */}
          {[1, 2, 3].map((round) => (
            <div key={round} className="border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="rounded-none text-xs">Round {round}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none h-7 text-xs"
                  onClick={() => handleSaveRound(round)}
                  disabled={saving}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Αποθήκευση
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-blue-600 font-medium block mb-1">Μπλε γωνία</label>
                  <Input
                    type="number"
                    min={0}
                    value={scores[round].a1 || ''}
                    onChange={(e) => setScores(prev => ({
                      ...prev,
                      [round]: { ...prev[round], a1: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-none h-12 text-xl text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-red-600 font-medium block mb-1">Κόκκινη γωνία</label>
                  <Input
                    type="number"
                    min={0}
                    value={scores[round].a2 || ''}
                    onChange={(e) => setScores(prev => ({
                      ...prev,
                      [round]: { ...prev[round], a2: parseInt(e.target.value) || 0 }
                    }))}
                    className="rounded-none h-12 text-xl text-center font-bold"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="border border-border p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Σύνολο</span>
              <Button
                size="sm"
                className="rounded-none h-8 bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
                onClick={handleSaveAll}
                disabled={saving}
              >
                <Send className="h-3 w-3 mr-1" />
                Αποθήκευση Όλων
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <span className="text-2xl font-bold text-blue-600">
                  {scores[1].a1 + scores[2].a1 + scores[3].a1}
                </span>
              </div>
              <div>
                <span className="text-2xl font-bold text-red-600">
                  {scores[1].a2 + scores[2].a2 + scores[3].a2}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeScoring;
