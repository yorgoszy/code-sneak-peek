import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, Plus, Settings, Radio, Play, Pause, Trash2, Save, Monitor, Copy, Check, RefreshCw, Maximize } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { RingScoreboard } from "@/components/federation/RingScoreboard";
import { VideoOverlayScores } from "@/components/federation/VideoOverlayScores";

interface Competition {
  id: string;
  name: string;
  competition_date: string;
  status: string;
}

interface Ring {
  id: string;
  competition_id: string;
  ring_number: number;
  ring_name: string | null;
  youtube_live_url: string | null;
  match_range_start: number | null;
  match_range_end: number | null;
  current_match_id: string | null;
  is_active: boolean;
  current_match?: {
    id: string;
    match_order: number;
    status: string;
    athlete1?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
    athlete2?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
    athlete1_club?: { name: string } | null;
    athlete2_club?: { name: string } | null;
    category?: { name: string } | null;
  } | null;
}

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
}

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1`;
  }
  if (url.includes('youtube.com/embed')) return url;
  return url;
}

const JudgeLinkRow: React.FC<{ judgeNum: number; url: string }> = ({ judgeNum, url }) => {
  const [copied, setCopied] = React.useState(false);
  const [showQR, setShowQR] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border p-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Κριτής {judgeNum}</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="rounded-none h-7 text-xs" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3 mr-1 text-[#00ffba]" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" className="rounded-none h-7 text-xs" onClick={() => setShowQR(!showQR)}>
            QR
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground break-all">{url}</p>
      {showQR && (
        <div className="flex justify-center p-3 bg-white">
          <QRCodeSVG value={url} size={160} />
        </div>
      )}
    </div>
  );
};

const FederationLive = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const { t } = useTranslation();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>(() => localStorage.getItem('federation-live-comp') || '');
  const [rings, setRings] = useState<Ring[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [ringCount, setRingCount] = useState(3);
  const [ringConfigs, setRingConfigs] = useState<{
    ring_number: number;
    ring_name: string;
    youtube_live_url: string;
    match_range_start: string;
    match_range_end: string;
  }[]>([]);

  const [editRing, setEditRing] = useState<Ring | null>(null);
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('');
  const [editCurrentMatchId, setEditCurrentMatchId] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const federationId = userProfile?.id;

  useEffect(() => {
    if (!federationId) return;
    const load = async () => {
      const { data } = await supabase
        .from('federation_competitions')
        .select('id, name, competition_date, status')
        .eq('federation_id', federationId)
        .order('competition_date', { ascending: false });
      setCompetitions(data || []);
    };
    load();
  }, [federationId]);

  useEffect(() => {
    if (selectedCompId) localStorage.setItem('federation-live-comp', selectedCompId);
    if (!selectedCompId) { setRings([]); setMatches([]); return; }
    loadRings();
    loadMatches();
  }, [selectedCompId]);

  const loadRings = useCallback(async () => {
    if (!selectedCompId) return;
    setLoading(true);
    const { data } = await supabase
      .from('competition_rings')
      .select('*')
      .eq('competition_id', selectedCompId)
      .order('ring_number');

    const ringsData = data || [];
    const enrichedRings = await Promise.all(ringsData.map(async (ring: any) => {
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

    setRings(enrichedRings as Ring[]);
    setLoading(false);
  }, [selectedCompId]);

  const loadMatches = useCallback(async () => {
    if (!selectedCompId) return;
    const { data } = await supabase
      .from('competition_matches')
      .select(`
        id, match_order, match_number, round_number, status, category_id, athlete1_id, athlete2_id, winner_id,
        athlete1:app_users!competition_matches_athlete1_id_fkey(name),
        athlete2:app_users!competition_matches_athlete2_id_fkey(name)
      `)
      .eq('competition_id', selectedCompId)
      .eq('is_bye', false)
      .order('match_order');
    
    const allMatches = (data as any) || [];
    
    // Also load bye matches to resolve feeder winners
    const { data: byeData } = await supabase
      .from('competition_matches')
      .select('id, match_order, match_number, round_number, category_id, athlete1_id, winner_id, athlete1:app_users!competition_matches_athlete1_id_fkey(name)')
      .eq('competition_id', selectedCompId)
      .eq('is_bye', true);
    const allWithByes = [...allMatches, ...(byeData || [])];
    
    // Compute display names for missing athletes
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
          return `Νικητής αγ. ${feeder.match_order || feederMatchNum}`;
        }
        return `Νικητής αγ. ?`;
      };
      
      return {
        ...m,
        athlete1_display: getFeederDisplay('athlete1'),
        athlete2_display: getFeederDisplay('athlete2'),
      };
    });
    
    setMatches(enriched);
  }, [selectedCompId]);

  const handleSetupRings = () => {
    const configs = Array.from({ length: ringCount }, (_, i) => ({
      ring_number: i + 1,
      ring_name: `Ring ${i + 1}`,
      youtube_live_url: '',
      match_range_start: '',
      match_range_end: '',
    }));
    setRingConfigs(configs);
    setSetupDialogOpen(true);
  };

  const handleSaveRings = async () => {
    const toInsert = ringConfigs.map(rc => ({
      competition_id: selectedCompId,
      ring_number: rc.ring_number,
      ring_name: rc.ring_name || `Ring ${rc.ring_number}`,
      youtube_live_url: rc.youtube_live_url || null,
      match_range_start: rc.match_range_start ? parseInt(rc.match_range_start) : null,
      match_range_end: rc.match_range_end ? parseInt(rc.match_range_end) : null,
      is_active: true,
    }));

    const { error } = await supabase.from('competition_rings').insert(toInsert);
    if (error) {
      toast.error(t('federation.live.ringsCreateError'));
      console.error(error);
    } else {
      toast.success(t('federation.live.ringsCreated'));
      setSetupDialogOpen(false);
      loadRings();
    }
  };

  const handleDeleteRings = async () => {
    const { error } = await supabase
      .from('competition_rings')
      .delete()
      .eq('competition_id', selectedCompId);
    if (error) {
      toast.error(t('federation.common.error'));
    } else {
      toast.success(t('federation.live.ringsDeleted'));
      setRings([]);
    }
    setDeleteDialogOpen(false);
  };

  const handleUpdateRing = async () => {
    if (!editRing) return;
    const { error } = await supabase
      .from('competition_rings')
      .update({
        youtube_live_url: editYoutubeUrl || null,
        current_match_id: editCurrentMatchId || null,
      })
      .eq('id', editRing.id);

    if (error) {
      toast.error(t('federation.common.error'));
    } else {
      toast.success(t('federation.live.ringUpdated'));
      setEditRing(null);
      loadRings();
    }
  };

  const openEditRing = (ring: Ring) => {
    setEditRing(ring);
    setEditYoutubeUrl(ring.youtube_live_url || '');
    setEditCurrentMatchId(ring.current_match_id || '');
  };

  const handleMatchChangeForRing = async (ringId: string, matchId: string) => {
    const { error } = await supabase
      .from('competition_rings')
      .update({ current_match_id: matchId || null })
      .eq('id', ringId);
    if (error) {
      toast.error('Σφάλμα ενημέρωσης');
    } else {
      loadRings();
    }
  };

  const handleRefreshAllRings = async () => {
    await supabase
      .from('competition_rings')
      .update({
        current_match_id: null,
        timer_running_since: null,
        timer_remaining_seconds: null,
        timer_current_round: 1,
        timer_is_break: false,
      })
      .eq('competition_id', selectedCompId);
    toast.success('Όλα τα rings ανανεώθηκαν');
    loadRings();
    loadMatches();
  };

  const handleRefreshSingleRing = async (ringId: string) => {
    await supabase
      .from('competition_rings')
      .update({
        current_match_id: null,
        timer_running_since: null,
        timer_remaining_seconds: null,
        timer_current_round: 1,
        timer_is_break: false,
      })
      .eq('id', ringId);
    toast.success('Το ring ανανεώθηκε');
    loadRings();
  };

  const getAthleteAvatar = (athlete: { name: string; photo_url: string | null; avatar_url: string | null } | null | undefined) => {
    return athlete?.photo_url || athlete?.avatar_url || undefined;
  };

  const renderSidebar = () => (
    <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

  // Realtime: rings changes
  useEffect(() => {
    if (!selectedCompId) return;
    const channel = supabase
      .channel('rings-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'competition_rings',
        filter: `competition_id=eq.${selectedCompId}`,
      }, () => {
        loadRings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedCompId, loadRings]);

  // Realtime: matches changes (bracket updates, winner declarations)
  useEffect(() => {
    if (!selectedCompId) return;
    const channel = supabase
      .channel('matches-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'competition_matches',
        filter: `competition_id=eq.${selectedCompId}`,
      }, () => {
        loadMatches();
        loadRings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedCompId, loadMatches, loadRings]);

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">{t('federation.live.mobileTitle')}</h1>
              </div>
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

            {/* Competition selector */}
            <div className="flex flex-wrap gap-4 mb-6 items-end">
              <div className="w-full sm:w-64">
                <Label className="text-sm mb-1 block">{t('federation.live.competition')}</Label>
                <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder={t('federation.live.selectCompetition')} />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompId && rings.length === 0 && (
                <Button onClick={handleSetupRings} className="rounded-none bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('federation.live.setupRings')}
                </Button>
              )}

              {rings.length > 0 && (
                <Button variant="outline" onClick={handleRefreshAllRings} className="rounded-none">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh All Rings
                </Button>
              )}

              {rings.length > 0 && (
                <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="rounded-none text-destructive border-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('federation.live.deleteRings')}
                </Button>
              )}
            </div>

            {/* Rings Grid */}
            {rings.length > 0 && (
              <div className={`grid gap-3 ${
                rings.length === 1 ? 'grid-cols-1' :
                rings.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
              }`}>
                {rings.map((ring) => (
                  <Card key={ring.id} id={`ring-card-${ring.id}`} className="rounded-none overflow-hidden bg-background">
                    <div className="flex items-center justify-between px-2 py-1 bg-muted border-b border-border">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-semibold">Ring {ring.ring_number}</span>
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
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="sm" onClick={() => {
                          const el = document.getElementById(`ring-video-${ring.id}`);
                          if (el) { if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen(); }
                        }} className="rounded-none h-5 w-5 p-0" title="Fullscreen">
                          <Maximize className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRefreshSingleRing(ring.id)} className="rounded-none h-5 w-5 p-0" title="Refresh Ring">
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditRing(ring)} className="rounded-none h-5 w-5 p-0">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-0">
                      {ring.youtube_live_url ? (
                        <div className="relative">
                          <AspectRatio ratio={16 / 9}>
                            <iframe
                              src={getYoutubeEmbedUrl(ring.youtube_live_url) || ''}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={`Ring ${ring.ring_number}`}
                            />
                          </AspectRatio>
                          {ring.current_match_id && (() => {
                            const currentMatch = (matches as any[]).find((m: any) => m.id === ring.current_match_id);
                            if (!currentMatch?.match_order) return null;
                            return (
                              <>
                                <div className="absolute top-1 left-1 bg-white text-black text-sm font-bold px-2 py-0.5 rounded-none pointer-events-none">
                                  #{currentMatch.match_order}
                                </div>
                                <VideoOverlayScores matchId={ring.current_match_id} match={currentMatch} />
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="bg-muted/50 flex items-center justify-center h-24">
                          <p className="text-[10px] text-muted-foreground">{t('federation.live.noYoutubeUrl')}</p>
                        </div>
                      )}

                      <RingScoreboard
                        ringId={ring.id}
                        currentMatchId={ring.current_match_id}
                        matches={(matches as any[]).filter((m: any) => {
                          if (!ring.match_range_start || !ring.match_range_end) return true;
                          return m.match_order >= ring.match_range_start && m.match_order <= ring.match_range_end;
                        })}
                        onMatchChange={(matchId) => handleMatchChangeForRing(ring.id, matchId)}
                      />

                      {/* Next 2 upcoming matches for this ring */}
                      {(() => {
                        const ringMatches = (matches as any[]).filter((m: any) => {
                          if (!ring.match_range_start || !ring.match_range_end) return true;
                          return m.match_order >= ring.match_range_start && m.match_order <= ring.match_range_end;
                        });
                        const nextMatches = ringMatches
                          .filter((m: any) => m.status === 'pending' && m.id !== ring.current_match_id && m.athlete1_id && m.athlete2_id)
                          .sort((a: any, b: any) => (a.match_order || 0) - (b.match_order || 0))
                          .slice(0, 2);
                        
                        if (nextMatches.length === 0) return null;
                        
                        return (
                          <div className="border-t border-border">
                            <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1 bg-muted/30">Επόμενοι αγώνες</p>
                            {nextMatches.map((m: any, idx: number) => (
                              <div key={m.id}>
                                {idx > 0 && <div className="h-px bg-white" />}
                                <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
                                  <div className="bg-blue-500/20 flex items-center gap-1.5 px-2 py-1">
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-[8px]">{m.athlete1?.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-semibold truncate leading-tight">{m.athlete1?.name || '—'}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center justify-center px-1 bg-muted/20">
                                    <span className="text-[8px] text-muted-foreground font-medium">#{m.match_order}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground">VS</span>
                                  </div>
                                  <div className="bg-red-500/20 flex items-center gap-1.5 px-2 py-1 justify-end">
                                    <div className="min-w-0 text-right">
                                      <p className="text-[10px] font-semibold truncate leading-tight">{m.athlete2?.name || '—'}</p>
                                    </div>
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-[8px]">{m.athlete2?.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedCompId && rings.length === 0 && !loading && (
              <Card className="rounded-none">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>{t('federation.live.noRings')}</p>
                  <p className="text-xs mt-1">{t('federation.live.noRingsDesc')}</p>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

      {/* Ring Setup Dialog */}
      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="rounded-none max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('federation.live.ringSetupTitle')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{t('federation.live.numberOfRings')}: {ringCount}</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none h-8 w-8 p-0"
                  disabled={ringCount <= 1}
                  onClick={() => {
                    const n = ringCount - 1;
                    setRingCount(n);
                    setRingConfigs(prev => prev.slice(0, n));
                  }}
                >
                  −
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none h-8 w-8 p-0"
                  disabled={ringCount >= 10}
                  onClick={() => {
                    const n = ringCount + 1;
                    setRingCount(n);
                    setRingConfigs(prev => [...prev, {
                      ring_number: n,
                      ring_name: `Ring ${n}`,
                      youtube_live_url: '',
                      match_range_start: '',
                      match_range_end: '',
                    }]);
                  }}
                >
                  +
                </Button>
              </div>
            </div>

            {ringConfigs.map((rc, idx) => (
              <Card key={idx} className="rounded-none">
                <CardContent className="p-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-xs whitespace-nowrap">Ring {rc.ring_number}</h4>
                    <Input
                      value={rc.youtube_live_url}
                      onChange={(e) => {
                        const updated = [...ringConfigs];
                        updated[idx].youtube_live_url = e.target.value;
                        setRingConfigs(updated);
                      }}
                      placeholder="YouTube URL..."
                      className="rounded-none h-7 text-xs flex-1"
                    />
                    <Input
                      type="number"
                      value={rc.match_range_start}
                      onChange={(e) => {
                        const updated = [...ringConfigs];
                        updated[idx].match_range_start = e.target.value;
                        setRingConfigs(updated);
                      }}
                      placeholder="From"
                      className="rounded-none h-7 text-xs w-16"
                    />
                    <span className="text-xs text-muted-foreground">-</span>
                    <Input
                      type="number"
                      value={rc.match_range_end}
                      onChange={(e) => {
                        const updated = [...ringConfigs];
                        updated[idx].match_range_end = e.target.value;
                        setRingConfigs(updated);
                      }}
                      placeholder="To"
                      className="rounded-none h-7 text-xs w-16"
                    />
                    {ringConfigs.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-none h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => {
                          const updated = ringConfigs.filter((_, i) => i !== idx).map((r, i) => ({ ...r, ring_number: i + 1 }));
                          setRingConfigs(updated);
                          setRingCount(updated.length);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupDialogOpen(false)} className="rounded-none">{t('federation.common.cancel')}</Button>
            <Button onClick={handleSaveRings} className="rounded-none bg-foreground text-background hover:bg-foreground/90">
              <Save className="h-4 w-4 mr-2" />
              {t('federation.competitions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ring Dialog */}
      {editRing && (
        <Dialog open={!!editRing} onOpenChange={() => setEditRing(null)}>
          <DialogContent className="rounded-none max-w-lg">
            <DialogHeader>
              <DialogTitle>{editRing.ring_name || `Ring ${editRing.ring_number}`}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm">{t('federation.live.youtubeUrl')}</Label>
                <Input
                  value={editYoutubeUrl}
                  onChange={(e) => setEditYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/live/..."
                  className="rounded-none"
                />
              </div>

              <div>
                <Label className="text-sm">{t('federation.live.currentMatch')}</Label>
                <Select value={editCurrentMatchId || "none"} onValueChange={(val) => setEditCurrentMatchId(val === "none" ? "" : val)}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder={t('federation.live.selectMatch')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('federation.live.none')}</SelectItem>
                    {matches
                      .filter(m => m.status !== 'completed')
                      .map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          #{m.match_order ?? '-'} - {m.athlete1_display || m.athlete1?.name || 'Νικητής'} vs {m.athlete2_display || m.athlete2?.name || 'Νικητής'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Judge Links */}
              <div>
                <Label className="text-sm mb-2 block">Links Κριτών</Label>
                <div className="space-y-3">
                  {[1, 2, 3].map((judgeNum) => {
                    const judgeUrl = `${window.location.origin}/judge?ring=${editRing.id}&judge=${judgeNum}&comp=${selectedCompId}`;
                    return (
                      <JudgeLinkRow key={judgeNum} judgeNum={judgeNum} url={judgeUrl} />
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRing(null)} className="rounded-none">{t('federation.common.cancel')}</Button>
              <Button onClick={handleUpdateRing} className="rounded-none bg-foreground text-background hover:bg-foreground/90">
                <Save className="h-4 w-4 mr-2" />
                {t('federation.competitions.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('federation.live.deleteRingsTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('federation.live.deleteRingsDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t('federation.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRings} className="bg-destructive hover:bg-destructive/90 rounded-none">
              {t('federation.competitions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default FederationLive;
