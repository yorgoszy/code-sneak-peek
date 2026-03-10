import React, { useState, useEffect, useCallback } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, Trophy, ChevronRight, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

function getRoundName(roundNumber: number, t: any): string {
  if (roundNumber === 1) return t('federation.brackets.final');
  if (roundNumber === 2) return t('federation.brackets.semifinals');
  if (roundNumber === 4) return t('federation.brackets.quarterfinals');
  if (roundNumber === 8) return '1/8';
  if (roundNumber === 16) return '1/16';
  return `${t('federation.brackets.round')} ${roundNumber}`;
}

// Category grouping utilities
const AGE_ORDER = ['18-40', 'U23', '16-17', '14-15', '12-13', '10-11', '8-9', '5-7'];

const getWeightLabel = (name: string): string => {
  const m = name.match(/([-+±]\s*\d+[\d.,]*\s*kg)/i);
  return m ? m[1] : name;
};

const getAgeLabel = (name: string): string => {
  if (/^Ενήλικοι/i.test(name)) return '18-40';
  if (/^U23/i.test(name)) return 'U23';
  const match = name.match(/^Νέ(?:οι|ες)\s*(\d+-\d+)/);
  if (match) return match[1];
  return name.replace(/([-+±]\s*\d+[\d.,]*\s*kg)/i, '').trim();
};

const groupByAge = (cats: { id: string; name: string; gender: string }[]) => {
  const grouped = new Map<string, typeof cats>();
  cats.forEach(cat => {
    const age = getAgeLabel(cat.name);
    if (!grouped.has(age)) grouped.set(age, []);
    grouped.get(age)!.push(cat);
  });
  const orderedKeys = AGE_ORDER.filter(a => grouped.has(a));
  const remainingKeys = [...grouped.keys()].filter(k => !AGE_ORDER.includes(k));
  return [...orderedKeys, ...remainingKeys].map(age => ({
    age,
    cats: grouped.get(age)!,
  }));
};

const CoachBracketAgeGroup: React.FC<{
  age: string;
  cats: { id: string; name: string; gender: string }[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}> = ({ age, cats, selectedCategoryId, onSelectCategory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSelected = cats.some(c => c.id === selectedCategoryId);
  
  return (
    <div className="mb-1 border border-border">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full text-[11px] font-bold px-2 py-2.5 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors select-none ${
          hasSelected ? 'bg-foreground text-background' : 'text-foreground bg-muted'
        }`}
      >
        <span className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          {age}
        </span>
        <span className={`text-[9px] ${hasSelected ? 'text-background/70' : 'text-muted-foreground'}`}>{cats.length} κατ.</span>
      </button>
      {isOpen && (
        <div>
          {cats.map(cat => {
            const isSelected = cat.id === selectedCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full flex items-center px-3 py-1.5 text-xs border-t border-border/30 cursor-pointer transition-colors text-left ${
                  isSelected ? 'bg-foreground text-background font-bold' : 'hover:bg-accent/30'
                }`}
              >
                <span className="font-medium">{getWeightLabel(cat.name)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CoachBracketsPage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const { t } = useTranslation();

  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Determine the club_id to find the federation
  // For coaches: their own id. For athletes: their coach_id
  const clubId = userProfile?.role === 'coach' ? userProfile?.id : userProfile?.coach_id;

  // Load ALL competitions from the user's federation
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

  useEffect(() => {
    if (!selectedCompId) { setCategories([]); setSelectedCategoryId(''); return; }
    const load = async () => {
      const { data } = await supabase
        .from('federation_competition_categories')
        .select('id, name')
        .eq('competition_id', selectedCompId)
        .order('name');
      setCategories(data || []);
      setSelectedCategoryId('');
    };
    load();
  }, [selectedCompId]);

  useEffect(() => {
    if (!selectedCategoryId || !selectedCompId) { setMatches([]); return; }
    loadMatches();
  }, [selectedCategoryId, selectedCompId]);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('competition_matches')
      .select(`
        *,
        athlete1:app_users!competition_matches_athlete1_id_fkey(name, photo_url, avatar_url),
        athlete2:app_users!competition_matches_athlete2_id_fkey(name, photo_url, avatar_url),
        athlete1_club:app_users!competition_matches_athlete1_club_id_fkey(name),
        athlete2_club:app_users!competition_matches_athlete2_club_id_fkey(name)
      `)
      .eq('competition_id', selectedCompId)
      .eq('category_id', selectedCategoryId)
      .order('round_number', { ascending: false })
      .order('match_number', { ascending: true });

    setMatches(data || []);
    setLoading(false);
  }, [selectedCategoryId, selectedCompId]);

  // Real-time updates
  useEffect(() => {
    if (!selectedCompId) return;
    const channel = supabase
      .channel('coach-brackets-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_matches', filter: `competition_id=eq.${selectedCompId}` }, () => {
        if (selectedCategoryId) loadMatches();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedCompId, selectedCategoryId, loadMatches]);

  const rounds = matches.reduce<Record<number, any[]>>((acc, m) => {
    if (!acc[m.round_number]) acc[m.round_number] = [];
    acc[m.round_number].push(m);
    return acc;
  }, {});
  const sortedRoundNumbers = Object.keys(rounds).map(Number).sort((a, b) => b - a);

  const getAvatar = (a: any) => a?.photo_url || a?.avatar_url || undefined;

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
              <h1 className="text-lg font-semibold">{t('federation.brackets.mobileTitle')}</h1>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold text-foreground">{t('federation.brackets.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('federation.brackets.subtitle')}</p>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="w-full sm:w-64">
                <Label className="text-sm mb-1 block">{t('federation.brackets.competition')}</Label>
                <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder={t('federation.brackets.selectCompetition')} /></SelectTrigger>
                  <SelectContent>
                    {competitions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-64">
                <Label className="text-sm mb-1 block">{t('federation.brackets.category')}</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} disabled={!selectedCompId}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder={t('federation.brackets.selectCategory')} /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {matches.length === 0 && selectedCategoryId && !loading && (
              <Card className="rounded-none">
                <CardContent className="p-8 text-center text-muted-foreground">
                  {t('federation.brackets.noDraw')}
                </CardContent>
              </Card>
            )}

            {matches.length > 0 && (
              <ScrollArea className="w-full">
                <div className="flex gap-6 min-w-max pb-4">
                  {sortedRoundNumbers.map((roundNum) => (
                    <div key={roundNum} className="flex-shrink-0 w-72">
                      <div className="bg-muted px-4 py-2 mb-3 border border-border">
                        <h3 className="font-semibold text-sm">{getRoundName(roundNum, t)}</h3>
                        <span className="text-xs text-muted-foreground">{rounds[roundNum].length} {t('federation.brackets.matches')}</span>
                      </div>
                      <div className="space-y-3">
                        {rounds[roundNum].map((match: any) => (
                          <Card key={match.id} className={`rounded-none ${
                            match.status === 'completed' ? 'border-l-4 border-l-[#00ffba]' :
                            match.is_bye ? 'border-l-4 border-l-muted-foreground opacity-60' : 'border-l-4 border-l-border'
                          }`}>
                            <CardContent className="p-3">
                              {match.is_bye ? (
                                <div className="text-center">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={getAvatar(match.athlete1)} />
                                      <AvatarFallback className="text-xs">{match.athlete1?.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{match.athlete1?.name || 'TBD'}</span>
                                  </div>
                                  <Badge variant="outline" className="rounded-none text-xs">BYE</Badge>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className={`flex items-center gap-2 p-1.5 ${match.winner_id === match.athlete1_id ? 'bg-[#00ffba]/10 border border-[#00ffba]/30' : ''}`}>
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={getAvatar(match.athlete1)} />
                                      <AvatarFallback className="text-xs">{match.athlete1?.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{match.athlete1?.name || 'TBD'}</p>
                                      {match.athlete1_club && <p className="text-xs text-muted-foreground truncate">{match.athlete1_club.name}</p>}
                                    </div>
                                    {match.winner_id === match.athlete1_id && <Trophy className="h-4 w-4 text-[#cb8954]" />}
                                  </div>
                                  <div className="text-center text-xs text-muted-foreground">VS</div>
                                  <div className={`flex items-center gap-2 p-1.5 ${match.winner_id === match.athlete2_id ? 'bg-[#00ffba]/10 border border-[#00ffba]/30' : ''}`}>
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={getAvatar(match.athlete2)} />
                                      <AvatarFallback className="text-xs">{match.athlete2?.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{match.athlete2?.name || 'TBD'}</p>
                                      {match.athlete2_club && <p className="text-xs text-muted-foreground truncate">{match.athlete2_club.name}</p>}
                                    </div>
                                    {match.winner_id === match.athlete2_id && <Trophy className="h-4 w-4 text-[#cb8954]" />}
                                  </div>
                                  {match.status === 'completed' && match.result_type && (
                                    <div className="text-center">
                                      <Badge variant="secondary" className="rounded-none text-xs uppercase">
                                        {match.result_type} {match.athlete1_score} {match.athlete2_score}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CoachBracketsPage;
