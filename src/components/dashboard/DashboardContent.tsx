
import { TodaysProgramsCard } from "./TodaysProgramsCard";
import { QuickActions } from "@/components/QuickActions";
import { RecentActivity } from "@/components/RecentActivity";

interface DashboardContentProps {
  isAdmin: boolean;
  userProfile: any;
}

export const DashboardContent = ({ isAdmin, userProfile }: DashboardContentProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <TodaysProgramsCard 
          todaysPrograms={[]}
          allCompletions={[]}
          onRefresh={() => {}}
        />
        {isAdmin && <QuickActions />}
      </div>
      
      <div className="space-y-6">
        <RecentActivity />
      </div>
    </div>
  );
};
