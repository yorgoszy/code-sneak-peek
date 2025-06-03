
import { RecentActivity } from "@/components/RecentActivity";
import { QuickActions } from "@/components/QuickActions";
import { TodaysProgramsCard } from "./TodaysProgramsCard";
import { ActiveProgramsList } from "@/components/active-programs/ActiveProgramsList";
import { CompletedProgramsList } from "@/components/active-programs/CompletedProgramsList";
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
  completedPrograms,
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
        <QuickActions />
        
        {/* Today's Programs Section for Admin */}
        {isAdmin && (
          <TodaysProgramsCard
            todaysPrograms={todaysPrograms}
            allCompletions={allCompletions}
            onRefresh={onRefresh}
          />
        )}
        
        {/* Active and Completed Programs in a grid for Admin */}
        {isAdmin && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ActiveProgramsList 
              programs={activePrograms} 
              onRefresh={onActiveProgramsRefresh} 
            />
            <CompletedProgramsList 
              programs={completedPrograms} 
              onRefresh={onActiveProgramsRefresh} 
            />
          </div>
        )}
      </div>
    </div>
  );
};
