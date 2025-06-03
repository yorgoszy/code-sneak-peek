
import { RecentActivity } from "@/components/RecentActivity";
import { QuickActions } from "@/components/QuickActions";
import { TodaysProgramsCard } from "./TodaysProgramsCard";
import { ActiveProgramsList } from "@/components/active-programs/ActiveProgramsList";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DashboardContentProps {
  isAdmin: boolean;
  todaysPrograms: EnrichedAssignment[];
  activePrograms: EnrichedAssignment[];
  completedPrograms: EnrichedAssignment[];
  allCompletions: any[];
  onRefresh: () => void;
  onActiveProgramsRefresh: () => void;
}

export const DashboardContent = ({ 
  isAdmin, 
  todaysPrograms, 
  activePrograms, 
  allCompletions, 
  onRefresh, 
  onActiveProgramsRefresh 
}: DashboardContentProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <RecentActivity />
      </div>
      <div className="space-y-6">
        <QuickActions onProgramCreated={onActiveProgramsRefresh} />
        
        {/* Today's Programs Section for Admin */}
        {isAdmin && (
          <TodaysProgramsCard
            todaysPrograms={todaysPrograms}
            allCompletions={allCompletions}
            onRefresh={onRefresh}
          />
        )}
        
        {/* Active Programs only for Admin */}
        {isAdmin && (
          <ActiveProgramsList 
            programs={activePrograms} 
            onRefresh={onActiveProgramsRefresh} 
          />
        )}
      </div>
    </div>
  );
};
