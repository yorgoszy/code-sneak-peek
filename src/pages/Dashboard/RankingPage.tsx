import React, { useState, useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, Trophy, Medal, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";

interface RankingEntry {
  athlete_id: string;
  athlete_name: string;
  athlete_avatar: string | null;
  club_name: string | null;
  total_points: number;
  competitions_count: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

interface CategoryGroup {
  age: string;
  gender: string;
  categories: { id: string; name: string }[];
}

const AGE_ORDER = ['18-40', 'U23', '16-17', '14-15', '12-13', '10-11', '8-9', '5-7'];

const getAgeLabel = (name: string): string => {
  if (/^Ενήλικοι/i.test(name)) return '18-40';
  if (/^U23/i.test(name)) return 'U23';
  const match = name.match(/^Νέ(?:οι|ες)\s*(\d+-\d+)/);
  if (match) return match[1];
  return name.replace(/([-+±]\s*\d+[\d.,]*\s*kg)/i, '').trim();
};

const getWeightLabel = (name: string): string => {
  const m = name.match(/([-+±]\s*\d+[\d.,]*\s*kg)/i);
  return m ? m[1] : name;
};

const RankingPage = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { userProfile } = useRoleCheck();

  const [federationId, setFederationId] = useState<string | null>(null);
  const [federationName, setFederationName] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGender, setSelectedGender] = useState<string>('male');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const role = userProfile?.role;

  useEffect(() => {
    if (userProfile?.id) {
      determineFederation();
    }
  }, [userProfile?.id]);

  const determineFederation = async () => {
    if (!userProfile) return;

    if (userProfile.role === 'federation') {
      setFederationId(userProfile.id);
      setFederationName(userProfile.name);
      return;
    }

    // For coach: find federation via federation_clubs
    if (userProfile.role === 'coach') {
      const { data } = await supabase
        .from('federation_clubs')
        .select('federation_id, federation:app_users!federation_clubs_federation_id_fkey(name)')
        .eq('club_id', userProfile.id)
        .limit(1)
        .single();
      if (data) {
        setFederationId(data.federation_id);
        setFederationName((data.federation as any)?.name || '');
      }
      return;
    }

    // For general users: find coach -> federation
    if (userProfile.coach_id) {
      const { data } = await supabase
        .from('federation_clubs')
        .select('federation_id, federation:app_users!federation_clubs_federation_id_fkey(name)')
        .eq('club_id', userProfile.coach_id)
        .limit(1)
        .single();
      if (data) {
        setFederationId(data.federation_id);
        setFederationName((data.federation as any)?.name || '');
      }
    }
  };

  useEffect(() => {
    if (federationId) {
      fetchData();
    }
  }, [federationId]);

  const fetchData = async () => {
    if (!federationId) return;
    setLoading(true);
    try {
      // Fetch all competitions with counts_for_ranking for this federation
      const { data: comps } = await supabase
        .from('federation_competitions')
        .select('id')
        .eq('federation_id', federationId)
        .eq('counts_for_ranking', true);

      const compIds = (comps || []).map(c => c.id);

      if (compIds.length === 0) {
        setResults([]);
        setCategories([]);
        setLoading(false);
        return;
      }

      // Fetch all categories from these competitions
      const { data: cats } = await supabase
        .from('federation_competition_categories')
        .select('id, name, gender, competition_id')
        .in('competition_id', compIds);

      setCategories(cats || []);

      // Fetch all results
      const { data: res } = await supabase
        .from('federation_competition_results')
        .select(`
          *,
          athlete:app_users!federation_competition_results_athlete_id_fkey(name, avatar_url, photo_url),
          club:app_users!federation_competition_results_club_id_fkey(name),
          category:federation_competition_categories(name, gender)
        `)
        .in('competition_id', compIds);

      setResults(res || []);
    } catch (error) {
      console.error('Error fetching ranking data:', error);
      toast.error('Σφάλμα φόρτωσης ranking');
    } finally {
      setLoading(false);
    }
  };

  // Build ranking from results
  const buildRanking = (): RankingEntry[] => {
    let filteredResults = results;

    // Filter by gender
    if (selectedGender !== 'all') {
      filteredResults = filteredResults.filter(r => r.category?.gender === selectedGender);
    }

    // Filter by age group
    if (selectedAge !== 'all') {
      filteredResults = filteredResults.filter(r => {
        const age = getAgeLabel(r.category?.name || '');
        return age === selectedAge;
      });
    }

    // Filter by specific category
    if (selectedCategory !== 'all') {
      filteredResults = filteredResults.filter(r => r.category_id === selectedCategory);
    }

    // Aggregate by athlete
    const athleteMap = new Map<string, RankingEntry>();
    filteredResults.forEach(r => {
      const key = r.athlete_id;
      if (!athleteMap.has(key)) {
        athleteMap.set(key, {
          athlete_id: r.athlete_id,
          athlete_name: r.athlete?.name || '-',
          athlete_avatar: r.athlete?.photo_url || r.athlete?.avatar_url || null,
          club_name: r.club?.name || null,
          total_points: 0,
          competitions_count: 0,
          golds: 0,
          silvers: 0,
          bronzes: 0,
        });
      }
      const entry = athleteMap.get(key)!;
      entry.total_points += r.points || 0;
      entry.competitions_count += 1;
      if (r.placement === 1) entry.golds += 1;
      if (r.placement === 2) entry.silvers += 1;
      if (r.placement === 3) entry.bronzes += 1;
    });

    return Array.from(athleteMap.values()).sort((a, b) => b.total_points - a.total_points);
  };

  // Get unique age groups from categories
  const getAgeGroups = (): string[] => {
    const ages = new Set<string>();
    categories
      .filter(c => selectedGender === 'all' || c.gender === selectedGender)
      .forEach(c => ages.add(getAgeLabel(c.name)));
    return AGE_ORDER.filter(a => ages.has(a)).concat([...ages].filter(a => !AGE_ORDER.includes(a)));
  };

  // Get categories for selected gender + age
  const getFilteredCategories = () => {
    return categories
      .filter(c => selectedGender === 'all' || c.gender === selectedGender)
      .filter(c => selectedAge === 'all' || getAgeLabel(c.name) === selectedAge);
  };

  const ranking = buildRanking();

  const renderSidebar = () => {
    if (role === 'federation') return <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
    if (role === 'coach') return <CoachSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
    return <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
  };

  const getMedalIcon = (position: number) => {
    if (position === 1) return <span className="text-lg">🥇</span>;
    if (position === 2) return <span className="text-lg">🥈</span>;
    if (position === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-sm font-bold text-muted-foreground w-6 text-center">{position}</span>;
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Ranking</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-[#cb8954]" /> Ranking
                </h1>
                {federationName && (
                  <p className="text-sm text-muted-foreground">{federationName}</p>
                )}
              </div>
            </div>

            {!federationId ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Δεν βρέθηκε συνδεδεμένη ομοσπονδία</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12 text-muted-foreground">Φόρτωση...</div>
            ) : (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <Select value={selectedGender} onValueChange={v => { setSelectedGender(v); setSelectedAge('all'); setSelectedCategory('all'); }}>
                    <SelectTrigger className="w-[140px] rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="all">Όλα</SelectItem>
                      <SelectItem value="male">Άνδρες</SelectItem>
                      <SelectItem value="female">Γυναίκες</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedAge} onValueChange={v => { setSelectedAge(v); setSelectedCategory('all'); }}>
                    <SelectTrigger className="w-[160px] rounded-none">
                      <SelectValue placeholder="Ηλικιακή ομάδα" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="all">Όλες οι ηλικίες</SelectItem>
                      {getAgeGroups().map(age => (
                        <SelectItem key={age} value={age}>{age}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px] rounded-none">
                      <SelectValue placeholder="Κατηγορία" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="all">Όλες οι κατηγορίες</SelectItem>
                      {getFilteredCategories().map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{getWeightLabel(cat.name)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ranking Table */}
                {ranking.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border border-border">
                    <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Δεν υπάρχουν αποτελέσματα ranking</p>
                    <p className="text-xs mt-1">Τα αποτελέσματα θα εμφανιστούν μετά την καταχώρηση τοποθετήσεων στους αγώνες</p>
                  </div>
                ) : (
                  <div className="border border-border">
                    {/* Header */}
                    <div className="grid grid-cols-[40px_1fr_80px_100px_80px] lg:grid-cols-[50px_1fr_120px_120px_100px] bg-muted text-xs font-bold text-foreground px-3 py-2">
                      <span>#</span>
                      <span>Αθλητής</span>
                      <span className="text-center">Μετάλλια</span>
                      <span className="text-center hidden lg:block">Αγώνες</span>
                      <span className="text-right">Πόντοι</span>
                    </div>

                    {/* Rows */}
                    {ranking.map((entry, index) => (
                      <div
                        key={entry.athlete_id}
                        className={`grid grid-cols-[40px_1fr_80px_100px_80px] lg:grid-cols-[50px_1fr_120px_120px_100px] items-center px-3 py-2 text-sm border-t border-border/50 ${
                          index < 3 ? 'bg-[#cb8954]/5' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          {getMedalIcon(index + 1)}
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-7 w-7 rounded-full shrink-0">
                            <AvatarImage src={entry.athlete_avatar || ''} />
                            <AvatarFallback className="text-[10px] rounded-full">
                              {entry.athlete_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{entry.athlete_name}</div>
                            {entry.club_name && (
                              <div className="text-[10px] text-muted-foreground truncate">{entry.club_name}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-1">
                          {entry.golds > 0 && <span className="text-xs">🥇{entry.golds}</span>}
                          {entry.silvers > 0 && <span className="text-xs">🥈{entry.silvers}</span>}
                          {entry.bronzes > 0 && <span className="text-xs">🥉{entry.bronzes}</span>}
                        </div>

                        <div className="text-center text-muted-foreground hidden lg:block">
                          {entry.competitions_count}
                        </div>

                        <div className="text-right font-bold text-[#cb8954]">
                          {entry.total_points}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground text-right">
                  {ranking.length} αθλητές
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RankingPage;
