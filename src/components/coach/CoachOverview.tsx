import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Video, ArrowDownRight, XCircle, ArrowUpRight, BarChart3, CalendarDays, ClipboardList, CreditCard, Dumbbell, FilePlus2, GraduationCap, HeartPulse, Layers, Plus, Settings, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewCoachUserDialog } from "@/components/coach-users/NewCoachUserDialog";
import { NewSubscriptionDialog } from "@/components/coach/subscriptions/NewSubscriptionDialog";
import { HealthCardFormDialog } from "@/components/health-cards/HealthCardFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { loadCoachOverviewCounts, type CoachOverviewCounts } from "./coachOverviewCounts";
import { isClubDashboardPath, isThaiHubPlanExpired, renewalPlan, usesClubDashboard } from "./clubDashboard";
import { CoachUpgradeDialog } from "./CoachUpgradeDialog";

interface CoachOverviewProps {
  coachId: string;
}

type DialogKey = "athlete" | "subscription" | "healthCard";

const overviewItems: { label: string; icon: any; path: string; create?: boolean; dialog?: DialogKey; countKey?: keyof CoachOverviewCounts }[] = [
  { label: "Οι αθλητές μου", icon: Users, path: "/dashboard/my-athletes", countKey: "athletes" },
  { label: "Προσθήκη νέου αθλητή", icon: UserPlus, path: "/dashboard/my-athletes", dialog: "athlete" },
  { label: "Συνδρομές", icon: CreditCard, path: "/dashboard/coach-subscriptions", countKey: "subscriptions" },
  { label: "Νέα συνδρομή", icon: Plus, path: "/dashboard/coach-subscriptions", dialog: "subscription" },
  { label: "Κάρτα Υγείας", icon: HeartPulse, path: "/dashboard/coach-health-cards" },
  { label: "Προσθήκη Κάρτας Υγείας", icon: Plus, path: "/dashboard/coach-health-cards", dialog: "healthCard" },
  { label: "Ενεργά προγράμματα", icon: Dumbbell, path: "/dashboard/coach-active-programs", countKey: "programs" },
  { label: "Νέο πρόγραμμα", icon: FilePlus2, path: "/dashboard/coach-programs", create: true },
  { label: "Ετήσιος Προγραμματισμός", icon: CalendarDays, path: "/dashboard/coach-annual-planning" },
  { label: "Program Cards", icon: Layers, path: "/dashboard/coach-program-cards" },
  { label: "Πρόοδος αθλητών", icon: BarChart3, path: "/dashboard/coach-athletes-progress", countKey: "testedAthletes" },
  { label: "Τεστ", icon: ClipboardList, path: "/dashboard/coach-progress" },
  { label: "Online Courses", icon: GraduationCap, path: "/dashboard/coach-courses" },
  { label: "Online Coaching", icon: Video, path: "/dashboard/coach-online-coaching" },
  { label: "Ρυθμίσεις", icon: Settings, path: "/dashboard/coach-profile" },
];

const tileClass = "h-auto min-h-28 min-w-0 rounded-none bg-background p-3 text-foreground sm:p-4";

export const CoachOverview = ({ coachId }: CoachOverviewProps) => {
  const [openDialog, setOpenDialog] = useState<DialogKey | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshUserProfile } = useAuthContext();
  const upgradeSession = searchParams.get('upgrade_session');
  useEffect(() => {
    if (!upgradeSession) return;
    let cancelled = false;
    const verify = async () => {
      const { data, error } = await supabase.functions.invoke('coach-upgrade', { body: { action: 'verify', session_id: upgradeSession, user_id: coachId } });
      if (cancelled) return;
      if (error) {
        const details = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
        toast.error(details?.error || 'Δεν ήταν δυνατή η επιβεβαίωση πληρωμής. Μην πληρώσεις ξανά.');
        return;
      }
      if (!data?.upgraded) {
        toast.info('Η πληρωμή δεν έχει ακόμη επιβεβαιωθεί.');
        return;
      }
      await refreshUserProfile();
      const params = new URLSearchParams(searchParams);
      params.delete('upgrade_session');
      setSearchParams(params, { replace: true });
      toast.success('Η αναβάθμιση σε Coach ολοκληρώθηκε.');
      window.location.reload();
    };
    void verify();
    return () => { cancelled = true; };
  }, [upgradeSession, coachId, refreshUserProfile, searchParams, setSearchParams]);
  const { isClub } = useRoleCheck();
  const { data: viewedProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['dashboard-owner-role', coachId],
    queryFn: async () => {
      const { data, error } = await supabase.from('app_users').select('role').eq('id', coachId).single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(coachId),
  });
  const isClubUser = usesClubDashboard(viewedProfile?.role, isClub());
  const { data: planStatus, refetch: refetchPlan } = useQuery({
    queryKey: ['thaihub-plan-status', coachId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_thaihub_plan_status', { p_user_id: coachId });
      if (error) throw error;
      return (data?.[0] ?? null) as { role: string; end_date: string | null; active: boolean; next_plan: string | null } | null;
    },
    enabled: Boolean(coachId),
    staleTime: 0,
  });
  const planExpired = isThaiHubPlanExpired(planStatus);
  const expiryText = planStatus?.end_date ? new Date(`${planStatus.end_date}T00:00:00`).toLocaleDateString('el-GR') : '—';
  const renewalTarget = planStatus ? renewalPlan(planStatus) : null;
  const { data: renewalPrice } = useQuery({
    queryKey: ['thaihub-renewal-price', renewalTarget],
    queryFn: async () => {
      const { data } = await supabase.from('subscription_types').select('price').eq('assigned_role', renewalTarget as string).eq('is_active', true).is('coach_id', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data ? Number(data.price) : null;
    },
    enabled: planExpired && Boolean(renewalTarget),
  });
  const [downgradeOpen, setDowngradeOpen] = useState(false);
  const [renewBusy, setRenewBusy] = useState(false);
  const toggleDowngrade = async () => {
    const { error } = await (supabase as any).rpc('set_thaihub_next_plan', { p_user_id: coachId, p_plan: planStatus?.next_plan === 'club' ? null : 'club' });
    setDowngradeOpen(false);
    if (error) { toast.error('Δεν ήταν δυνατή η αλλαγή πακέτου.'); return; }
    toast.success(planStatus?.next_plan === 'club' ? 'Ακυρώθηκε το downgrade.' : `Από ${expiryText} η συνδρομή σου θα συνεχίσει ως Club.`);
    void refetchPlan();
  };
  const startRenewal = async () => {
    setRenewBusy(true);
    const { data, error } = await supabase.functions.invoke('thaihub-plan-checkout', { body: { action: 'checkout' } });
    setRenewBusy(false);
    if (error || !data?.url) {
      const details = error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
      toast.error(details?.error || data?.error || 'Δεν ήταν δυνατή η έναρξη πληρωμής.');
      return;
    }
    window.location.href = data.url;
  };
  const planSession = searchParams.get('plan_session');
  useEffect(() => {
    if (!planSession) return;
    (async () => {
      const { data } = await supabase.functions.invoke('thaihub-plan-checkout', { body: { action: 'verify', session_id: planSession } });
      const params = new URLSearchParams(searchParams);
      params.delete('plan_session');
      setSearchParams(params, { replace: true });
      if (data?.activated) { toast.success('Η συνδρομή ανανεώθηκε.'); window.location.reload(); }
      else toast.info('Η πληρωμή δεν έχει ακόμη επιβεβαιωθεί. Μην πληρώσεις ξανά.');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planSession]);
  const visibleItems = planExpired ? [] : isClubUser
    ? overviewItems.filter((item) => isClubDashboardPath(item.path))
    : overviewItems;
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: counts, isError, refetch } = useQuery({
    queryKey: ["coach-overview-counts", coachId, today],
    queryFn: () => loadCoachOverviewCounts(coachId, today, supabase),
    enabled: Boolean(coachId),
    staleTime: 0,
  });
  const handleCreated = () => {
    setOpenDialog(null);
    void refetch();
  };

  if (profileLoading) {
    return <p role="status" className="text-sm text-muted-foreground">Φόρτωση…</p>;
  }

  return (
    <section className="space-y-4">
      {isError && <p role="status" className="text-sm text-muted-foreground">Δεν ήταν δυνατή η φόρτωση των αριθμών.</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {visibleItems.map(({ label, icon: Icon, path, create, dialog, countKey }) => {
          const content = (
            <>
              <span className="flex w-full items-center justify-between gap-2">
                <Icon className="h-5 w-5 shrink-0 text-[#004aad]" aria-hidden="true" />
                {countKey && (
                  <span className="text-2xl font-semibold leading-none tabular-nums text-[#004aad]" aria-live="polite">
                    {counts ? counts[countKey] : isError ? "—" : "…"}
                  </span>
                )}
              </span>
              <span className="w-full whitespace-normal break-words text-left text-sm font-medium leading-snug text-[#004aad]">{label}</span>
            </>
          );

          if (dialog) {
            return (
              <Button
                key={label}
                variant="outline"
                onClick={() => setOpenDialog(dialog)}
                className={`${tileClass} relative flex flex-col items-start justify-between gap-4`}
              >
                {content}
              </Button>
            );
          }

          const params = new URLSearchParams({ coachId });
          if (create) params.set("action", "create");
          return (
            <Button key={label} asChild variant="outline" className={tileClass}>
              <Link to={`${path}?${params}`} className="relative flex flex-col items-start justify-between gap-4">
                {content}
              </Link>
            </Button>
          );
        })}
        {planExpired && (
          <Button
            variant="outline"
            disabled={renewBusy}
            onClick={startRenewal}
            className={`${tileClass} relative flex flex-col items-start justify-between gap-4 border-destructive text-destructive hover:text-destructive`}
          >
            <XCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="flex w-full flex-col items-start gap-1">
              <span className="whitespace-normal break-words text-left text-sm font-medium leading-snug">Η συνδρομή έληξε</span>
              <span className="whitespace-normal break-words text-left text-xs leading-snug">
                {renewBusy ? 'Μετάβαση στην πληρωμή…' : `Πλήρωσε ${renewalPrice != null ? `${renewalPrice}€` : ''} για ${renewalTarget === 'federation' ? 'Federation' : renewalTarget === 'coach' ? 'Coach' : 'Club'}`}
              </span>
            </span>
          </Button>
        )}
        {!planExpired && planStatus?.role === 'coach' && (
          <Button
            variant="outline"
            onClick={() => setDowngradeOpen(true)}
            className={`${tileClass} relative flex flex-col items-start justify-between gap-4 text-[var(--th-blue)] hover:text-[var(--th-blue)]`}
          >
            <ArrowDownRight className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="flex w-full flex-col items-start gap-1">
              <span className="whitespace-normal break-words text-left text-sm font-medium leading-snug">
                {planStatus.next_plan === 'club' ? 'Downgrade σε Club προγραμματισμένο' : 'Downgrade to Club'}
              </span>
              <span className="whitespace-normal break-words text-left text-xs leading-snug">
                {planStatus.next_plan === 'club' ? `Ως Club από ${expiryText}` : `Λήξη συνδρομής: ${expiryText}`}
              </span>
            </span>
          </Button>
        )}
        {!planExpired && isClubUser && (
          <Button
            variant="outline"
            onClick={() => setUpgradeOpen(true)}
            className={`${tileClass} relative flex flex-col items-start justify-between gap-4 text-[var(--th-blue)] hover:text-[var(--th-blue)]`}
          >
            <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="flex w-full flex-col items-start gap-1">
              <span className="whitespace-normal break-words text-left text-sm font-medium leading-snug">Upgrade to Coach</span>
              <span className="whitespace-normal break-words text-left text-xs leading-snug">
                Λήξη συνδρομής: {expiryText}
              </span>
            </span>
          </Button>
        )}
      </div>

      <AlertDialog open={downgradeOpen} onOpenChange={setDowngradeOpen}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>{planStatus?.next_plan === 'club' ? 'Ακύρωση downgrade;' : 'Downgrade to Club;'}</AlertDialogTitle>
            <AlertDialogDescription>
              {planStatus?.next_plan === 'club'
                ? 'Η συνδρομή σου θα συνεχίσει ως Coach.'
                : `Κρατάς το Coach μέχρι ${expiryText}. Μετά τη λήξη η επόμενη συνδρομή σου θα είναι Club.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Άκυρο</AlertDialogCancel>
            <AlertDialogAction onClick={toggleDowngrade} className="rounded-none">Επιβεβαίωση</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isClubUser && <CoachUpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} coachId={coachId} />}

      <NewCoachUserDialog
        open={openDialog === "athlete"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        coachId={coachId}
        onSuccess={handleCreated}
      />
      <NewSubscriptionDialog
        open={openDialog === "subscription"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        coachId={coachId}
        onSuccess={handleCreated}
      />
      <HealthCardFormDialog
        open={openDialog === "healthCard"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        coachId={coachId}
        onSaved={handleCreated}
      />
    </section>
  );
};
