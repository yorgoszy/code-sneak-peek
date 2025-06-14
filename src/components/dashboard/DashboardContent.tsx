
import { TodaysProgramsCard } from "./TodaysProgramsCard";
import { QuickActions } from "@/components/QuickActions";
import { RecentActivity } from "@/components/RecentActivity";

interface DashboardContentProps {
  isAdmin: boolean;
  userProfile: any;
}

export const DashboardContent = ({ isAdmin, userProfile }: DashboardContentProps) => {
  const handleProgramClick = (assignment: any) => {
    console.log('Program clicked in dashboard:', assignment);
    // Για το dashboard, μπορούμε να κάνουμε redirect στο ActivePrograms ή άλλη ενέργεια
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
      <div className="space-y-3 sm:space-y-6">
        <TodaysProgramsCard 
          todaysPrograms={[]}
          allCompletions={[]}
          onRefresh={() => {}}
          onProgramClick={handleProgramClick}
        />
        {isAdmin && <QuickActions />}
      </div>
      
      <div className="space-y-3 sm:space-y-6">
        <RecentActivity />
      </div>
    </div>
  );
};
