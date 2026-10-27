import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { BarChart3, CalendarDays, ClipboardList, CreditCard, Dumbbell, FilePlus2, GraduationCap, HeartPulse, Layers, Plus, Settings, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewCoachUserDialog } from "@/components/coach-users/NewCoachUserDialog";
import { NewSubscriptionDialog } from "@/components/coach/subscriptions/NewSubscriptionDialog";
import { HealthCardFormDialog } from "@/components/health-cards/HealthCardFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { loadCoachOverviewCounts, type CoachOverviewCounts } from "./coachOverviewCounts";

interface CoachOverviewProps {
  coachId: string;
}

type DialogKey = "athlete" | "subscription" | "healthCard";

const overviewItems: { label: string; icon: any; path: string; create?: boolean; dialog?: DialogKey; countKey?: keyof CoachOverviewCounts }[] = [
  { label: "Οι αθλητές μου", icon: Users, path: "/dashboard/my-athletes", countKey: "athletes" },
  { label: "Προσθήκη νέου αθλητή", icon: UserPlus, path: "/dashboard/my-athletes", dialog: "athlete" },
  { label: "Συνδρομές", icon: CreditCard, path: "/dashboard/coach-subscriptions", countKey: "subscriptions" },
  { label: "Νέα συνδρομή", icon: Plus, path: "/dashboard/coach-subscriptions", dialog: "subscription" },
  { label: "Ενεργά προγράμματα", icon: Dumbbell, path: "/dashboard/coach-active-programs", countKey: "programs" },
  { label: "Νέο πρόγραμμα", icon: FilePlus2, path: "/dashboard/coach-programs", create: true },
  { label: "Ετήσιος Προγραμματισμός", icon: CalendarDays, path: "/dashboard/coach-annual-planning" },
  { label: "Program Cards", icon: Layers, path: "/dashboard/coach-program-cards" },
  { label: "Πρόοδος αθλητών", icon: BarChart3, path: "/dashboard/coach-athletes-progress", countKey: "testedAthletes" },
  { label: "Τεστ", icon: ClipboardList, path: "/dashboard/coach-progress" },
  { label: "Κάρτα Υγείας", icon: HeartPulse, path: "/dashboard/coach-health-cards" },
  { label: "Προσθήκη Κάρτας Υγείας", icon: Plus, path: "/dashboard/coach-health-cards", dialog: "healthCard" },
  { label: "Online Courses", icon: GraduationCap, path: "/dashboard/coach-courses" },
  { label: "Ρυθμίσεις", icon: Settings, path: "/dashboard/coach-profile" },
];

const tileClass = "h-auto min-h-28 min-w-0 rounded-none bg-background p-3 text-foreground sm:p-4";

export const CoachOverview = ({ coachId }: CoachOverviewProps) => {
  const [openDialog, setOpenDialog] = useState<DialogKey | null>(null);
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

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Επισκόπηση</h2>
      {isError && <p role="status" className="text-sm text-muted-foreground">Δεν ήταν δυνατή η φόρτωση των αριθμών.</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {overviewItems.map(({ label, icon: Icon, path, create, dialog, countKey }) => {
          const content = (
            <>
              <span className="flex w-full items-center justify-between gap-2">
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {countKey && (
                  <span className="text-2xl font-semibold leading-none tabular-nums" aria-live="polite">
                    {counts ? counts[countKey] : isError ? "—" : "…"}
                  </span>
                )}
              </span>
              <span className="w-full whitespace-normal break-words text-left text-sm font-medium leading-snug">{label}</span>
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
      </div>

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
