import React, { useState, useEffect, useCallback } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, Radio, Monitor } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ReadOnlyRingScoreboard } from "@/components/federation/ReadOnlyRingScoreboard";
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

const CoachLivePage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();

  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompId, setSelectedCompId] = useState(() => localStorage.getItem('coach-live-comp') || '');
  const [rings, setRings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Determine the club_id to find the federation
  const clubId = userProfile?.role === 'coach' ? userProfile?.id : userProfile?.coach_id;

  useEffect(() => {
    if (!clubId) return;
    const load = async () => {
      // Find the federation(s) this club belongs to
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

  useEffect(() => {
    if (!selectedCompId) { setRings([]); return; }
    loadRings();
  }, [selectedCompId, loadRings]);

  // Real-time: listen to both rings AND matches changes (for draw resets)
  useEffect(() => {
    if (!selectedCompId) return;
    const channel = supabase
      .channel('coach-rings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_rings', filter: `competition_id=eq.${selectedCompId}` }, () => loadRings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_matches', filter: `competition_id=eq.${selectedCompId}` }, () => loadRings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_match_judge_scores' }, () => loadRings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedCompId, loadRings]);

  

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
              <h1 className="text-lg font-semibold">Live</h1>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Radio className="h-6 w-6 text-destructive animate-pulse" />
                Live Αγώνες
              </h1>
              <p className="text-sm text-muted-foreground">Ζωντανή παρακολούθηση αγώνων</p>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="w-full sm:w-64">
                <Label className="text-sm mb-1 block">Διοργάνωση</Label>
                <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Επιλέξτε διοργάνωση" /></SelectTrigger>
                  <SelectContent>
                    {competitions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {rings.length > 0 ? (
              <div className={`grid gap-6 ${
                rings.length === 1 ? 'grid-cols-1' :
                rings.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
              }`}>
                {rings.map((ring: any) => (
                  <Card key={ring.id} className="rounded-none overflow-hidden">
                    <CardHeader className="p-3 bg-muted border-b border-border">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">{ring.ring_name || `Ring ${ring.ring_number}`}</CardTitle>
                        {ring.is_active && (
                          <Badge variant="outline" className="rounded-none text-xs bg-destructive/10 text-destructive border-destructive/30">
                            <Radio className="h-3 w-3 mr-1 animate-pulse" />
                            LIVE
                          </Badge>
                        )}
                      </div>
                      {ring.match_range_start && ring.match_range_end && (
                        <p className="text-xs text-muted-foreground mt-1">Αγώνες {ring.match_range_start} - {ring.match_range_end}</p>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      {ring.youtube_live_url ? (
                        <AspectRatio ratio={16 / 9}>
                          <iframe
                            src={getYoutubeEmbedUrl(ring.youtube_live_url) || ''}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={ring.ring_name || `Ring ${ring.ring_number}`}
                          />
                        </AspectRatio>
                      ) : (
                        <div className="bg-muted/50 flex items-center justify-center h-48">
                          <p className="text-sm text-muted-foreground">Δεν υπάρχει live stream</p>
                        </div>
                      )}

                      <ReadOnlyRingScoreboard 
                        currentMatchId={ring.current_match_id} 
                        competitionId={selectedCompId}
                        matchRangeStart={ring.match_range_start}
                        matchRangeEnd={ring.match_range_end}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : selectedCompId && !loading ? (
              <Card className="rounded-none">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Δεν υπάρχουν ενεργά rings για αυτή τη διοργάνωση</p>
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
