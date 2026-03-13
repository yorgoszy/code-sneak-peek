import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, Radio, Monitor, Maximize } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { ReadOnlyRingScoreboard } from "@/components/federation/ReadOnlyRingScoreboard";
import { VideoOverlayScores } from "@/components/federation/VideoOverlayScores";
import { SyncedYouTubePlayer } from "@/components/federation/SyncedYouTubePlayer";
import { RingCameraViewer } from "@/components/federation/webrtc/RingCameraViewer";

const getRingLetter = (num: number) => String.fromCharCode(64 + num);

interface Match {
  id: string;
  match_order: number | null;
  match_number: number;
  round_number: number;
  status: string;
  athlete1?: { name: string } | null;
  athlete2?: { name: string } | null;
  athlete1_id?: string | null;
  athlete2_id?: string | null;
  winner_id?: string | null;
  athlete1_display?: string;
  athlete2_display?: string;
  category_id: string;
  category?: { name: string; gender?: string; min_age?: number | null; max_age?: number | null; min_weight?: number | null; max_weight?: number | null } | null;
}

const CoachLivePage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const { t } = useTranslation();

  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompId, setSelectedCompId] = useState(() => localStorage.getItem('coach-live-comp') || '');
  const [rings, setRings] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  const clubId = userProfile?.role === 'coach' ? userProfile?.id : userProfile?.coach_id;

  useEffect(() => {
    if (!clubId) return;
    const load = async () => {
      const { data: fedLinks } = await supabase
        .from('federation_clubs')
        .select('federation_id')
        .eq('club_id', clubId);
      if (!fedLinks?.length) return;
      const federationIds = [...new Set(fedLinks.map(f => f.federation_id))];
      const { data } = await supabase
        .from('federation_competitions')
        .select('id, name, competition_date, status')
        .in('federation_id', federationIds)
        .order('competition_date', { ascending: false });
      setCompetitions(data || []);
    };
    load();
  }, [clubId]);

  const loadRings = useCallback(async () => {
    if (!selectedCompId) return;
    setLoading(true);
    const { data } = await supabase
      .from('competition_rings')
      .select('*')
      .eq('competition_id', selectedCompId)
      .order('ring_number');

    const ringsData = data || [];
    const enriched = await Promise.all(ringsData.map(async (ring: any) => {
      if (!ring.current_match_id) return { ...ring, current_match: null };
      const { data: matchData } = await supabase
        .from('competition_matches')
        .select(`
          id, match_order, status,
          athlete1:app_users!competition_matches_athlete1_id_fkey(name, photo_url, avatar_url),
          athlete2:app_users!competition_matches_athlete2_id_fkey(name, photo_url, avatar_url),
          athlete1_club:app_users!competition_matches_athlete1_club_id_fkey(name),
          athlete2_club:app_users!competition_matches_athlete2_club_id_fkey(name),
          category:federation_competition_categories!competition_matches_category_id_fkey(name)
        `)
        .eq('id', ring.current_match_id)
        .single();
      return { ...ring, current_match: matchData };
    }));

    setRings(enriched);
    setLoading(false);
  }, [selectedCompId]);

  const loadMatches = useCallback(async () => {
    if (!selectedCompId) return;
    const { data } = await supabase
      .from('competition_matches')
      .select(`
        id, match_order, match_number, round_number, status, category_id, athlete1_id, athlete2_id, winner_id,
        athlete1:app_users!competition_matches_athlete1_id_fkey(name),
        athlete2:app_users!competition_matches_athlete2_id_fkey(name),
        category:federation_competition_categories!competition_matches_category_id_fkey(name, gender, min_age, max_age, min_weight, max_weight)
      `)
      .eq('competition_id', selectedCompId)
      .eq('is_bye', false)
      .order('match_order');
    
    const allMatches = (data as any) || [];
    
    const { data: byeData } = await supabase
      .from('competition_matches')
      .select('id, match_order, match_number, round_number, category_id, athlete1_id, winner_id, athlete1:app_users!competition_matches_athlete1_id_fkey(name)')
      .eq('competition_id', selectedCompId)
      .eq('is_bye', true);
    const allWithByes = [...allMatches, ...(byeData || [])];
    
    const enriched = allMatches.map((m: any) => {
      const getFeederDisplay = (slot: 'athlete1' | 'athlete2') => {
        const idKey = slot === 'athlete1' ? 'athlete1_id' : 'athlete2_id';
        if (m[idKey] && m[slot]?.name) return m[slot].name;
        
        const feederRound = m.round_number * 2;
        const feederMatchNum = slot === 'athlete1' ? (m.match_number * 2) - 1 : m.match_number * 2;
        const feeder = allWithByes.find((fm: any) => 
          fm.category_id === m.category_id && fm.round_number === feederRound && fm.match_number === feederMatchNum
        );
        
        if (feeder) {
          if (feeder.winner_id) {
            const winnerName = feeder.athlete1_id === feeder.winner_id 
              ? feeder.athlete1?.name : feeder.athlete2?.name;
            if (winnerName) return winnerName;
          }
          return `${t('federation.live.winnerFight')} ${feeder.match_order || feederMatchNum}`;
        }
        return `${t('federation.live.winnerFight')} ?`;
      };
      
      return {
        ...m,
        athlete1_display: getFeederDisplay('athlete1'),
        athlete2_display: getFeederDisplay('athlete2'),
      };
    });
    
    setMatches(enriched);
  }, [selectedCompId, t]);

  useEffect(() => {
    if (selectedCompId) localStorage.setItem('coach-live-comp', selectedCompId);
    if (!selectedCompId) { setRings([]); setMatches([]); return; }
    loadRings();
    loadMatches();
  }, [selectedCompId, loadRings, loadMatches]);

  // Real-time
  useEffect(() => {
    if (!selectedCompId) return;
    const channel = supabase
      .channel('coach-rings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_rings', filter: `competition_id=eq.${selectedCompId}` }, () => { loadRings(); loadMatches(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_matches', filter: `competition_id=eq.${selectedCompId}` }, () => { loadRings(); loadMatches(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedCompId, loadRings, loadMatches]);

  const role = userProfile?.role;
  const renderSidebar = () => {
    if (role === 'federation') return <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
    if (role === 'coach') return <CoachSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
    return <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
  };

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
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">{t('federation.live.mobileTitle')}</h1>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Radio className="h-6 w-6 text-destructive animate-pulse" />
                  {t('federation.live.title')}
                </h1>
                <p className="text-sm text-muted-foreground">{t('federation.live.subtitle')}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 items-end">
              <div className="w-full sm:w-64">
                <Label className="text-sm mb-1 block">{t('federation.live.competition')}</Label>
                <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder={t('federation.live.selectCompetition')} />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {rings.length > 0 ? (
              <div className={`grid gap-3 ${
                rings.length === 1 ? 'grid-cols-1' :
                rings.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
              }`}>
                {rings.map((ring: any) => {
                  const ringScopedMatches = (matches as Match[])
                    .filter((m) => {
                      if (!ring.match_range_start || !ring.match_range_end) return true;
                      const order = m.match_order ?? 0;
                      return order >= ring.match_range_start && order <= ring.match_range_end;
                    })
                    .filter((m) => m.status !== 'completed' && typeof m.match_order === 'number')
                    .sort((a, b) => (a.match_order ?? 0) - (b.match_order ?? 0));

                  const currentIndex = ring.current_match_id
                    ? ringScopedMatches.findIndex((m) => m.id === ring.current_match_id)
                    : -1;

                  const nextMatches = currentIndex >= 0
                    ? ringScopedMatches.slice(currentIndex + 1, currentIndex + 3)
                    : ringScopedMatches.slice(0, 2);

                  return (
                    <Card key={ring.id} id={`ring-card-${ring.id}`} className="rounded-none overflow-hidden bg-background">
                      <div className="flex items-center justify-between px-2 py-1 bg-muted border-b border-border">
                        <div className="flex items-center gap-1.5">
                          <Monitor className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-semibold">{ring.ring_name || `Ring ${getRingLetter(ring.ring_number)}`}</span>
                          {ring.is_active && (
                            <Badge variant="outline" className="rounded-none text-[10px] px-1 py-0 bg-destructive/10 text-destructive border-destructive/30 leading-none">
                              <Radio className="h-2 w-2 mr-0.5 animate-pulse" />
                              LIVE
                            </Badge>
                          )}
                          {ring.match_range_start && ring.match_range_end && (
                            <span className="text-[10px] text-muted-foreground">({ring.match_range_start}-{ring.match_range_end})</span>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          const el = document.getElementById(`ring-video-${ring.id}`);
                          if (el) { if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen(); }
                        }} className="rounded-none h-5 w-5 p-0" title="Fullscreen">
                          <Maximize className="h-3 w-3" />
                        </Button>
                      </div>

                      <CardContent className="p-0">
                        {ring.youtube_live_url ? (
                          <div id={`ring-video-${ring.id}`} className="relative bg-black group">
                            <AspectRatio ratio={16 / 9}>
                              <iframe
                                src={getYoutubeEmbedUrl(ring.youtube_live_url) || ''}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={ring.ring_name || `Ring ${getRingLetter(ring.ring_number)}`}
                              />
                              {/* Transparent overlay to block all video interaction (no seeking/controls) */}
                              <div className="absolute inset-0 z-10" style={{ pointerEvents: 'auto' }} />
                            </AspectRatio>
                            {ring.current_match_id && (() => {
                              const currentMatch = (matches as any[]).find((m: any) => m.id === ring.current_match_id);
                              if (!currentMatch) return null;
                              return (
                                <VideoOverlayScores 
                                  matchId={ring.current_match_id} 
                                  ringId={ring.id}
                                  match={currentMatch} 
                                  ringLabel={ring.ring_name || `Ring ${getRingLetter(ring.ring_number)}`}
                                />
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="bg-muted/50 flex items-center justify-center h-24">
                            <p className="text-[10px] text-muted-foreground">{t('federation.live.noYoutubeUrl', 'Δεν υπάρχει live stream')}</p>
                          </div>
                        )}

                        <ReadOnlyRingScoreboard 
                          currentMatchId={ring.current_match_id} 
                          competitionId={selectedCompId}
                          matchRangeStart={ring.match_range_start}
                          matchRangeEnd={ring.match_range_end}
                        />

                        {/* Upcoming matches - identical to FederationLive */}
                        {nextMatches.length > 0 && (
                          <div className="border-t border-border">
                            <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1 bg-muted/30">{t('federation.live.upcomingMatches')}</p>
                            {nextMatches.map((m: Match, idx: number) => (
                              <div key={m.id}>
                                {idx > 0 && <div className="h-px bg-white" />}
                                <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
                                  <div className="bg-red-500/20 flex items-center gap-1.5 px-2 py-1">
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-[8px]">{(m.athlete1_display || m.athlete1?.name || '?').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-semibold truncate leading-tight">{m.athlete1_display || m.athlete1?.name || 'TBD'}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center justify-center px-1 bg-muted/20">
                                    <span className="text-[8px] text-muted-foreground font-medium">#{m.match_order}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground">VS</span>
                                  </div>
                                  <div className="bg-blue-500/20 flex items-center gap-1.5 px-2 py-1 justify-end">
                                    <div className="min-w-0 text-right">
                                      <p className="text-[10px] font-semibold truncate leading-tight">{m.athlete2_display || m.athlete2?.name || 'TBD'}</p>
                                    </div>
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-[8px]">{(m.athlete2_display || m.athlete2?.name || '?').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : selectedCompId && !loading ? (
              <Card className="rounded-none">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>{t('federation.live.noRings', 'Δεν υπάρχουν ενεργά rings για αυτή τη διοργάνωση')}</p>
                </CardContent>
              </Card>
            ) : null}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CoachLivePage;
