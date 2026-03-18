import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Menu, ArrowLeft, Swords, Shield, Target, 
  RotateCcw, Save, Radio, Timer, 
  TrendingUp, Activity, Square, Radio
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";
import { SyncedYouTubePlayer } from "@/components/federation/SyncedYouTubePlayer";
import { RingCameraBroadcaster } from "@/components/federation/webrtc/RingCameraBroadcaster";
import { VideoOverlayScores } from "@/components/federation/VideoOverlayScores";
import { ActivityBalanceBar } from "@/components/federation/live-analysis/ActivityBalanceBar";
import { FightTimelineChart } from "@/components/video-analysis/FightTimelineChart";
import { RoundTimelineData } from '@/hooks/useFightStats';
import type { ActionPhase, PhaseType, StrikeCategory, StrikeEvent, RoundData } from '@/components/federation/live-analysis/types';
import { STRIKE_BUTTONS } from '@/components/federation/live-analysis/types';

const LiveRingAnalysis: React.FC = () => {
  const { ringId, corner } = useParams<{ ringId: string; corner: string }>();
  const navigate = useNavigate();
  const { isAdmin, isFederation, userProfile } = useRoleCheck();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Ring & match data
  const [ring, setRing] = useState<any>(null);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [athlete, setAthlete] = useState<any>(null);
  const [competitionId, setCompetitionId] = useState<string | null>(null);

  // Ring timer state (synced from ring)
  const [currentRound, setCurrentRound] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedBaseRef = useRef<number>(0); // accumulated elapsed when timer was last paused
  const lastRunSinceRef = useRef<string | null>(null);
  const lastRemainingRef = useRef<number | null>(null);

  // Phase-based analysis: periods of attack/defense with strikes inside
  const [phases, setPhases] = useState<ActionPhase[]>([]);
  const [activePhase, setActivePhase] = useState<ActionPhase | null>(null);

  const isCornerRed = corner === 'red';
  const cornerColor = isCornerRed ? 'text-red-500' : 'text-blue-500';
  const cornerBg = isCornerRed ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30';
  const cornerBgSolid = isCornerRed ? 'bg-red-500' : 'bg-blue-500';

  // ─── Load ring data ───
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
        setAthlete(isCornerRed ? matchData.athlete1 : matchData.athlete2);
      }
    }
  }, [ringId, isCornerRed]);

  useEffect(() => { loadRingData(); }, [loadRingData]);

  // Real-time ring subscription
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

  // ─── Sync with ring timer ───
  const applyRingTimer = useCallback((data: any) => {
    if (!data) return;
    const round = data.timer_current_round ?? 1;
    const isBrk = data.timer_is_break ?? false;
    const runningSince = data.timer_running_since ?? null;
    const remaining = data.timer_remaining_seconds ?? null;

    setCurrentRound(round);
    setIsBreak(isBrk);

    const timerIsRunning = !!runningSince && !isBrk;
    
    // Track when timer starts/stops to accumulate elapsed
    if (timerIsRunning && !isRecording) {
      // Timer just started - save current elapsed as base
      elapsedBaseRef.current = elapsedTime;
      lastRunSinceRef.current = runningSince;
      lastRemainingRef.current = remaining;
    }
    
    if (!timerIsRunning && isRecording && activePhase) {
      // Timer stopped - close any active phase
      const closed = { ...activePhase, endTime: elapsedTime };
      setPhases(prev => prev.map(p => p.id === closed.id ? closed : p));
      setActivePhase(null);
    }

    setIsRecording(timerIsRunning);
  }, [isRecording, elapsedTime, activePhase]);

  // Poll ring timer (like VideoOverlayScores)
  useEffect(() => {
    if (!ringId) return;
    let active = true;
    
    const poll = async () => {
      const { data } = await supabase
        .from('competition_rings')
        .select('timer_current_round, timer_is_break, timer_remaining_seconds, timer_running_since')
        .eq('id', ringId)
        .maybeSingle();
      if (active && data) applyRingTimer(data);
      if (active) setTimeout(poll, 500);
    };
    poll();
    
    return () => { active = false; };
  }, [ringId, applyRingTimer]);

  // Realtime ring timer subscription
  useEffect(() => {
    if (!ringId) return;
    const channel = supabase
      .channel(`analysis-timer-${ringId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'competition_rings',
        filter: `id=eq.${ringId}`
      }, (payload) => applyRingTimer(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ringId, applyRingTimer]);

  // Local elapsed time counter - runs when isRecording
  useEffect(() => {
    if (!isRecording || !lastRunSinceRef.current) return;
    const base = elapsedBaseRef.current;
    const runStart = new Date(lastRunSinceRef.current).getTime();
    
    const interval = setInterval(() => {
      const sinceStart = (Date.now() - runStart) / 1000;
      setElapsedTime(base + sinceStart);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRecording]);

  // ─── Start a phase (attack or defense) ───
  const startPhase = useCallback((type: PhaseType) => {
    if (!isRecording) return;

    // Close any active phase first
    if (activePhase) {
      const closedPhase = { ...activePhase, endTime: elapsedTime };
      setPhases(prev => prev.map(p => p.id === closedPhase.id ? closedPhase : p));
      setActivePhase(null);
    }

    const newPhase: ActionPhase = {
      id: crypto.randomUUID(),
      type,
      roundNumber: currentRound,
      startTime: elapsedTime,
      endTime: null,
      strikes: [],
    };
    setPhases(prev => [...prev, newPhase]);
    setActivePhase(newPhase);
  }, [isRecording, activePhase, elapsedTime, currentRound]);

  // ─── End current phase ───
  const endPhase = useCallback(() => {
    if (!activePhase) return;
    const closed = { ...activePhase, endTime: elapsedTime };
    setPhases(prev => prev.map(p => p.id === closed.id ? closed : p));
    setActivePhase(null);
  }, [activePhase, elapsedTime]);

  // ─── Record a strike (only within an active phase) ───
  const recordStrike = useCallback((
    strikeType: string,
    category: StrikeCategory | null,
    side: string | null,
  ) => {
    if (!activePhase || !isRecording) {
      toast.error('Ξεκίνα πρώτα Επίθεση ή Άμυνα');
      return;
    }

    const strike: StrikeEvent = {
      id: crypto.randomUUID(),
      strikeType,
      category,
      side,
      timestamp: elapsedTime,
    };

    const updated = { ...activePhase, strikes: [...activePhase.strikes, strike] };
    setActivePhase(updated);
    setPhases(prev => prev.map(p => p.id === updated.id ? updated : p));
  }, [activePhase, isRecording, elapsedTime]);

  // ─── Undo last action ───
  const undoLast = useCallback(() => {
    if (activePhase && activePhase.strikes.length > 0) {
      // Remove last strike from active phase
      const updated = { ...activePhase, strikes: activePhase.strikes.slice(0, -1) };
      setActivePhase(updated);
      setPhases(prev => prev.map(p => p.id === updated.id ? updated : p));
    } else if (activePhase) {
      // Cancel active phase
      setPhases(prev => prev.filter(p => p.id !== activePhase.id));
      setActivePhase(null);
    } else if (phases.length > 0) {
      // Remove last completed phase
      setPhases(prev => prev.slice(0, -1));
    }
  }, [activePhase, phases]);

  // ─── Compute round stats ───
  const roundStats: RoundData[] = useMemo(() => {
    const roundNumbers = [...new Set(phases.map(p => p.roundNumber))].sort((a, b) => a - b);
    return roundNumbers.map(rn => {
      const roundPhases = phases.filter(p => p.roundNumber === rn);
      let attackSec = 0, defenseSec = 0;
      let attackStrikes = 0, defenseStrikes = 0;
      let punches = 0, kicks = 0, knees = 0, elbows = 0;

      roundPhases.forEach(p => {
        const dur = (p.endTime ?? elapsedTime) - p.startTime;
        if (p.type === 'attack') {
          attackSec += dur;
          attackStrikes += p.strikes.length;
        } else {
          defenseSec += dur;
          defenseStrikes += p.strikes.length;
        }
        p.strikes.forEach(s => {
          if (s.category === 'punch') punches++;
          if (s.category === 'kick') kicks++;
          if (s.category === 'knee') knees++;
          if (s.category === 'elbow') elbows++;
        });
      });

      return {
        roundNumber: rn,
        attackSeconds: attackSec,
        defenseSeconds: defenseSec,
        totalStrikes: attackStrikes + defenseStrikes,
        attackStrikes,
        defenseStrikes,
        punches, kicks, knees, elbows,
      };
    });
  }, [phases, elapsedTime]);

  // ─── Total stats ───
  const totalStats = useMemo(() => {
    return roundStats.reduce((acc, r) => ({
      attackSeconds: acc.attackSeconds + r.attackSeconds,
      defenseSeconds: acc.defenseSeconds + r.defenseSeconds,
      totalStrikes: acc.totalStrikes + r.totalStrikes,
      attackStrikes: acc.attackStrikes + r.attackStrikes,
      defenseStrikes: acc.defenseStrikes + r.defenseStrikes,
      punches: acc.punches + r.punches,
      kicks: acc.kicks + r.kicks,
      knees: acc.knees + r.knees,
      elbows: acc.elbows + r.elbows,
    }), {
      attackSeconds: 0, defenseSeconds: 0,
      totalStrikes: 0, attackStrikes: 0, defenseStrikes: 0,
      punches: 0, kicks: 0, knees: 0, elbows: 0,
    });
  }, [roundStats]);

  // ─── Timeline data for FightTimelineChart ───
  const roundsTimelineData: RoundTimelineData[] = useMemo(() => {
    if (phases.length === 0) return [];
    const roundNumbers = [...new Set(phases.map(p => p.roundNumber))].sort((a, b) => a - b);
    return roundNumbers.map(rn => {
      const roundPhases = phases.filter(p => p.roundNumber === rn);
      const allStrikes = roundPhases.flatMap(p => p.strikes.map(s => ({ ...s, phaseType: p.type })));
      const maxTime = Math.max(...roundPhases.map(p => p.endTime ?? elapsedTime), 0);
      const intervalSec = 30;
      const intervals = Math.max(Math.ceil(maxTime / intervalSec), 1);
      const data = [];
      for (let i = 0; i < intervals; i++) {
        const start = i * intervalSec;
        const end = (i + 1) * intervalSec;
        const mins = Math.floor(start / 60);
        const secs = start % 60;
        const intervalStrikes = allStrikes.filter(s => s.timestamp >= start && s.timestamp < end);
        data.push({
          time: `${mins}:${secs.toString().padStart(2, '0')}`,
          timeSeconds: start,
          strikes: intervalStrikes.filter(s => s.phaseType === 'attack').length,
          defenses: intervalStrikes.filter(s => s.phaseType === 'defense').length,
          attacks: intervalStrikes.filter(s => s.phaseType === 'attack').length,
        });
      }
      return { roundNumber: rn, duration: maxTime, data };
    });
  }, [phases, elapsedTime]);

  // ─── Save to DB ───
  const saveAnalysis = useCallback(async () => {
    if (!currentMatch || !athlete || !competitionId || !ringId) return;

    // Save each phase as events
    for (const phase of phases) {
      const dur = (phase.endTime ?? elapsedTime) - phase.startTime;
      // Save phase event
      await supabase.from('competition_match_analysis').insert({
        competition_id: competitionId,
        match_id: currentMatch.id,
        ring_id: ringId,
        athlete_id: athlete.id,
        corner: corner || 'red',
        round_number: phase.roundNumber,
        timestamp_seconds: phase.startTime,
        event_type: phase.type,
        strike_type: null,
        strike_category: null,
        is_successful: true,
        is_blocked: false,
        confidence: 1.0,
        detection_method: 'manual',
        created_by: userProfile?.id,
      });

      // Save each strike
      for (const s of phase.strikes) {
        await supabase.from('competition_match_analysis').insert({
          competition_id: competitionId,
          match_id: currentMatch.id,
          ring_id: ringId,
          athlete_id: athlete.id,
          corner: corner || 'red',
          round_number: phase.roundNumber,
          timestamp_seconds: s.timestamp,
          event_type: 'strike',
          strike_type: s.strikeType,
          strike_category: s.category,
          strike_side: s.side,
          is_successful: phase.type === 'attack',
          is_blocked: phase.type === 'defense',
          confidence: 1.0,
          detection_method: 'manual',
          created_by: userProfile?.id,
        });
      }
    }

    // Save summary stats
    await supabase.from('competition_match_stats').upsert({
      competition_id: competitionId,
      match_id: currentMatch.id,
      athlete_id: athlete.id,
      corner: corner || 'red',
      total_strikes: totalStats.totalStrikes,
      total_punches: totalStats.punches,
      total_kicks: totalStats.kicks,
      total_knees: totalStats.knees,
      total_elbows: totalStats.elbows,
      total_attacks: totalStats.attackStrikes,
      total_defenses: totalStats.defenseStrikes,
      successful_strikes: totalStats.attackStrikes,
      blocked_strikes: totalStats.defenseStrikes,
      strike_accuracy: totalStats.totalStrikes > 0 ? (totalStats.attackStrikes / totalStats.totalStrikes) : 0,
    }, { onConflict: 'match_id,athlete_id' });

    toast.success('Ανάλυση αποθηκεύτηκε');
  }, [phases, currentMatch, athlete, competitionId, ringId, corner, userProfile, elapsedTime, totalStats]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSidebar = () => (
    <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

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
                <h1 className="text-lg font-semibold">Live Analysis</h1>
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
                  <ArrowLeft className="h-4 w-4 mr-2" />Πίσω
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
                  <Radio className="h-3 w-3 mr-1" />REC · {formatTime(elapsedTime)}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              {/* LEFT: Video + Controls + Timeline */}
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

                {/* Recording Controls - synced with ring timer */}
                <Card className="rounded-none">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Recording status indicator */}
                      <div className={`flex items-center gap-1.5 border px-3 py-1.5 ${
                        isRecording 
                          ? 'border-destructive bg-destructive/10' 
                          : isBreak 
                            ? 'border-amber-500 bg-amber-500/10' 
                            : 'border-border'
                      }`}>
                        {isRecording ? (
                          <Radio className="h-3 w-3 text-destructive animate-pulse" />
                        ) : isBreak ? (
                          <Timer className="h-3 w-3 text-amber-500" />
                        ) : (
                          <Square className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-xs font-medium">
                          {isRecording ? 'REC' : isBreak ? 'BREAK' : 'Αναμονή'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 border border-border px-2 py-1">
                        <Timer className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
                      </div>

                      <div className="flex items-center gap-1 border border-border px-2 py-1">
                        <span className="text-xs text-muted-foreground">Γύρος:</span>
                        <span className="text-sm font-bold">{currentRound}</span>
                      </div>

                      <Button variant="outline" size="sm" className="rounded-none" onClick={undoLast}
                        disabled={phases.length === 0 && !activePhase}>
                        <RotateCcw className="h-3 w-3 mr-1" />Undo
                      </Button>

                      <Button variant="outline" size="sm" className="rounded-none" onClick={saveAnalysis}>
                        <Save className="h-3 w-3 mr-1" />Αποθήκευση
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Balance Bars */}
                <Card className="rounded-none">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Ισορροπία Επίθεσης / Άμυνας
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-3">
                    {/* Per-round bars */}
                    {roundStats.map(r => (
                      <ActivityBalanceBar
                        key={r.roundNumber}
                        attackSeconds={r.attackSeconds}
                        defenseSeconds={r.defenseSeconds}
                        label={`Γύρος ${r.roundNumber} — ${r.totalStrikes} χτυπ.`}
                      />
                    ))}
                    {/* Total bar */}
                    {roundStats.length > 0 && (
                      <>
                        <Separator />
                        <ActivityBalanceBar
                          attackSeconds={totalStats.attackSeconds}
                          defenseSeconds={totalStats.defenseSeconds}
                          label={`Σύνολο Αγώνα — ${totalStats.totalStrikes} χτυπ.`}
                          className="font-semibold"
                        />
                      </>
                    )}
                    {roundStats.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Δεν υπάρχουν δεδομένα ακόμα
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline Chart */}
                <FightTimelineChart roundsData={roundsTimelineData} loading={false} />
              </div>

              {/* RIGHT: Phase controls + Strikes + Stats */}
              <div className="space-y-3">
                {/* Phase Controls (Attack / Defense toggle) */}
                <Card className="rounded-none">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Swords className="h-4 w-4" />
                      Φάση Δράσης
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    {/* Current phase indicator */}
                    {activePhase && (
                      <div className={`flex items-center justify-between p-2 border ${activePhase.type === 'attack' ? 'border-red-500/50 bg-red-500/10' : 'border-blue-500/50 bg-blue-500/10'}`}>
                        <div className="flex items-center gap-2">
                          {activePhase.type === 'attack' ? (
                            <Swords className="h-4 w-4 text-red-500 animate-pulse" />
                          ) : (
                            <Shield className="h-4 w-4 text-blue-500 animate-pulse" />
                          )}
                          <span className="text-xs font-bold">
                            {activePhase.type === 'attack' ? 'ΕΠΙΘΕΣΗ' : 'ΑΜΥΝΑ'} σε εξέλιξη
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatTime(elapsedTime - activePhase.startTime)}
                          </span>
                        </div>
                        <Button
                          variant="outline" size="sm" className="rounded-none h-7 text-xs"
                          onClick={endPhase}
                        >
                          <Square className="h-3 w-3 mr-1" />Τέλος
                        </Button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={activePhase?.type === 'attack' ? 'default' : 'outline'}
                        className={`rounded-none h-14 ${
                          activePhase?.type === 'attack'
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'border-red-500/50 text-red-600 hover:bg-red-500/10'
                        }`}
                        onClick={() => activePhase?.type === 'attack' ? endPhase() : startPhase('attack')}
                        disabled={!isRecording}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Swords className="h-5 w-5" />
                          <span className="text-xs font-bold">
                            {activePhase?.type === 'attack' ? 'ΤΕΛΟΣ ⚔' : 'Επίθεση'}
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant={activePhase?.type === 'defense' ? 'default' : 'outline'}
                        className={`rounded-none h-14 ${
                          activePhase?.type === 'defense'
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'border-blue-500/50 text-blue-600 hover:bg-blue-500/10'
                        }`}
                        onClick={() => activePhase?.type === 'defense' ? endPhase() : startPhase('defense')}
                        disabled={!isRecording}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Shield className="h-5 w-5" />
                          <span className="text-xs font-bold">
                            {activePhase?.type === 'defense' ? 'ΤΕΛΟΣ 🛡' : 'Άμυνα'}
                          </span>
                        </div>
                      </Button>
                    </div>

                    {!activePhase && isRecording && (
                      <p className="text-[10px] text-muted-foreground text-center">
                        Πάτα Επίθεση ή Άμυνα για να ξεκινήσεις φάση
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Strike Buttons (only active during a phase) */}
                <Card className={`rounded-none transition-opacity ${activePhase ? 'opacity-100' : 'opacity-40'}`}>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Χτυπήματα
                      {activePhase && (
                        <Badge variant="outline" className={`rounded-none text-[9px] ml-auto ${
                          activePhase.type === 'attack' ? 'border-red-500/50 text-red-500' : 'border-blue-500/50 text-blue-500'
                        }`}>
                          μέσα σε {activePhase.type === 'attack' ? 'Επίθεση' : 'Άμυνα'}
                        </Badge>
                      )}
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
                          onClick={() => recordStrike(btn.type, btn.category, btn.side)}
                          disabled={!activePhase}
                        >
                          <span className="mr-1.5">{btn.icon}</span>
                          {btn.label}
                          {/* Show count in active phase */}
                          {activePhase && (() => {
                            const count = activePhase.strikes.filter(s => s.strikeType === btn.type).length;
                            return count > 0 ? (
                              <Badge variant="secondary" className="rounded-none ml-auto text-[9px] h-4 px-1">
                                {count}
                              </Badge>
                            ) : null;
                          })()}
                        </Button>
                      ))}
                    </div>
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
                        <p className="text-lg font-bold text-foreground">{totalStats.totalStrikes}</p>
                        <p className="text-muted-foreground">Σύνολο Χτυπ.</p>
                      </div>
                      <div className="border border-border p-2 text-center">
                        <p className="text-lg font-bold text-foreground">{formatTime(totalStats.attackSeconds + totalStats.defenseSeconds)}</p>
                        <p className="text-muted-foreground">Ενεργός Χρόνος</p>
                      </div>
                      <div className="border border-border p-2 text-center">
                        <p className="text-lg font-bold text-red-500">{totalStats.attackStrikes}</p>
                        <p className="text-muted-foreground">Επιθ. Χτυπ.</p>
                      </div>
                      <div className="border border-border p-2 text-center">
                        <p className="text-lg font-bold text-blue-500">{totalStats.defenseStrikes}</p>
                        <p className="text-muted-foreground">Αμυντ. Χτυπ.</p>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-4 gap-1 text-xs text-center">
                      <div className="p-1.5 border border-border">
                        <p className="font-bold">{totalStats.punches}</p>
                        <p className="text-[10px] text-muted-foreground">Μπουνιές</p>
                      </div>
                      <div className="p-1.5 border border-border">
                        <p className="font-bold">{totalStats.kicks}</p>
                        <p className="text-[10px] text-muted-foreground">Κλωτσιές</p>
                      </div>
                      <div className="p-1.5 border border-border">
                        <p className="font-bold">{totalStats.knees}</p>
                        <p className="text-[10px] text-muted-foreground">Γόνατα</p>
                      </div>
                      <div className="p-1.5 border border-border">
                        <p className="font-bold">{totalStats.elbows}</p>
                        <p className="text-[10px] text-muted-foreground">Αγκώνες</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Phase Log */}
                <Card className="rounded-none">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm">Φάσεις ({phases.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 max-h-48 overflow-y-auto">
                    {phases.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Ξεκίνα καταγραφή φάσεων
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {[...phases].reverse().slice(0, 20).map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs border-b border-border py-1">
                            <div className="flex items-center gap-1.5">
                              {p.type === 'attack' ? (
                                <Swords className="h-3 w-3 text-red-500" />
                              ) : (
                                <Shield className="h-3 w-3 text-blue-500" />
                              )}
                              <span className="font-medium">
                                {p.type === 'attack' ? 'Επίθεση' : 'Άμυνα'}
                              </span>
                              <Badge variant="outline" className="rounded-none text-[8px] px-1 py-0">
                                {p.strikes.length} χτυπ.
                              </Badge>
                              {!p.endTime && (
                                <Badge className="rounded-none text-[8px] px-1 py-0 bg-destructive text-destructive-foreground animate-pulse">
                                  LIVE
                                </Badge>
                              )}
                            </div>
                            <span className="text-muted-foreground font-mono text-[10px]">
                              R{p.roundNumber} · {formatTime(p.startTime)}–{p.endTime ? formatTime(p.endTime) : '...'}
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
