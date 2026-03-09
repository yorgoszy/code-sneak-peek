import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CoachLayout } from '@/components/layouts/CoachLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Swords, Calendar, MapPin, Users, FileText, UserPlus, Trash2, ChevronDown, ChevronUp, ChevronRight, DollarSign, Check, Trophy, CreditCard, Loader2, ExternalLink, Clock } from "lucide-react";
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
  location_url: string | null;
  competition_date: string;
  registration_deadline: string | null;
  late_registration_deadline: string | null;
  regulations_pdf_url: string | null;
  status: string;
  federation_id: string;
  federation_name?: string;
  categories_count?: number;
  my_registrations_count?: number;
  counts_for_ranking?: boolean;
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
  registration_fee: number | null;
  late_registration_fee: number | null;
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

// --- Age group helpers (same as federation view) ---
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

// --- Coach Age Group component for registration dialog ---
const CoachAgeGroup: React.FC<{
  age: string;
  cats: Category[];
  myRegistrations: Registration[];
  coachId: string;
  addingToCategoryId: string | null;
  setAddingToCategoryId: (id: string | null) => void;
  selectedAthleteId: string;
  setSelectedAthleteId: (id: string) => void;
  onQuickRegister: (categoryId: string, athleteId: string) => void;
  onDeleteReg: (regId: string) => void;
}> = ({ age, cats, myRegistrations, coachId, addingToCategoryId, setAddingToCategoryId, selectedAthleteId, setSelectedAthleteId, onQuickRegister, onDeleteReg }) => {
  const [isOpen, setIsOpen] = useState(false);

  const ageRegs = myRegistrations.filter(r => cats.some(c => c.id === r.category_id));
  const fee = cats[0]?.registration_fee;

  return (
    <div className="mb-1 border border-border">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full text-[11px] font-bold text-foreground bg-muted px-2 py-2.5 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors select-none"
      >
        <span className="flex items-center gap-2">
          {isOpen
            ? <ChevronDown className="h-4 w-4 shrink-0 text-foreground" />
            : <ChevronRight className="h-4 w-4 shrink-0 text-foreground" />
          }
          {age}
        </span>
        <div className="flex items-center gap-1.5">
          {fee != null && fee > 0 && (
            <Badge variant="outline" className="rounded-none text-[9px] h-4 px-1">
              {fee}€
            </Badge>
          )}
          {ageRegs.length > 0 && (
            <Badge className="rounded-none text-[9px] bg-foreground text-background h-4 px-1">
              {ageRegs.length} δηλ.
            </Badge>
          )}
          <span className="text-[9px] text-muted-foreground">{cats.length} κατ.</span>
        </div>
      </button>
      {isOpen && (
        <div>
          {cats.map(cat => {
            const catRegs = myRegistrations.filter(r => r.category_id === cat.id);
            const isAdding = addingToCategoryId === cat.id;

            return (
              <div key={cat.id} className="flex items-center gap-1.5 px-2 py-1 text-xs border-t border-border/30">
                <span className="font-medium min-w-[60px]">{getWeightLabel(cat.name)}</span>
                <div className="flex items-center gap-0.5 flex-1 justify-end">
                  {catRegs.map(reg => (
                    <div key={reg.id} className="group relative">
                      <Avatar className={`h-5 w-5 rounded-full border ${reg.is_paid ? 'border-[#00ffba]' : 'border-border'}`}>
                        <AvatarImage src={reg.athlete?.photo_url || reg.athlete?.avatar_url || ''} />
                        <AvatarFallback className="text-[8px] rounded-full">{reg.athlete?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {reg.is_paid && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-[#00ffba] rounded-full h-2.5 w-2.5 flex items-center justify-center">
                          <Check className="h-1.5 w-1.5 text-black" />
                        </span>
                      )}
                      <button
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-3.5 w-3.5 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDeleteReg(reg.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {isAdding ? (
                  <div className="flex items-center gap-1 shrink-0 w-48">
                    <UserSearchCombobox
                      value={selectedAthleteId}
                      onValueChange={(id) => {
                        if (id) onQuickRegister(cat.id, id);
                      }}
                      placeholder="Αθλητής..."
                      coachId={coachId}
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
        </div>
      )}
    </div>
  );
};

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [regToDelete, setRegToDelete] = useState<string | null>(null);
  const [expandedComp, setExpandedComp] = useState<string | null>(null);
  const [compRegistrations, setCompRegistrations] = useState<Record<string, Registration[]>>({});
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle Stripe payment callback
  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (payment === 'success' && sessionId) {
      // Verify payment with Stripe and mark registrations as paid
      const verifyPayment = async () => {
        try {
          toast.info('Επαλήθευση πληρωμής...');
          const { data, error } = await supabase.functions.invoke('verify-competition-payment', {
            body: { session_id: sessionId },
          });
          if (error) throw error;
          if (data?.success) {
            toast.success(`Η πληρωμή ολοκληρώθηκε! ${data.paid_count} δηλώσεις επιβεβαιώθηκαν.`);
            fetchCompetitions();
          } else {
            toast.error(data?.message || 'Η πληρωμή δεν επιβεβαιώθηκε');
          }
        } catch (err) {
          console.error('Payment verification error:', err);
          toast.error('Σφάλμα επαλήθευσης πληρωμής');
        }
      };
      verifyPayment();
      // Clean URL params
      setSearchParams({});
    } else if (payment === 'cancelled') {
      toast.info('Η πληρωμή ακυρώθηκε');
      setSearchParams({});
    }
  }, [searchParams]);

  useEffect(() => {
    if (coachId) fetchCompetitions();
  }, [coachId]);

  const fetchCompetitions = async () => {
    if (!coachId) return;
    setLoading(true);
    try {
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

      const { data: comps, error: compsError } = await supabase
        .from('federation_competitions')
        .select('*')
        .in('federation_id', federationIds)
        .in('status', ['upcoming', 'active'])
        .order('competition_date', { ascending: true });

      if (compsError) throw compsError;

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
          counts_for_ranking: comp.counts_for_ranking,
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
    setAddingToCategoryId(null);
    await Promise.all([fetchCategories(comp.id), fetchMyRegistrations(comp.id)]);
    setRegisterDialogOpen(true);
  };

  // Helper: calculate age from birth_date relative to competition date
  const calculateAge = (birthDate: string, referenceDate: string): number => {
    const birth = new Date(birthDate);
    const ref = new Date(referenceDate);
    let age = ref.getFullYear() - birth.getFullYear();
    const monthDiff = ref.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Helper: get expected age range from age group label
  const getAgeRange = (ageLabel: string): { min: number; max: number } | null => {
    if (ageLabel === '18-40') return { min: 18, max: 40 };
    if (ageLabel === 'U23') return { min: 18, max: 22 };
    const match = ageLabel.match(/^(\d+)-(\d+)$/);
    if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) };
    return null;
  };

  const handleQuickRegister = async (categoryId: string, athleteId: string) => {
    if (!selectedComp || !coachId) return;

    // Fetch athlete profile to validate gender & age
    const { data: athlete, error: athleteError } = await supabase
      .from('app_users')
      .select('name, gender, birth_date')
      .eq('id', athleteId)
      .single();

    if (athleteError || !athlete) {
      toast.error('Σφάλμα ανάκτησης στοιχείων αθλητή');
      return;
    }

    // Check mandatory fields
    if (!athlete.gender || !athlete.birth_date) {
      toast.error(`Ο/Η ${athlete.name} δεν έχει συμπληρωμένο φύλο ή ημερομηνία γέννησης. Συμπληρώστε τα στο προφίλ του πριν τη δήλωση.`);
      return;
    }

    // Find the category
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      toast.error('Δεν βρέθηκε η κατηγορία');
      return;
    }

    // Gender validation
    const categoryGender = category.gender;
    if (categoryGender) {
      if (athlete.gender === 'female' && categoryGender === 'male') {
        toast.error(`Η ${athlete.name} είναι γυναίκα και δεν μπορεί να δηλωθεί σε ανδρική κατηγορία. Δηλώστε την στις γυναικείες κατηγορίες.`);
        return;
      }
      if (athlete.gender === 'male' && categoryGender === 'female') {
        toast.error(`Ο ${athlete.name} είναι άνδρας και δεν μπορεί να δηλωθεί σε γυναικεία κατηγορία. Δηλώστε τον στις ανδρικές κατηγορίες.`);
        return;
      }
    }

    // Age validation
    const ageLabel = getAgeLabel(category.name);
    const ageRange = getAgeRange(ageLabel);
    if (ageRange && athlete.birth_date) {
      const athleteAge = calculateAge(athlete.birth_date, selectedComp.competition_date);
      if (athleteAge < ageRange.min || athleteAge > ageRange.max) {
        toast.error(`Ο/Η ${athlete.name} είναι ${athleteAge} ετών και δεν ανήκει στην ηλικιακή κατηγορία ${ageLabel} (${ageRange.min}-${ageRange.max} ετών).`);
        return;
      }
    }
    
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

  // Check if ALL deadlines (including late) have passed
  const isAllDeadlinesPassed = (comp: Competition) => {
    const lateDl = comp.late_registration_deadline;
    const normalDl = comp.registration_deadline;
    // If late deadline exists, use that as the final cutoff
    if (lateDl) return isDeadlinePassed(lateDl);
    return isDeadlinePassed(normalDl);
  };

  // Check if we're in the late registration period
  const isInLatePeriod = (comp: Competition) => {
    return isDeadlinePassed(comp.registration_deadline) && !isDeadlinePassed(comp.late_registration_deadline);
  };

  // Get the correct fee for a category based on timing
  const getCategoryFee = (cat: Category, comp: Competition | null) => {
    if (comp && isInLatePeriod(comp)) {
      return cat.late_registration_fee ?? cat.registration_fee ?? 0;
    }
    return cat.registration_fee ?? 0;
  };

  // Group categories by gender for the registration dialog
  const maleCats = categories.filter(c => c.gender === 'male');
  const femaleCats = categories.filter(c => c.gender === 'female');
  const maleGroups = groupByAge(maleCats);
  const femaleGroups = groupByAge(femaleCats);

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {competitions.map(comp => (
            <Card key={comp.id} className="rounded-none hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{comp.name}</CardTitle>
                    {comp.counts_for_ranking && (
                      <Badge className="rounded-none bg-[#cb8954] text-white text-[9px] px-1.5 h-5 gap-1 shrink-0">
                        <Trophy className="h-3 w-3" /> Ranking
                      </Badge>
                    )}
                  </div>
                  {getStatusBadge(comp.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{comp.federation_name}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(comp.competition_date), 'd MMMM yyyy', { locale: el })}</span>
                </div>
                {comp.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {comp.location_url ? (
                      <a href={comp.location_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                        {comp.location}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span>{comp.location}</span>
                    )}
                  </div>
                )}
                {(comp.registration_deadline || comp.late_registration_deadline) && (
                  <div className="space-y-0.5">
                    {comp.registration_deadline && (
                      <p className={`text-xs ${isDeadlinePassed(comp.registration_deadline) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        Εμπρόθεσμες: {format(new Date(comp.registration_deadline), 'd MMM yyyy', { locale: el })}
                        {isDeadlinePassed(comp.registration_deadline) && ' (Έληξε)'}
                      </p>
                    )}
                    {comp.late_registration_deadline && (
                      <p className={`text-xs ${isDeadlinePassed(comp.late_registration_deadline) ? 'text-destructive font-medium' : 'text-[#cb8954] font-medium'}`}>
                        Εκπρόθεσμες: {format(new Date(comp.late_registration_deadline), 'd MMM yyyy', { locale: el })}
                        {isDeadlinePassed(comp.late_registration_deadline) && ' (Έληξε)'}
                        {isInLatePeriod(comp) && ' ⚠️'}
                      </p>
                    )}
                  </div>
                )}
                {comp.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{comp.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Swords className="h-3 w-3" /> {comp.categories_count} κατηγορίες
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {comp.my_registrations_count} δηλώσεις
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t mt-auto">
                  {!isAllDeadlinesPassed(comp) && (
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
                            {(() => { const c = competitions.find(c => c.id === comp.id); return c && !isAllDeadlinesPassed(c); })() && (
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

      {/* Register Dialog - Two column men/women layout */}
      <Dialog open={registerDialogOpen} onOpenChange={(open) => {
        if (!open && myRegistrations.some(r => !r.is_paid)) {
          toast.info('Οι δηλώσεις αποθηκεύτηκαν στο πρόχειρο. Χωρίς πληρωμή δεν αποστέλλονται στην ομοσπονδία.', { duration: 5000 });
        }
        setRegisterDialogOpen(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[85vh] rounded-none flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle>Δήλωση Αθλητών - {selectedComp?.name}</DialogTitle>
          </DialogHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6">
            {categories.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Δεν υπάρχουν κατηγορίες</p>
            ) : (
              <div className="flex gap-4">
                {/* Άνδρες */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground px-2 py-2 border-b-2 border-foreground mb-1">
                    Άνδρες
                  </div>
                  {maleGroups.map(g => (
                    <CoachAgeGroup
                      key={`male-${g.age}`}
                      age={g.age}
                      cats={g.cats}
                      myRegistrations={myRegistrations}
                      coachId={coachId || ''}
                      addingToCategoryId={addingToCategoryId}
                      setAddingToCategoryId={setAddingToCategoryId}
                      selectedAthleteId={selectedAthleteId}
                      setSelectedAthleteId={setSelectedAthleteId}
                      onQuickRegister={handleQuickRegister}
                      onDeleteReg={(regId) => { setRegToDelete(regId); setDeleteDialogOpen(true); }}
                    />
                  ))}
                </div>
                {/* Γυναίκες */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground px-2 py-2 border-b-2 border-foreground mb-1">
                    Γυναίκες
                  </div>
                  {femaleGroups.map(g => (
                    <CoachAgeGroup
                      key={`female-${g.age}`}
                      age={g.age}
                      cats={g.cats}
                      myRegistrations={myRegistrations}
                      coachId={coachId || ''}
                      addingToCategoryId={addingToCategoryId}
                      setAddingToCategoryId={setAddingToCategoryId}
                      selectedAthleteId={selectedAthleteId}
                      setSelectedAthleteId={setSelectedAthleteId}
                      onQuickRegister={handleQuickRegister}
                      onDeleteReg={(regId) => { setRegToDelete(regId); setDeleteDialogOpen(true); }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fixed payment summary at bottom */}
          {(() => {
            const unpaidRegs = myRegistrations.filter(r => !r.is_paid);
            const totalCost = unpaidRegs.reduce((sum, reg) => {
              const cat = categories.find(c => c.id === reg.category_id);
              return sum + (cat ? getCategoryFee(cat, selectedComp) : 0);
            }, 0);
            const totalAll = myRegistrations.reduce((sum, reg) => {
              const cat = categories.find(c => c.id === reg.category_id);
              return sum + (cat ? getCategoryFee(cat, selectedComp) : 0);
            }, 0);
            const paidCount = myRegistrations.filter(r => r.is_paid).length;

            return (
              <div className="border-t border-border px-6 py-4 bg-background space-y-2 shrink-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Σύνολο: {myRegistrations.length} δηλώσεις
                    {paidCount > 0 && <span className="text-[#00ffba] ml-1">({paidCount} πληρωμένες)</span>}
                  </span>
                  <span className="font-bold text-lg">{totalAll.toFixed(2)}€</span>
                </div>
                {unpaidRegs.length > 0 && totalCost > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Προς πληρωμή: {unpaidRegs.length} × δηλώσεις
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{totalCost.toFixed(2)}€</span>
                      <Button
                        className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black font-semibold"
                        onClick={async () => {
                          try {
                            setPaymentLoading(true);
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) {
                              toast.error('Πρέπει να είστε συνδεδεμένοι');
                              return;
                            }
                            const { data, error } = await supabase.functions.invoke('create-competition-checkout', {
                              body: {
                                competition_id: selectedComp?.id,
                                club_id: coachId,
                                registration_ids: unpaidRegs.map(r => r.id),
                                total_amount: totalCost,
                                currency: 'eur',
                                competition_name: selectedComp?.name,
                              },
                            });
                            if (error) throw error;
                            if (data?.url) {
                              const newWindow = window.open(data.url, '_blank');
                              if (!newWindow) {
                                window.location.href = data.url;
                              }
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error('Σφάλμα πληρωμής');
                          } finally {
                            setPaymentLoading(false);
                          }
                        }}
                        disabled={paymentLoading}
                      >
                        {paymentLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Πληρωμή μέσω Stripe
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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
