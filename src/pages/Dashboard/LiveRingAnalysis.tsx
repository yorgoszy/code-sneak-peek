import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { 
  Menu, ArrowLeft, Swords, Shield, Target, Hand, 
  CircleDot, Zap, RotateCcw, Save, Radio, Timer, 
  TrendingUp, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";
import { SyncedYouTubePlayer } from "@/components/federation/SyncedYouTubePlayer";
import { RingCameraBroadcaster } from "@/components/federation/webrtc/RingCameraBroadcaster";
import { VideoOverlayScores } from "@/components/federation/VideoOverlayScores";

type StrikeCategory = 'punch' | 'kick' | 'knee' | 'elbow';
type EventType = 'attack' | 'defense' | 'strike' | 'clinch';

interface AnalysisEvent {
  id: string;
  event_type: EventType;
  strike_type: string | null;
  strike_category: StrikeCategory | null;
  strike_side: string | null;
  is_successful: boolean;
  is_blocked: boolean;
  round_number: number;
  timestamp_seconds: number;
  detection_method: 'manual' | 'ai' | 'hybrid';
}

interface LiveStats {
  totalStrikes: number;
  punches: number;
  kicks: number;
  knees: number;
  elbows: number;
  attacks: number;
  defenses: number;
  successfulStrikes: number;
  blockedStrikes: number;
}

const STRIKE_BUTTONS = [
  { type: 'jab', category: 'punch' as StrikeCategory, label: 'Jab', side: 'left', icon: '👊' },
  { type: 'cross', category: 'punch' as StrikeCategory, label: 'Cross', side: 'right', icon: '🥊' },
  { type: 'hook', category: 'punch' as StrikeCategory, label: 'Hook', side: null, icon: '🪝' },
  { type: 'uppercut', category: 'punch' as StrikeCategory, label: 'Uppercut', side: null, icon: '⬆️' },
  { type: 'roundhouse_kick', category: 'kick' as StrikeCategory, label: 'Roundhouse', side: null, icon: '🦵' },
  { type: 'front_kick', category: 'kick' as StrikeCategory, label: 'Teep', side: null, icon: '🦶' },
  { type: 'low_kick', category: 'kick' as StrikeCategory, label: 'Low Kick', side: null, icon: '⬇️' },
  { type: 'knee', category: 'knee' as StrikeCategory, label: 'Knee', side: null, icon: '🦿' },
  { type: 'elbow', category: 'elbow' as StrikeCategory, label: 'Elbow', side: null, icon: '💪' },
  { type: 'clinch', category: null, label: 'Clinch', side: null, icon: '🤼' },
];

const LiveRingAnalysis: React.FC = () => {
  const { ringId, corner } = useParams<{ ringId: string; corner: string }>();
  const navigate = useNavigate();
  const { isAdmin, isFederation, userProfile } = useRoleCheck();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Ring & match data
  const [ring, setRing] = useState<any>(null);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [athlete, setAthlete] = useState<any>(null);
  const [competitionId, setCompetitionId] = useState<string | null>(null);

  // Analysis state
  const [events, setEvents] = useState<AnalysisEvent[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Live stats
  const [stats, setStats] = useState<LiveStats>({
    totalStrikes: 0, punches: 0, kicks: 0, knees: 0, elbows: 0,
    attacks: 0, defenses: 0, successfulStrikes: 0, blockedStrikes: 0,
  });

  const isCornerRed = corner === 'red';
  const cornerColor = isCornerRed ? 'text-red-500' : 'text-blue-500';
  const cornerBg = isCornerRed ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30';
  const cornerBgSolid = isCornerRed ? 'bg-red-500' : 'bg-blue-500';

  // Load ring data
  const loadRingData = useCallback(async () => {
    if (!ringId) return;
    
    const { data: ringData } = await supabase
      .from('competition_rings')
      .select('*, competition_id')
      .eq('id', ringId)
      .single();

    if (!ringData) return;
    setRing(ringData);
    setCompetitionId(ringData.competition_id);

    if (ringData.current_match_id) {
      const { data: matchData } = await supabase
        .from('competition_matches')
        .select(`
          id, match_order, status, round_number,
          athlete1_id, athlete2_id,
          athlete1:app_users!competition_matches_athlete1_id_fkey(id, name, photo_url, avatar_url),
          athlete2:app_users!competition_matches_athlete2_id_fkey(id, name, photo_url, avatar_url),
          category:federation_competition_categories!competition_matches_category_id_fkey(name)
        `)
        .eq('id', ringData.current_match_id)
        .single();

      if (matchData) {
        setCurrentMatch(matchData);
        const athleteData = isCornerRed ? matchData.athlete1 : matchData.athlete2;
        setAthlete(athleteData);
      }
    }
  }, [ringId, isCornerRed]);

  useEffect(() => { loadRingData(); }, [loadRingData]);

  // Real-time subscription for ring changes
  useEffect(() => {
    if (!ringId) return;
    const channel = supabase
      .channel(`analysis-ring-${ringId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'competition_rings',
        filter: `id=eq.${ringId}`
      }, () => loadRingData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ringId, loadRingData]);

  // Timer
  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now() - (elapsedTime * 1000);
      timerRef.current = window.setInterval(() => {
        setElapsedTime((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  // Recalculate stats when events change
  useEffect(() => {
    const newStats: LiveStats = {
      totalStrikes: 0, punches: 0, kicks: 0, knees: 0, elbows: 0,
      attacks: 0, defenses: 0, successfulStrikes: 0, blockedStrikes: 0,
    };
    events.forEach(e => {
      if (e.event_type === 'attack') newStats.attacks++;
      if (e.event_type === 'defense') newStats.defenses++;
      if (e.event_type === 'strike' || e.strike_category) {
        newStats.totalStrikes++;
        if (e.strike_category === 'punch') newStats.punches++;
        if (e.strike_category === 'kick') newStats.kicks++;
        if (e.strike_category === 'knee') newStats.knees++;
        if (e.strike_category === 'elbow') newStats.elbows++;
        if (e.is_successful) newStats.successfulStrikes++;
        if (e.is_blocked) newStats.blockedStrikes++;
      }
    });
    setStats(newStats);
  }, [events]);

  // Record event
  const recordEvent = useCallback(async (
    eventType: EventType,
    strikeType: string | null = null,
    strikeCategory: StrikeCategory | null = null,
    strikeSide: string | null = null,
    isBlocked = false,
  ) => {
    if (!currentMatch || !athlete || !competitionId || !ringId) {
      toast.error('Δεν υπάρχει ενεργός αγώνας');
      return;
    }

    const newEvent: AnalysisEvent = {
      id: crypto.randomUUID(),
      event_type: eventType,
      strike_type: strikeType,
      strike_category: strikeCategory,
      strike_side: strikeSide,
      is_successful: !isBlocked,
      is_blocked: isBlocked,
      round_number: currentRound,
      timestamp_seconds: elapsedTime,
      detection_method: 'manual',
    };

    setEvents(prev => [...prev, newEvent]);

    // Save to DB
    const { error } = await supabase.from('competition_match_analysis').insert({
      competition_id: competitionId,
      match_id: currentMatch.id,
      ring_id: ringId,
      athlete_id: athlete.id,
      corner: corner || 'red',
      round_number: currentRound,
      timestamp_seconds: elapsedTime,
      event_type: eventType,
      strike_type: strikeType,
      strike_category: strikeCategory,
      strike_side: strikeSide,
      is_successful: !isBlocked,
      is_blocked: isBlocked,
      confidence: 1.0,
      detection_method: 'manual',
      created_by: userProfile?.id,
    });

    if (error) {
      console.error('Error saving event:', error);
    }
  }, [currentMatch, athlete, competitionId, ringId, corner, currentRound, elapsedTime, userProfile]);

  // Save summary stats
  const saveStats = useCallback(async () => {
    if (!currentMatch || !athlete || !competitionId) return;

    const { error } = await supabase.from('competition_match_stats').upsert({
      competition_id: competitionId,
      match_id: currentMatch.id,
      athlete_id: athlete.id,
      corner: corner || 'red',
      total_strikes: stats.totalStrikes,
      total_punches: stats.punches,
      total_kicks: stats.kicks,
      total_knees: stats.knees,
      total_elbows: stats.elbows,
      total_attacks: stats.attacks,
      total_defenses: stats.defenses,
      successful_strikes: stats.successfulStrikes,
      blocked_strikes: stats.blockedStrikes,
      strike_accuracy: stats.totalStrikes > 0 ? (stats.successfulStrikes / stats.totalStrikes) : 0,
    }, { onConflict: 'match_id,athlete_id' });

    if (error) {
      toast.error('Σφάλμα αποθήκευσης στατιστικών');
      console.error(error);
    } else {
      toast.success('Στατιστικά αποθηκεύτηκαν');
    }
  }, [currentMatch, athlete, competitionId, corner, stats]);

  // Undo last event
  const undoLastEvent = useCallback(async () => {
    if (events.length === 0) return;
    const last = events[events.length - 1];
    setEvents(prev => prev.slice(0, -1));
    
    // Delete from DB (best effort)
    await supabase.from('competition_match_analysis')
      .delete()
      .eq('match_id', currentMatch?.id)
      .eq('athlete_id', athlete?.id)
      .eq('timestamp_seconds', last.timestamp_seconds)
      .eq('event_type', last.event_type);
  }, [events, currentMatch, athlete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSidebar = () => {
    if (isFederation()) return <FederationSidebar />;
    return <FederationSidebar />;
  };

  const ringLabel = ring?.ring_name || (ring ? `Ring ${String.fromCharCode(64 + ring.ring_number)}` : 'Ring');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">{renderSidebar()}</div>

        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Video Analysis</h1>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-none">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <main className="flex-1 p-3 lg:p-4 overflow-auto">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-none">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Πίσω
                </Button>
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Live Video Analysis — {ringLabel}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Γωνία: <span className={`font-semibold ${cornerColor}`}>{isCornerRed ? 'Κόκκινη (Red)' : 'Μπλε (Blue)'}</span>
                  </p>
                </div>
              </div>
              {isRecording && (
                <Badge className="rounded-none bg-destructive text-destructive-foreground animate-pulse">
                  <Radio className="h-3 w-3 mr-1" />
                  REC · {formatTime(elapsedTime)}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              {/* LEFT: Video + Athlete Info */}
              <div className="xl:col-span-2 space-y-3">
                {/* Athlete Card */}
                {athlete && (
                  <Card className={`rounded-none border ${cornerBg}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={athlete.photo_url || athlete.avatar_url} />
                        <AvatarFallback className={`${cornerBgSolid} text-white text-sm`}>
                          {athlete.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{athlete.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Αγώνας #{currentMatch?.match_order} · {currentMatch?.category?.name || ''}
                        </p>
                      </div>
                      <Badge variant="outline" className={`rounded-none ${isCornerRed ? 'border-red-500 text-red-500' : 'border-blue-500 text-blue-500'}`}>
                        {isCornerRed ? 'RED' : 'BLUE'}
                      </Badge>
                    </CardContent>
                  </Card>
                )}

                {/* Live Video */}
                <Card className="rounded-none overflow-hidden">
                  <CardContent className="p-0">
                    {ring && (ring.youtube_live_url || ring.source_type === 'camera') ? (
                      <div className="relative bg-black">
                        <AspectRatio ratio={16 / 9}>
                          {ring.source_type === 'camera' ? (
                            <RingCameraBroadcaster ringId={ring.id} deviceId={ring.camera_device_id} className="w-full h-full object-cover" />
                          ) : (
                            <SyncedYouTubePlayer
                              ringId={ring.id}
                              videoUrl={ring.youtube_live_url}
                              mode="broadcaster"
                              controls={1}
                              className="w-full h-full"
                            />
                          )}
                        </AspectRatio>
                        {currentMatch && (
                          <VideoOverlayScores 
                            matchId={currentMatch.id} 
                            ringId={ring.id}
                            match={currentMatch}
                            ringLabel={ringLabel}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="bg-muted/50 flex items-center justify-center h-48">
                        <p className="text-sm text-muted-foreground">Δεν υπάρχει ενεργό βίντεο</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recording Controls */}
                <Card className="rounded-none">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        onClick={() => setIsRecording(!isRecording)}
                        className={`rounded-none ${isRecording ? 'bg-destructive hover:bg-destructive/90' : 'bg-[#00ffba] hover:bg-[#00ffba]/90 text-black'}`}
                      >
                        {isRecording ? (
                          <><Radio className="h-4 w-4 mr-2 animate-pulse" />Παύση</>
                        ) : (
                          <><Radio className="h-4 w-4 mr-2" />Εκκίνηση</>
                        )}
                      </Button>

                      <div className="flex items-center gap-1 border border-border px-2 py-1">
                        <Timer className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Γύρος:</span>
                        <Button variant="outline" size="sm" className="rounded-none h-7 w-7 p-0" 
                          disabled={currentRound <= 1} onClick={() => setCurrentRound(r => r - 1)}>−</Button>
                        <span className="text-sm font-bold px-1">{currentRound}</span>
                        <Button variant="outline" size="sm" className="rounded-none h-7 w-7 p-0" 
                          onClick={() => setCurrentRound(r => r + 1)}>+</Button>
                      </div>

                      <Button variant="outline" size="sm" className="rounded-none" onClick={undoLastEvent} disabled={events.length === 0}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Undo
                      </Button>

                      <Button variant="outline" size="sm" className="rounded-none" onClick={saveStats}>
                        <Save className="h-3 w-3 mr-1" />
                        Αποθήκευση
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT: Strike Buttons + Live Stats */}
              <div className="space-y-3">
                {/* Quick Action Buttons */}
                <Card className="rounded-none">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Swords className="h-4 w-4" />
                      Επίθεση / Άμυνα
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="rounded-none border-red-500/50 text-red-600 hover:bg-red-500/10 h-12"
                        onClick={() => recordEvent('attack')}
                        disabled={!isRecording}
                      >
                        <Swords className="h-4 w-4 mr-2" />
                        Επίθεση
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-none border-blue-500/50 text-blue-600 hover:bg-blue-500/10 h-12"
                        onClick={() => recordEvent('defense')}
                        disabled={!isRecording}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Άμυνα
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Strike Buttons */}
                <Card className="rounded-none">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Χτυπήματα
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-2 gap-1.5">
                      {STRIKE_BUTTONS.map((btn) => (
                        <Button
                          key={btn.type}
                          variant="outline"
                          size="sm"
                          className="rounded-none h-10 text-xs justify-start"
                          onClick={() => recordEvent(
                            btn.category ? 'strike' : 'clinch',
                            btn.type,
                            btn.category,
                            btn.side,
                          )}
                          disabled={!isRecording}
                        >
                          <span className="mr-1.5">{btn.icon}</span>
                          {btn.label}
                        </Button>
                      ))}
                    </div>

                    {/* Blocked strike */}
                    <Separator className="my-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none w-full h-9 text-xs border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                      onClick={() => recordEvent('defense', 'block', null, null, true)}
                      disabled={!isRecording}
                    >
                      <Shield className="h-3 w-3 mr-1.5" />
                      Μπλοκαρισμένο χτύπημα
                    </Button>
                  </CardContent>
                </Card>

                {/* Live Stats */}
                <Card className="rounded-none">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Live Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="border border-border p-2 text-center">
                        <p className="text-lg font-bold text-foreground">{stats.totalStrikes}</p>
                        <p className="text-muted-foreground">Σύνολο</p>
                      </div>
                      <div className="border border-border p-2 text-center">
                        <p className="text-lg font-bold text-[#00ffba]">
                          {stats.totalStrikes > 0 ? Math.round((stats.successfulStrikes / stats.totalStrikes) * 100) : 0}%
                        </p>
                        <p className="text-muted-foreground">Ακρίβεια</p>
                      </div>
                      <div className="border border-border p-2 text-center">
                        <p className="text-lg font-bold text-red-500">{stats.attacks}</p>
                        <p className="text-muted-foreground">Επιθέσεις</p>
                      </div>
                      <div className="border border-border p-2 text-center">
                        <p className="text-lg font-bold text-blue-500">{stats.defenses}</p>
                        <p className="text-muted-foreground">Άμυνες</p>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-4 gap-1 text-xs text-center">
                      <div className="p-1.5 border border-border">
                        <p className="font-bold">{stats.punches}</p>
                        <p className="text-[10px] text-muted-foreground">Μπουνιές</p>
                      </div>
                      <div className="p-1.5 border border-border">
                        <p className="font-bold">{stats.kicks}</p>
                        <p className="text-[10px] text-muted-foreground">Κλωτσιές</p>
                      </div>
                      <div className="p-1.5 border border-border">
                        <p className="font-bold">{stats.knees}</p>
                        <p className="text-[10px] text-muted-foreground">Γόνατα</p>
                      </div>
                      <div className="p-1.5 border border-border">
                        <p className="font-bold">{stats.elbows}</p>
                        <p className="text-[10px] text-muted-foreground">Αγκώνες</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Events Log */}
                <Card className="rounded-none">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm">Πρόσφατα Events ({events.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 max-h-48 overflow-y-auto">
                    {events.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Πατήστε Εκκίνηση και καταγράψτε events
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {[...events].reverse().slice(0, 20).map((e) => (
                          <div key={e.id} className="flex items-center justify-between text-xs border-b border-border py-1">
                            <div className="flex items-center gap-1.5">
                              {e.event_type === 'attack' && <Swords className="h-3 w-3 text-red-500" />}
                              {e.event_type === 'defense' && <Shield className="h-3 w-3 text-blue-500" />}
                              {e.event_type === 'strike' && <Target className="h-3 w-3 text-[#00ffba]" />}
                              {e.event_type === 'clinch' && <Hand className="h-3 w-3 text-amber-500" />}
                              <span className="font-medium">
                                {e.strike_type || e.event_type}
                              </span>
                              {e.is_blocked && <Badge variant="outline" className="rounded-none text-[8px] px-1 py-0">BLK</Badge>}
                            </div>
                            <span className="text-muted-foreground font-mono">
                              R{e.round_number} · {formatTime(e.timestamp_seconds)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default LiveRingAnalysis;
