
import { StatCard } from "@/components/StatCard";
import { Users, TrendingUp, Activity, Dumbbell } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalUsers: number;
    athletes: number;
    trainers: number;
    parents: number;
    general: number;
    activePrograms: number;
    totalExercises: number;
    newUsersThisMonth: number;
  };
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Σύνολο Χρηστών"
        value={stats.totalUsers}
        subtitle={`Αθλητές: ${stats.athletes} | Προπονητές: ${stats.trainers} | Γονείς: ${stats.parents} | Γενικοί: ${stats.general}`}
        icon={<Users className="h-5 w-5" />}
        trend="up"
      />
      <StatCard
        title="Νέοι Χρήστες"
        value={stats.newUsersThisMonth}
        subtitle="Αυτόν τον μήνα"
        icon={<TrendingUp className="h-5 w-5" />}
        trend={stats.newUsersThisMonth > 0 ? "up" : "neutral"}
      />
      <StatCard
        title="Ενεργά Προγράμματα"
        value={stats.activePrograms}
        subtitle="Προγράμματα προπόνησης"
        icon={<Activity className="h-5 w-5" />}
        trend={stats.activePrograms > 0 ? "up" : "neutral"}
      />
      <StatCard
        title="Διαθέσιμες Ασκήσεις"
        value={stats.totalExercises}
        subtitle="Στη βάση δεδομένων"
        icon={<Dumbbell className="h-5 w-5" />}
        trend="neutral"
      />
    </div>
  );
};
