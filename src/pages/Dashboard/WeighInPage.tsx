import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FederationSidebar } from '@/components/FederationSidebar';
import { CoachSidebar } from '@/components/CoachSidebar';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Menu, Search, Scale, Stethoscope, Check, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizeGreekText } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

interface Registration {
  id: string;
  athlete_id: string;
  club_id: string;
  category_id: string;
  competition_id: string;
  is_paid: boolean | null;
  weigh_in_status: string | null;
  weigh_in_weight: number | null;
  athlete: { name: string; photo_url: string | null; avatar_url: string | null; email: string } | null;
  club: { name: string } | null;
  category: { name: string; min_weight: number | null; max_weight: number | null; gender: string | null } | null;
}

interface WeighInRecord {
  id: string;
  declared_weight: number | null;
  actual_weight: number | null;
  doctor_approved: boolean;
  weigh_in_approved: boolean;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
}

interface Competition {
  id: string;
  name: string;
  competition_date: string;
}

const WeighInPage: React.FC = () => {
  const { t } = useTranslation();
  const { userProfile, isAdmin, isFederation, isCoach } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [weighIns, setWeighIns] = useState<Record<string, WeighInRecord[]>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Weigh-in dialog
  const [weighInDialogOpen, setWeighInDialogOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [actualWeight, setActualWeight] = useState('');
  const [doctorApproved, setDoctorApproved] = useState(false);
  const [weighInNotes, setWeighInNotes] = useState('');

  // History dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyAthleteId, setHistoryAthleteId] = useState('');
  const [historyAthleteName, setHistoryAthleteName] = useState('');
  const [allHistory, setAllHistory] = useState<any[]>([]);

  const isFederationUser = isFederation?.() || false;
  const isCoachUser = isCoach?.() || false;
  const isAdminUser = isAdmin?.() || false;
  const canManageWeighIn = isFederationUser || isAdminUser;

  useEffect(() => {
    fetchCompetitions();
  }, [userProfile?.id]);

  useEffect(() => {
    if (selectedCompId) {
      fetchRegistrations();
    }
  }, [selectedCompId]);

  const fetchCompetitions = async () => {
    if (!userProfile?.id) return;
    let query = supabase.from('federation_competitions').select('id, name, competition_date').order('competition_date', { ascending: false });

    if (isFederationUser) {
      query = query.eq('federation_id', userProfile.id);
    }

    const { data } = await query;
    setCompetitions(data || []);
    if (data && data.length > 0) setSelectedCompId(data[0].id);
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('federation_competition_registrations')
      .select(`
        id, athlete_id, club_id, category_id, competition_id, is_paid, weigh_in_status, weigh_in_weight,
        athlete:app_users!federation_competition_registrations_athlete_id_fkey(name, photo_url, avatar_url, email),
        club:app_users!federation_competition_registrations_club_id_fkey(name),
        category:federation_competition_categories(name, min_weight, max_weight, gender)
      `)
      .eq('competition_id', selectedCompId);

    if (!error && data) {
      setRegistrations(data as unknown as Registration[]);
      // Fetch weigh-in records
      const { data: wiData } = await supabase
        .from('competition_weigh_ins')
        .select('*')
        .eq('competition_id', selectedCompId);

      const grouped: Record<string, WeighInRecord[]> = {};
      (wiData || []).forEach((wi: any) => {
        if (!grouped[wi.registration_id]) grouped[wi.registration_id] = [];
        grouped[wi.registration_id].push(wi);
      });
      setWeighIns(grouped);
    }
    setLoading(false);
  };

  const handleWeighIn = async () => {
    if (!selectedReg || !actualWeight) return;

    const weight = parseFloat(actualWeight);
    const cat = selectedReg.category;
    const withinLimits = cat?.max_weight ? weight <= cat.max_weight : true;
    const approved = doctorApproved && withinLimits;

    // Insert weigh-in record
    const { error: wiError } = await supabase.from('competition_weigh_ins').insert({
      registration_id: selectedReg.id,
      competition_id: selectedReg.competition_id,
      athlete_id: selectedReg.athlete_id,
      category_id: selectedReg.category_id,
      declared_weight: cat?.max_weight || null,
      actual_weight: weight,
      doctor_approved: doctorApproved,
      weigh_in_approved: approved,
      rejection_reason: !approved ? (!doctorApproved ? t('weighIn.doctorNotApproved') : t('weighIn.overweight')) : null,
      notes: weighInNotes || null,
      approved_by: userProfile?.id,
    });

    if (wiError) {
      toast.error(t('common.error'));
      return;
    }

    // Update registration status
    await supabase.from('federation_competition_registrations').update({
      weigh_in_status: approved ? 'approved' : 'rejected',
      weigh_in_weight: weight,
      weigh_in_date: new Date().toISOString(),
    }).eq('id', selectedReg.id);

    toast.success(approved ? t('weighIn.approved') : t('weighIn.rejected'));
    setWeighInDialogOpen(false);
    setActualWeight('');
    setDoctorApproved(false);
    setWeighInNotes('');
    fetchRegistrations();
  };

  const openWeighInDialog = (reg: Registration) => {
    setSelectedReg(reg);
    setActualWeight('');
    setDoctorApproved(false);
    setWeighInNotes('');
    setWeighInDialogOpen(true);
  };

  const openHistory = async (athleteId: string, athleteName: string) => {
    setHistoryAthleteId(athleteId);
    setHistoryAthleteName(athleteName);
    const { data } = await supabase
      .from('competition_weigh_ins')
      .select(`
        *,
        category:federation_competition_categories(name),
        competition:federation_competitions(name)
      `)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false });
    setAllHistory(data || []);
    setHistoryDialogOpen(true);
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (!searchTerm) return true;
    const normalized = normalizeGreekText(searchTerm);
    const name = normalizeGreekText(reg.athlete?.name || '');
    const club = normalizeGreekText(reg.club?.name || '');
    const email = normalizeGreekText(reg.athlete?.email || '');
    return name.includes(normalized) || club.includes(normalized) || email.includes(normalized);
  });

  const rejectionCount = (athleteId: string) => {
    let count = 0;
    Object.values(weighIns).forEach(records => {
      records.forEach(r => {
        if (r.declared_weight !== null && !r.weigh_in_approved && (r as any).athlete_id === athleteId) count++;
      });
    });
    // Also check from allHistory but simpler: count from all weigh-ins in current comp
    return Object.values(weighIns).flat().filter(w => !w.weigh_in_approved && (w as any).athlete_id === athleteId).length;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-[#00ffba] text-black rounded-none"><Check className="w-3 h-3 mr-1" />{t('weighIn.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="rounded-none"><X className="w-3 h-3 mr-1" />{t('weighIn.rejected')}</Badge>;
      default:
        return <Badge variant="outline" className="rounded-none">{t('weighIn.pending')}</Badge>;
    }
  };

  const renderSidebar = () => {
    if (isFederationUser) {
      return <FederationSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
    }
    return <CoachSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">
          {renderSidebar()}
        </div>

        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">
              {renderSidebar()}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">{t('weighIn.title')}</h1>
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {/* Desktop header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">{t('weighIn.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('weighIn.subtitle')}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                <SelectTrigger className="w-full sm:w-[300px] rounded-none">
                  <SelectValue placeholder={t('weighIn.selectCompetition')} />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {competitions.map(c => (
                    <SelectItem key={c.id} value={c.id} className="rounded-none">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('weighIn.searchPlaceholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-none"
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <p className="text-muted-foreground">{t('common.loading')}</p>
            ) : (
              <div className="border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('weighIn.athlete')}</TableHead>
                      <TableHead>{t('weighIn.club')}</TableHead>
                      <TableHead>{t('weighIn.category')}</TableHead>
                      <TableHead>{t('weighIn.declaredWeight')}</TableHead>
                      <TableHead>{t('weighIn.actualWeight')}</TableHead>
                      <TableHead><Stethoscope className="w-4 h-4" /></TableHead>
                      <TableHead>{t('weighIn.status')}</TableHead>
                      <TableHead>{t('weighIn.rejections')}</TableHead>
                      {canManageWeighIn && <TableHead>{t('weighIn.actions')}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManageWeighIn ? 9 : 8} className="text-center text-muted-foreground py-8">
                          {t('weighIn.noRegistrations')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRegistrations.map(reg => {
                        const latestWeighIn = weighIns[reg.id]?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                        const rejCount = Object.values(weighIns).flat().filter(w => !w.weigh_in_approved && (w as any).athlete_id === reg.athlete_id).length;

                        return (
                          <TableRow key={reg.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={reg.athlete?.photo_url || reg.athlete?.avatar_url || ''} />
                                  <AvatarFallback className="text-xs">{reg.athlete?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <button
                                    onClick={() => openHistory(reg.athlete_id, reg.athlete?.name || '')}
                                    className="text-sm font-medium hover:underline text-left"
                                  >
                                    {reg.athlete?.name}
                                  </button>
                                  <p className="text-xs text-muted-foreground">{reg.athlete?.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{reg.club?.name}</TableCell>
                            <TableCell>
                              <span className="text-sm">{reg.category?.name}</span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {reg.category?.max_weight ? `${reg.category.min_weight || 0}-${reg.category.max_weight} kg` : '-'}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {latestWeighIn?.actual_weight ? `${latestWeighIn.actual_weight} kg` : '-'}
                            </TableCell>
                            <TableCell>
                              {latestWeighIn?.doctor_approved ? (
                                <Check className="w-4 h-4 text-[#00ffba]" />
                              ) : latestWeighIn ? (
                                <X className="w-4 h-4 text-destructive" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(reg.weigh_in_status)}</TableCell>
                            <TableCell>
                              {rejCount > 0 ? (
                                <Badge variant="destructive" className="rounded-none">
                                  <AlertTriangle className="w-3 h-3 mr-1" />{rejCount}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                            {canManageWeighIn && (
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-none"
                                  onClick={() => openWeighInDialog(reg)}
                                >
                                  <Scale className="w-4 h-4 mr-1" />
                                  {t('weighIn.weighIn')}
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Weigh-in Dialog */}
      <Dialog open={weighInDialogOpen} onOpenChange={setWeighInDialogOpen}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              {t('weighIn.weighInAthlete')}
            </DialogTitle>
          </DialogHeader>

          {selectedReg && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border border-border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedReg.athlete?.photo_url || selectedReg.athlete?.avatar_url || ''} />
                  <AvatarFallback>{selectedReg.athlete?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedReg.athlete?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedReg.category?.name} • {selectedReg.category?.max_weight ? `${selectedReg.category.min_weight || 0}-${selectedReg.category.max_weight} kg` : ''}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{t('weighIn.actualWeight')} (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={actualWeight}
                  onChange={e => setActualWeight(e.target.value)}
                  className="rounded-none mt-1"
                  placeholder="0.0"
                />
                {actualWeight && selectedReg.category?.max_weight && parseFloat(actualWeight) > selectedReg.category.max_weight && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {t('weighIn.overweightWarning', { max: selectedReg.category.max_weight })}
                  </p>
                )}
              </div>

              <div
                onClick={() => setDoctorApproved(!doctorApproved)}
                className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                  doctorApproved ? 'border-[#00ffba] bg-[#00ffba]/10' : 'border-border'
                }`}
              >
                <Stethoscope className="w-5 h-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('weighIn.doctorCheck')}</p>
                  <p className="text-xs text-muted-foreground">{t('weighIn.doctorCheckDesc')}</p>
                </div>
                {doctorApproved ? (
                  <Check className="w-5 h-5 text-[#00ffba]" />
                ) : (
                  <X className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              <div>
                <label className="text-sm font-medium">{t('weighIn.notes')}</label>
                <Input
                  value={weighInNotes}
                  onChange={e => setWeighInNotes(e.target.value)}
                  className="rounded-none mt-1"
                  placeholder={t('weighIn.notesPlaceholder')}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setWeighInDialogOpen(false)} className="rounded-none">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleWeighIn}
              disabled={!actualWeight}
              className="rounded-none bg-foreground text-background hover:bg-foreground/90"
            >
              {t('weighIn.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="rounded-none max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('weighIn.history')} - {historyAthleteName}</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('weighIn.competition')}</TableHead>
                <TableHead>{t('weighIn.category')}</TableHead>
                <TableHead>{t('weighIn.actualWeight')}</TableHead>
                <TableHead><Stethoscope className="w-4 h-4" /></TableHead>
                <TableHead>{t('weighIn.status')}</TableHead>
                <TableHead>{t('weighIn.reason')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                    {t('weighIn.noHistory')}
                  </TableCell>
                </TableRow>
              ) : (
                allHistory.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm">{h.competition?.name}</TableCell>
                    <TableCell className="text-sm">{h.category?.name}</TableCell>
                    <TableCell className="text-sm font-medium">{h.actual_weight} kg</TableCell>
                    <TableCell>
                      {h.doctor_approved ? <Check className="w-4 h-4 text-[#00ffba]" /> : <X className="w-4 h-4 text-destructive" />}
                    </TableCell>
                    <TableCell>
                      {h.weigh_in_approved
                        ? <Badge className="bg-[#00ffba] text-black rounded-none">{t('weighIn.approved')}</Badge>
                        : <Badge variant="destructive" className="rounded-none">{t('weighIn.rejected')}</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{h.rejection_reason || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default WeighInPage;
