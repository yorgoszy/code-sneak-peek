import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, Search, ListOrdered, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { normalizeGreekText } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Competition {
  id: string;
  name: string;
  competition_date: string;
}

interface MatchRow {
  id: string;
  match_order: number | null;
  match_number: number;
  round_number: number;
  status: string;
  is_bye: boolean | null;
  result_type: string | null;
  athlete1_score: string | null;
  athlete2_score: string | null;
  winner_id: string | null;
  athlete1_id: string | null;
  athlete2_id: string | null;
  category_id: string;
  ring_number: number | null;
  athlete1?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  athlete2?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  athlete1_club?: { name: string } | null;
  athlete2_club?: { name: string } | null;
  category?: { name: string; gender: string | null; min_age: number | null; max_age: number | null; min_weight: number | null; max_weight: number | null } | null;
}

interface RingInfo {
  id: string;
  ring_number: number;
  ring_name: string | null;
  current_match_id: string | null;
}

const FederationFightCard: React.FC = () => {
  const { t } = useTranslation();
  const { userProfile } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [rings, setRings] = useState<RingInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [weightFilter, setWeightFilter] = useState('all');

  const federationId = userProfile?.id;

  // Load competitions
  useEffect(() => {
    if (!federationId) return;
    supabase
      .from('federation_competitions')
      .select('id, name, competition_date')
      .eq('federation_id', federationId)
      .order('competition_date', { ascending: false })
      .then(({ data }) => setCompetitions(data || []));
  }, [federationId]);

  // Load matches and rings
  const loadData = useCallback(async () => {
    if (!selectedCompId) { setMatches([]); setRings([]); return; }
    setLoading(true);

    const [matchesRes, ringsRes] = await Promise.all([
      supabase
        .from('competition_matches')
        .select(`
          id, match_order, match_number, round_number, status, is_bye, result_type,
          athlete1_score, athlete2_score, winner_id, athlete1_id, athlete2_id,
          category_id, ring_number,
          athlete1:app_users!competition_matches_athlete1_id_fkey(name, photo_url, avatar_url),
          athlete2:app_users!competition_matches_athlete2_id_fkey(name, photo_url, avatar_url),
          athlete1_club:app_users!competition_matches_athlete1_club_id_fkey(name),
          athlete2_club:app_users!competition_matches_athlete2_club_id_fkey(name),
          category:federation_competition_categories!competition_matches_category_id_fkey(name, gender, min_age, max_age, min_weight, max_weight)
        `)
        .eq('competition_id', selectedCompId)
        .eq('is_bye', false)
        .not('match_order', 'is', null)
        .order('match_order', { ascending: true }),
      supabase
        .from('competition_rings')
        .select('id, ring_number, ring_name, current_match_id')
        .eq('competition_id', selectedCompId)
        .order('ring_number')
    ]);

    setMatches((matchesRes.data as MatchRow[]) || []);
    setRings((ringsRes.data as RingInfo[]) || []);
    setLoading(false);
  }, [selectedCompId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime
  useEffect(() => {
    if (!selectedCompId) return;
    const channel = supabase
      .channel(`fightcard-${selectedCompId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_matches', filter: `competition_id=eq.${selectedCompId}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_rings', filter: `competition_id=eq.${selectedCompId}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedCompId, loadData]);

  // Current match IDs (active on rings)
  const currentMatchIds = useMemo(() => new Set(rings.map(r => r.current_match_id).filter(Boolean)), [rings]);

  // Get ring info for a match
  const getRingForMatch = useCallback((matchId: string) => {
    return rings.find(r => r.current_match_id === matchId);
  }, [rings]);

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    const genders = new Set<string>();
    const ages = new Set<string>();
    const weights = new Set<string>();
    matches.forEach(m => {
      if (m.category?.gender) genders.add(m.category.gender);
      if (m.category?.min_age != null && m.category?.max_age != null) {
        ages.add(`${m.category.min_age}-${m.category.max_age}`);
      }
      if (m.category?.max_weight != null) {
        weights.add(`${m.category.min_weight || 0}-${m.category.max_weight}`);
      }
    });
    return {
      genders: Array.from(genders).sort(),
      ages: Array.from(ages).sort(),
      weights: Array.from(weights).sort((a, b) => parseFloat(a) - parseFloat(b))
    };
  }, [matches]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // Search filter
      if (searchTerm) {
        const normalized = normalizeGreekText(searchTerm);
        const a1 = normalizeGreekText(m.athlete1?.name || '');
        const a2 = normalizeGreekText(m.athlete2?.name || '');
        const c1 = normalizeGreekText(m.athlete1_club?.name || '');
        const c2 = normalizeGreekText(m.athlete2_club?.name || '');
        if (!a1.includes(normalized) && !a2.includes(normalized) && !c1.includes(normalized) && !c2.includes(normalized)) {
          return false;
        }
      }
      // Gender filter
      if (genderFilter !== 'all' && m.category?.gender !== genderFilter) return false;
      // Age filter
      if (ageFilter !== 'all') {
        const [minA, maxA] = ageFilter.split('-').map(Number);
        if (m.category?.min_age !== minA || m.category?.max_age !== maxA) return false;
      }
      // Weight filter
      if (weightFilter !== 'all') {
        const [minW, maxW] = weightFilter.split('-').map(Number);
        if ((m.category?.min_weight || 0) !== minW || m.category?.max_weight !== maxW) return false;
      }
      return true;
    });
  }, [matches, searchTerm, genderFilter, ageFilter, weightFilter]);

  // Group by ring
  const matchesByRing = useMemo(() => {
    const groups: Record<number, MatchRow[]> = {};
    filteredMatches.forEach(m => {
      const rn = m.ring_number || 0;
      if (!groups[rn]) groups[rn] = [];
      groups[rn].push(m);
    });
    return groups;
  }, [filteredMatches]);

  const ringNumbers = useMemo(() => Object.keys(matchesByRing).map(Number).sort((a, b) => a - b), [matchesByRing]);

  const renderSidebar = () => (
    <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

  const getResultText = (m: MatchRow) => {
    if (m.status !== 'completed') return null;
    const winnerName = m.winner_id === m.athlete1_id ? m.athlete1?.name : m.athlete2?.name;
    const parts: string[] = [];
    if (winnerName) parts.push(`🏆 ${winnerName}`);
    if (m.result_type) parts.push(m.result_type.toUpperCase());
    if (m.athlete1_score && m.athlete2_score) parts.push(`${m.athlete1_score} - ${m.athlete2_score}`);
    return parts.join(' · ');
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
          {/* Mobile Header */}
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">{t('federation.fightCard.title')}</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">{t('federation.fightCard.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('federation.fightCard.subtitle')}</p>
              </div>
            </div>

            {/* Competition Selector */}
            <div className="mb-4">
              <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                <SelectTrigger className="w-full max-w-md rounded-none">
                  <SelectValue placeholder={t('federation.fightCard.selectCompetition')} />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {competitions.map(c => (
                    <SelectItem key={c.id} value={c.id} className="rounded-none">
                      {c.name} ({c.competition_date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCompId && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder={t('federation.fightCard.searchPlaceholder')}
                      className="pl-10 rounded-none"
                    />
                  </div>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="w-[140px] rounded-none">
                      <SelectValue placeholder={t('federation.fightCard.gender')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="all" className="rounded-none">{t('federation.fightCard.allGenders')}</SelectItem>
                      {filterOptions.genders.map(g => (
                        <SelectItem key={g} value={g} className="rounded-none">{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={ageFilter} onValueChange={setAgeFilter}>
                    <SelectTrigger className="w-[140px] rounded-none">
                      <SelectValue placeholder={t('federation.fightCard.age')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="all" className="rounded-none">{t('federation.fightCard.allAges')}</SelectItem>
                      {filterOptions.ages.map(a => (
                        <SelectItem key={a} value={a} className="rounded-none">{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={weightFilter} onValueChange={setWeightFilter}>
                    <SelectTrigger className="w-[140px] rounded-none">
                      <SelectValue placeholder={t('federation.fightCard.weight')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="all" className="rounded-none">{t('federation.fightCard.allWeights')}</SelectItem>
                      {filterOptions.weights.map(w => (
                        <SelectItem key={w} value={w} className="rounded-none">{w} kg</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Matches by Ring */}
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">{t('federation.fightCard.loading')}</div>
                ) : ringNumbers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">{t('federation.fightCard.noMatches')}</div>
                ) : (
                  <div className="space-y-8">
                    {ringNumbers.map(ringNum => {
                      const ringInfo = rings.find(r => r.ring_number === ringNum);
                      const ringLabel = ringInfo?.ring_name || `Ring ${ringNum}`;
                      const ringMatches = matchesByRing[ringNum];

                      return (
                        <div key={ringNum}>
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                            <ListOrdered className="h-5 w-5 text-foreground" />
                            <h2 className="text-lg font-bold">{ringLabel}</h2>
                            <Badge variant="outline" className="rounded-none ml-2">
                              {ringMatches.length} {t('federation.fightCard.fights')}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            {ringMatches.map(m => {
                              const isCompleted = m.status === 'completed';
                              const isCurrent = currentMatchIds.has(m.id);
                              const currentRing = isCurrent ? getRingForMatch(m.id) : null;

                              return (
                                <div
                                  key={m.id}
                                  className={`border border-border p-3 transition-all ${
                                    isCurrent
                                      ? 'bg-[hsl(var(--primary)/0.08)] border-foreground border-2'
                                      : isCompleted
                                      ? 'opacity-50'
                                      : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Match Order */}
                                    <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center font-bold text-sm border ${
                                      isCurrent ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'
                                    }`}>
                                      {m.match_order || m.match_number}
                                    </div>

                                    {/* Athletes - horizontal on desktop, stacked on mobile */}
                                    <div className="flex-1 min-w-0">
                                      {/* Desktop layout */}
                                      <div className="hidden sm:flex items-center gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <div className="w-1 h-7 bg-red-500 flex-shrink-0" />
                                          <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarImage src={m.athlete1?.photo_url || m.athlete1?.avatar_url || undefined} />
                                            <AvatarFallback className="text-[10px]">{(m.athlete1?.name || '?').charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0">
                                            <p className={`text-sm font-medium truncate ${m.winner_id === m.athlete1_id && isCompleted ? 'text-foreground font-bold' : ''}`}>
                                              {m.athlete1?.name || '—'}
                                            </p>
                                            {m.athlete1_club?.name && (
                                              <p className="text-[10px] text-muted-foreground truncate">{m.athlete1_club.name}</p>
                                            )}
                                          </div>
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground px-2">VS</span>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <div className="w-1 h-7 bg-blue-500 flex-shrink-0" />
                                          <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarImage src={m.athlete2?.photo_url || m.athlete2?.avatar_url || undefined} />
                                            <AvatarFallback className="text-[10px]">{(m.athlete2?.name || '?').charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0">
                                            <p className={`text-sm font-medium truncate ${m.winner_id === m.athlete2_id && isCompleted ? 'text-foreground font-bold' : ''}`}>
                                              {m.athlete2?.name || '—'}
                                            </p>
                                            {m.athlete2_club?.name && (
                                              <p className="text-[10px] text-muted-foreground truncate">{m.athlete2_club.name}</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Mobile layout - stacked: red on top, blue below */}
                                      <div className="flex sm:hidden flex-col gap-1">
                                        <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 border-l-2 border-red-500">
                                          <Avatar className="h-6 w-6 flex-shrink-0">
                                            <AvatarImage src={m.athlete1?.photo_url || m.athlete1?.avatar_url || undefined} />
                                            <AvatarFallback className="text-[9px]">{(m.athlete1?.name || '?').charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0 flex-1">
                                            <p className={`text-xs font-medium ${m.winner_id === m.athlete1_id && isCompleted ? 'font-bold' : ''}`}>
                                              {m.athlete1?.name || '—'}
                                            </p>
                                            {m.athlete1_club?.name && (
                                              <p className="text-[9px] text-muted-foreground">{m.athlete1_club.name}</p>
                                            )}
                                          </div>
                                          {m.winner_id === m.athlete1_id && isCompleted && (
                                            <Trophy className="h-3 w-3 text-red-500 flex-shrink-0" />
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 bg-blue-500/10 px-2 py-1 border-l-2 border-blue-500">
                                          <Avatar className="h-6 w-6 flex-shrink-0">
                                            <AvatarImage src={m.athlete2?.photo_url || m.athlete2?.avatar_url || undefined} />
                                            <AvatarFallback className="text-[9px]">{(m.athlete2?.name || '?').charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0 flex-1">
                                            <p className={`text-xs font-medium ${m.winner_id === m.athlete2_id && isCompleted ? 'font-bold' : ''}`}>
                                              {m.athlete2?.name || '—'}
                                            </p>
                                            {m.athlete2_club?.name && (
                                              <p className="text-[9px] text-muted-foreground">{m.athlete2_club.name}</p>
                                            )}
                                          </div>
                                          {m.winner_id === m.athlete2_id && isCompleted && (
                                            <Trophy className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Category + LIVE badge */}
                                    <div className="flex-shrink-0 text-right flex flex-col items-end gap-1">
                                      <Badge variant="secondary" className="rounded-none text-[10px]">
                                        {m.category?.name || '—'}
                                      </Badge>
                                      {isCurrent && (
                                        <Badge className="rounded-none text-[10px] bg-foreground text-background">
                                          LIVE
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Result row for completed */}
                                  {isCompleted && (
                                    <div className="mt-1 flex items-center gap-1">
                                      <Trophy className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">{getResultText(m)}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FederationFightCard;
