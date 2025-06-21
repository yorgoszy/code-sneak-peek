
import { TodaysProgramsCard } from "./TodaysProgramsCard";
import { QuickActions } from "@/components/QuickActions";
import { RecentActivity } from "@/components/RecentActivity";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardContentProps {
  isAdmin: boolean;
  userProfile: any;
}

export const DashboardContent = ({ isAdmin, userProfile }: DashboardContentProps) => {
  const isMobile = useIsMobile();
  
  const handleProgramClick = (assignment: any) => {
    console.log('Program clicked in dashboard:', assignment);
    // Για το dashboard, μπορούμε να κάνουμε redirect στο ActivePrograms ή άλλη ενέργεια
  };

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
      <div className={`space-y-${isMobile ? '4' : '6'}`}>
        <TodaysProgramsCard 
          todaysPrograms={[]}
          allCompletions={[]}
          onRefresh={() => {}}
          onProgramClick={handleProgramClick}
        />
        {isAdmin && <QuickActions />}
      </div>
      
      <div className={`space-y-${isMobile ? '4' : '6'}`}>
        <RecentActivity />
      </div>
    </div>
  );
};
