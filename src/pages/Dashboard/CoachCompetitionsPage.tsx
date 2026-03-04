import React, { useState, useEffect } from 'react';
import { CoachLayout } from '@/components/layouts/CoachLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Swords, Calendar, MapPin, Users, FileText, UserPlus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCoachContext } from '@/contexts/CoachContext';
import { toast } from "sonner";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { UserSearchCombobox } from '@/components/users/UserSearchCombobox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Competition {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  competition_date: string;
  registration_deadline: string | null;
  regulations_pdf_url: string | null;
  status: string;
  federation_id: string;
  federation_name?: string;
  categories_count?: number;
  my_registrations_count?: number;
}

interface Category {
  id: string;
  name: string;
  category_type: string;
  gender: string | null;
  min_weight: number | null;
  max_weight: number | null;
  min_age: number | null;
  max_age: number | null;
}

interface Registration {
  id: string;
  athlete_id: string;
  category_id: string;
  registration_status: string;
  athlete?: { name: string; photo_url: string | null; avatar_url: string | null } | null;
  category?: { name: string } | null;
}

const CoachCompetitionsContent: React.FC = () => {
  const { coachId } = useCoachContext();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [regToDelete, setRegToDelete] = useState<string | null>(null);
  const [expandedComp, setExpandedComp] = useState<string | null>(null);
  const [compRegistrations, setCompRegistrations] = useState<Record<string, Registration[]>>({});

  useEffect(() => {
    if (coachId) fetchCompetitions();
  }, [coachId]);

  const fetchCompetitions = async () => {
    if (!coachId) return;
    setLoading(true);
    try {
      // Get federations this coach belongs to
      const { data: clubs, error: clubsError } = await supabase
        .from('federation_clubs')
        .select('federation_id, federation:app_users!federation_clubs_federation_id_fkey(name)')
        .eq('club_id', coachId);

      if (clubsError) throw clubsError;
      if (!clubs || clubs.length === 0) {
        setCompetitions([]);
        setLoading(false);
        return;
      }

      const federationIds = clubs.map(c => c.federation_id);

      // Get competitions from those federations
      const { data: comps, error: compsError } = await supabase
        .from('federation_competitions')
        .select('*')
        .in('federation_id', federationIds)
        .in('status', ['upcoming', 'active'])
        .order('competition_date', { ascending: true });

      if (compsError) throw compsError;

      // Enrich with federation name, categories count and my registrations count
      const enriched = await Promise.all((comps || []).map(async (comp) => {
        const federation = clubs.find(c => c.federation_id === comp.federation_id);
        const [catRes, regRes] = await Promise.all([
          supabase.from('federation_competition_categories').select('id', { count: 'exact', head: true }).eq('competition_id', comp.id),
          supabase.from('federation_competition_registrations').select('id', { count: 'exact', head: true }).eq('competition_id', comp.id).eq('club_id', coachId),
        ]);
        return {
          ...comp,
          federation_name: (federation?.federation as any)?.name || 'Ομοσπονδία',
          categories_count: catRes.count || 0,
          my_registrations_count: regRes.count || 0,
        };
      }));

      setCompetitions(enriched);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      toast.error('Σφάλμα φόρτωσης αγώνων');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (competitionId: string) => {
    const { data, error } = await supabase
      .from('federation_competition_categories')
      .select('*')
      .eq('competition_id', competitionId)
      .order('sort_order', { ascending: true });
    if (error) { console.error(error); return; }
    setCategories((data as Category[]) || []);
  };

  const fetchMyRegistrations = async (competitionId: string) => {
    if (!coachId) return;
    const { data, error } = await supabase
      .from('federation_competition_registrations')
      .select(`
        *,
        athlete:app_users!federation_competition_registrations_athlete_id_fkey(name, photo_url, avatar_url),
        category:federation_competition_categories(name)
      `)
      .eq('competition_id', competitionId)
      .eq('club_id', coachId)
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    const regs = (data as unknown as Registration[]) || [];
    setMyRegistrations(regs);
    setCompRegistrations(prev => ({ ...prev, [competitionId]: regs }));
  };

  const handleOpenRegister = async (comp: Competition) => {
    setSelectedComp(comp);
    setSelectedAthleteId('');
    setSelectedCategoryId('');
    await fetchCategories(comp.id);
    setRegisterDialogOpen(true);
  };

  const handleRegister = async () => {
    if (!selectedComp || !selectedAthleteId || !selectedCategoryId || !coachId) {
      toast.error('Επιλέξτε αθλητή και κατηγορία');
      return;
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('federation_competition_registrations')
      .select('id')
      .eq('competition_id', selectedComp.id)
      .eq('athlete_id', selectedAthleteId)
      .eq('category_id', selectedCategoryId)
      .maybeSingle();

    if (existing) {
      toast.error('Ο αθλητής είναι ήδη δηλωμένος σε αυτή την κατηγορία');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('federation_competition_registrations').insert({
        competition_id: selectedComp.id,
        athlete_id: selectedAthleteId,
        category_id: selectedCategoryId,
        club_id: coachId,
        registration_status: 'registered',
      });
      if (error) throw error;
      toast.success('Ο αθλητής δηλώθηκε επιτυχώς');
      setSelectedAthleteId('');
      setSelectedCategoryId('');
      await fetchMyRegistrations(selectedComp.id);
      fetchCompetitions();
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα δήλωσης');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRegistration = async () => {
    if (!regToDelete) return;
    try {
      const { error } = await supabase
        .from('federation_competition_registrations')
        .delete()
        .eq('id', regToDelete);
      if (error) throw error;
      toast.success('Η δήλωση αφαιρέθηκε');
      setDeleteDialogOpen(false);
      setRegToDelete(null);
      if (selectedComp) await fetchMyRegistrations(selectedComp.id);
      if (expandedComp) await fetchMyRegistrations(expandedComp);
      fetchCompetitions();
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα');
    }
  };

  const toggleExpand = async (compId: string) => {
    if (expandedComp === compId) {
      setExpandedComp(null);
    } else {
      setExpandedComp(compId);
      if (!compRegistrations[compId]) {
        await fetchMyRegistrations(compId);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      upcoming: 'Επερχόμενος',
      active: 'Ενεργός',
    };
    return <Badge className={`rounded-none ${styles[status] || ''}`}>{labels[status] || status}</Badge>;
  };

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div>
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Swords className="h-6 w-6" /> Αγώνες
          </h1>
          <p className="text-sm text-muted-foreground">Δηλώσεις αθλητών σε αγώνες ομοσπονδιών</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Φόρτωση...</div>
      ) : competitions.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Swords className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Δεν υπάρχουν διαθέσιμοι αγώνες</p>
            <p className="text-sm">Οι αγώνες δημιουργούνται από τις ομοσπονδίες στις οποίες ανήκετε</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {competitions.map(comp => (
            <Card key={comp.id} className="rounded-none">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{comp.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{comp.federation_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(comp.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(comp.competition_date), 'd MMMM yyyy', { locale: el })}
                  </span>
                  {comp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {comp.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Swords className="h-3 w-3" /> {comp.categories_count} κατηγορίες
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {comp.my_registrations_count} δηλώσεις μου
                  </span>
                </div>

                {comp.registration_deadline && (
                  <p className={`text-xs ${isDeadlinePassed(comp.registration_deadline) ? 'text-destructive' : 'text-muted-foreground'}`}>
                    Deadline δηλώσεων: {format(new Date(comp.registration_deadline), 'd MMM yyyy', { locale: el })}
                    {isDeadlinePassed(comp.registration_deadline) && ' (Έληξε)'}
                  </p>
                )}

                {comp.description && (
                  <p className="text-sm text-muted-foreground">{comp.description}</p>
                )}

                <div className="flex items-center gap-2 pt-2 border-t">
                  {!isDeadlinePassed(comp.registration_deadline) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none"
                      onClick={() => handleOpenRegister(comp)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" /> Δήλωση Αθλητή
                    </Button>
                  )}
                  {comp.regulations_pdf_url && (
                    <a href={comp.regulations_pdf_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="rounded-none">
                        <FileText className="h-4 w-4 mr-1" /> Κανονισμοί
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none ml-auto"
                    onClick={() => toggleExpand(comp.id)}
                  >
                    {expandedComp === comp.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span className="ml-1 text-xs">Οι δηλώσεις μου</span>
                  </Button>
                </div>

                {/* Expanded registrations */}
                {expandedComp === comp.id && (
                  <div className="mt-3 space-y-2">
                    {(compRegistrations[comp.id] || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Δεν υπάρχουν δηλώσεις ακόμα</p>
                    ) : (
                      (compRegistrations[comp.id] || []).map(reg => (
                        <div key={reg.id} className="flex items-center justify-between p-2 border rounded-none text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={reg.athlete?.photo_url || reg.athlete?.avatar_url || ''} />
                              <AvatarFallback className="text-xs">{reg.athlete?.name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{reg.athlete?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-none text-xs">{reg.category?.name}</Badge>
                            {!isDeadlinePassed(competitions.find(c => c.id === comp.id)?.registration_deadline || null) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-none h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => { setRegToDelete(reg.id); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Register Dialog */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle>Δήλωση Αθλητή - {selectedComp?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Χρήστης</label>
              <UserSearchCombobox
                value={selectedAthleteId}
                onValueChange={setSelectedAthleteId}
                placeholder="Επιλέξτε αθλητή..."
                coachId={coachId || undefined}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Κατηγορία</label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε κατηγορία..." />
                </SelectTrigger>
                <SelectContent className="rounded-none max-h-60">
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show current registrations for this competition */}
            {myRegistrations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Ήδη δηλωμένοι ({myRegistrations.length})</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {myRegistrations.map(reg => (
                    <div key={reg.id} className="flex items-center justify-between text-xs p-2 border rounded-none">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={reg.athlete?.photo_url || reg.athlete?.avatar_url || ''} />
                          <AvatarFallback className="text-[10px]">{reg.athlete?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{reg.athlete?.name}</span>
                      </div>
                      <Badge variant="outline" className="rounded-none text-[10px]">{reg.category?.name}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleRegister}
              disabled={!selectedAthleteId || !selectedCategoryId || saving}
              className="w-full rounded-none bg-foreground text-background hover:bg-foreground/90"
            >
              {saving ? 'Αποθήκευση...' : 'Δήλωση'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Registration Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Αφαίρεση Δήλωσης</AlertDialogTitle>
            <AlertDialogDescription>
              Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτή τη δήλωση; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRegistration} className="bg-destructive hover:bg-destructive/90 rounded-none">
              Αφαίρεση
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const CoachCompetitionsPage: React.FC = () => {
  return (
    <CoachLayout title="Αγώνες" ContentComponent={CoachCompetitionsContent} />
  );
};

export default CoachCompetitionsPage;
