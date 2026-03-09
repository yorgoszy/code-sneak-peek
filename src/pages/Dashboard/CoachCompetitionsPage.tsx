import React, { useState, useEffect } from 'react';
import { CoachLayout } from '@/components/layouts/CoachLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Swords, Calendar, MapPin, Users, FileText, UserPlus, Trash2, ChevronDown, ChevronUp, DollarSign, Check } from "lucide-react";
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
  is_paid: boolean;
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
  const [addingToCategoryId, setAddingToCategoryId] = useState<string | null>(null);
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
    setAddingToCategoryId(null);
    await Promise.all([fetchCategories(comp.id), fetchMyRegistrations(comp.id)]);
    setRegisterDialogOpen(true);
  };

  const handleQuickRegister = async (categoryId: string, athleteId: string) => {
    if (!selectedComp || !coachId) return;
    
    const { data: existing } = await supabase
      .from('federation_competition_registrations')
      .select('id')
      .eq('competition_id', selectedComp.id)
      .eq('athlete_id', athleteId)
      .eq('category_id', categoryId)
      .maybeSingle();

    if (existing) {
      toast.error('Ο αθλητής είναι ήδη δηλωμένος σε αυτή την κατηγορία');
      return;
    }

    try {
      const { error } = await supabase.from('federation_competition_registrations').insert({
        competition_id: selectedComp.id,
        athlete_id: athleteId,
        category_id: categoryId,
        club_id: coachId,
        registration_status: 'registered',
      });
      if (error) throw error;
      toast.success('Ο αθλητής δηλώθηκε επιτυχώς');
      setAddingToCategoryId(null);
      setSelectedAthleteId('');
      await fetchMyRegistrations(selectedComp.id);
      fetchCompetitions();
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα δήλωσης');
    }
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

  const togglePayment = async (regId: string, currentStatus: boolean, competitionId: string) => {
    try {
      const { error } = await supabase
        .from('federation_competition_registrations')
        .update({ is_paid: !currentStatus })
        .eq('id', regId);
      if (error) throw error;
      toast.success(!currentStatus ? 'Σημειώθηκε ως πληρωμένη' : 'Σημειώθηκε ως μη πληρωμένη');
      await fetchMyRegistrations(competitionId);
    } catch (error) {
      console.error(error);
      toast.error('Σφάλμα ενημέρωσης πληρωμής');
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {competitions.map(comp => (
            <Card key={comp.id} className="rounded-none flex flex-col">
              <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm md:text-base truncate">{comp.name}</CardTitle>
                    <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 truncate">{comp.federation_name}</p>
                  </div>
                  {getStatusBadge(comp.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 md:space-y-3 px-3 md:px-6 pb-3 md:pb-6 flex-1 flex flex-col">
                {/* Info rows */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs md:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{format(new Date(comp.competition_date), 'd MMM yyyy', { locale: el })}</span>
                  </span>
                  {comp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{comp.location}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Swords className="h-3 w-3 shrink-0" />
                    {comp.categories_count} κατηγορίες
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 shrink-0" />
                    {comp.my_registrations_count} δηλώσεις
                  </span>
                </div>

                {comp.registration_deadline && (
                  <p className={`text-[11px] md:text-xs ${isDeadlinePassed(comp.registration_deadline) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    Deadline: {format(new Date(comp.registration_deadline), 'd MMM yyyy', { locale: el })}
                    {isDeadlinePassed(comp.registration_deadline) && ' (Έληξε)'}
                  </p>
                )}

                {comp.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{comp.description}</p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 pt-2 border-t mt-auto">
                  {!isDeadlinePassed(comp.registration_deadline) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none text-xs h-8"
                      onClick={() => handleOpenRegister(comp)}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden sm:inline">Δήλωση</span>
                      <span className="sm:hidden">+</span>
                    </Button>
                  )}
                  {comp.regulations_pdf_url && (
                    <a href={comp.regulations_pdf_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="rounded-none text-xs h-8">
                        <FileText className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">PDF</span>
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none ml-auto text-xs h-8"
                    onClick={() => toggleExpand(comp.id)}
                  >
                    {expandedComp === comp.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    <span className="ml-1 hidden sm:inline">Δηλώσεις</span>
                  </Button>
                </div>

                {/* Expanded registrations */}
                {expandedComp === comp.id && (
                  <div className="mt-2 space-y-1.5">
                    {(compRegistrations[comp.id] || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Δεν υπάρχουν δηλώσεις</p>
                    ) : (
                      (compRegistrations[comp.id] || []).map(reg => (
                        <div key={reg.id} className="flex items-center justify-between p-1.5 md:p-2 border rounded-none text-xs md:text-sm gap-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={reg.athlete?.photo_url || reg.athlete?.avatar_url || ''} />
                              <AvatarFallback className="text-[10px]">{reg.athlete?.name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate">{reg.athlete?.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="outline" className="rounded-none text-[10px] md:text-xs max-w-[100px] truncate">{reg.category?.name}</Badge>
                            <button
                              onClick={() => togglePayment(reg.id, reg.is_paid, comp.id)}
                              className={`h-6 w-6 flex items-center justify-center rounded-none border transition-colors ${
                                reg.is_paid 
                                  ? 'bg-[#00ffba]/20 border-[#00ffba] text-[#00ffba]' 
                                  : 'border-border text-muted-foreground hover:text-foreground'
                              }`}
                              title={reg.is_paid ? 'Πληρωμένη' : 'Μη πληρωμένη'}
                            >
                              <DollarSign className="h-3 w-3" />
                            </button>
                            {!isDeadlinePassed(competitions.find(c => c.id === comp.id)?.registration_deadline || null) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-none h-6 w-6 p-0 text-destructive hover:text-destructive"
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

      {/* Register Dialog - Category-centric view */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle>Δήλωση Αθλητών - {selectedComp?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {(() => {
              const grouped = new Map<string, Category[]>();
              categories.forEach(cat => {
                const groupName = cat.name
                  .replace(/\s+[-+±(].*$/, '')
                  .replace(/\s+\d+[\d.,]*\s*(kg)?$/i, '')
                  .trim() || 'Άλλα';
                if (!grouped.has(groupName)) grouped.set(groupName, []);
                grouped.get(groupName)!.push(cat);
              });

              return Array.from(grouped.entries()).map(([group, cats]) => {
                const groupRegCount = cats.reduce((sum, cat) => 
                  sum + myRegistrations.filter(r => r.category_id === cat.id).length, 0
                );
                return (
                  <Collapsible key={group}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-bold text-foreground bg-muted px-3 py-2 border-b border-border hover:bg-muted/80 cursor-pointer">
                      <span>{group} ({cats.length})</span>
                      <div className="flex items-center gap-2">
                        {groupRegCount > 0 && (
                          <Badge className="rounded-none text-[10px] bg-foreground text-background h-5">{groupRegCount} δηλ.</Badge>
                        )}
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {cats.map(cat => {
                        const catRegs = myRegistrations.filter(r => r.category_id === cat.id);
                        const isAdding = addingToCategoryId === cat.id;
                        
                        return (
                          <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 border-b border-border/50 hover:bg-accent/30 text-xs">
                            <span className="flex-1 min-w-0 truncate">{cat.name}</span>
                            
                            {/* Registered athletes avatars */}
                            <div className="flex items-center gap-1 shrink-0">
                              {catRegs.map(reg => (
                                <div key={reg.id} className="group relative">
                                  <Avatar className="h-6 w-6 border border-border">
                                    <AvatarImage src={reg.athlete?.photo_url || reg.athlete?.avatar_url || ''} />
                                    <AvatarFallback className="text-[9px]">{reg.athlete?.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  {/* Remove on click */}
                                  <button
                                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-3.5 w-3.5 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setRegToDelete(reg.id);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Add athlete */}
                            {isAdding ? (
                              <div className="flex items-center gap-1 shrink-0 w-48">
                                <UserSearchCombobox
                                  value={selectedAthleteId}
                                  onValueChange={(id) => {
                                    if (id) {
                                      handleQuickRegister(cat.id, id);
                                    }
                                  }}
                                  placeholder="Αθλητής..."
                                  coachId={coachId || undefined}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 rounded-none shrink-0"
                                  onClick={() => { setAddingToCategoryId(null); setSelectedAthleteId(''); }}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-none shrink-0 text-muted-foreground hover:text-foreground"
                                onClick={() => { setAddingToCategoryId(cat.id); setSelectedAthleteId(''); }}
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              });
            })()}
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
