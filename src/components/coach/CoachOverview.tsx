import { Link } from "react-router-dom";
import { ArrowUpRight, BarChart3, ClipboardList, CreditCard, Dumbbell, FilePlus2, Plus, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoachOverviewProps {
  coachId: string;
}

const overviewItems = [
  { label: "Οι αθλητές μου", icon: Users, path: "/dashboard/my-athletes" },
  { label: "Προσθήκη νέου αθλητή", icon: UserPlus, path: "/dashboard/my-athletes", create: true },
  { label: "Συνδρομές", icon: CreditCard, path: "/dashboard/coach-subscriptions" },
  { label: "Νέα συνδρομή", icon: Plus, path: "/dashboard/coach-subscriptions", create: true },
  { label: "Ενεργά προγράμματα", icon: Dumbbell, path: "/dashboard/coach-active-programs" },
  { label: "Νέο πρόγραμμα", icon: FilePlus2, path: "/dashboard/coach-programs", create: true },
  { label: "Πρόοδος αθλητών", icon: BarChart3, path: "/dashboard/coach-athletes-progress" },
  { label: "Τεστ", icon: ClipboardList, path: "/dashboard/coach-progress" },
];

export const CoachOverview = ({ coachId }: CoachOverviewProps) => (
  <section className="space-y-4">
    <h2 className="text-lg font-semibold">Επισκόπηση</h2>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {overviewItems.map(({ label, icon: Icon, path, create }) => {
        const params = new URLSearchParams({ coachId });
        if (create) params.set("action", "create");

        return (
          <Button key={label} asChild variant="outline" className="h-auto min-h-28 min-w-0 rounded-none bg-background p-3 text-foreground sm:p-4">
            <Link to={`${path}?${params}`} className="relative flex flex-col items-start justify-between gap-4">
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="w-full whitespace-normal break-words text-left text-sm font-medium leading-snug">{label}</span>
            </Link>
          </Button>
        );
      })}
    </div>
  </section>
);
