
import { TodaysProgramsCard } from "./TodaysProgramsCard";
import { QuickActions } from "@/components/QuickActions";
import { RecentActivity } from "@/components/RecentActivity";

interface DashboardContentProps {
  isAdmin: boolean;
  userProfile: any;
}

export const DashboardContent = ({ isAdmin, userProfile }: DashboardContentProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4 lg:gap-6 h-full">
      <div className="space-y-2 md:space-y-4 lg:space-y-6">
        <TodaysProgramsCard 
          todaysPrograms={[]}
          allCompletions={[]}
          onRefresh={() => {}}
        />
        {isAdmin && (
          <div className="hidden md:block">
            <QuickActions />
          </div>
        )}
      </div>
      
      <div className="space-y-2 md:space-y-4 lg:space-y-6 hidden lg:block">
        <RecentActivity />
      </div>
    </div>
  );
};
