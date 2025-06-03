
import { QuickActions } from "@/components/QuickActions";
import { UserProfileDailyProgram } from "@/components/user-profile/UserProfileDailyProgram";
import { LazyActiveProgramsList } from "@/components/dashboard/LazyActiveProgramsList";

interface DashboardContentProps {
  isAdmin: boolean;
  userProfile: any;
}

export const DashboardContent = ({ isAdmin, userProfile }: DashboardContentProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6">
        {/* Ενεργά Προγράμματα για Admin */}
        {isAdmin && (
          <LazyActiveProgramsList />
        )}
        
        <QuickActions />
      </div>
      
      <div className="lg:col-span-2">
        <div className="bg-white rounded-none border p-6">
          <h2 className="text-lg font-semibold mb-4">Πρόγραμμα Ημέρας</h2>
          {userProfile ? (
            <UserProfileDailyProgram user={userProfile} />
          ) : (
            <p className="text-gray-500">Φόρτωση προγράμματος...</p>
          )}
        </div>
      </div>
    </div>
  );
};
