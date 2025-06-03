
import { QuickActions } from "@/components/QuickActions";
import { ActiveProgramsList } from "@/components/active-programs/ActiveProgramsList";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DashboardContentProps {
  isAdmin: boolean;
  activePrograms: EnrichedAssignment[];
  onActiveProgramsRefresh: () => void;
}

export const DashboardContent = ({ 
  isAdmin, 
  activePrograms, 
  onActiveProgramsRefresh 
}: DashboardContentProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-none border p-6">
          <h2 className="text-lg font-semibold mb-4">Πρόσφατη Δραστηριότητα</h2>
          <p className="text-gray-500">Φόρτωση δραστηριότητας...</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <QuickActions onProgramCreated={onActiveProgramsRefresh} />
        
        {/* Active Programs only for Admin */}
        {isAdmin && activePrograms.length > 0 && (
          <ActiveProgramsList 
            programs={activePrograms.slice(0, 5)} 
            onRefresh={onActiveProgramsRefresh} 
          />
        )}
      </div>
    </div>
  );
};
