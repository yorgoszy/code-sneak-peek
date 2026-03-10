import React, { useState, useEffect, useCallback } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { FederationSidebar } from "@/components/FederationSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, Shuffle, Trophy, ChevronRight, User, Award, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { toast } from "sonner";
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

  // Shuffle athletes but try to avoid same-club matchups in first round
  const shuffled = shuffleAvoidingSameClub(athletes);
  const n = shuffled.length;

  if (n < 2) return [];

  // Calculate bracket size (next power of 2)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
  const totalRounds = Math.log2(bracketSize);
  const byes = bracketSize - n;

  const matches: Omit<Match, 'id' | 'athlete1' | 'athlete2' | 'athlete1_club' | 'athlete2_club'>[] = [];
  let matchOrder = 1;

  // First round
  const firstRoundSize = bracketSize / 2;
  let athleteIndex = 0;
  const firstRoundWinners: (typeof athletes[0] | null)[] = [];

  for (let i = 0; i < firstRoundSize; i++) {
    const a1 = athleteIndex < shuffled.length ? shuffled[athleteIndex++] : null;
    const a2 = athleteIndex < shuffled.length ? shuffled[athleteIndex++] : null;

    if (a1 && !a2) {
      // Bye
      matches.push({
        competition_id: '',
        category_id: '',
        round_number: Math.pow(2, totalRounds - 1),
        match_number: i + 1,
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
      firstRoundWinners.push(a1);
    } else if (a1 && a2) {
      matches.push({
        competition_id: '',
        category_id: '',
        round_number: Math.pow(2, totalRounds - 1),
        match_number: i + 1,
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
      firstRoundWinners.push(null);
    }
  }

  // Subsequent rounds (empty slots for winners)
  for (let round = totalRounds - 2; round >= 0; round--) {
    const roundSize = Math.pow(2, round);
    for (let i = 0; i < roundSize; i++) {
      matches.push({
        competition_id: '',
        category_id: '',
        round_number: roundSize,
        match_number: i + 1,
        match_order: matchOrder++,
        athlete1_id: null,
        athlete2_id: null,
        athlete1_club_id: null,
        athlete2_club_id: null,
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

function shuffleAvoidingSameClub(athletes: { athleteId: string; clubId: string }[]) {
  // Fisher-Yates shuffle
  const arr = [...athletes];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // Try to fix same-club adjacents (best effort, max 100 attempts)
  for (let attempt = 0; attempt < 100; attempt++) {
    let fixed = true;
    for (let i = 0; i < arr.length - 1; i += 2) {
      if (arr[i].clubId === arr[i + 1]?.clubId) {
        // Find a swap candidate
        for (let j = i + 2; j < arr.length; j++) {
          if (arr[j].clubId !== arr[i].clubId && (j % 2 === 0 || arr[j - 1]?.clubId !== arr[i + 1]?.clubId)) {
            [arr[i + 1], arr[j]] = [arr[j], arr[i + 1]];
            fixed = false;
            break;
          }
        }
      }
    }
    if (fixed) break;
  }

  return arr;
}

function getRoundName(roundNumber: number): string {
  if (roundNumber === 1) return 'Τελικός';
  if (roundNumber === 2) return 'Ημιτελικοί';
  if (roundNumber === 4) return 'Προημιτελικοί';
  if (roundNumber === 8) return '1/8';
  if (roundNumber === 16) return '1/16';
  return `Γύρος ${roundNumber}`;
}

const FederationBrackets = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userProfile } = useRoleCheck();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Load categories when competition changes
  useEffect(() => {
    if (!selectedCompId) { setCategories([]); setSelectedCategoryId(''); return; }
    const load = async () => {
      const { data } = await supabase
        .from('federation_competition_categories')
        .select('id, name, competition_id')
        .eq('competition_id', selectedCompId)
        .order('name');
      setCategories(data || []);
      setSelectedCategoryId('');
    };
    load();
  }, [selectedCompId]);

  // Load registrations and existing matches when category changes
  useEffect(() => {
    if (!selectedCategoryId || !selectedCompId) { setRegistrations([]); setMatches([]); return; }
    loadData();
  }, [selectedCategoryId, selectedCompId]);

  const loadData = useCallback(async () => {
    if (!selectedCategoryId || !selectedCompId) return;
    setLoading(true);

    const [regRes, matchRes] = await Promise.all([
      supabase
        .from('federation_competition_registrations')
        .select(`
          id, athlete_id, club_id, category_id,
          athlete:app_users!federation_competition_registrations_athlete_id_fkey(name, photo_url, avatar_url),
          club:app_users!federation_competition_registrations_club_id_fkey(name)
        `)
        .eq('competition_id', selectedCompId)
        .eq('category_id', selectedCategoryId)
        .eq('is_paid', true),
      supabase
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
        .order('match_number', { ascending: true })
    ]);

    setRegistrations((regRes.data as any) || []);
    setMatches((matchRes.data as any) || []);
    setLoading(false);
  }, [selectedCategoryId, selectedCompId]);

  const handleGenerateBracket = async () => {
    if (registrations.length < 2) {
      toast.error('Χρειάζονται τουλάχιστον 2 δηλωμένοι αθλητές');
      return;
    }

    const bracket = generateBracket(registrations);
    const toInsert = bracket.map(m => ({
      ...m,
      competition_id: selectedCompId,
      category_id: selectedCategoryId,
    }));

    const { error } = await supabase.from('competition_matches').insert(toInsert);
    if (error) {
      toast.error('Σφάλμα κατά τη δημιουργία κλήρωσης');
      console.error(error);
    } else {
      toast.success('Η κλήρωση δημιουργήθηκε επιτυχώς!');
      loadData();
    }
  };

  const handleResetBracket = async () => {
    const { error } = await supabase
      .from('competition_matches')
      .delete()
      .eq('competition_id', selectedCompId)
      .eq('category_id', selectedCategoryId);

    if (error) {
      toast.error('Σφάλμα κατά τη διαγραφή');
    } else {
      toast.success('Η κλήρωση διαγράφηκε');
      setMatches([]);
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
    loadData();
  };

  // Group matches by round
  const rounds = matches.reduce<Record<number, Match[]>>((acc, m) => {
    if (!acc[m.round_number]) acc[m.round_number] = [];
    acc[m.round_number].push(m);
    return acc;
  }, {});

  const sortedRoundNumbers = Object.keys(rounds).map(Number).sort((a, b) => b - a);

  const renderSidebar = () => (
    <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

  const getAthleteAvatar = (athlete: { name: string; photo_url: string | null; avatar_url: string | null } | null | undefined) => {
    if (!athlete) return null;
    return athlete.photo_url || athlete.avatar_url;
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
                <h1 className="text-lg font-semibold">Κλήρωση</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Κλήρωση Αγώνων</h1>
                <p className="text-sm text-muted-foreground">Ζευγαρώματα αθλητών ανά κατηγορία</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="w-full sm:w-64">
                <Label className="text-sm mb-1 block">Διοργάνωση</Label>
                <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε διοργάνωση" />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-64">
                <Label className="text-sm mb-1 block">Κατηγορία</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} disabled={!selectedCompId}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Επιλέξτε κατηγορία" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCategoryId && matches.length === 0 && registrations.length >= 2 && (
                <div className="flex items-end">
                  <Button onClick={handleGenerateBracket} className="rounded-none bg-foreground text-background hover:bg-foreground/90">
                    <Shuffle className="h-4 w-4 mr-2" />
                    Κλήρωση
                  </Button>
                </div>
              )}

              {selectedCategoryId && matches.length > 0 && (
                <div className="flex items-end">
                  <Button variant="outline" onClick={() => setResetDialogOpen(true)} className="rounded-none text-destructive border-destructive">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Επανάληψη Κλήρωσης
                  </Button>
                </div>
              )}
            </div>

            {/* Info */}
            {selectedCategoryId && registrations.length > 0 && matches.length === 0 && (
              <Card className="rounded-none mb-6">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>{registrations.length}</strong> δηλωμένοι αθλητές σε αυτή την κατηγορία.
                    Πατήστε "Κλήρωση" για τυχαία ζευγαρώματα.
                  </p>
                </CardContent>
              </Card>
            )}

            {selectedCategoryId && registrations.length < 2 && matches.length === 0 && (
              <Card className="rounded-none">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Χρειάζονται τουλάχιστον 2 δηλωμένοι αθλητές για κλήρωση
                </CardContent>
              </Card>
            )}

            {/* Bracket Display */}
            {matches.length > 0 && (
              <ScrollArea className="w-full">
                <div className="flex gap-6 min-w-max pb-4">
                  {sortedRoundNumbers.map((roundNum) => (
                    <div key={roundNum} className="flex-shrink-0 w-72">
                      <div className="bg-muted px-4 py-2 mb-3 border border-border">
                        <h3 className="font-semibold text-sm text-foreground">
                          {getRoundName(roundNum)}
                        </h3>
                        <span className="text-xs text-muted-foreground">{rounds[roundNum].length} αγώνες</span>
                      </div>

                      <div className="space-y-3" style={{
                        paddingTop: roundNum < sortedRoundNumbers[0]
                          ? `${(sortedRoundNumbers[0] / roundNum - 1) * 40}px`
                          : '0px'
                      }}>
                        {rounds[roundNum].map((match) => (
                          <Card
                            key={match.id}
                            className={`rounded-none cursor-pointer transition-all hover:shadow-md ${
                              match.status === 'completed' ? 'border-l-4 border-l-[#00ffba]' :
                              match.is_bye ? 'border-l-4 border-l-muted-foreground opacity-60' :
                              'border-l-4 border-l-border'
                            }`}
                            onClick={() => openWinnerDialog(match)}
                          >
                            <CardContent className="p-3">
                              {match.is_bye ? (
                                <div className="text-center">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={getAthleteAvatar(match.athlete1) || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {match.athlete1?.name?.charAt(0) || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{match.athlete1?.name || 'TBD'}</span>
                                  </div>
                                  <Badge variant="outline" className="rounded-none text-xs">BYE</Badge>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {/* Athlete 1 */}
                                  <div className={`flex items-center gap-2 p-1.5 ${
                                    match.winner_id === match.athlete1_id ? 'bg-[#00ffba]/10 border border-[#00ffba]/30' : ''
                                  }`}>
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={getAthleteAvatar(match.athlete1) || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {match.athlete1?.name?.charAt(0) || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {match.athlete1?.name || 'TBD'}
                                      </p>
                                      {match.athlete1_club && (
                                        <p className="text-xs text-muted-foreground truncate">{match.athlete1_club.name}</p>
                                      )}
                                    </div>
                                    {match.winner_id === match.athlete1_id && (
                                      <Trophy className="h-4 w-4 text-[#cb8954]" />
                                    )}
                                  </div>

                                  <div className="text-center text-xs text-muted-foreground">VS</div>

                                  {/* Athlete 2 */}
                                  <div className={`flex items-center gap-2 p-1.5 ${
                                    match.winner_id === match.athlete2_id ? 'bg-[#00ffba]/10 border border-[#00ffba]/30' : ''
                                  }`}>
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={getAthleteAvatar(match.athlete2) || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {match.athlete2?.name?.charAt(0) || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {match.athlete2?.name || 'TBD'}
                                      </p>
                                      {match.athlete2_club && (
                                        <p className="text-xs text-muted-foreground truncate">{match.athlete2_club.name}</p>
                                      )}
                                    </div>
                                    {match.winner_id === match.athlete2_id && (
                                      <Trophy className="h-4 w-4 text-[#cb8954]" />
                                    )}
                                  </div>

                                  {/* Result info */}
                                  {match.status === 'completed' && match.result_type && (
                                    <div className="text-center">
                                      <Badge variant="secondary" className="rounded-none text-xs uppercase">
                                        {match.result_type}
                                        {match.athlete1_score && ` ${match.athlete1_score}`}
                                        {match.athlete2_score && ` ${match.athlete2_score}`}
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

      {/* Winner Selection Dialog */}
      {winnerDialog && (
        <Dialog open={winnerDialog.open} onOpenChange={() => setWinnerDialog(null)}>
          <DialogContent className="rounded-none max-w-md">
            <DialogHeader>
              <DialogTitle>Επιλογή Νικητή</DialogTitle>
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
                      <p className="font-medium text-sm">{athlete?.name || 'TBD'}</p>
                      {club && <p className="text-xs text-muted-foreground">{club.name}</p>}
                    </div>
                    {selectedWinnerId === id && <Trophy className="h-4 w-4 text-[#cb8954] ml-auto" />}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Τύπος Αποτελέσματος</Label>
                  <Select value={resultType} onValueChange={setResultType}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">Πόντοι</SelectItem>
                      <SelectItem value="ko">KO</SelectItem>
                      <SelectItem value="tko">TKO</SelectItem>
                      <SelectItem value="dq">Αποβολή (DQ)</SelectItem>
                      <SelectItem value="rsc">RSC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Σκορ (προαιρετικά)</Label>
                  <Input
                    value={scoreText}
                    onChange={(e) => setScoreText(e.target.value)}
                    placeholder="π.χ. 3-0"
                    className="rounded-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setWinnerDialog(null)} className="rounded-none">Ακύρωση</Button>
              <Button
                onClick={handleSelectWinner}
                disabled={!selectedWinnerId}
                className="rounded-none bg-foreground text-background hover:bg-foreground/90"
              >
                Καταχώρηση
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Confirmation */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Επανάληψη Κλήρωσης;</AlertDialogTitle>
            <AlertDialogDescription>
              Αυτή η ενέργεια θα διαγράψει όλα τα ζευγαρώματα και τα αποτελέσματα αυτής της κατηγορίας. Δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetBracket} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Διαγραφή & Επανάληψη
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default FederationBrackets;
