import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Shield, Send, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const normalize = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

interface UserProfileSafetyProps {
  userProfile: any;
}

const ABUSE_TYPE_IDS = ['physical', 'psychological', 'sexual', 'verbal', 'bullying', 'other'] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  investigating: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

export const UserProfileSafety = ({ userProfile }: UserProfileSafetyProps) => {
  const { t } = useTranslation();
  const { userProfile: currentUser, isAdmin } = useRoleCheck();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [clubId, setClubId] = useState<string>("");
  const [clubNameText, setClubNameText] = useState("");
  const [clubAddress, setClubAddress] = useState("");
  const [clubCity, setClubCity] = useState("");
  const [clubCountry, setClubCountry] = useState("Ελλάδα");
  const [coachId, setCoachId] = useState<string>("");
  const [coachNameText, setCoachNameText] = useState("");
  const [sport, setSport] = useState<string>("");
  const [clubs, setClubs] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [clubOpen, setClubOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [clubSearch, setClubSearch] = useState("");
  const [coachSearch, setCoachSearch] = useState("");

  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");

  const filteredClubs = useMemo(() => {
    const q = normalize(clubSearch);
    if (!q) return clubs.slice(0, 50);
    return clubs.filter((c) => normalize(c.name).includes(q)).slice(0, 50);
  }, [clubs, clubSearch]);

  const filteredCoaches = useMemo(() => {
    const q = normalize(coachSearch);
    const base = clubId ? coaches.filter((c) => c.id === clubId || c.coach_id === clubId) : coaches;
    if (!q) return base.slice(0, 50);
    return base.filter((c) => normalize(c.name).includes(q)).slice(0, 50);
  }, [coaches, coachSearch, clubId]);

  const isOwnProfile = currentUser?.id === userProfile?.id;
  const profileRole = (userProfile?.role || '').toLowerCase();
  const isFederationProfile = profileRole === 'federation';
  const adminViewing = isAdmin() && !isOwnProfile;
  const viewTitleKey = isFederationProfile ? 'safety.federationViewTitle' : 'safety.userViewTitle';
  const viewEmptyKey = isFederationProfile ? 'safety.federationNoReports' : 'safety.userNoReports';

  useEffect(() => {
    loadReports();
    loadClubsAndSports();
  }, [userProfile?.id]);

  useEffect(() => {
    if (userProfile?.coach_id) {
      setClubId(userProfile.coach_id);
    }
  }, [userProfile?.coach_id]);

  const loadClubsAndSports = async () => {
    const { data: dirData } = await supabase.rpc('get_public_clubs_directory');
    const all = (dirData as any[]) || [];
    setClubs(all.filter((u) => ['admin', 'coach', 'trainer'].includes(u.role)));
    setCoaches(all.filter((u) => ['coach', 'trainer'].includes(u.role)));
    const uniqueSports = Array.from(
      new Set(
        all
          .filter((u) => u.role === 'federation')
          .map((u: any) => (u.sport || '').trim())
          .filter(Boolean)
      )
    ).sort();
    setSports(uniqueSports);
  };

  const loadReports = async () => {
    if (!userProfile?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('abuse_reports')
      .select('*')
      .eq('athlete_id', userProfile.id)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setReports(data || []);
    setLoading(false);
  };

  const toggleType = (id: string) => {
    setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!reporterName.trim() || !reporterEmail.trim()) {
      toast.error("Συμπληρώστε όνομα και email");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(reporterEmail)) {
      toast.error("Μη έγκυρο email");
      return;
    }
    if (!sport) {
      toast.error('Παρακαλώ επιλέξτε άθλημα');
      return;
    }
    if (!clubId && !clubNameText.trim()) {
      toast.error("Επιλέξτε σύλλογο ή γράψτε όνομα");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error(t('safety.errorMinTypes'));
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    setConfirmOpen(false);
    try {
      const { data: inserted, error } = await supabase
        .from('abuse_reports')
        .insert({
          athlete_id: userProfile.id,
          coach_id: coachId || (clubId || userProfile.coach_id || null),
          club_id: clubId || null,
          club_name_text: clubId ? null : (clubNameText.trim() || null),
          club_address: clubAddress.trim() || null,
          club_city: clubCity.trim() || null,
          club_country: clubCountry.trim() || null,
          coach_name_text: coachId ? null : (coachNameText.trim() || null),
          reporter_name: reporterName.trim() || null,
          reporter_email: reporterEmail.trim() || null,
          reporter_phone: reporterPhone.trim() || null,
          sport: sport || null,
          abuse_types: selectedTypes,
          description: description.trim() || '—',
          incident_date: incidentDate || null,
          is_anonymous: isAnonymous,
        })
        .select()
        .single();

      if (error) throw error;

      try {
        await supabase.functions.invoke('send-abuse-report-notification', {
          body: { reportId: inserted.id },
        });
      } catch (e) {
        console.error('Notification error:', e);
      }

      toast.success(t('safety.successSubmit'));
      setSelectedTypes([]);
      setDescription("");
      setIncidentDate("");
      setIsAnonymous(false);
      setClubId("");
      setClubNameText("");
      setClubAddress("");
      setClubCity("");
      setCoachId("");
      setCoachNameText("");
      setSport("");
      setReporterName("");
      setReporterEmail("");
      setReporterPhone("");
      loadReports();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || t('safety.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  };



  if (adminViewing) {
    return (
      <div className="space-y-4">
        <Card className="rounded-none border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> {t(viewTitleKey)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">{t('safety.loading')}</p>
            ) : reports.length === 0 ? (
              <p className="text-gray-500">{t(viewEmptyKey)}</p>
            ) : (
              <ReportList reports={reports} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Card className="rounded-none border border-destructive/30">
        <CardHeader className="bg-destructive/5 py-1.5 px-3">
          <CardTitle className="flex items-center gap-1.5 text-destructive text-xs">
            <AlertTriangle className="h-3.5 w-3.5" /> {t('safety.title')}
          </CardTitle>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t('safety.intro')}</p>
        </CardHeader>
        <CardContent className="space-y-2 pt-2 px-3 pb-3">
          <div
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={cn(
              "flex items-center gap-2 px-2 py-1 border cursor-pointer transition-colors",
              isAnonymous ? "border-foreground bg-muted" : "border-border hover:bg-muted/50"
            )}
          >
            <Checkbox checked={isAnonymous} />
            <span className="text-xs font-medium">{t('safety.anonymous')}</span>
            <span className="text-[10px] text-muted-foreground hidden md:inline">— {t('safety.anonymousHint')}</span>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground border-b pb-0.5">
              Σύλλογος
            </h3>
            <div className="grid md:grid-cols-2 gap-1.5">
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger className="rounded-none h-8 text-xs">
                  <SelectValue placeholder="Άθλημα *" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {sports.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">Δεν έχουν δηλωθεί αθλήματα.</div>
                  ) : (
                    sports.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)
                  )}
                </SelectContent>
              </Select>

              <Popover open={clubOpen} onOpenChange={setClubOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between rounded-none h-8 font-normal text-xs">
                    <span className="truncate">
                      {clubId ? clubs.find((c) => c.id === clubId)?.name : "Σύλλογος *"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-none" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Πληκτρολογήστε..." value={clubSearch} onValueChange={setClubSearch} />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-xs text-muted-foreground">Δεν βρέθηκε.</div>
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredClubs.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            onSelect={() => {
                              setClubId(c.id);
                              setClubOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", clubId === c.id ? "opacity-100" : "opacity-0")} />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Input
              value={coachNameText}
              onChange={(e) => setCoachNameText(e.target.value)}
              placeholder="Ονοματεπώνυμο προπονητή"
              className="rounded-none h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground border-b pb-0.5">
              Περιστατικό
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-1">
              {ABUSE_TYPE_IDS.map(id => (
                <div
                  key={id}
                  onClick={() => toggleType(id)}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-1 border cursor-pointer transition-colors",
                    selectedTypes.includes(id) ? "border-destructive bg-destructive/10" : "border-border hover:bg-muted/50"
                  )}
                >
                  <Checkbox checked={selectedTypes.includes(id)} className="h-3 w-3" />
                  <span className="text-[11px]">{t(`safety.types.${id}`)}</span>
                </div>
              ))}
            </div>
            <Input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="rounded-none h-8 text-xs max-w-[180px]"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-none text-xs"
              placeholder={t('safety.descriptionPlaceholder')}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-none h-9 text-sm"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {t('safety.submit')}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs">{t('safety.myReports')}</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {loading ? (
            <p className="text-muted-foreground text-xs">{t('safety.loading')}</p>
          ) : reports.length === 0 ? (
            <p className="text-muted-foreground text-xs">{t('safety.noReports')}</p>
          ) : (
            <ReportList reports={reports} />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('safety.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('safety.confirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t('safety.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} className="bg-destructive hover:bg-destructive/90 rounded-none">
              {t('safety.submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ReportList = ({ reports }: { reports: any[] }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      {reports.map(r => {
        const color = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
        return (
          <div key={r.id} className="border p-3 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge className={`${color} rounded-none`}>{t(`safety.status.${r.status}`)}</Badge>
                {r.is_anonymous && <Badge variant="outline" className="rounded-none">{t('safety.anonymousBadge')}</Badge>}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(r.created_at).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              {t('safety.typesLabel')}: {(r.abuse_types || []).map((x: string) => t(`safety.types.${x}`)).join(', ')}
            </div>
            <p className="text-sm whitespace-pre-wrap">{r.description}</p>
            {r.admin_notes && (
              <div className="bg-gray-50 p-2 text-xs border-l-2 border-gray-400">
                <strong>{t('safety.adminNotes')}:</strong> {r.admin_notes}
              </div>
            )}
            <div className="text-xs text-gray-500">
              {t('safety.notifiedFeds')}: {(r.notified_federation_ids || []).length}
            </div>
          </div>
        );
      })}
    </div>
  );
};
