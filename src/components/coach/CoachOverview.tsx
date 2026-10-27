import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ClipboardList, CreditCard, Dumbbell, FilePlus2, Plus, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewCoachUserDialog } from "@/components/coach-users/NewCoachUserDialog";
import { NewSubscriptionDialog } from "@/components/coach/subscriptions/NewSubscriptionDialog";

interface CoachOverviewProps {
  coachId: string;
}

type DialogKey = "athlete" | "subscription";

const overviewItems: { label: string; icon: any; path: string; create?: boolean; dialog?: DialogKey }[] = [
  { label: "Οι αθλητές μου", icon: Users, path: "/dashboard/my-athletes" },
  { label: "Προσθήκη νέου αθλητή", icon: UserPlus, path: "/dashboard/my-athletes", dialog: "athlete" },
  { label: "Συνδρομές", icon: CreditCard, path: "/dashboard/coach-subscriptions" },
  { label: "Νέα συνδρομή", icon: Plus, path: "/dashboard/coach-subscriptions", dialog: "subscription" },
  { label: "Ενεργά προγράμματα", icon: Dumbbell, path: "/dashboard/coach-active-programs" },
  { label: "Νέο πρόγραμμα", icon: FilePlus2, path: "/dashboard/coach-programs", create: true },
  { label: "Πρόοδος αθλητών", icon: BarChart3, path: "/dashboard/coach-athletes-progress" },
  { label: "Τεστ", icon: ClipboardList, path: "/dashboard/coach-progress" },
];

const tileClass = "h-auto min-h-28 min-w-0 rounded-none bg-background p-3 text-foreground sm:p-4";

export const CoachOverview = ({ coachId }: CoachOverviewProps) => {
  const [openDialog, setOpenDialog] = useState<DialogKey | null>(null);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Επισκόπηση</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {overviewItems.map(({ label, icon: Icon, path, create, dialog }) => {
          const content = (
            <>
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
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
        onSuccess={() => setOpenDialog(null)}
      />
      <NewSubscriptionDialog
        open={openDialog === "subscription"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        coachId={coachId}
        onSuccess={() => setOpenDialog(null)}
      />
    </section>
  );
};
