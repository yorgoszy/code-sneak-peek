import React, { useState, useEffect, useCallback } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, Shuffle, Trophy, ChevronRight, ChevronDown, User, Award, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Competition {
  id: string;
  name: string;
  competition_date: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
  competition_id: string;
  gender: string;
}

interface Registration {
  id: string;
  athlete_id: string;
  club_id: string;
  category_id: string;
  athlete: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  club: { name: string } | null;
}

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

// Tournament bracket generation algorithm
function generateBracket(registrations: Registration[]): Omit<Match, 'id' | 'athlete1' | 'athlete2' | 'athlete1_club' | 'athlete2_club'>[] {
  const athletes = registrations.map(r => ({
    athleteId: r.athlete_id,
    clubId: r.club_id,
  }));

  const n = athletes.length;
  if (n < 2) return [];

  // Calculate bracket size (next power of 2)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
  const totalRounds = Math.log2(bracketSize);
  const byes = bracketSize - n;

  // Seed athletes trying to avoid same-club matchups
  const seeded = seedAvoidingSameClub(athletes, bracketSize);

  const matches: Omit<Match, 'id' | 'athlete1' | 'athlete2' | 'athlete1_club' | 'athlete2_club'>[] = [];
  let matchOrder = 1;

  // Build all rounds structure first
  // nextRoundSlots[roundNumber][matchNumber] = { athlete1, athlete2, ... }
  type Slot = { athleteId: string; clubId: string } | null;
  const roundSlots: Map<string, { a1: Slot; a2: Slot }> = new Map();

  // Create first round matches
  const firstRoundNumber = Math.pow(2, totalRounds - 1);
  const firstRoundSize = bracketSize / 2;

  for (let i = 0; i < firstRoundSize; i++) {
    const a1 = seeded[i * 2];
    const a2 = seeded[i * 2 + 1];
    const matchNum = i + 1;

    if (a1 && !a2) {
      // BYE - athlete advances automatically
      matches.push({
        competition_id: '',
        category_id: '',
        round_number: firstRoundNumber,
        match_number: matchNum,
        match_order: matchOrder++,
        athlete1_id: a1.athleteId,
        athlete2_id: null,
        athlete1_club_id: a1.clubId,
        athlete2_club_id: null,
        winner_id: a1.athleteId,
        athlete1_score: null,
        athlete2_score: null,
        result_type: 'bye',
        is_bye: true,
        ring_number: null,
        status: 'completed',
      });

      // Propagate bye winner to next round
      const nextRound = firstRoundNumber / 2;
      const nextMatchNum = Math.ceil(matchNum / 2);
      const isFirstSlot = matchNum % 2 === 1;
      const key = `${nextRound}-${nextMatchNum}`;
      if (!roundSlots.has(key)) roundSlots.set(key, { a1: null, a2: null });
      const slot = roundSlots.get(key)!;
      if (isFirstSlot) slot.a1 = a1; else slot.a2 = a1;
    } else if (a1 && a2) {
      matches.push({
        competition_id: '',
        category_id: '',
        round_number: firstRoundNumber,
        match_number: matchNum,
        match_order: matchOrder++,
        athlete1_id: a1.athleteId,
        athlete2_id: a2.athleteId,
        athlete1_club_id: a1.clubId,
        athlete2_club_id: a2.clubId,
        winner_id: null,
        athlete1_score: null,
        athlete2_score: null,
        result_type: null,
        is_bye: false,
        ring_number: null,
        status: 'pending',
      });
    }
  }

  // Subsequent rounds - pre-fill with bye winners
  for (let round = totalRounds - 2; round >= 0; round--) {
    const roundNumber = Math.pow(2, round);
    const roundSize = roundNumber;
    for (let i = 0; i < roundSize; i++) {
      const matchNum = i + 1;
      const key = `${roundNumber}-${matchNum}`;
      const slot = roundSlots.get(key) || { a1: null, a2: null };

      matches.push({
        competition_id: '',
        category_id: '',
        round_number: roundNumber,
        match_number: matchNum,
        match_order: matchOrder++,
        athlete1_id: slot.a1?.athleteId || null,
        athlete2_id: slot.a2?.athleteId || null,
        athlete1_club_id: slot.a1?.clubId || null,
        athlete2_club_id: slot.a2?.clubId || null,
        winner_id: null,
        athlete1_score: null,
        athlete2_score: null,
        result_type: null,
        is_bye: false,
        ring_number: null,
        status: 'pending',
      });
    }
  }

  return matches;
}

// Seed athletes into bracket positions, maximizing distance between same-club athletes
// Uses recursive halving: same-club athletes go to opposite halves, then opposite quarters, etc.
function seedAvoidingSameClub(
  athletes: { athleteId: string; clubId: string }[],
  bracketSize: number
): ({ athleteId: string; clubId: string } | null)[] {
  const n = athletes.length;
  const totalPairs = bracketSize / 2;

  // Group athletes by club, sorted by club size descending
  const clubGroups = new Map<string, { athleteId: string; clubId: string }[]>();
  for (const a of athletes) {
    if (!clubGroups.has(a.clubId)) clubGroups.set(a.clubId, []);
    clubGroups.get(a.clubId)!.push(a);
  }
  const sortedClubs = [...clubGroups.entries()].sort((a, b) => b[1].length - a[1].length);

  // Shuffle within each club
  for (const [, arr] of sortedClubs) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Recursive bracket segment distribution
  // Divide the bracket into segments (halves, quarters, etc.)
  // and distribute same-club athletes across different segments
  const slots: ({ athleteId: string; clubId: string } | null)[] = new Array(totalPairs).fill(null);
  
  // Each slot represents a "pair position" (will become positions i*2 and i*2+1)
  // We distribute athletes to slots, then assign positions within slots
  
  function distributeToSegments(
    clubAthletes: { athleteId: string; clubId: string }[],
    segmentIndices: number[][]
  ): void {
    if (clubAthletes.length === 0) return;
    if (segmentIndices.length === 0) return;

    // Distribute athletes round-robin across segments
    let segIdx = 0;
    for (const athlete of clubAthletes) {
      // Find a segment that has an empty slot
      let placed = false;
      for (let attempt = 0; attempt < segmentIndices.length; attempt++) {
        const seg = segmentIndices[(segIdx + attempt) % segmentIndices.length];
        const emptyIdx = seg.find(i => slots[i] === null);
        if (emptyIdx !== undefined) {
          slots[emptyIdx] = athlete;
          placed = true;
          segIdx = ((segIdx + attempt) % segmentIndices.length) + 1;
          break;
        }
      }
      if (!placed) {
        // Fallback: place in any empty slot
        const emptyIdx = slots.findIndex(s => s === null);
        if (emptyIdx >= 0) slots[emptyIdx] = athlete;
      }
    }
  }

  // Build segment hierarchy: split bracket into 2, then 4, then 8, etc.
  function buildSegments(indices: number[], depth: number): number[][] {
    if (depth <= 0 || indices.length <= 1) return [indices];
    const mid = Math.floor(indices.length / 2);
    const left = buildSegments(indices.slice(0, mid), depth - 1);
    const right = buildSegments(indices.slice(mid), depth - 1);
    // Interleave left and right for better distribution
    const result: number[][] = [];
    const maxLen = Math.max(left.length, right.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < left.length) result.push(left[i]);
      if (i < right.length) result.push(right[i]);
    }
    return result;
  }

  const allSlotIndices = Array.from({ length: totalPairs }, (_, i) => i);
  
  // For each club, determine the appropriate segmentation depth
  // Largest clubs need the deepest separation
  for (const [, clubAthletes] of sortedClubs) {
    const count = clubAthletes.length;
    if (count <= 0) continue;
    
    // Determine how many segments we need (at least as many as athletes)
    const depth = Math.ceil(Math.log2(Math.max(count, 2)));
    const segments = buildSegments(allSlotIndices, depth);
    
    distributeToSegments(clubAthletes, segments);
  }

  // Convert slots to final positions array
  // Each slot i becomes positions i*2 (athlete) and i*2+1 (opponent or null/bye)
  const positions: ({ athleteId: string; clubId: string } | null)[] = new Array(bracketSize).fill(null);
  
  // First pass: place one athlete per pair at even positions
  const placedAthletes: { athleteId: string; clubId: string }[] = [];
  const unplacedAthletes: { athleteId: string; clubId: string }[] = [];
  
  for (let i = 0; i < totalPairs; i++) {
    if (slots[i]) {
      positions[i * 2] = slots[i];
      placedAthletes.push(slots[i]!);
    }
  }

  // Remaining athletes (more than totalPairs) need odd positions
  // This shouldn't happen with proper slot distribution, but handle it
  const allPlaced = new Set(placedAthletes.map(a => a.athleteId));
  for (const [, clubAthletes] of sortedClubs) {
    for (const a of clubAthletes) {
      if (!allPlaced.has(a.athleteId)) {
        unplacedAthletes.push(a);
      }
    }
  }

  // Place remaining athletes at odd positions, avoiding same-club pairs
  for (const athlete of unplacedAthletes) {
    let bestIdx = -1;
    for (let pair = 0; pair < totalPairs; pair++) {
      const oddIdx = pair * 2 + 1;
      if (positions[oddIdx] === null) {
        const partner = positions[pair * 2];
        if (!partner || partner.clubId !== athlete.clubId) {
          bestIdx = oddIdx;
          break;
        }
        if (bestIdx < 0) bestIdx = oddIdx; // fallback
      }
    }
    if (bestIdx >= 0) positions[bestIdx] = athlete;
  }

  // Final swap pass: ensure no pair has same club in round 1
  for (let attempt = 0; attempt < 200; attempt++) {
    let anySwapped = false;
    for (let pair = 0; pair < totalPairs; pair++) {
      const idx1 = pair * 2;
      const idx2 = pair * 2 + 1;
      const a1 = positions[idx1];
      const a2 = positions[idx2];
      if (a1 && a2 && a1.clubId === a2.clubId) {
        let swapped = false;
        for (let otherPair = pair + 1; otherPair < totalPairs; otherPair++) {
          const oi1 = otherPair * 2;
          const oi2 = otherPair * 2 + 1;
          const o1 = positions[oi1];
          const o2 = positions[oi2];
          if (o1 && o1.clubId !== a1.clubId && (!o2 || o2.clubId !== a2.clubId)) {
            [positions[idx2], positions[oi1]] = [positions[oi1], positions[idx2]];
            swapped = true; anySwapped = true; break;
          }
          if (o2 && o2.clubId !== a1.clubId && (!o1 || o1.clubId !== a2.clubId)) {
            [positions[idx2], positions[oi2]] = [positions[oi2], positions[idx2]];
            swapped = true; anySwapped = true; break;
          }
        }
        if (!swapped) {
          for (let otherPair = pair + 1; otherPair < totalPairs; otherPair++) {
            const oi1 = otherPair * 2;
            const oi2 = otherPair * 2 + 1;
            const o1 = positions[oi1];
            const o2 = positions[oi2];
            if (o1 && o1.clubId !== a2.clubId && (!o2 || o2.clubId !== a1.clubId)) {
              [positions[idx1], positions[oi1]] = [positions[oi1], positions[idx1]];
              anySwapped = true; break;
            }
            if (o2 && o2.clubId !== a2.clubId && (!o1 || o1.clubId !== a1.clubId)) {
              [positions[idx1], positions[oi2]] = [positions[oi2], positions[idx1]];
              anySwapped = true; break;
            }
          }
        }
      }
    }
    if (!anySwapped) break;
  }

  return positions;
}

function getRoundName(roundNumber: number, t: any): string {
  if (roundNumber === 1) return t('federation.brackets.final');
  if (roundNumber === 2) return t('federation.brackets.semifinals');
  if (roundNumber === 4) return t('federation.brackets.quarterfinals');
  if (roundNumber === 8) return 'Προκριματικοί 1/8';
  if (roundNumber === 16) return 'Προκριματικοί 1/16';
  return `${t('federation.brackets.round')} ${roundNumber}`;
}

// Category grouping utilities (same logic as CompetitionRegistrationsDialog)
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

const groupByAge = (cats: Category[]) => {
  const grouped = new Map<string, Category[]>();
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

// Collapsible age group component for category selection
const BracketAgeGroup: React.FC<{
  age: string;
  cats: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  registrationCounts: Map<string, number>;
}> = ({ age, cats, selectedCategoryId, onSelectCategory, registrationCounts }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const totalRegs = cats.reduce((sum, c) => sum + (registrationCounts.get(c.id) || 0), 0);
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
          {isOpen
            ? <ChevronDown className="h-4 w-4 shrink-0" />
            : <ChevronRight className="h-4 w-4 shrink-0" />
          }
          {age}
        </span>
        <div className="flex items-center gap-1.5">
          {totalRegs > 0 && (
            <Badge className={`rounded-none text-[9px] h-4 px-1 ${hasSelected ? 'bg-background text-foreground' : 'bg-foreground text-background'}`}>
              {totalRegs}
            </Badge>
          )}
          <span className={`text-[9px] ${hasSelected ? 'text-background/70' : 'text-muted-foreground'}`}>{cats.length} κατ.</span>
        </div>
      </button>
      {isOpen && (
        <div>
          {cats.map(cat => {
            const count = registrationCounts.get(cat.id) || 0;
            const isSelected = cat.id === selectedCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs border-t border-border/30 cursor-pointer transition-colors ${
                  isSelected ? 'bg-foreground text-background font-bold' : 'hover:bg-accent/30'
                }`}
              >
                <span className="font-medium">{getWeightLabel(cat.name)}</span>
                {count > 0 && (
                  <Badge className={`rounded-none text-[9px] h-4 px-1 ${isSelected ? 'bg-background text-foreground' : 'bg-muted text-foreground'}`}>
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FederationBrackets = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();
  const { t } = useTranslation();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  // Filters
  const [filterGender, setFilterGender] = useState<string>('');
  const [filterAge, setFilterAge] = useState<string>('');
  const [filterWeight, setFilterWeight] = useState<string>('');
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [registrationCounts, setRegistrationCounts] = useState<Map<string, number>>(new Map());
  const [hasAnyMatches, setHasAnyMatches] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  // Winner selection dialog
  const [winnerDialog, setWinnerDialog] = useState<{ match: Match; open: boolean } | null>(null);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [scoreText, setScoreText] = useState('');
  const [resultType, setResultType] = useState('points');

  // Reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const federationId = userProfile?.id;

  // Load competitions
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

  // Load categories, registration counts, and check for existing matches when competition changes
  useEffect(() => {
    if (!selectedCompId) { setCategories([]); setSelectedCategoryId(''); setRegistrationCounts(new Map()); setHasAnyMatches(false); return; }
    const load = async () => {
      const [catRes, regRes, matchCountRes] = await Promise.all([
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
        supabase
          .from('competition_matches')
          .select('id')
          .eq('competition_id', selectedCompId)
          .limit(1)
      ]);
      setCategories(catRes.data || []);
      setSelectedCategoryId('');
      setHasAnyMatches((matchCountRes.data?.length || 0) > 0);
      
      const counts = new Map<string, number>();
      (regRes.data || []).forEach((r: any) => {
        if (r.category_id) {
          counts.set(r.category_id, (counts.get(r.category_id) || 0) + 1);
        }
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

  // Derive available filter options from categories
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

  // Auto-select category when weight filter changes
  useEffect(() => {
    if (filterWeight) {
      setSelectedCategoryId(filterWeight);
    } else {
      setSelectedCategoryId('');
    }
  }, [filterWeight]);

  // Reset downstream filters
  const handleGenderChange = (val: string) => {
    setFilterGender(val);
    setFilterAge('');
    setFilterWeight('');
  };

  const handleAgeChange = (val: string) => {
    setFilterAge(val);
    setFilterWeight('');
  };


  useEffect(() => {
    if (!selectedCategoryId || !selectedCompId) { setMatches([]); return; }
    loadCategoryMatches();
  }, [selectedCategoryId, selectedCompId]);

  const loadCategoryMatches = useCallback(async () => {
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

  // Generate brackets for ALL categories at once with unified numbering
  const handleGenerateAllBrackets = async () => {
    setGeneratingAll(true);
    try {
      // Load all registrations for all categories
      const { data: allRegs } = await supabase
        .from('federation_competition_registrations')
        .select(`
          id, athlete_id, club_id, category_id,
          athlete:app_users!federation_competition_registrations_athlete_id_fkey(name, photo_url, avatar_url),
          club:app_users!federation_competition_registrations_club_id_fkey(name)
        `)
        .eq('competition_id', selectedCompId)
        .eq('is_paid', true);

      if (!allRegs?.length) {
        toast.error('Δεν υπάρχουν δηλώσεις');
        return;
      }

      // Group registrations by category
      const regsByCategory = new Map<string, Registration[]>();
      allRegs.forEach((r: any) => {
        if (!regsByCategory.has(r.category_id)) regsByCategory.set(r.category_id, []);
        regsByCategory.get(r.category_id)!.push(r);
      });

      // Generate brackets for each category
      const orderedCategories = categories.filter(c => {
        const regs = regsByCategory.get(c.id);
        return regs && regs.length >= 2;
      });

      // Step 1: Generate all brackets per category (without match_order yet)
      const allBrackets: { categoryId: string; match: any; roundNumber: number; matchNumber: number }[] = [];
      for (const cat of orderedCategories) {
        const catRegs = regsByCategory.get(cat.id)!;
        const bracket = generateBracket(catRegs);
        bracket.forEach(m => {
          allBrackets.push({
            categoryId: cat.id,
            match: { ...m, competition_id: selectedCompId, category_id: cat.id },
            roundNumber: m.round_number,
            matchNumber: m.match_number,
          });
        });
      }

      // Step 2: Order matches so that each athlete has at least ~3-5 matches gap
      // Strategy: process round by round (highest round_number = first round of tournament)
      // Within each round, interleave categories so same-category matches are spread apart
      const roundNumbers = [...new Set(allBrackets.map(b => b.roundNumber))].sort((a, b) => b - a);
      
      const orderedMatches: typeof allBrackets = [];
      for (const rn of roundNumbers) {
        const roundMatches = allBrackets.filter(b => b.roundNumber === rn && !b.match.is_bye);
        const byeMatches = allBrackets.filter(b => b.roundNumber === rn && b.match.is_bye);
        
        // Group by category
        const byCat = new Map<string, typeof roundMatches>();
        roundMatches.forEach(m => {
          if (!byCat.has(m.categoryId)) byCat.set(m.categoryId, []);
          byCat.get(m.categoryId)!.push(m);
        });
        
        // Interleave: take one match from each category in round-robin
        const catArrays = [...byCat.values()];
        const catPointers = new Array(catArrays.length).fill(0);
        let remaining = roundMatches.length;
        let ci = 0;
        while (remaining > 0) {
          for (let attempt = 0; attempt < catArrays.length; attempt++) {
            const idx = (ci + attempt) % catArrays.length;
            if (catPointers[idx] < catArrays[idx].length) {
              orderedMatches.push(catArrays[idx][catPointers[idx]++]);
              remaining--;
              ci = (idx + 1) % catArrays.length;
              break;
            }
          }
          // Safety: if no progress, break
          if (remaining > 0 && catArrays.every((arr, i) => catPointers[i] >= arr.length)) break;
        }
        
        // Bye matches don't need ordering, just append
        orderedMatches.push(...byeMatches);
      }

      // Step 3: Assign global match_order (only to non-bye matches)
      let globalOrder = 1;
      const allMatchesToInsert = orderedMatches.map((entry) => ({
        ...entry.match,
        match_order: entry.match.is_bye ? null : globalOrder++,
      }));

      if (allMatchesToInsert.length === 0) {
        toast.error('Δεν υπάρχουν κατηγορίες με τουλάχιστον 2 αθλητές');
        return;
      }

      const { error } = await supabase.from('competition_matches').insert(allMatchesToInsert);
      if (error) {
        toast.error(t('federation.brackets.errorGenerating'));
        console.error(error);
      } else {
        toast.success(`Η κλήρωση δημιουργήθηκε για ${orderedCategories.length} κατηγορίες (${allMatchesToInsert.length} αγώνες)`);
        setHasAnyMatches(true);
        if (selectedCategoryId) loadCategoryMatches();
      }
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα κατά τη δημιουργία κλήρωσης');
    } finally {
      setGeneratingAll(false);
    }
  };

  const handleResetAllBrackets = async () => {
    const { error } = await supabase
      .from('competition_matches')
      .delete()
      .eq('competition_id', selectedCompId);

    if (error) {
      toast.error('Σφάλμα κατά τη διαγραφή');
    } else {
      toast.success('Η κλήρωση διαγράφηκε για όλες τις κατηγορίες');
      setMatches([]);
      setHasAnyMatches(false);
    }
    setResetDialogOpen(false);
  };

  const openWinnerDialog = (match: Match) => {
    if (match.status === 'completed' || match.is_bye) return;
    if (!match.athlete1_id || !match.athlete2_id) {
      toast.error('Δεν έχουν οριστεί και οι δύο αθλητές');
      return;
    }
    setWinnerDialog({ match, open: true });
    setSelectedWinnerId('');
    setScoreText('');
    setResultType('points');
  };

  const handleSelectWinner = async () => {
    if (!winnerDialog || !selectedWinnerId) return;
    const match = winnerDialog.match;

    // Update this match
    const { error } = await supabase
      .from('competition_matches')
      .update({
        winner_id: selectedWinnerId,
        athlete1_score: match.athlete1_id === selectedWinnerId ? scoreText : null,
        athlete2_score: match.athlete2_id === selectedWinnerId ? scoreText : null,
        result_type: resultType,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', match.id);

    if (error) {
      toast.error('Σφάλμα');
      return;
    }

    // Advance winner to next round
    const nextRound = match.round_number / 2;
    if (nextRound >= 1) {
      const nextMatchNumber = Math.ceil(match.match_number / 2);
      const isFirstSlot = match.match_number % 2 === 1;

      const { data: nextMatch } = await supabase
        .from('competition_matches')
        .select('id')
        .eq('competition_id', match.competition_id)
        .eq('category_id', match.category_id)
        .eq('round_number', nextRound)
        .eq('match_number', nextMatchNumber)
        .single();

      if (nextMatch) {
        const winnerClubId = match.athlete1_id === selectedWinnerId
          ? match.athlete1_club_id
          : match.athlete2_club_id;

        await supabase
          .from('competition_matches')
          .update(isFirstSlot
            ? { athlete1_id: selectedWinnerId, athlete1_club_id: winnerClubId }
            : { athlete2_id: selectedWinnerId, athlete2_club_id: winnerClubId }
          )
          .eq('id', nextMatch.id);
      }
    }

    setWinnerDialog(null);
    toast.success('Ο νικητής καταχωρήθηκε!');
    loadCategoryMatches();
  };

  // Group matches by round
  const rounds = matches.reduce<Record<number, Match[]>>((acc, m) => {
    if (!acc[m.round_number]) acc[m.round_number] = [];
    acc[m.round_number].push(m);
    return acc;
  }, {});

  const sortedRoundNumbers = Object.keys(rounds).map(Number).sort((a, b) => b - a);

  const getSlotDisplayName = (match: Match, slot: 'athlete1' | 'athlete2', globalMatchNumbers?: Map<string, number>): { name: string; isConfirmed: boolean } => {
    // If the actual athlete is set in this match, show their name
    const athleteId = slot === 'athlete1' ? match.athlete1_id : match.athlete2_id;
    const athlete = slot === 'athlete1' ? match.athlete1 : match.athlete2;
    if (athleteId && athlete?.name) return { name: athlete.name, isConfirmed: true };

    // Otherwise, find feeder match(es) from previous round
    const feederRound = match.round_number * 2;
    const feederMatchNumber = slot === 'athlete1'
      ? (match.match_number * 2) - 1
      : match.match_number * 2;

    const feederRoundMatches = (rounds[feederRound] || []).slice().sort((a, b) => a.match_number - b.match_number);
    const feederMatch = feederRoundMatches.find((m) => m.match_number === feederMatchNumber)
      || (feederRoundMatches.length === 1 ? feederRoundMatches[0] : undefined);

    if (!feederMatch) return { name: `Νικητής αγ. ${feederMatchNumber}`, isConfirmed: false };

    // If feeder match is completed, show winner name
    if (feederMatch.winner_id) {
      const winnerName = feederMatch.athlete1_id === feederMatch.winner_id
        ? feederMatch.athlete1?.name
        : feederMatch.athlete2?.name;
      if (winnerName) return { name: winnerName, isConfirmed: true };
      const winnerMatchNumber = feederMatch.match_order || globalMatchNumbers?.get(feederMatch.id) || feederMatchNumber;
      return { name: `Νικητής αγ. ${winnerMatchNumber}`, isConfirmed: false };
    }

    // Feeder match NOT completed - show "Νικητής αγ. X" using global match_order
    if (feederMatch.match_order) {
      return { name: `Νικητής αγ. ${feederMatch.match_order}`, isConfirmed: false };
    }
    const globalNum = globalMatchNumbers?.get(feederMatch.id);
    if (globalNum) {
      return { name: `Νικητής αγ. ${globalNum}`, isConfirmed: false };
    }
    return { name: `Νικητής αγ. ${feederMatchNumber}`, isConfirmed: false };
  };

  const renderSidebar = () => (
    <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

  const getAthleteAvatar = (athlete: { name: string; photo_url: string | null; avatar_url: string | null } | null | undefined) => {
    if (!athlete) return null;
    return athlete.photo_url || athlete.avatar_url;
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">{t('federation.brackets.mobileTitle')}</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-2 lg:p-3 overflow-auto flex flex-col min-h-0">
            {/* Compact header row: title + competition + actions + filters all in one line */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="hidden lg:block text-lg font-bold text-foreground whitespace-nowrap">{t('federation.brackets.title')}</h1>
              
              {/* Competition selector */}
              <div className="w-44">
                <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                  <SelectTrigger className="rounded-none h-8 text-xs">
                    <SelectValue placeholder={t('federation.brackets.selectCompetition')} />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              {selectedCompId && categories.length > 0 && (
                <>
                  {!hasAnyMatches && (
                    <Button 
                      onClick={handleGenerateAllBrackets} 
                      disabled={generatingAll}
                      size="sm"
                      className="rounded-none bg-foreground text-background hover:bg-foreground/90 h-8 text-xs"
                    >
                      <Shuffle className="h-3 w-3 mr-1" />
                      {generatingAll ? '...' : t('federation.brackets.generateDraw')}
                    </Button>
                  )}
                  {hasAnyMatches && (
                    <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(true)} className="rounded-none text-destructive border-destructive h-8 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      {t('federation.brackets.resetDraw')}
                    </Button>
                  )}

                  {/* Filters inline */}
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
                        {ageOptions.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
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
                </>
              )}
            </div>

            {/* Selected category badge - compact */}
            {selectedCategoryId && (
              <div className="mb-1">
                <Badge variant="outline" className="rounded-none text-xs py-0.5 px-2">
                  {categories.find(c => c.id === selectedCategoryId)?.name}
                </Badge>
              </div>
            )}

            {/* Bracket Display */}
            {matches.length > 0 && (() => {
              const CARD_H = 110;
              const CARD_GAP = 40;
              const COL_W = 300;
              const CONNECTOR_W = 60;
              const HEADER_H = 41;

              // Non-bye matches per round, sorted by match_order (global sequence) for top-to-bottom display
              const roundMatchArrays = sortedRoundNumbers.map(rn =>
                rounds[rn].filter(m => !m.is_bye).sort((a, b) => (a.match_order || a.match_number) - (b.match_order || b.match_number))
              );
              const firstRoundCount = roundMatchArrays[0]?.length || 1;
              const maxMatchesInAnyRound = Math.max(...roundMatchArrays.map(r => r.length), 1);

               // Initial height: guarantee minimum spacing for all matches
               const minSpacing = CARD_H + CARD_GAP;
               const contentH = HEADER_H + maxMatchesInAnyRound * (CARD_H + CARD_GAP) + 40;
               let totalH = Math.max(contentH, 700);
               const totalW = sortedRoundNumbers.length * (COL_W + CONNECTOR_W);

              // Build a lookup: roundNumber -> match_number -> Match
              const matchByRoundAndNum = new Map<string, Match>();
              sortedRoundNumbers.forEach(rn => {
                rounds[rn].forEach(m => {
                  matchByRoundAndNum.set(`${rn}-${m.match_number}`, m);
                });
              });

              // Y-center positions keyed by match id
              const yPositions = new Map<string, number>();

               // First round: use guaranteed minimum spacing, start right below header
               const firstRoundSpacing = Math.max((totalH - HEADER_H) / firstRoundCount, minSpacing);
               roundMatchArrays[0]?.forEach((m, i) => {
                 yPositions.set(m.id, HEADER_H + 10 + i * firstRoundSpacing + CARD_H / 2);
               });

               // Subsequent rounds: position at midpoint of feeder matches
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
                   if (y1 !== undefined && y2 !== undefined) {
                     yCenter = (y1 + y2) / 2;
                   } else if (y1 !== undefined) {
                     yCenter = y1;
                   } else if (y2 !== undefined) {
                     yCenter = y2;
                   } else {
                     const spacing = totalH / (roundMatchArrays[ri].length + 1);
                     yCenter = spacing * (mi + 1);
                   }
                   yPositions.set(m.id, yCenter);
                 });

                  // Collision resolution: enforce strict visual order by global match number
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

               // Recalculate totalH based on actual positions after collision resolution
               let maxY = 0;
               yPositions.forEach(y => {
                 const bottom = y + CARD_H / 2;
                 if (bottom > maxY) maxY = bottom;
               });
               totalH = Math.max(totalH, maxY + 40);

               // Global match numbering - use match_order from DB (global across all categories)
               const globalMatchNumbers = new Map<string, number>();
               sortedRoundNumbers.forEach(rn => {
                 roundMatchArrays[sortedRoundNumbers.indexOf(rn)].forEach(m => {
                   if (m.match_order) {
                     globalMatchNumbers.set(m.id, m.match_order);
                   }
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
                            className="absolute bg-foreground text-background px-3 py-1.5 border border-border"
                            style={{ left: xOffset, top: 0, width: COL_W }}
                          >
                            <h3 className="font-bold text-xs">
                              {getRoundName(roundNum, t)}
                            </h3>
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
                                className={`absolute border cursor-pointer transition-all hover:shadow-lg bg-card ${
                                  match.status === 'completed' ? 'border-[#00ffba] shadow-sm' : 'border-border'
                                }`}
                                style={{ left: xOffset, top: yTop, width: COL_W, height: CARD_H, overflow: 'hidden' }}
                                onClick={() => openWinnerDialog(match)}
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
                                    <AvatarImage src={getAthleteAvatar(match.athlete1) || undefined} />
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
                                  {match.winner_id === match.athlete1_id && (
                                    <Trophy className="h-3.5 w-3.5 text-[#cb8954] shrink-0" />
                                  )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-border/50" />

                                {/* Athlete 2 - Blue corner */}
                                <div className={`flex items-center gap-2 px-2.5 py-1.5 border-l-[3px] border-l-blue-500 ${
                                  match.winner_id === match.athlete2_id ? 'bg-[#00ffba]/10' : ''
                                }`}>
                                  <Avatar className="h-6 w-6 shrink-0">
                                    <AvatarImage src={getAthleteAvatar(match.athlete2) || undefined} />
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
                                  {match.winner_id === match.athlete2_id && (
                                    <Trophy className="h-3.5 w-3.5 text-[#cb8954] shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Connector lines to next round */}
                          {ri < sortedRoundNumbers.length - 1 && (
                            <svg
                              className="absolute overflow-visible pointer-events-none"
                              style={{
                                left: xOffset + COL_W,
                                top: 0,
                                width: CONNECTOR_W,
                                height: totalH,
                              }}
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
                                    {y1 !== undefined && (
                                      <line x1="0" y1={y1} x2={halfW} y2={y1} stroke="hsl(var(--border))" strokeWidth="1.5" />
                                    )}
                                    {y2 !== undefined && (
                                      <line x1="0" y1={y2} x2={halfW} y2={y2} stroke="hsl(var(--border))" strokeWidth="1.5" />
                                    )}
                                    {y1 !== undefined && y2 !== undefined && (
                                      <line x1={halfW} y1={y1} x2={halfW} y2={y2} stroke="hsl(var(--border))" strokeWidth="1.5" />
                                    )}
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

      {/* Winner Selection Dialog */}
      {winnerDialog && (
        <Dialog open={winnerDialog.open} onOpenChange={() => setWinnerDialog(null)}>
          <DialogContent className="rounded-none max-w-md">
            <DialogHeader>
              <DialogTitle>{t('federation.brackets.selectWinner')}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                {[
                  { id: winnerDialog.match.athlete1_id, athlete: winnerDialog.match.athlete1, club: winnerDialog.match.athlete1_club },
                  { id: winnerDialog.match.athlete2_id, athlete: winnerDialog.match.athlete2, club: winnerDialog.match.athlete2_club },
                ].map(({ id, athlete, club }) => id && (
                  <button
                    key={id}
                    onClick={() => setSelectedWinnerId(id)}
                    className={`w-full flex items-center gap-3 p-3 border transition-all ${
                      selectedWinnerId === id
                        ? 'border-[#00ffba] bg-[#00ffba]/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAthleteAvatar(athlete) || undefined} />
                      <AvatarFallback>{athlete?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium text-sm">{athlete?.name || 'Νικητής προηγούμενου αγώνα'}</p>
                      {club && <p className="text-xs text-muted-foreground">{club.name}</p>}
                    </div>
                    {selectedWinnerId === id && <Trophy className="h-4 w-4 text-[#cb8954] ml-auto" />}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t('federation.brackets.resultType')}</Label>
                  <Select value={resultType} onValueChange={setResultType}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">{t('federation.brackets.points')}</SelectItem>
                      <SelectItem value="ko">KO</SelectItem>
                      <SelectItem value="tko">TKO</SelectItem>
                      <SelectItem value="dq">{t('federation.brackets.disqualification')}</SelectItem>
                      <SelectItem value="rsc">RSC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t('federation.brackets.score')}</Label>
                  <Input
                    value={scoreText}
                    onChange={(e) => setScoreText(e.target.value)}
                    placeholder={t('federation.brackets.scorePlaceholder')}
                    className="rounded-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setWinnerDialog(null)} className="rounded-none">{t('federation.common.cancel')}</Button>
              <Button
                onClick={handleSelectWinner}
                disabled={!selectedWinnerId}
                className="rounded-none bg-foreground text-background hover:bg-foreground/90"
              >
                {t('federation.brackets.submit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Confirmation */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('federation.brackets.resetConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('federation.brackets.resetConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t('federation.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAllBrackets} className="bg-destructive hover:bg-destructive/90 rounded-none">
              {t('federation.brackets.deleteAndReset')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default FederationBrackets;
