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
import { useTranslation } from "react-i18next";

interface Match {
  id: string;
  competition_id: string;
  category_id: string;
  round_number: number;
  match_number: number;
  match_order: number | null;
  athlete1_id: string | null;
  athlete2_id: string | null;
  athlete1_club_id: string | null;
  athlete2_club_id: string | null;
  winner_id: string | null;
  athlete1_score: string | null;
  athlete2_score: string | null;
  result_type: string | null;
  is_bye: boolean;
  ring_number: number | null;
  status: string;
  athlete1?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  athlete2?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  athlete1_club?: { name: string } | null;
  athlete2_club?: { name: string } | null;
}

function getRoundName(roundNumber: number, t: any): string {
  if (roundNumber === 1) return t('federation.brackets.final');
  if (roundNumber === 2) return t('federation.brackets.semifinals');
  if (roundNumber === 4) return t('federation.brackets.quarterfinals');
  if (roundNumber === 8) return 'Προκριματικοί 1/8';
  if (roundNumber === 16) return 'Προκριματικοί 1/16';
  return `${t('federation.brackets.round')} ${roundNumber}`;
}

const AGE_ORDER = ['18-40', 'U23', '40+', '16-17', '14-15', '12-13', '10-11', '8-9', '5-7'];

const getWeightLabel = (name: string): string => {
  const m = name.match(/([-+±]\s*\d+[\d.,]*\s*kg)/i);
  return m ? m[1] : name;
};

const getAgeLabel = (name: string): string => {
  if (/^Ενήλικοι/i.test(name)) return '18-40';
  if (/^U23/i.test(name)) return 'U23';
  if (/^Βετεράνοι|^40\+/i.test(name)) return '40+';
  const match = name.match(/^Νέ(?:οι|ες)\s*(\d+-\d+)/);
  if (match) return match[1];
  return name.replace(/([-+±]\s*\d+[\d.,]*\s*kg)/i, '').trim();
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
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  // Cascading filters
  const [filterGender, setFilterGender] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterWeight, setFilterWeight] = useState('');
  const [registrationCounts, setRegistrationCounts] = useState<Map<string, number>>(new Map());

  const clubId = userProfile?.role === 'coach' ? userProfile?.id : userProfile?.coach_id;

  // Load competitions
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

  // Load categories + registration counts
  useEffect(() => {
    if (!selectedCompId) { setCategories([]); setSelectedCategoryId(''); setRegistrationCounts(new Map()); return; }
    const load = async () => {
      const [catRes, regRes] = await Promise.all([
        supabase
          .from('federation_competition_categories')
          .select('id, name, competition_id, gender')
          .eq('competition_id', selectedCompId)
          .order('name'),
        supabase
          .from('federation_competition_registrations')
          .select('category_id')
          .eq('competition_id', selectedCompId)
          .eq('is_paid', true),
      ]);
      setCategories(catRes.data || []);
      setSelectedCategoryId('');
      const counts = new Map<string, number>();
      (regRes.data || []).forEach((r: any) => {
        if (r.category_id) counts.set(r.category_id, (counts.get(r.category_id) || 0) + 1);
      });
      setRegistrationCounts(counts);
    };
    load();
  }, [selectedCompId]);

  // Reset filters when competition changes
  useEffect(() => {
    setFilterGender('');
    setFilterAge('');
    setFilterWeight('');
    setSelectedCategoryId('');
  }, [selectedCompId]);

  // Cascading filter options
  const genderOptions = React.useMemo(() => {
    const genders = new Set(categories.map(c => c.gender));
    return [...genders].sort();
  }, [categories]);

  const ageOptions = React.useMemo(() => {
    if (!filterGender) return [];
    const filtered = categories.filter(c => c.gender === filterGender);
    const ages = new Set(filtered.map(c => getAgeLabel(c.name)));
    return AGE_ORDER.filter(a => ages.has(a)).concat([...ages].filter(a => !AGE_ORDER.includes(a)));
  }, [categories, filterGender]);

  const weightOptions = React.useMemo(() => {
    if (!filterGender || !filterAge) return [];
    const filtered = categories.filter(c => c.gender === filterGender && getAgeLabel(c.name) === filterAge);
    return filtered.map(c => ({ id: c.id, label: getWeightLabel(c.name), count: registrationCounts.get(c.id) || 0 }));
  }, [categories, filterGender, filterAge, registrationCounts]);

  useEffect(() => {
    if (filterWeight) setSelectedCategoryId(filterWeight);
    else setSelectedCategoryId('');
  }, [filterWeight]);

  const handleGenderChange = (val: string) => { setFilterGender(val); setFilterAge(''); setFilterWeight(''); };
  const handleAgeChange = (val: string) => { setFilterAge(val); setFilterWeight(''); };

  // Load matches
  useEffect(() => {
    if (!selectedCategoryId || !selectedCompId) { setMatches([]); return; }
    loadMatches();
  }, [selectedCategoryId, selectedCompId]);

  const loadMatches = useCallback(async () => {
    if (!selectedCategoryId || !selectedCompId) return;
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
    setMatches((data as any) || []);
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

  // Group matches by round
  const rounds = matches.reduce<Record<number, Match[]>>((acc, m) => {
    if (!acc[m.round_number]) acc[m.round_number] = [];
    acc[m.round_number].push(m);
    return acc;
  }, {});
  const sortedRoundNumbers = Object.keys(rounds).map(Number).sort((a, b) => b - a);

  const getAthleteAvatar = (athlete: any) => athlete?.photo_url || athlete?.avatar_url || undefined;

  const getSlotDisplayName = (match: Match, slot: 'athlete1' | 'athlete2', globalMatchNumbers?: Map<string, number>): { name: string; isConfirmed: boolean } => {
    const athleteId = slot === 'athlete1' ? match.athlete1_id : match.athlete2_id;
    const athlete = slot === 'athlete1' ? match.athlete1 : match.athlete2;
    if (athleteId && athlete?.name) return { name: athlete.name, isConfirmed: true };

    const feederRound = match.round_number * 2;
    const feederMatchNumber = slot === 'athlete1' ? (match.match_number * 2) - 1 : match.match_number * 2;

    const feederRoundMatches = (rounds[feederRound] || []).slice().sort((a, b) => a.match_number - b.match_number);
    const feederMatch = feederRoundMatches.find((m) => m.match_number === feederMatchNumber)
      || (feederRoundMatches.length === 1 ? feederRoundMatches[0] : undefined);

    if (!feederMatch) return { name: `Νικητής αγ. ${feederMatchNumber}`, isConfirmed: false };

    if (feederMatch.winner_id) {
      const winnerName = feederMatch.athlete1_id === feederMatch.winner_id
        ? feederMatch.athlete1?.name : feederMatch.athlete2?.name;
      if (winnerName) return { name: winnerName, isConfirmed: true };
      const winnerMatchNumber = feederMatch.match_order || globalMatchNumbers?.get(feederMatch.id) || feederMatchNumber;
      return { name: `Νικητής αγ. ${winnerMatchNumber}`, isConfirmed: false };
    }

    if (feederMatch.match_order) return { name: `Νικητής αγ. ${feederMatch.match_order}`, isConfirmed: false };
    const globalNum = globalMatchNumbers?.get(feederMatch.id);
    if (globalNum) return { name: `Νικητής αγ. ${globalNum}`, isConfirmed: false };
    return { name: `Νικητής αγ. ${feederMatchNumber}`, isConfirmed: false };
  };

  const role = userProfile?.role;
  const renderSidebar = () => {
    if (role === 'federation') return <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
    if (role === 'coach') return <CoachSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
    return <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
  };

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <div className="hidden lg:block">{renderSidebar()}</div>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">{t('federation.brackets.mobileTitle')}</h1>
            </div>
          </div>

          <main className="flex-1 p-2 lg:p-3 overflow-auto flex flex-col min-h-0">
            {/* Compact header row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="hidden lg:block text-lg font-bold text-foreground whitespace-nowrap">{t('federation.brackets.title')}</h1>

              <div className="w-44">
                <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                  <SelectTrigger className="rounded-none h-8 text-xs">
                    <SelectValue placeholder={t('federation.brackets.selectCompetition')} />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Cascading filters */}
              {selectedCompId && categories.length > 0 && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <Select value={filterGender} onValueChange={handleGenderChange}>
                    <SelectTrigger className="rounded-none h-8 text-xs w-28">
                      <SelectValue placeholder="Φύλο" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map(g => (
                        <SelectItem key={g} value={g}>
                          {g === 'male' ? 'Άνδρες' : 'Γυναίκες'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterAge} onValueChange={handleAgeChange} disabled={!filterGender}>
                    <SelectTrigger className="rounded-none h-8 text-xs w-24">
                      <SelectValue placeholder="Ηλικία" />
                    </SelectTrigger>
                    <SelectContent>
                      {ageOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={filterWeight} onValueChange={setFilterWeight} disabled={!filterAge}>
                    <SelectTrigger className="rounded-none h-8 text-xs w-32">
                      <SelectValue placeholder="Κιλά" />
                    </SelectTrigger>
                    <SelectContent>
                      {weightOptions.map(w => (
                        <SelectItem key={w.id} value={w.id}>
                          <span className="flex items-center gap-1">
                            <span>{w.label}</span>
                            {w.count > 0 && (
                              <Badge className="rounded-none text-[8px] h-3.5 px-1 bg-foreground text-background">
                                {w.count}
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Selected category badge */}
            {selectedCategoryId && (
              <div className="mb-1">
                <Badge variant="outline" className="rounded-none text-xs py-0.5 px-2">
                  {categories.find(c => c.id === selectedCategoryId)?.name}
                </Badge>
              </div>
            )}

            {matches.length === 0 && selectedCategoryId && !loading && (
              <Card className="rounded-none">
                <CardContent className="p-8 text-center text-muted-foreground">
                  {t('federation.brackets.noDraw')}
                </CardContent>
              </Card>
            )}

            {/* Visual Bracket with absolute positioning */}
            {matches.length > 0 && (() => {
              const CARD_H = 110;
              const CARD_GAP = 40;
              const COL_W = 300;
              const CONNECTOR_W = 60;
              const HEADER_H = 50;

              const roundMatchArrays = sortedRoundNumbers.map(rn =>
                rounds[rn].filter(m => !m.is_bye).sort((a, b) => (a.match_order || a.match_number) - (b.match_order || b.match_number))
              );
              const firstRoundCount = roundMatchArrays[0]?.length || 1;
              const maxMatchesInAnyRound = Math.max(...roundMatchArrays.map(r => r.length), 1);

              const minSpacing = CARD_H + CARD_GAP;
              const contentH = HEADER_H + maxMatchesInAnyRound * (CARD_H + CARD_GAP) + 40;
              let totalH = Math.max(contentH, 700);
              const totalW = sortedRoundNumbers.length * (COL_W + CONNECTOR_W);

              const matchByRoundAndNum = new Map<string, Match>();
              sortedRoundNumbers.forEach(rn => {
                rounds[rn].forEach(m => {
                  matchByRoundAndNum.set(`${rn}-${m.match_number}`, m);
                });
              });

              const yPositions = new Map<string, number>();

              const firstRoundSpacing = Math.max((totalH - HEADER_H) / firstRoundCount, minSpacing);
              roundMatchArrays[0]?.forEach((m, i) => {
                yPositions.set(m.id, HEADER_H + i * firstRoundSpacing + firstRoundSpacing / 2);
              });

              for (let ri = 1; ri < sortedRoundNumbers.length; ri++) {
                const prevRound = sortedRoundNumbers[ri - 1];
                roundMatchArrays[ri].forEach((m, mi) => {
                  const feederNum1 = m.match_number * 2 - 1;
                  const feederNum2 = m.match_number * 2;
                  const feeder1 = matchByRoundAndNum.get(`${prevRound}-${feederNum1}`);
                  const feeder2 = matchByRoundAndNum.get(`${prevRound}-${feederNum2}`);
                  const y1 = feeder1 && !feeder1.is_bye ? yPositions.get(feeder1.id) : undefined;
                  const y2 = feeder2 && !feeder2.is_bye ? yPositions.get(feeder2.id) : undefined;

                  let yCenter: number;
                  if (y1 !== undefined && y2 !== undefined) yCenter = (y1 + y2) / 2;
                  else if (y1 !== undefined) yCenter = y1;
                  else if (y2 !== undefined) yCenter = y2;
                  else {
                    const spacing = totalH / (roundMatchArrays[ri].length + 1);
                    yCenter = spacing * (mi + 1);
                  }
                  yPositions.set(m.id, yCenter);
                });

                const roundMatches = roundMatchArrays[ri];
                const sortedByOrder = [...roundMatches].sort(
                  (a, b) => (a.match_order || a.match_number) - (b.match_order || b.match_number)
                );
                for (let j = 1; j < sortedByOrder.length; j++) {
                  const prevY = yPositions.get(sortedByOrder[j - 1].id) || 0;
                  const currY = yPositions.get(sortedByOrder[j].id) || 0;
                  if (currY - prevY < minSpacing) {
                    yPositions.set(sortedByOrder[j].id, prevY + minSpacing);
                  }
                }
              }

              let maxY = 0;
              yPositions.forEach(y => { const bottom = y + CARD_H / 2; if (bottom > maxY) maxY = bottom; });
              totalH = Math.max(totalH, maxY + 40);

              const globalMatchNumbers = new Map<string, number>();
              sortedRoundNumbers.forEach(rn => {
                roundMatchArrays[sortedRoundNumbers.indexOf(rn)].forEach(m => {
                  if (m.match_order) globalMatchNumbers.set(m.id, m.match_order);
                });
              });

              return (
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto border border-border bg-muted/10 p-3" style={{ height: 'calc(100vh - 80px)' }}>
                  <div className="relative" style={{ width: totalW, minHeight: totalH }}>
                    {sortedRoundNumbers.map((roundNum, ri) => {
                      const rMatches = roundMatchArrays[ri];
                      const xOffset = ri * (COL_W + CONNECTOR_W);

                      return (
                        <React.Fragment key={roundNum}>
                          {/* Round header */}
                          <div
                            className="absolute bg-foreground text-background px-3 py-2 border border-border"
                            style={{ left: xOffset, top: 0, width: COL_W }}
                          >
                            <h3 className="font-bold text-xs">{getRoundName(roundNum, t)}</h3>
                            <span className="text-[10px] opacity-70">{rMatches.length} αγώνες</span>
                          </div>

                          {/* Match cards */}
                          {rMatches.map((match) => {
                            const yCenter = yPositions.get(match.id) || 0;
                            const yTop = yCenter - CARD_H / 2;
                            const globalMatchNum = globalMatchNumbers.get(match.id) || 0;
                            const slot1 = getSlotDisplayName(match, 'athlete1', globalMatchNumbers);
                            const slot2 = getSlotDisplayName(match, 'athlete2', globalMatchNumbers);

                            return (
                              <div
                                key={match.id}
                                className={`absolute border bg-card ${
                                  match.status === 'completed' ? 'border-[#00ffba] shadow-sm' : 'border-border'
                                }`}
                                style={{ left: xOffset, top: yTop, width: COL_W, height: CARD_H, overflow: 'hidden' }}
                              >
                                {/* Match number header */}
                                <div className="flex items-center justify-between px-2.5 py-1 bg-muted/50 border-b border-border">
                                  <span className="text-[11px] font-bold text-foreground">Αγ. {globalMatchNum}</span>
                                  {match.status === 'completed' && match.result_type && (
                                    <Badge variant="secondary" className="rounded-none text-[9px] h-4 px-1.5 uppercase">
                                      {match.result_type}
                                      {match.athlete1_score && ` ${match.athlete1_score}`}
                                      {match.athlete2_score && ` ${match.athlete2_score}`}
                                    </Badge>
                                  )}
                                </div>

                                {/* Athlete 1 - Red corner */}
                                <div className={`flex items-center gap-2 px-2.5 py-1.5 border-l-[3px] border-l-red-500 ${
                                  match.winner_id === match.athlete1_id ? 'bg-[#00ffba]/10' : ''
                                }`}>
                                  <Avatar className="h-6 w-6 shrink-0">
                                    <AvatarImage src={getAthleteAvatar(match.athlete1)} />
                                    <AvatarFallback className="text-[10px] bg-red-100 text-red-700">
                                      {match.athlete1?.name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[12px] leading-tight truncate ${slot1.isConfirmed ? 'font-bold text-red-700' : 'text-muted-foreground italic text-[11px]'}`}>
                                      {slot1.name}
                                    </p>
                                    {match.athlete1_club && (
                                      <p className="text-[10px] text-muted-foreground truncate leading-tight">{match.athlete1_club.name}</p>
                                    )}
                                  </div>
                                  {match.winner_id === match.athlete1_id && <Trophy className="h-3.5 w-3.5 text-[#cb8954] shrink-0" />}
                                </div>

                                <div className="border-t border-border/50" />

                                {/* Athlete 2 - Blue corner */}
                                <div className={`flex items-center gap-2 px-2.5 py-1.5 border-l-[3px] border-l-blue-500 ${
                                  match.winner_id === match.athlete2_id ? 'bg-[#00ffba]/10' : ''
                                }`}>
                                  <Avatar className="h-6 w-6 shrink-0">
                                    <AvatarImage src={getAthleteAvatar(match.athlete2)} />
                                    <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                      {match.athlete2?.name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[12px] leading-tight truncate ${slot2.isConfirmed ? 'font-bold text-blue-700' : 'text-muted-foreground italic text-[11px]'}`}>
                                      {slot2.name}
                                    </p>
                                    {match.athlete2_club && (
                                      <p className="text-[10px] text-muted-foreground truncate leading-tight">{match.athlete2_club.name}</p>
                                    )}
                                  </div>
                                  {match.winner_id === match.athlete2_id && <Trophy className="h-3.5 w-3.5 text-[#cb8954] shrink-0" />}
                                </div>
                              </div>
                            );
                          })}

                          {/* Connector lines */}
                          {ri < sortedRoundNumbers.length - 1 && (
                            <svg
                              className="absolute overflow-visible pointer-events-none"
                              style={{ left: xOffset + COL_W, top: 0, width: CONNECTOR_W, height: totalH }}
                            >
                              {roundMatchArrays[ri + 1].map((nextMatch) => {
                                const prevRound = sortedRoundNumbers[ri];
                                const feederNum1 = nextMatch.match_number * 2 - 1;
                                const feederNum2 = nextMatch.match_number * 2;
                                const feeder1 = matchByRoundAndNum.get(`${prevRound}-${feederNum1}`);
                                const feeder2 = matchByRoundAndNum.get(`${prevRound}-${feederNum2}`);
                                const y1 = feeder1 && !feeder1.is_bye ? yPositions.get(feeder1.id) : undefined;
                                const y2 = feeder2 && !feeder2.is_bye ? yPositions.get(feeder2.id) : undefined;
                                const yNext = yPositions.get(nextMatch.id) || 0;
                                if (y1 === undefined && y2 === undefined) return null;
                                const halfW = CONNECTOR_W / 2;

                                return (
                                  <g key={nextMatch.id}>
                                    {y1 !== undefined && <line x1="0" y1={y1} x2={halfW} y2={y1} stroke="hsl(var(--border))" strokeWidth="1.5" />}
                                    {y2 !== undefined && <line x1="0" y1={y2} x2={halfW} y2={y2} stroke="hsl(var(--border))" strokeWidth="1.5" />}
                                    {y1 !== undefined && y2 !== undefined && <line x1={halfW} y1={y1} x2={halfW} y2={y2} stroke="hsl(var(--border))" strokeWidth="1.5" />}
                                    <line x1={halfW} y1={yNext} x2={CONNECTOR_W} y2={yNext} stroke="hsl(var(--border))" strokeWidth="1.5" />
                                  </g>
                                );
                              })}
                            </svg>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CoachBracketsPage;
