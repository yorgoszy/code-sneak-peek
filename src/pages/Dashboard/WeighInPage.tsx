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
  Dialog, DialogContent, DialogHeader, DialogTitle
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
  const [weighIns, setWeighIns] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Inline state per registration
  const [doctorChecks, setDoctorChecks] = useState<Record<string, boolean>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  // History dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
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
    if (selectedCompId) fetchRegistrations();
  }, [selectedCompId]);

  const fetchCompetitions = async () => {
    if (!userProfile?.id) return;
    let query = supabase.from('federation_competitions').select('id, name, competition_date').order('competition_date', { ascending: false });
    if (isFederationUser) query = query.eq('federation_id', userProfile.id);
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
      const { data: wiData } = await (supabase
        .from('competition_weigh_ins' as any)
        .select('*')
        .eq('competition_id', selectedCompId)) as any;

      const grouped: Record<string, any[]> = {};
      (wiData || []).forEach((wi: any) => {
        if (!grouped[wi.registration_id]) grouped[wi.registration_id] = [];
        grouped[wi.registration_id].push(wi);
      });
      setWeighIns(grouped);
    }
    setLoading(false);
  };

  const toggleDoctor = (regId: string) => {
    setDoctorChecks(prev => ({ ...prev, [regId]: !prev[regId] }));
  };

  const handleWeighIn = async (reg: Registration) => {
    const weight = parseFloat(weights[reg.id] || '');
    const doctorOk = doctorChecks[reg.id] || false;

    // If doctor not approved → rejected
    if (!doctorOk) {
      setSubmitting(prev => ({ ...prev, [reg.id]: true }));
      await submitWeighIn(reg, 0, false, t('weighIn.doctorNotApproved'));
      setSubmitting(prev => ({ ...prev, [reg.id]: false }));
      return;
    }

    if (!weight || isNaN(weight)) {
      toast.error(t('weighIn.enterWeight'));
      return;
    }

    setSubmitting(prev => ({ ...prev, [reg.id]: true }));

    // Weight tolerance: max_weight + 0.1 is allowed, max_weight + 0.11 is not
    const maxWeight = reg.category?.max_weight;
    let approved = true;
    let reason: string | null = null;

    if (maxWeight) {
      // Round to 2 decimals to avoid floating point issues
      const tolerance = Math.round((maxWeight + 0.1) * 100) / 100;
      if (weight > tolerance) {
        approved = false;
        reason = t('weighIn.overweight');
      }
    }

    await submitWeighIn(reg, weight, approved, reason);
    setSubmitting(prev => ({ ...prev, [reg.id]: false }));
  };

  const submitWeighIn = async (reg: Registration, weight: number, approved: boolean, reason: string | null) => {
    const doctorOk = doctorChecks[reg.id] || false;

    // Try to insert into competition_weigh_ins (history), but don't block on failure
    try {
      await (supabase as any).from('competition_weigh_ins').insert({
        registration_id: reg.id,
        competition_id: reg.competition_id,
        athlete_id: reg.athlete_id,
        category_id: reg.category_id,
        declared_weight: reg.category?.max_weight || null,
        actual_weight: weight || null,
        doctor_approved: doctorOk,
        weigh_in_approved: approved,
        rejection_reason: reason,
        notes: null,
        approved_by: userProfile?.id,
      });
    } catch (e) {
      console.warn('competition_weigh_ins insert failed:', e);
    }

    // Update registration with weigh-in result
    const { error: updateError } = await supabase.from('federation_competition_registrations').update({
      weigh_in_status: approved ? 'passed' : 'failed',
      weigh_in_weight: weight || null,
      weigh_in_date: new Date().toISOString(),
    }).eq('id', reg.id);

    if (updateError) {
      console.error('Registration update error:', updateError);
      toast.error(t('common.error'));
      return;
    }

    toast.success(approved ? t('weighIn.approved') : t('weighIn.rejected'));

    // Update local state immediately so UI reflects changes
    setRegistrations(prev => prev.map(r => 
      r.id === reg.id 
        ? { ...r, weigh_in_status: approved ? 'passed' : 'failed', weigh_in_weight: weight || null } 
        : r
    ));

    // Store the weigh-in data locally for display
    setWeighIns(prev => ({
      ...prev,
      [reg.id]: [...(prev[reg.id] || []), {
        id: crypto.randomUUID(),
        registration_id: reg.id,
        actual_weight: weight || null,
        doctor_approved: doctorOk,
        weigh_in_approved: approved,
        rejection_reason: reason,
        athlete_id: reg.athlete_id,
        created_at: new Date().toISOString(),
      }]
    }));
  };

  const openHistory = async (athleteId: string, athleteName: string) => {
    setHistoryAthleteName(athleteName);
    const { data } = await (supabase
      .from('competition_weigh_ins' as any)
      .select(`
        *,
        category:federation_competition_categories(name),
        competition:federation_competitions(name)
      `)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })) as any;
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
                      <TableHead><Stethoscope className="w-4 h-4" /></TableHead>
                      <TableHead>{t('weighIn.actualWeight')}</TableHead>
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
                        const rejCount = Object.values(weighIns).flat().filter(w => !w.weigh_in_approved && w.athlete_id === reg.athlete_id).length;
                        const isAlreadyProcessed = reg.weigh_in_status === 'approved' || reg.weigh_in_status === 'rejected';
                        const doctorOk = doctorChecks[reg.id] || false;
                        const currentWeight = weights[reg.id] || '';
                        const isSubmitting = submitting[reg.id] || false;

                        // Weight warning
                        const maxW = reg.category?.max_weight;
                        const parsedWeight = parseFloat(currentWeight);
                        const tolerance = maxW ? Math.round((maxW + 0.1) * 100) / 100 : null;
                        const isOverweight = tolerance && !isNaN(parsedWeight) && parsedWeight > tolerance;

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
                            <TableCell className="text-sm">{reg.category?.name}</TableCell>
                            <TableCell className="text-sm">
                              {maxW ? `${reg.category?.min_weight || 0}-${maxW} kg` : '-'}
                            </TableCell>

                            {/* Doctor check - inline toggle */}
                            <TableCell>
                              {isAlreadyProcessed ? (
                                latestWeighIn?.doctor_approved
                                  ? <Check className="w-5 h-5 text-[#00ffba]" />
                                  : <X className="w-5 h-5 text-destructive" />
                              ) : canManageWeighIn ? (
                                <button
                                  onClick={() => toggleDoctor(reg.id)}
                                  className={`w-8 h-8 flex items-center justify-center border transition-colors ${
                                    doctorOk
                                      ? 'border-[#00ffba] bg-[#00ffba]/10'
                                      : 'border-destructive bg-destructive/10'
                                  }`}
                                >
                                  {doctorOk
                                    ? <Check className="w-4 h-4 text-[#00ffba]" />
                                    : <X className="w-4 h-4 text-destructive" />
                                  }
                                </button>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>

                            {/* Weight input - inline */}
                            <TableCell>
                              {isAlreadyProcessed ? (
                                <span className="text-sm font-medium">
                                  {reg.weigh_in_weight ? `${reg.weigh_in_weight} kg` : (latestWeighIn?.actual_weight ? `${latestWeighIn.actual_weight} kg` : '-')}
                                </span>
                              ) : canManageWeighIn ? (
                                <div className="w-24">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={currentWeight}
                                    onChange={e => setWeights(prev => ({ ...prev, [reg.id]: e.target.value }))}
                                    className={`no-spinners rounded-none h-8 text-sm ${isOverweight ? 'border-destructive' : ''}`}
                                    placeholder="kg"
                                  />
                                </div>
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
                                {!isAlreadyProcessed ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-none h-8"
                                    onClick={() => handleWeighIn(reg)}
                                    disabled={isSubmitting}
                                  >
                                    <Scale className="w-4 h-4 mr-1" />
                                    Weigh-in
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
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
